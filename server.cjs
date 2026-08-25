const express = require('express');
const path = require('path');
const fs = require('fs');
const open = require('open');
const { execSync } = require('child_process');

const app = express();
const PORT = process.env.PORT || 5173;
const distDir = path.join(__dirname, 'dist');

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
 * Detects installed Chromium browsers (Edge, Chrome, Brave) on the host machine.
 * Returns the browser name for the `open` package, or null if not found.
 */
function getPreferredBrowser() {
  const platform = process.platform;

  if (platform === 'win32') {
    // Check Edge first (most reliable on Windows)
    const edgePaths = [
      process.env['PROGRAMFILES(X86)'] + '\\Microsoft\\Edge\\Application\\msedge.exe',
      process.env['PROGRAMFILES'] + '\\Microsoft\\Edge\\Application\\msedge.exe',
    ];
    if (edgePaths.some(p => fs.existsSync(p))) return 'msedge';

    const chromePaths = [
      process.env['PROGRAMFILES(X86)'] + '\\Google\\Chrome\\Application\\chrome.exe',
      process.env['PROGRAMFILES'] + '\\Google\\Chrome\\Application\\chrome.exe',
      process.env['LOCALAPPDATA'] + '\\Google\\Chrome\\Application\\chrome.exe',
    ];
    if (chromePaths.some(p => fs.existsSync(p))) return 'google chrome';

    const bravePaths = [
      process.env['PROGRAMFILES'] + '\\BraveSoftware\\Brave-Browser\\Application\\brave.exe',
    ];
    if (bravePaths.some(p => fs.existsSync(p))) return 'brave';
  }
  else if (platform === 'darwin') {
    if (fs.existsSync('/Applications/Microsoft Edge.app')) return 'microsoft edge';
    if (fs.existsSync('/Applications/Google Chrome.app')) return 'google chrome';
    if (fs.existsSync('/Applications/Brave Browser.app')) return 'brave';
  }
  else if (platform === 'linux') {
    try { execSync('which microsoft-edge || which msedge', { stdio: 'ignore' }); return 'microsoft-edge'; } catch (e) {}
    try { execSync('which google-chrome || which chromium-browser || which chromium', { stdio: 'ignore' }); return 'google chrome'; } catch (e) {}
    try { execSync('which brave-browser || which brave', { stdio: 'ignore' }); return 'brave'; } catch (e) {}
  }

  return null; // Fallback to system default browser
}

app.listen(PORT, '127.0.0.1', async () => {
  const targetUrl = `http://127.0.0.1:${PORT}`;
  console.log(`[tagflix] server running at ${targetUrl}`);

  const browser = getPreferredBrowser();

  try {
    if (browser) {
      console.log(`[tagflix] launching ${browser} in app mode...`);
      await open(targetUrl, {
        app: {
          name: open.apps[browser] || browser,
          arguments: [`--app=${targetUrl}`],
        },
      });
    } else {
      console.log('[tagflix] no chromium browser found — opening in default browser...');
      await open(targetUrl);
    }
  } catch (err) {
    console.error('[tagflix] failed to launch browser:', err.message);
  }
});
