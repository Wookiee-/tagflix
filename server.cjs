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
      { path: path.join(process.env['PROGRAMFILES(X86)'] || '', 'Microsoft', 'Edge', 'Application', 'msedge.exe'), name: 'edge' },
      { path: path.join(process.env['PROGRAMFILES'] || '', 'Microsoft', 'Edge', 'Application', 'msedge.exe'), name: 'edge' },
      { path: path.join(process.env['PROGRAMFILES(X86)'] || '', 'Google', 'Chrome', 'Application', 'chrome.exe'), name: 'chrome' },
      { path: path.join(process.env['PROGRAMFILES'] || '', 'Google', 'Chrome', 'Application', 'chrome.exe'), name: 'chrome' },
      { path: path.join(process.env['LOCALAPPDATA'] || '', 'Google', 'Chrome', 'Application', 'chrome.exe'), name: 'chrome' },
      { path: path.join(process.env['PROGRAMFILES'] || '', 'BraveSoftware', 'Brave-Browser', 'Application', 'brave.exe'), name: 'brave' },
      { path: path.join(process.env['PROGRAMFILES(X86)'] || '', 'BraveSoftware', 'Brave-Browser', 'Application', 'brave.exe'), name: 'brave' },
      { path: path.join(process.env['LOCALAPPDATA'] || '', 'BraveSoftware', 'Brave-Browser', 'Application', 'brave.exe'), name: 'brave' },
      { path: path.join(process.env['PROGRAMFILES(X86)'] || '', 'Vivaldi', 'Application', 'vivaldi.exe'), name: 'vivaldi' },
      { path: path.join(process.env['PROGRAMFILES'] || '', 'Vivaldi', 'Application', 'vivaldi.exe'), name: 'vivaldi' },
    ];
    for (var i = 0; i < candidates.length; i++) {
      if (fs.existsSync(candidates[i].path)) return candidates[i];
    }
  } else if (platform === 'darwin') {
    var macCandidates = [
      { path: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', name: 'chrome' },
      { path: '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge', name: 'edge' },
      { path: '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser', name: 'brave' },
      { path: '/Applications/Chromium.app/Contents/MacOS/Chromium', name: 'chrome' },
      { path: '/Applications/Vivaldi.app/Contents/MacOS/Vivaldi', name: 'vivaldi' },
    ];
    for (var i = 0; i < macCandidates.length; i++) {
      if (fs.existsSync(macCandidates[i].path)) return macCandidates[i];
    }
  } else if (platform === 'linux') {
    var linuxBrowsers = ['google-chrome', 'google-chrome-stable', 'chromium', 'chromium-browser', 'microsoft-edge', 'microsoft-edge-stable', 'brave-browser', 'vivaldi'];
    for (var i = 0; i < linuxBrowsers.length; i++) {
      try {
        var binPath = execSync('which ' + linuxBrowsers[i] + ' 2>/dev/null', { encoding: 'utf8', windowsHide: true }).trim();
        if (binPath && fs.existsSync(binPath)) {
          var name = linuxBrowsers[i].includes('edge') ? 'edge' :
                     linuxBrowsers[i].includes('brave') ? 'brave' :
                     linuxBrowsers[i].includes('vivaldi') ? 'vivaldi' : 'chrome';
          return { path: binPath, name: name };
        }
      } catch (e) {}
    }
  }

  return null;
}

function getBrowserArgs(browserName, url) {
  var args = [
    '--app=' + url,
    '--window-size=1280,720',
    '--window-position=0,0',
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-sync',
  ];

  // Browser-specific first-run suppression
  if (browserName === 'edge') {
    args.push('--disable-features=msEdgeFirstRunExperience,msEdgeWelcomePage');
  } else if (browserName === 'chrome') {
    args.push('--disable-features=ChromeWhatsNewUI');
  } else if (browserName === 'brave') {
    args.push('--disable-features=BraveWelcomeUI');
  }

  return args;
}

function openBrowser(url) {
  var browser = findBrowser();
  if (!browser) return;

  // Persistent profile dir per browser to avoid first-run pages
  var profileDir = path.join(os.homedir(), '.tagflix', browser.name + '-profile');

  var args = getBrowserArgs(browser.name, url);
  args.push('--user-data-dir=' + profileDir);

  var proc = spawn(browser.path, args, {
    detached: true,
    stdio: 'ignore',
    windowsHide: true,
  });

  proc.unref();

  // Poll for browser processes to detect when user closes all windows
  var closed = false;
  var processNames = {
    edge: 'msedge.exe',
    chrome: 'chrome.exe',
    brave: 'brave.exe',
    vivaldi: 'vivaldi.exe',
  };

  // On non-Windows, use different process detection
  var checkCmd, checkFilter;
  if (process.platform === 'win32') {
    var exeName = processNames[browser.name] || 'chrome.exe';
    checkCmd = 'tasklist /FI "IMAGENAME eq ' + exeName + '" /FO CSV /NH';
    checkFilter = function (line) { return line.includes(exeName); };
  } else {
    checkCmd = 'pgrep -f ' + browser.name;
    checkFilter = function (line) { return line.trim().length > 0; };
  }

  function checkBrowserGone() {
    if (closed) return;
    try {
      var result = require('child_process').execSync(checkCmd, {
        encoding: 'utf8',
        windowsHide: true,
        timeout: 5000,
      });
      var lines = result.trim().split('\n').filter(checkFilter);
      if (lines.length === 0) {
        closed = true;
        process.exit(0);
      }
    } catch (e) {
      // pgrep returns exit code 1 when no processes found
      if (process.platform !== 'win32') {
        closed = true;
        process.exit(0);
      }
    }
    setTimeout(checkBrowserGone, 2000);
  }

  setTimeout(checkBrowserGone, 5000);
}

function startServer() {
  var targetUrl = 'http://127.0.0.1:' + PORT;

  // Check if server is already running
  http.get(targetUrl, function (res) {
    res.resume();
    openBrowser(targetUrl);
  }).on('error', function () {
    // Server not running — start it
    var server = http.createServer(function (req, res) {
      try {
        var url = new URL(req.url, 'http://127.0.0.1:' + PORT);
        var filePath = path.join(distDir, url.pathname === '/' ? 'index.html' : url.pathname);

        if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
          filePath = path.join(distDir, 'index.html');
        }

        var ext = path.extname(filePath);
        res.setHeader('Content-Type', MIME[ext] || 'application/octet-stream');
        if (ext === '.html') {
          res.setHeader('Content-Security-Policy', "default-src 'self' 'unsafe-inline' 'unsafe-eval' https: data:; frame-src https:; frame-ancestors 'self';");
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
