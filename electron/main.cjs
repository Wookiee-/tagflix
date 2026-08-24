const { app, BrowserWindow, session } = require('electron');
const path = require('path');

const isDev = !app.isPackaged;

console.log('[tagflix] isDev:', isDev);
console.log('[tagflix] appPath:', app.getAppPath());
console.log('[tagflix] __dirname:', __dirname);

// ─── Chromium flags for codec/DRM support (VidCore needs these) ───
app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');
app.commandLine.appendSwitch('disable-site-isolation-trials');
app.commandLine.appendSwitch('ignore-certificate-errors');
app.commandLine.appendSwitch('disable-gpu-compositing');
app.commandLine.appendSwitch('disable-gpu');
app.commandLine.appendSwitch('disable-gpu-sandbox');

let mainWindow;

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
      webSecurity: false,
      allowRunningInsecureContent: true,
      experimentalFeatures: true,
      preload: path.join(__dirname, 'preload.cjs'),
    },
  });

  mainWindow.setMenuBarVisibility(false);

  const ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';
  mainWindow.webContents.setUserAgent(ua);

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    // Serve dist/ via local HTTP so cross-origin API calls (TMDB) work.
    // file:// protocol blocks cross-origin fetch — localhost doesn't.
    const http = require('http');
    const fs = require('fs');
    const distDir = path.join(__dirname, '..', 'dist');

    const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.woff2': 'font/woff2' };

    const server = http.createServer((req, res) => {
      let filePath = path.join(distDir, req.url === '/' ? '/index.html' : req.url);
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

  mainWindow.webContents.on('console-message', (event, level, message) => {
    if (level >= 2) console.log(`[renderer] ${message}`);
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  const ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';
  session.defaultSession.setUserAgent(ua);
  session.defaultSession.clearCache().catch(() => {});

  session.defaultSession.registerPreloadScript({
    filePath: path.join(__dirname, 'preload.cjs'),
    type: 'frame',
  });

  createWindow();

  // ─── Ad blocker ───
  const AD_DOMAINS = [
    'doubleclick.net', 'googlesyndication.com', 'googleadservices.com',
    'google-analytics.com', 'googletagmanager.com', 'googletagservices.com',
    'adservice.google.com', 'pagead2.googlesyndication.com',
    'tpc.googlesyndication.com', 'ad.lgappstv.com',
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
    'adfly', 'adf.ly', 'bit.ly', 'shorte.st',
    'anonym.to', 'redirect.viglink.com',
  ];
  const adUrlPatterns = AD_DOMAINS.map(d => `*://*.${d}/*`);
  adUrlPatterns.push(
    '*://*/ads/*', '*://*/advert/*', '*://*/advertisement/*',
    '*://*/popunder/*', '*://*/popup/*',
    '*://*/tracking/*', '*://*/analytics/*',
  );

  session.defaultSession.webRequest.onBeforeRequest(
    { urls: adUrlPatterns },
    (details, callback) => {
      callback({ cancel: true });
    }
  );

  session.defaultSession.webRequest.onBeforeSendHeaders(
    { urls: ['*://*.vidcore.io/*', '*://*.vidking.net/*'] },
    (details, callback) => {
      const url = details.url;
      details.requestHeaders['User-Agent'] = ua;
      if (url.includes('vidcore.io')) {
        details.requestHeaders['Referer'] = 'https://vidcore.io/';
        details.requestHeaders['Origin'] = 'https://vidcore.io';
      } else if (url.includes('vidking.net')) {
        details.requestHeaders['Referer'] = 'https://www.vidking.net/';
        details.requestHeaders['Origin'] = 'https://www.vidking.net';
      }
      if (!details.requestHeaders['Accept']) {
        details.requestHeaders['Accept'] = '*/*';
      }
      details.requestHeaders['Accept-Language'] = 'en-US,en;q=0.9';
      callback({ requestHeaders: details.requestHeaders });
    }
  );

  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    const responseHeaders = details.responseHeaders;
    for (const key of Object.keys(responseHeaders)) {
      if (key.toLowerCase() === 'x-frame-options') {
        delete responseHeaders[key];
      }
    }
    callback({ responseHeaders });
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
