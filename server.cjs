const http = require('http');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
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

const server = http.createServer((req, res) => {
  try {
    const url = new URL(req.url, `http://127.0.0.1:${PORT}`);
    let filePath = path.join(distDir, url.pathname === '/' ? 'index.html' : url.pathname);

    if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
      filePath = path.join(distDir, 'index.html');
    }

    const ext = path.extname(filePath);
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

function waitForServer(url, cb, retries) {
  retries = retries || 0;
  http.get(url, function (res) {
    res.resume();
    cb();
  }).on('error', function () {
    if (retries > 30) { cb(); return; } // 3 seconds max
    setTimeout(function () { waitForServer(url, cb, retries + 1); }, 100);
  });
}

server.listen(PORT, '127.0.0.1', function () {
  var targetUrl = 'http://127.0.0.1:' + PORT;
  var browserPath = findBrowserPath();

  if (browserPath) {
    // Wait for server to be ready, then give Edge extra time to init profile
    waitForServer(targetUrl, function () {
      setTimeout(function () {
        var profileDir = path.join(os.tmpdir(), 'tagflix-browser');
        var browser = spawn(browserPath, [
          '--app=' + targetUrl,
          '--window-size=1280,720',
          '--window-position=0,0',
          '--user-data-dir=' + profileDir,
          '--no-first-run',
          '--disable-sync',
          '--disable-sync-preferences',
          '--no-default-browser-check',
          '--disable-features=msEdgeEnableSync',
        ], { detached: true, stdio: 'ignore' });

        browser.unref();
        browser.on('close', function () { process.exit(0); });
        browser.on('error', function () { process.exit(1); });
      }, 2000); // extra 2s for Edge profile init
    });
  }
});

process.on('SIGINT', function () { process.exit(0); });
process.on('SIGHUP', function () { process.exit(0); });
