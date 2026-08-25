// Minimal Electron stealth — safe for cross-origin iframes
// All operations wrapped in try/catch to prevent crashes in subframes

// Safe removal of Electron globals (may not exist in cross-origin frames)
try { delete window.require; } catch (e) {}
try { delete window.module; } catch (e) {}
try { delete window.global; } catch (e) {}
try { delete window.process; } catch (e) {}

// Hide webdriver flag (Cloudflare checks this)
try {
  Object.defineProperty(navigator, 'webdriver', {
    get: () => false,
  });
} catch (e) {}

// Mock chrome.runtime for Cloudflare challenges
try {
  if (!window.chrome) {
    window.chrome = {};
  }
  if (!window.chrome.runtime) {
    window.chrome.runtime = { connect: () => {}, sendMessage: () => {} };
  }
} catch (e) {}
