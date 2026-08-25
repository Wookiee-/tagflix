const { app, BrowserWindow, WebContentsView, ipcMain, session } = require('electron');
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
let playerView = null;

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
      session: session.defaultSession,
    },
  });

  mainWindow.setMenuBarVisibility(false);
  mainWindow.webContents.setUserAgent(CHROME_UA);

  // Block popup ads from main window
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
  mainWindow.on('closed', () => {
    mainWindow = null;
    playerView = null;
  });
}

// ─── Stream View IPC Handlers ───
// Instead of iframe, VidCore loads as a top-level Chromium view
// that behaves identically to a normal Chrome tab.

ipcMain.handle('load-stream-view', async (event, { url, bounds }) => {
  if (!mainWindow) return;

  // Destroy existing view if swapping streams
  if (playerView) {
    mainWindow.contentView.removeChildView(playerView);
    playerView.webContents.close();
    playerView = null;
  }

  // Create native WebContentsView — acts as a top-level document like Chrome/Edge
  playerView = new WebContentsView({
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
    },
  });

  mainWindow.contentView.addChildView(playerView);

  // Set position and size matching the UI player container
  playerView.setBounds(bounds);

  // Block popups inside player view
  playerView.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  playerView.webContents.setUserAgent(CHROME_UA);

  await playerView.webContents.loadURL(url);
});

// Update bounds on window resize or layout change
ipcMain.on('update-stream-bounds', (event, bounds) => {
  if (playerView) {
    playerView.setBounds(bounds);
  }
});

// Destroy stream view
ipcMain.on('close-stream-view', () => {
  if (playerView && mainWindow) {
    mainWindow.contentView.removeChildView(playerView);
    playerView.webContents.close();
    playerView = null;
  }
});

// ─── App Lifecycle ───

app.whenReady().then(() => {
  session.defaultSession.setUserAgent(CHROME_UA);

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

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
