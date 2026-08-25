// Minimal Electron stealth — only what's needed for Cloudflare
// DO NOT override window.parent or window.top — breaks VidCore token handshakes

// Remove Electron globals
delete window.require;
delete window.module;
delete window.process;

// Hide webdriver flag (Cloudflare checks this)
Object.defineProperty(navigator, 'webdriver', {
  get: () => false,
});

// Mock chrome.runtime for Cloudflare challenges
if (!window.chrome) {
  window.chrome = {};
}
if (!window.chrome.runtime) {
  window.chrome.runtime = { connect: () => {}, sendMessage: () => {} };
}
