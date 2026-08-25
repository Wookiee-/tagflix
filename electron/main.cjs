const { app, BrowserWindow, session } = require('electron');
const path = require('path');

const isDev = !app.isPackaged;

// GPU Hardware Acceleration
app.commandLine.appendSwitch('ignore-gpu-blocklist');
app.commandLine.appendSwitch('enable-gpu-rasterization');
app.commandLine.appendSwitch('enable-zero-copy');
app.commandLine.appendSwitch('enable-accelerated-video-decode');
app.commandLine.appendSwitch('enable-features', 'VaapiVideoDecoder,PlatformHEVCDecoderSupport');
app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');

let mainWindow;

const CHROME_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    title: 'Tagflix',
    backgroundColor: '#0c0b11',
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
      webSecurity: true,
      backgroundThrottling: true,
      // Explicitly bind to defaultSession so cookies flow naturally
      session: session.defaultSession,
      // No preload here — registered globally via registerPreloadScript
    },
  });

  mainWindow.setMenuBarVisibility(false);
  mainWindow.webContents.setUserAgent(CHROME_UA);

  // Block popup ads
  mainWindow.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    const http = require('http');
    const fs = require('fs');
    const distDir = path.join(__dirname, '..', 'dist');
    const MIME = {
      '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
      '.svg': 'image/svg+xml', '.json': 'application/json',
      '.png': 'image/png', '.jpg': 'image/jpeg', '.woff2': 'font/woff2',
    };

    const server = http.createServer((req, res) => {
      const url = new URL(req.url, 'http://localhost');
      let filePath = path.join(distDir, url.pathname === '/' ? '/index.html' : url.pathname);
      if (!fs.existsSync(filePath)) filePath = path.join(distDir, 'index.html');
      const ext = path.extname(filePath);
      res.setHeader('Content-Type', MIME[ext] || 'application/octet-stream');
      fs.createReadStream(filePath).pipe(res);
    });

    server.listen(0, '127.0.0.1', () => {
      const port = server.address().port;
      console.log('[tagflix] serving dist on http://127.0.0.1:' + port);
      mainWindow.loadURL('http://127.0.0.1:' + port);
    });
  }

  mainWindow.once('ready-to-show', () => mainWindow.show());
  mainWindow.on('closed', () => { mainWindow = null; });
}

app.whenReady().then(async () => {
  // Clear broken session tokens from previous 500 attempts
  await session.defaultSession.clearStorageData();

  session.defaultSession.setUserAgent(CHROME_UA);
  session.defaultSession.clearCache().catch(() => {});

  // Register preload for all frames (single registration, no duplicate)
  session.defaultSession.registerPreloadScript({
    filePath: path.join(__dirname, 'preload.cjs'),
    type: 'frame',
  });

  // Global: Spoof Client Hints on ALL outgoing requests (not just VidCore)
  // This removes Electron branding from Sec-Ch-Ua headers
  session.defaultSession.webRequest.onBeforeSendHeaders(
    (details, callback) => {
      const headers = { ...details.requestHeaders };
      headers['Sec-Ch-Ua'] = '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"';
      headers['Sec-Ch-Ua-Mobile'] = '?0';
      headers['Sec-Ch-Ua-Platform'] = '"Windows"';
      callback({ requestHeaders: headers });
    }
  );

  createWindow();

  // VidCore-specific: Smart Referer + Origin
  session.defaultSession.webRequest.onBeforeSendHeaders(
    { urls: ['*://*.vidcore.io/*', '*://vidcore.io/*'] },
    (details, callback) => {
      // Let OPTIONS preflight pass untouched — Chromium handles CORS natively
      if (details.method === 'OPTIONS') {
        return callback({ requestHeaders: details.requestHeaders });
      }

      const headers = { ...details.requestHeaders };

      // Preserve inner frame Referer paths, only set root for external requests
      const existingReferer = headers['Referer'] || details.referrer || '';
      if (!existingReferer.includes('vidcore.io')) {
        headers['Referer'] = 'https://vidcore.io/';
      }

      // Only attach Origin on non-GET
      if (headers['Origin'] || details.method !== 'GET') {
        headers['Origin'] = 'https://vidcore.io';
      }

      callback({ requestHeaders: headers });
    }
  );

  // Strip X-Frame-Options and CSP frame-ancestors
  session.defaultSession.webRequest.onHeadersReceived(
    { urls: ['*://*.vidcore.io/*', '*://vidcore.io/*'] },
    (details, callback) => {
      const responseHeaders = { ...details.responseHeaders };

      Object.keys(responseHeaders).forEach((key) => {
        const lowerKey = key.toLowerCase();
        if (lowerKey === 'x-frame-options') {
          delete responseHeaders[key];
        }
        if (lowerKey === 'content-security-policy') {
          responseHeaders[key] = responseHeaders[key].map(val =>
            val.replace(/frame-ancestors[^;]+(;|$)/gi, '')
          );
        }
      });

      callback({ responseHeaders });
    }
  );

  // Ad Blocker
  const AD_DOMAINS = [
    'doubleclick.net', 'googlesyndication.com', 'googleadservices.com',
    'google-analytics.com', 'googletagmanager.com',
    'adservice.google.com', 'pagead2.googlesyndication.com',
    'tpc.googlesyndication.com',
    'moat.com', 'spotxchange.com', 'spotx.tv', 'serving-sys.com',
    'adnxs.com', 'adsrvr.org', 'demdex.net', 'scorecardresearch.com',
    'popads.net', 'popcash.net', 'propellerads.com', 'onclickmax.com',
    'exoclick.com', 'juicyads.com', 'trafficjunky.com',
    'facebook.net', 'fbcdn.net', 'connect.facebook.net',
    'hotjar.com', 'sentry.io', 'amplitude.com',
    'mixpanel.com', 'segment.com', 'branch.io',
    'adjust.com', 'appsflyer.com',
    'coinhive.com', 'coin-hive.com', 'crypto-loot.com',
    'coinimp.com', 'authedmine.com',
    'je.deuxseethe.com', 'deuxseethe.com',
    'ads.vidcore.io', 'ad.vidcore.io',
    'adf.ly', 'shorte.st', 'anonym.to',
    'adskeeper.com', 'hilltopads.com', 'clickadu.com',
    'pico.cedra.com', 'ad-maven.com', 'monu.delivery',
  ];
  const adUrlPatterns = AD_DOMAINS.map(d => `*://*.${d}/*`);

  session.defaultSession.webRequest.onBeforeRequest(
    { urls: adUrlPatterns },
    (details, callback) => { callback({ cancel: true }); }
  );

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
