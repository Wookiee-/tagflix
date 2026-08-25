const express = require('express');
const path = require('path');
const fs = require('fs');
const { spawn, execSync } = require('child_process');

const app = express();
const PORT = process.env.PORT || 5173;

// Resolve paths for both normal Node and compiled pkg binary
const isPkg = typeof process.pkg !== 'undefined';
const distDir = isPkg
  ? path.join(path.dirname(process.execPath), 'dist')
  : path.join(__dirname, 'dist');

// Serve static frontend build
app.use(express.static(distDir));

// SPA fallback for routing
app.get('*', (req, res) => {
  const indexFile = path.join(distDir, 'index.html');
  if (fs.existsSync(indexFile)) {
    res.sendFile(indexFile);
  } else {
    res.status(404).send('Build dist directory not found. Run npm run build first.');
  }
});

/**
 * Returns the full path to the first installed Chromium browser, or null.
 */
function findBrowserPath() {
  const platform = process.platform;

  if (platform === 'win32') {
    const candidates = [
      // Edge
      path.join(process.env['PROGRAMFILES(X86)'] || '', 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
      path.join(process.env['PROGRAMFILES'] || '', 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
      // Chrome
      path.join(process.env['PROGRAMFILES(X86)'] || '', 'Google', 'Chrome', 'Application', 'chrome.exe'),
      path.join(process.env['PROGRAMFILES'] || '', 'Google', 'Chrome', 'Application', 'chrome.exe'),
      path.join(process.env['LOCALAPPDATA'] || '', 'Google', 'Chrome', 'Application', 'chrome.exe'),
      // Brave
      path.join(process.env['PROGRAMFILES'] || '', 'BraveSoftware', 'Brave-Browser', 'Application', 'brave.exe'),
    ];
    for (const p of candidates) {
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

app.listen(PORT, '127.0.0.1', () => {
  const targetUrl = `http://127.0.0.1:${PORT}`;
  console.log(`[tagflix] server running at ${targetUrl}`);

  const browserPath = findBrowserPath();

  if (browserPath) {
    console.log(`[tagflix] launching ${path.basename(browserPath)} in app mode...`);

    // Launch browser directly with spawn so we can track its lifecycle
    const browser = spawn(browserPath, [
      `--app=${targetUrl}`,
      '--window-size=1280,720',
      '--window-position=0,0',
      '--disable-features=TranslateUI',
    ], { detached: false, stdio: 'ignore' });

    // When the browser window closes, kill the server
    browser.on('close', () => {
      console.log('[tagflix] browser closed — shutting down');
      process.exit(0);
    });

    browser.on('error', (err) => {
      console.error('[tagflix] failed to launch browser:', err.message);
      console.log(`[tagflix] open ${targetUrl} in your browser`);
    });
  } else {
    console.log(`[tagflix] no chromium browser found — open ${targetUrl} in your browser`);
  }
});
