// =============================================================================
// MINDI Desktop — Electron Preload Script
// Secure context bridge. Exposes ONLY the APIs the renderer needs.
// contextIsolation: true — renderer cannot access Node.js directly.
// =============================================================================

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('mindiDesktop', {
  // Platform detection
  getPlatform: () => ipcRenderer.invoke('get-platform'),
  getVersion: () => ipcRenderer.invoke('get-version'),

  // File system — open dialog only, no direct FS access
  openFileDialog: () => ipcRenderer.invoke('open-file-dialog'),

  // Is running in Electron (renderer can check this)
  isDesktop: true,
});
