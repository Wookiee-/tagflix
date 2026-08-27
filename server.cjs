const http = require('http');
const path = require('path');
const fs = require('fs');
const { spawn, execSync } = require('child_process');
const os = require('os');

const PORT = 5173;

const isPkg = typeof process.pkg !== 'undefined';
const distDir = isPkg
  ? path.join(path.dirname(process.execPath), 'dist')
  : path.join(__dirname, 'dist');

const MIME = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.svg': 'image/svg+xml', '.json': 'application/json',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.gif': 'image/gif', '.woff': 'font/woff', '.woff2': 'font/woff2',
  '.ttf': 'font/ttf', '.ico': 'image/x-icon',
};

function findBrowser() {
  var platform = process.platform;

  if (platform === 'win32') {
    var candidates = [
      { path: path.join(process.env['PROGRAMFILES(X86)'] || '', 'Microsoft', 'Edge', 'Application', 'msedge.exe'), name: 'edge', engine: 'chromium' },
      { path: path.join(process.env['PROGRAMFILES'] || '', 'Microsoft', 'Edge', 'Application', 'msedge.exe'), name: 'edge', engine: 'chromium' },
      { path: path.join(process.env['PROGRAMFILES(X86)'] || '', 'Google', 'Chrome', 'Application', 'chrome.exe'), name: 'chrome', engine: 'chromium' },
      { path: path.join(process.env['PROGRAMFILES'] || '', 'Google', 'Chrome', 'Application', 'chrome.exe'), name: 'chrome', engine: 'chromium' },
      { path: path.join(process.env['LOCALAPPDATA'] || '', 'Google', 'Chrome', 'Application', 'chrome.exe'), name: 'chrome', engine: 'chromium' },
      { path: path.join(process.env['PROGRAMFILES'] || '', 'BraveSoftware', 'Brave-Browser', 'Application', 'brave.exe'), name: 'brave', engine: 'chromium' },
      { path: path.join(process.env['PROGRAMFILES(X86)'] || '', 'BraveSoftware', 'Brave-Browser', 'Application', 'brave.exe'), name: 'brave', engine: 'chromium' },
      { path: path.join(process.env['LOCALAPPDATA'] || '', 'BraveSoftware', 'Brave-Browser', 'Application', 'brave.exe'), name: 'brave', engine: 'chromium' },
      { path: path.join(process.env['PROGRAMFILES(X86)'] || '', 'Vivaldi', 'Application', 'vivaldi.exe'), name: 'vivaldi', engine: 'chromium' },
      { path: path.join(process.env['PROGRAMFILES'] || '', 'Vivaldi', 'Application', 'vivaldi.exe'), name: 'vivaldi', engine: 'chromium' },
      { path: path.join(process.env['PROGRAMFILES'] || '', 'Mozilla Firefox', 'firefox.exe'), name: 'firefox', engine: 'gecko' },
      { path: path.join(process.env['PROGRAMFILES(X86)'] || '', 'Mozilla Firefox', 'firefox.exe'), name: 'firefox', engine: 'gecko' },
      { path: path.join(process.env['LOCALAPPDATA'] || '', 'Mozilla Firefox', 'firefox.exe'), name: 'firefox', engine: 'gecko' },
      { path: path.join(process.env['PROGRAMFILES'] || '', 'Pale Moon', 'palemoon.exe'), name: 'palemoon', engine: 'gecko' },
      { path: path.join(process.env['PROGRAMFILES'] || '', 'Waterfox', 'waterfox.exe'), name: 'waterfox', engine: 'gecko' },
    ];
    for (var i = 0; i < candidates.length; i++) {
      if (fs.existsSync(candidates[i].path)) return candidates[i];
    }
  } else if (platform === 'darwin') {
    var macCandidates = [
      { path: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', name: 'chrome', engine: 'chromium' },
      { path: '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge', name: 'edge', engine: 'chromium' },
      { path: '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser', name: 'brave', engine: 'chromium' },
      { path: '/Applications/Chromium.app/Contents/MacOS/Chromium', name: 'chrome', engine: 'chromium' },
      { path: '/Applications/Vivaldi.app/Contents/MacOS/Vivaldi', name: 'vivaldi', engine: 'chromium' },
      { path: '/Applications/Firefox.app/Contents/MacOS/firefox', name: 'firefox', engine: 'gecko' },
      { path: '/Applications/Pale Moon.app/Contents/MacOS/palemoon', name: 'palemoon', engine: 'gecko' },
      { path: '/Applications/Waterfox.app/Contents/MacOS/waterfox', name: 'waterfox', engine: 'gecko' },
    ];
    for (var i = 0; i < macCandidates.length; i++) {
      if (fs.existsSync(macCandidates[i].path)) return macCandidates[i];
    }
  } else if (platform === 'linux') {
    var linuxBrowsers = [
      { cmd: 'google-chrome', name: 'chrome', engine: 'chromium' },
      { cmd: 'google-chrome-stable', name: 'chrome', engine: 'chromium' },
      { cmd: 'chromium', name: 'chrome', engine: 'chromium' },
      { cmd: 'chromium-browser', name: 'chrome', engine: 'chromium' },
      { cmd: 'microsoft-edge', name: 'edge', engine: 'chromium' },
      { cmd: 'microsoft-edge-stable', name: 'edge', engine: 'chromium' },
      { cmd: 'brave-browser', name: 'brave', engine: 'chromium' },
      { cmd: 'vivaldi', name: 'vivaldi', engine: 'chromium' },
      { cmd: 'firefox', name: 'firefox', engine: 'gecko' },
      { cmd: 'firefox-esr', name: 'firefox', engine: 'gecko' },
      { cmd: 'palemoon', name: 'palemoon', engine: 'gecko' },
      { cmd: 'waterfox', name: 'waterfox', engine: 'gecko' },
    ];
    for (var i = 0; i < linuxBrowsers.length; i++) {
      try {
        var binPath = execSync('which ' + linuxBrowsers[i].cmd + ' 2>/dev/null', { encoding: 'utf8', windowsHide: true }).trim();
        if (binPath && fs.existsSync(binPath)) {
          return { path: binPath, name: linuxBrowsers[i].name, engine: linuxBrowsers[i].engine };
        }
      } catch (e) {}
    }
  }

  return null;
}

function getBrowserArgs(browser, url, extDir) {
  var args = [];

  if (browser.engine === 'gecko') {
    args.push('--new-instance');
    args.push('--width=1280');
    args.push('--height=720');
    args.push(url);
  } else {
    args.push('--app=' + url);
    args.push('--window-size=1280,720');
    args.push('--window-position=0,0');
    args.push('--no-first-run');
    args.push('--no-default-browser-check');
    args.push('--disable-restore-session-state');
    args.push('--disable-session-crashed-bubble');
    args.push('--disable-sync');

    // Load ad-block extension (no --user-data-dir so extension loads)
    if (extDir && fs.existsSync(extDir)) {
      args.push('--load-extension=' + extDir);
      args.push('--disable-extensions-except=' + extDir);
    }

    if (browser.name === 'edge') {
      args.push('--disable-features=msEdgeFirstRunExperience,msEdgeWelcomePage');
    } else if (browser.name === 'chrome') {
      args.push('--disable-features=ChromeWhatsNewUI');
    } else if (browser.name === 'brave') {
      args.push('--disable-features=BraveWelcomeUI');
    }
  }

  return args;
}

function openBrowser(url) {
  var browser = findBrowser();
  if (!browser) return;

  var extDir = isPkg
    ? path.join(path.dirname(process.execPath), 'tagflix-adblock')
    : path.join(__dirname, 'dist-app', 'tagflix-adblock');

  var args = getBrowserArgs(browser, url, extDir);

  // Firefox profile setup
  if (browser.engine === 'gecko') {
    var profilesDir = path.join(os.homedir(), '.tagflix', 'firefox-profiles');
    var tagflixProfile = path.join(profilesDir, 'tagflix');
    try {
      if (!fs.existsSync(profilesDir)) fs.mkdirSync(profilesDir, { recursive: true });
      var profilesIni = path.join(os.homedir(), '.tagflix', 'firefox-profiles.ini');
      if (!fs.existsSync(profilesIni)) {
        fs.writeFileSync(profilesIni, '[General]\nStartWithLastProfile=0\n\n[Profile0]\nName=Tagflix\nIsRelative=1\nPath=tagflix\n');
      }
      if (!fs.existsSync(tagflixProfile)) fs.mkdirSync(tagflixProfile, { recursive: true });
      var autoconfDir = path.join(tagflixProfile, 'defaults', 'pref');
      if (!fs.existsSync(autoconfDir)) fs.mkdirSync(autoconfDir, { recursive: true });
      fs.writeFileSync(path.join(autoconfDir, 'autoconfig.js'),
        'pref("general.config.filename", "tagflix-block.js");\n' +
        'pref("general.config.obscure_value", 0);\n' +
        'pref("general.config.sandbox_enabled", false);\n'
      );
      fs.writeFileSync(path.join(tagflixProfile, 'tagflix-block.js'),
        'try {\n  window.open = function() { return null; };\n} catch(e) {}\n' +
        'try {\n  lockPref("dom.popup_allowed_events", "");\n' +
        '  lockPref("dom.disable_open_during_load", true);\n} catch(e) {}\n'
      );
    } catch (e) {}
    args.push('-Profile');
    args.push(tagflixProfile);
  }

  var proc = spawn(browser.path, args, {
    detached: true,
    stdio: 'ignore',
    windowsHide: true,
  });

  proc.unref();

  proc.on('exit', function () {
    setTimeout(function () { process.exit(0); }, 2000);
  });
}

function startServer() {
  var targetUrl = 'http://127.0.0.1:' + PORT;

  http.get(targetUrl, function (res) {
    res.resume();
    openBrowser(targetUrl);
  }).on('error', function () {
    var server = http.createServer(function (req, res) {
      try {
        var url = new URL(req.url, 'http://127.0.0.1:' + PORT);

        // ─── VidCore proxy: inject CSP sandbox to block popups ───
        if (url.pathname === '/proxy') {
          var target = url.searchParams.get('url');
          if (!target) { res.writeHead(400); res.end('missing url'); return; }

          var parsedTarget = new URL(target);
          var referer = parsedTarget.origin + '/';

          http.get(target, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
              'Referer': referer,
              'Accept': 'text/html,application/xhtml+xml',
            },
          }, function (proxyRes) {
            // Only inject into HTML responses
            var ct = proxyRes.headers['content-type'] || '';
            if (ct.indexOf('text/html') === -1 && ct.indexOf('application/xhtml') === -1) {
              // Pass through non-HTML (JS, CSS, images) with CORS
              var headers = {};
              Object.keys(proxyRes.headers).forEach(function (k) {
                if (k !== 'content-security-policy' && k !== 'x-frame-options') headers[k] = proxyRes.headers[k];
              });
              headers['access-control-allow-origin'] = '*';
              res.writeHead(proxyRes.statusCode, headers);
              proxyRes.pipe(res);
              return;
            }

            var chunks = [];
            proxyRes.on('data', function (c) { chunks.push(c); });
            proxyRes.on('end', function () {
              var html = Buffer.concat(chunks).toString('utf8');

              // 1) CSP sandbox blocks window.open() at browser level.
              //    VidCore checks the <iframe sandbox=...> HTML attribute,
              //    NOT CSP-level sandbox — so it doesn't detect this.
              var sandboxMeta = '<meta http-equiv="Content-Security-Policy" content="sandbox allow-scripts allow-same-origin allow-forms allow-modals">';

              // 2) window.open override as a safety net
              var blockerScript = '<script>
' +
                '(function(){
' +
                '  window.open=function(){return{focus:function(){},blur:function(){},close:function(){},closed:false,location:{href:""},postMessage:function(){}};};
' +
                '  document.addEventListener("click",function(e){
' +
                '    var t=e.target;
' +
                '    while(t&&t!==document){
' +
                '      if(t.tagName==="A"&&t.target==="_blank"){e.preventDefault();e.stopPropagation();return;}
' +
                '      t=t.parentNode;
' +
                '    }
' +
                '  },true);
' +
                '})();
' +
                '</script>';

              // Inject right after <head> or at the start
              if (html.indexOf('<head') !== -1) {
                html = html.replace(/(<head[^>]*>)/i, '$1' + sandboxMeta + blockerScript);
              } else if (html.indexOf('<body') !== -1) {
                html = html.replace(/(<body[^>]*>)/i, sandboxMeta + blockerScript + '$1');
              } else {
                html = sandboxMeta + blockerScript + html;
              }

              // Strip original CSP and X-Frame-Options from upstream
              var headers = {};
              Object.keys(proxyRes.headers).forEach(function (k) {
                var lk = k.toLowerCase();
                if (lk === 'content-security-policy' || lk === 'x-frame-options') return;
                headers[k] = proxyRes.headers[k];
              });
              headers['content-type'] = 'text/html; charset=utf-8';
              headers['access-control-allow-origin'] = '*';
              res.writeHead(200, headers);
              res.end(html);
            });
          }).on('error', function (err) {
            res.writeHead(502);
            res.end('proxy error: ' + err.message);
          });
          return;
        }

        // ─── Static file serving ───
        var filePath = path.join(distDir, url.pathname === '/' ? 'index.html' : url.pathname);

        if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
          filePath = path.join(distDir, 'index.html');
        }

        var ext = path.extname(filePath);
        res.setHeader('Content-Type', MIME[ext] || 'application/octet-stream');
        if (ext === '.html') {
          res.setHeader('Content-Security-Policy', "default-src 'self' 'unsafe-inline' 'unsafe-eval' https: data: blob:; frame-src https:; frame-ancestors 'self';");
        }
        fs.createReadStream(filePath).pipe(res);
      } catch (err) {
        res.statusCode = 500;
        res.end('Internal Server Error');
      }
    });

    server.on('error', function (err) {
      if (err.code === 'EADDRINUSE') {
        openBrowser(targetUrl);
      }
    });

    server.listen(PORT, '127.0.0.1', function () {
      var retries = 0;
      function checkReady() {
        http.get(targetUrl, function (res) {
          res.resume();
          if (res.statusCode === 200) {
            openBrowser(targetUrl);
          } else {
            setTimeout(checkReady, 200);
          }
        }).on('error', function () {
          retries++;
          if (retries > 50) { openBrowser(targetUrl); return; }
          setTimeout(checkReady, 200);
        });
      }
      checkReady();
    });
  });
}

startServer();

process.on('SIGINT', function () { process.exit(0); });
process.on('SIGHUP', function () { process.exit(0); });
