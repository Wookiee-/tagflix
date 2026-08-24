// Comprehensive Electron stealth — hides all detection markers
// that Cloudflare/VidCore use to identify non-browser environments.

// ─── 1. Remove Electron globals ───
delete window.require;
delete window.module;
delete window.global;
delete window.process;

// ─── 2. Override navigator properties ───
Object.defineProperty(navigator, 'plugins', {
  get: () => {
    const plugins = [
      { name: 'Chrome PDF Plugin', filename: 'internal-pdf-viewer', description: 'Portable Document Format' },
      { name: 'Chrome PDF Viewer', filename: 'mhjfbmdgcfjbbpaeojofohoefgiehjai', description: '' },
      { name: 'Native Client', filename: 'internal-nacl-plugin', description: '' },
    ];
    plugins.length = 3;
    return plugins;
  },
});

Object.defineProperty(navigator, 'languages', {
  get: () => ['en-US', 'en'],
});

Object.defineProperty(navigator, 'language', {
  get: () => 'en-US',
});

// ─── 3. Hide webdriver flag (Cloudflare checks this) ───
Object.defineProperty(navigator, 'webdriver', {
  get: () => false,
});

// ─── 4. Mock chrome.runtime for Cloudflare challenges ───
if (!window.chrome) {
  window.chrome = {};
}
if (!window.chrome.runtime) {
  window.chrome.runtime = {
    connect: () => {},
    sendMessage: () => {},
    id: undefined,
  };
}

// ─── 5. Mock permissions API ───
const originalQuery = window.navigator.permissions?.query;
if (window.navigator.permissions) {
  window.navigator.permissions.query = (parameters) =>
    parameters.name === 'notifications'
      ? Promise.resolve({ state: Notification.permission })
      : originalQuery?.(parameters) ?? Promise.resolve({ state: 'prompt' });
}

// ─── 6. Prevent iframe detection via window.top comparison ───
// VidCore may check if window !== window.top to detect iframe embedding
try {
  Object.defineProperty(window, 'parent', { get: () => window });
} catch (e) {
  // Some contexts disallow this
}

// ─── 7. Ensure WebGL is available (fingerprinting check) ───
try {
  const getParameter = WebGLRenderingContext.prototype.getParameter;
  WebGLRenderingContext.prototype.getParameter = function (param) {
    // UNMASKED_VENDOR_WEBGL
    if (param === 37445) return 'Intel Inc.';
    // UNMASKED_RENDERER_WEBGL
    if (param === 37446) return 'Intel Iris OpenGL Engine';
    return getParameter.call(this, param);
  };
} catch (e) {
  // WebGL not available
}
