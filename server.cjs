const http = require('http');
const path = require('path');
const fs = require('fs');
const { spawn, execSync } = require('child_process');

const PORT = process.env.PORT || 5173;

// Resolve paths for both normal Node and compiled pkg binary
const isPkg = typeof process.pkg !== 'undefined';
const distDir = isPkg
  ? path.join(path.dirname(process.execPath), 'dist')
  : path.join(__dirname, 'dist');

// Log to file so we can debug when console is hidden
const logFile = isPkg
  ? path.join(path.dirname(process.execPath), 'tagflix.log')
  : path.join(__dirname, 'tagflix.log');
function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}\n`;
  try { fs.appendFileSync(logFile, line); } catch (e) {}
  try { console.log(msg); } catch (e) {}
}

log('[tagflix] starting...');
log(`[tagflix] isPkg=${isPkg}`);
log(`[tagflix] process.execPath=${process.execPath}`);
log(`[tagflix] distDir=${distDir}`);
log(`[tagflix] distDir exists=${fs.existsSync(distDir)}`);

const MIME = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.svg': 'image/svg+xml', '.json': 'application/json',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.gif': 'image/gif', '.woff': 'font/woff', '.woff2': 'font/woff2',
  '.ttf': 'font/ttf', '.ico': 'image/x-icon',
};

// Minimal static file server with SPA fallback
const server = http.createServer((req, res) => {
  try {
    const url = new URL(req.url, `http://127.0.0.1:${PORT}`);
    let filePath = path.join(distDir, url.pathname === '/' ? 'index.html' : url.pathname);

    if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
      filePath = path.join(distDir, 'index.html');
    }

    const ext = path.extname(filePath);
    res.setHeader('Content-Type', MIME[ext] || 'application/octet-stream');
    fs.createReadStream(filePath).pipe(res);
  } catch (err) {
    log(`[tagflix] request error: ${err.message}`);
    res.statusCode = 500;
    res.end('Internal Server Error');
  }
});

/**
 * Returns the full path to the first installed Chromium browser, or null.
 */
function findBrowserPath() {
  const platform = process.platform;

  if (platform === 'win32') {
    const candidates = [
      path.join(process.env['PROGRAMFILES(X86)'] || '', 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
      path.join(process.env['PROGRAMFILES'] || '', 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
      path.join(process.env['PROGRAMFILES(X86)'] || '', 'Google', 'Chrome', 'Application', 'chrome.exe'),
      path.join(process.env['PROGRAMFILES'] || '', 'Google', 'Chrome', 'Application', 'chrome.exe'),
      path.join(process.env['LOCALAPPDATA'] || '', 'Google', 'Chrome', 'Application', 'chrome.exe'),
      path.join(process.env['PROGRAMFILES'] || '', 'BraveSoftware', 'Brave-Browser', 'Application', 'brave.exe'),
    ];
    for (const p of candidates) {
      log(`[tagflix] checking browser: ${p} → ${fs.existsSync(p)}`);
      if (fs.existsSync(p)) return p;
    }
  }
  else if (platform === 'darwin') {
    const macCandidates = [
      '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser',
    ];
    for (const p of macCandidates) {
      if (fs.existsSync(p)) return p;
    }
  }
  else if (platform === 'linux') {
    const cmds = ['microsoft-edge', 'msedge', 'google-chrome', 'chromium-browser', 'chromium', 'brave-browser', 'brave'];
    for (const cmd of cmds) {
      try {
        return execSync(`which ${cmd}`, { stdio: ['pipe', 'pipe', 'ignore'] }).toString().trim();
      } catch (e) {}
    }
  }

  return null;
}

server.on('error', (err) => {
  log(`[tagflix] server error: ${err.message}`);
});

server.listen(PORT, '127.0.0.1', () => {
  const targetUrl = `http://127.0.0.1:${PORT}`;
  log(`[tagflix] server running at ${targetUrl}`);

  const browserPath = findBrowserPath();

  if (browserPath) {
    log(`[tagflix] launching ${browserPath} in app mode...`);

    // Small delay to ensure server is fully ready
    setTimeout(() => {
      const browser = spawn(browserPath, [
        `--app=${targetUrl}`,
        '--window-size=1280,720',
        '--window-position=0,0',
        '--disable-features=TranslateUI',
      ], { detached: false, stdio: 'ignore' });

      log(`[tagflix] browser spawned with pid ${browser.pid}`);

      browser.on('close', () => {
        log('[tagflix] browser closed — shutting down');
        process.exit(0);
      });

      browser.on('error', (err) => {
        log(`[tagflix] failed to launch browser: ${err.message}`);
        log(`[tagflix] open ${targetUrl} in your browser`);
      });
    }, 500);
  } else {
    log(`[tagflix] no chromium browser found — open ${targetUrl} in your browser`);
  }
});

// Keep process alive
process.on('uncaughtException', (err) => {
  log(`[tagflix] uncaught: ${err.message}`);
});
