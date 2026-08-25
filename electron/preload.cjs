// Minimal Electron preload — exposes IPC for the renderer to control the stream view.
// No stealth patches needed: WebContentsView runs as a top-level Chromium document.

const { contextBridge, ipcRenderer } = require('electron');

// Expose IPC methods to the renderer for the native stream view
contextBridge.exposeInMainWorld('electron', {
  ipcRenderer: {
    // Load a URL in a native WebContentsView positioned at the given bounds
    loadStreamView: (url, bounds) =>
      ipcRenderer.invoke('load-stream-view', { url, bounds }),

    // Update the view's position/size
    updateStreamBounds: (bounds) =>
      ipcRenderer.send('update-stream-bounds', bounds),

    // Destroy the stream view
    closeStreamView: () =>
      ipcRenderer.send('close-stream-view'),
  },
});
