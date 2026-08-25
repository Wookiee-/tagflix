const http = require('http');
const path = require('path');
const fs = require('fs');
const { spawn, execSync } = require('child_process');
const os = require('os');

// Hide console window instantly — blocking so it's gone before anything else
if (process.platform === 'win32') {
  try {
    execSync(
      'powershell -NoProfile -Command "Add-Type \'using System; using System.Runtime.InteropServices; public class C { [DllImport(\\"kernel32.dll\\")] public static extern bool FreeConsole(); }\' ; [C]::FreeConsole()"',
      { windowsHide: true, timeout: 3000 }
    );
  } catch (e) {}
}

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

function findBrowserPath() {
  if (process.platform === 'win32') {
    const candidates = [
      path.join(process.env['PROGRAMFILES(X86)'] || '', 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
      path.join(process.env['PROGRAMFILES'] || '', 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
      path.join(process.env['PROGRAMFILES(X86)'] || '', 'Google', 'Chrome', 'Application', 'chrome.exe'),
      path.join(process.env['PROGRAMFILES'] || '', 'Google', 'Chrome', 'Application', 'chrome.exe'),
      path.join(process.env['LOCALAPPDATA'] || '', 'Google', 'Chrome', 'Application', 'chrome.exe'),
      path.join(process.env['PROGRAMFILES'] || '', 'BraveSoftware', 'Brave-Browser', 'Application', 'brave.exe'),
    ];
    for (const p of candidates) {
      if (fs.existsSync(p)) return p;
    }
  }
  return null;
}

function openBrowser(url) {
  var browserPath = findBrowserPath();
  if (!browserPath) return;

  // Persistent profile dir — Edge reuses cache, no first-run page
  var profileDir = path.join(os.homedir(), '.tagflix', 'browser-profile');

  var browser = spawn(browserPath, [
    '--app=' + url,
    '--window-size=1280,720',
    '--window-position=0,0',
    '--user-data-dir=' + profileDir,
    '--no-first-run',
    '--disable-features=msEdgeFirstRunExperience,msEdgeWelcomePage',
    '--disable-sync',
    '--no-default-browser-check',
  ], { detached: true, stdio: 'ignore', windowsHide: true });

  browser.unref();
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
