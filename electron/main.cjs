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
      webviewTag: false,
      sandbox: false,
      webSecurity: true,
      backgroundThrottling: true,
      preload: path.join(__dirname, 'preload.cjs'),
    },
  });

  mainWindow.setMenuBarVisibility(false);
  mainWindow.webContents.setUserAgent(CHROME_UA);

  // Silent-kill popup ads from the iframe
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

  // Stealth patches
  mainWindow.webContents.on('did-finish-load', () => {
    mainWindow.webContents.executeJavaScript(`
      Object.defineProperty(navigator, 'webdriver', { get: () => false });
      if (!window.chrome) window.chrome = {};
      if (!window.chrome.runtime) window.chrome.runtime = { connect: () => {}, sendMessage: () => {} };
    `).catch(() => {});
  });

  mainWindow.webContents.on('frame-navigated', (event, frame) => {
    if (frame === mainWindow.webContents.mainFrame) return;
    frame.once('dom-ready', () => {
      frame.executeJavaScript(`
        Object.defineProperty(navigator, 'webdriver', { get: () => false });
        if (!window.chrome) window.chrome = {};
        if (!window.chrome.runtime) window.chrome.runtime = { connect: () => {}, sendMessage: () => {} };
      `).catch(() => {});
    });
  });

  mainWindow.once('ready-to-show', () => mainWindow.show());
  mainWindow.on('closed', () => { mainWindow = null; });
}

app.whenReady().then(async () => {
  // Wipe broken session data from previous 500 errors
  await session.defaultSession.clearStorageData();

  session.defaultSession.setUserAgent(CHROME_UA);
  session.defaultSession.clearCache().catch(() => {});

  session.defaultSession.registerPreloadScript({
    filePath: path.join(__dirname, 'preload.cjs'),
    type: 'frame',
  });

  createWindow();

  // ═══════════════════════════════════════════════════════════════
  // MINIMAL: Only set Referer for vidcore.io.
  // Do NOT touch Origin, Sec-Fetch-*, or any other headers.
  // VidCore's internal XHR/fetch needs its own natural headers.
  // ═══════════════════════════════════════════════════════════════
  session.defaultSession.webRequest.onBeforeSendHeaders(
    { urls: ['*://*.vidcore.io/*', '*://*.vidking.net/*'] },
    (details, callback) => {
      const headers = { ...details.requestHeaders };
      headers['Referer'] = 'https://vidcore.io/';
      callback({ requestHeaders: headers });
    }
  );

  // Only strip X-Frame-Options so iframes load
  session.defaultSession.webRequest.onHeadersReceived(
    { urls: ['*://*.vidcore.io/*', '*://*.vidking.net/*'] },
    (details, callback) => {
      const responseHeaders = { ...details.responseHeaders };
      delete responseHeaders['x-frame-options'];
      delete responseHeaders['content-security-policy'];
      callback({ responseHeaders });
    }
  );

  // Ad blocker
  const AD_DOMAINS = [
    'doubleclick.net', 'googlesyndication.com', 'googleadservices.com',
    'google-analytics.com', 'googletagmanager.com', 'googletagservices.com',
    'adservice.google.com', 'pagead2.googlesyndication.com',
    'tpc.googlesyndication.com',
    'jwpltx.com', 'jwpsrv.com', 'brightcove.com', 'viralize.tv',
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
    'adf.ly', 'bit.ly', 'shorte.st',
    'anonym.to', 'redirect.viglink.com',
    'adskeeper.com', 'hilltopads.com', 'clickadu.com',
    'pico.cedra.com', 'ad-maven.com', 'monu.delivery',
    'pushame.com', 'pushwoosh.com',
  ];
  const adUrlPatterns = AD_DOMAINS.map(d => `*://*.${d}/*`);
  adUrlPatterns.push(
    '*://*/ads/*', '*://*/advert/*', '*://*/advertisement/*',
    '*://*/popunder/*', '*://*/popup/*',
    '*://*/tracking/*', '*://*/analytics/*',
    '*://*/beacon/*', '*://*/pixel/*',
  );

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
