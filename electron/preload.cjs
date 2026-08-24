// Hide Electron-specific properties so VidCore/VidKing don't detect us
const { contextBridge } = require('electron');

// Override navigator properties to hide Electron
Object.defineProperty(navigator, 'plugins', {
  get: () => [1, 2, 3, 4, 5], // Real browsers have plugins
});

Object.defineProperty(navigator, 'languages', {
  get: () => ['en-US', 'en'],
});

// Remove Electron-specific global variables
delete window.require;
delete window.module;
delete window.global;
delete window.process;
