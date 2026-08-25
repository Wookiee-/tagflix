const { app, BrowserWindow, session } = require('electron');
const path = require('path');

const isDev = !app.isPackaged;

// ═══════════════════════════════════════════════════════════════
// 1. GPU Hardware Acceleration — forces H.264/HEVC to the GPU
// ═══════════════════════════════════════════════════════════════
app.commandLine.appendSwitch('ignore-gpu-blocklist');
app.commandLine.appendSwitch('enable-gpu-rasterization');
app.commandLine.appendSwitch('enable-zero-copy');
app.commandLine.appendSwitch('enable-accelerated-video-decode');
app.commandLine.appendSwitch('enable-features', 'VaapiVideoDecoder,PlatformHEVCDecoderSupport,VaapiVideoEncodeLinuxGL,VaapiVP8ProfileTL0Profile1');
app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');
app.commandLine.appendSwitch('disable-http-cache', 'false'); // enable cache to prevent re-downloading segments

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
      // ═══════════════════════════════════════════════════════════
      // 2. webSecurity: TRUE — standard cookie & storage rules.
      //    NO wildcard CORS injection — VidCore's backend rejects it.
      //    Use partition for persistent VidCore session tokens.
      // ═══════════════════════════════════════════════════════════
      webSecurity: true,
      allowRunningInsecureContent: false,
      experimentalFeatures: true,
      backgroundThrottling: true,
      partition: 'persist:vidcore_session',
      preload: path.join(__dirname, 'preload.cjs'),
    },
  });

  mainWindow.setMenuBarVisibility(false);
  mainWindow.webContents.setUserAgent(CHROME_UA);

  // BLOCK POPUP ADS: Silently deny all window.open() from iframes.
  // Without sandbox, VidCore can trigger ad redirects via window.open().
  mainWindow.webContents.setWindowOpenHandler(() => {
    return { action: 'deny' };
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    // Serve dist/ via local HTTP so cross-origin API calls (TMDB) work.
    const http = require('http');
    const fs = require('fs');
    const distDir = path.join(__dirname, '..', 'dist');

    const MIME = {
      '.html': 'text/html',
      '.js': 'text/javascript',
      '.css': 'text/css',
      '.svg': 'image/svg+xml',
      '.json': 'application/json',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.woff2': 'font/woff2',
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

  // Stealth patches on page load
  mainWindow.webContents.on('did-finish-load', () => {
    mainWindow.webContents.executeJavaScript(`
      Object.defineProperty(navigator, 'webdriver', { get: () => false });
      if (!window.chrome) window.chrome = {};
      if (!window.chrome.runtime) window.chrome.runtime = { connect: () => {}, sendMessage: () => {} };
    `).catch(() => {});
  });

  // Re-apply stealth to sub-frames (iframes)
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

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  session.defaultSession.setUserAgent(CHROME_UA);
  session.defaultSession.clearCache().catch(() => {});

  session.defaultSession.registerPreloadScript({
    filePath: path.join(__dirname, 'preload.cjs'),
    type: 'frame',
  });

  createWindow();

  // ═══════════════════════════════════════════════════════════════
  // 3. DO NOT use onHeadersReceived to inject CORS headers!
  //    VidCore's backend rejects wildcard access-control-allow-origin.
  //    Let the browser handle CORS naturally with webSecurity: true.
  // ═══════════════════════════════════════════════════════════════

  // Only remove X-Frame-Options so iframes load (VidCore sets this
  // on some responses but it's not needed in Electron).
  session.defaultSession.webRequest.onHeadersReceived(
    { urls: ['*://*.vidcore.io/*', '*://*.vidking.net/*'] },
    (details, callback) => {
      const responseHeaders = { ...details.responseHeaders };
      delete responseHeaders['x-frame-options'];
      delete responseHeaders['content-security-policy'];
      callback({ responseHeaders });
    }
  );

  // 4. Inject request headers to match standard Chrome iframe requests.
  //    Sec-Fetch-* headers are critical — VidCore's backend checks them.
  session.defaultSession.webRequest.onBeforeSendHeaders(
    { urls: ['*://*.vidcore.io/*', '*://*.vidking.net/*'] },
    (details, callback) => {
      const url = details.url;
      const headers = { ...details.requestHeaders };

      headers['User-Agent'] = CHROME_UA;
      headers['Accept-Language'] = 'en-US,en;q=0.9';

      if (url.includes('vidcore.io')) {
        headers['Referer'] = 'https://vidcore.io/';
        headers['Origin'] = 'https://vidcore.io';
      } else if (url.includes('vidking.net')) {
        headers['Referer'] = 'https://www.vidking.net/';
        headers['Origin'] = 'https://www.vidking.net';
      }

      // Match standard Chrome iframe request fingerprint
      headers['Sec-Fetch-Dest'] = 'iframe';
      headers['Sec-Fetch-Mode'] = 'navigate';
      headers['Sec-Fetch-Site'] = 'cross-site';
      headers['Sec-Fetch-User'] = '?1';

      callback({ requestHeaders: headers });
    }
  );

  // ═══════════════════════════════════════════════════════════════
  // 5. Ad blocker — blocks tracking, ads, cryptominers, and
  //    background workers that flood network during seeking.
  // ═══════════════════════════════════════════════════════════════
  const AD_DOMAINS = [
    // Google ads/tracking
    'doubleclick.net', 'googlesyndication.com', 'googleadservices.com',
    'google-analytics.com', 'googletagmanager.com', 'googletagservices.com',
    'adservice.google.com', 'pagead2.googlesyndication.com',
    'tpc.googlesyndication.com',
    // Video ad servers
    'jwpltx.com', 'jwpsrv.com', 'brightcove.com', 'viralize.tv',
    'moat.com', 'spotxchange.com', 'spotx.tv', 'serving-sys.com',
    // Programmatic ad platforms
    'adnxs.com', 'adsrvr.org', 'demdex.net', 'scorecardresearch.com',
    // Pop-under / pop-up networks
    'popads.net', 'popcash.net', 'propellerads.com', 'onclickmax.com',
    'exoclick.com', 'juicyads.com', 'trafficjunky.com',
    // Social trackers
    'facebook.net', 'fbcdn.net', 'connect.facebook.net',
    // Analytics
    'hotjar.com', 'sentry.io', 'amplitude.com',
    'mixpanel.com', 'segment.com', 'branch.io',
    'adjust.com', 'appsflyer.com',
    // Cryptominers
    'coinhive.com', 'coin-hive.com', 'crypto-loot.com',
    'coinimp.com', 'authedmine.com',
    // VidCore ad/tracking servers
    'je.deuxseethe.com', 'deuxseethe.com',
    'ads.vidcore.io', 'ad.vidcore.io',
    // URL shorteners / ad redirects
    'adf.ly', 'bit.ly', 'shorte.st',
    'anonym.to', 'redirect.viglink.com',
    // Generic ad/tracking patterns
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
    (details, callback) => {
      callback({ cancel: true });
    }
  );

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
