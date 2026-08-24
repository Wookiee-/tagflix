const { app, BrowserWindow, session } = require('electron');
const path = require('path');

const isDev = !app.isPackaged;

// ─── Chromium flags for codec/DRM support (VidCore needs these) ───
app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');
app.commandLine.appendSwitch('disable-site-isolation-trials');
app.commandLine.appendSwitch('ignore-certificate-errors');

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
      webSecurity: false, // VidCore iframe needs cross-origin HLS fetches
      allowRunningInsecureContent: true,
      experimentalFeatures: true, // Enables underlying media/codec features
      preload: path.join(__dirname, 'preload.cjs'),
    },
  });

  // Remove menu bar
  mainWindow.setMenuBarVisibility(false);

  // Use a real Chrome user agent so VidCore/VidKing don't block us
  mainWindow.webContents.setUserAgent(
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'
  );

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  // Inject stealth into every frame after it loads (catches iframes)
  mainWindow.webContents.on('did-finish-load', () => {
    mainWindow.webContents.executeJavaScript(`
      // Re-apply stealth patches in the main frame
      Object.defineProperty(navigator, 'webdriver', { get: () => false });
      if (!window.chrome) window.chrome = {};
      if (!window.chrome.runtime) window.chrome.runtime = { connect: () => {}, sendMessage: () => {} };
    `).catch(() => {});
  });

  // Also inject into every sub-frame (iframes)
  mainWindow.webContents.on('did-attach-webview', () => {});
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

  // Show when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  // Set user agent on the default session (applies to all requests including iframes)
  const ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';
  session.defaultSession.setUserAgent(ua);

  // Clear corrupted disk cache on startup
  session.defaultSession.clearCache().catch(() => {});

  // Register preload script for all frames (including cross-origin iframes)
  session.defaultSession.registerPreloadScript({
    filePath: path.join(__dirname, 'preload.cjs'),
    type: 'frame',
  });

  createWindow();

  // ─── Built-in ad blocker ───
  // Blocks requests to known ad/tracking domains before they load.
  const AD_DOMAINS = [
    // Generic ad networks
    'doubleclick.net', 'googlesyndication.com', 'googleadservices.com',
    'google-analytics.com', 'googletagmanager.com', 'googletagservices.com',
    'adservice.google.com', 'pagead2.googlesyndication.com',
    'tpc.googlesyndication.com', 'ad.lgappstv.com',
    // Video player ads
    'jwpltx.com', 'jwpsrv.com', 'brightcove.com', 'viralize.tv',
    'moat.com', 'spotxchange.com', 'spotx.tv', 'serving-sys.com',
    'adnxs.com', 'adsrvr.org', 'demdex.net', 'scorecardresearch.com',
    // Pop-ups and pop-unders
    'popads.net', 'popcash.net', 'propellerads.com', 'onclickmax.com',
    'exoclick.com', 'juicyads.com', 'trafficjunky.com',
    // Tracking / analytics
    'facebook.net', 'fbcdn.net', 'connect.facebook.net',
    'hotjar.com', 'sentry.io', 'amplitude.com',
    'mixpanel.com', 'segment.com', 'branch.io',
    'adjust.com', 'appsflyer.com', ' Branch.io',
    // Cryptominers
    'coinhive.com', 'coin-hive.com', 'crypto-loot.com',
    'coinimp.com', 'authedmine.com',
    // VidCore-specific ad domains
    'je.deuxseethe.com', 'deuxseethe.com',
    'ads.vidcore.io', 'ad.vidcore.io',
    // Misc ad/redirect
    'adfly', 'adf.ly', 'bit.ly', 'shorte.st',
    'anonym.to', 'redirect.viglink.com',
  ];

  // Build URL filter patterns
  const adUrlPatterns = AD_DOMAINS.map(d => `*://*.${d}/*`);
  adUrlPatterns.push(
    // Also block common ad path patterns
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

  // ─── End ad blocker ───

  // Set proper headers for embed providers and hide Electron from detection
  session.defaultSession.webRequest.onBeforeSendHeaders(
    { urls: ['*://*.vidcore.io/*', '*://*.vidking.net/*'] },
    (details, callback) => {
      const url = details.url;
      // Spoof User-Agent so VidCore doesn't detect Electron
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

  // Allow third-party cookies for iframe embeds
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    const responseHeaders = details.responseHeaders;
    // Remove X-Frame-Options if present (for all embeds)
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
