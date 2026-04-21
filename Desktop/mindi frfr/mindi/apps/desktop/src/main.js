// =============================================================================
// MINDI Desktop — Electron Main Process
// Wraps the Next.js web app in a native window.
// Security: contextIsolation + nodeIntegration disabled + preload bridge.
// Supports: Windows, macOS, Linux.
// =============================================================================

const { app, BrowserWindow, shell, ipcMain, nativeTheme, Menu } = require('electron');
const path = require('path');
const isDev = process.env.NODE_ENV === 'development';

// Keep reference to prevent GC
let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    backgroundColor: '#0f0f13', // Match Mindi's base color — no white flash on load
    show: false, // Show after content loads — prevents blank flash

    webPreferences: {
      // Security: strict isolation — Trust Covenant at OS layer
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      preload: path.join(__dirname, 'preload.js'),

      // Allow Web Speech API for voice features
      additionalArguments: ['--enable-speech-dispatcher'],
    },

    icon: path.join(__dirname, '../resources/icon.png'),
  });

  // Load Next.js — dev server or built output
  const url = isDev
    ? 'http://localhost:3000'
    : `file://${path.join(__dirname, '../../web/.next/server/app/index.html')}`;

  mainWindow.loadURL(url);

  // Show window only after first paint (no blank white flash)
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    if (isDev) mainWindow.webContents.openDevTools({ mode: 'detach' });
  });

  // Open external links in system browser, not Electron
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https://')) shell.openExternal(url);
    return { action: 'deny' };
  });

  // Prevent navigation away from Mindi (security)
  mainWindow.webContents.on('will-navigate', (event, navUrl) => {
    if (!navUrl.startsWith('http://localhost') && !navUrl.startsWith('file://')) {
      event.preventDefault();
    }
  });

  mainWindow.on('closed', () => { mainWindow = null; });
}

// -----------------------------------------------------------------------------
// App lifecycle
// -----------------------------------------------------------------------------

app.whenReady().then(() => {
  // Force dark mode to match Mindi's theme
  nativeTheme.themeSource = 'dark';

  createWindow();
  buildAppMenu();

  // macOS: re-create window on dock click
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// -----------------------------------------------------------------------------
// IPC handlers — exposed to renderer via preload bridge
// -----------------------------------------------------------------------------

// Platform info (renderer needs to know it's desktop for feature gating)
ipcMain.handle('get-platform', () => ({
  platform: process.platform,
  version: app.getVersion(),
  isDesktop: true,
}));

// Open file dialog for brain upload
ipcMain.handle('open-file-dialog', async () => {
  const { dialog } = require('electron');
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Add to your brain',
    filters: [
      { name: 'Documents', extensions: ['txt', 'md', 'pdf', 'json'] },
      { name: 'All Files', extensions: ['*'] },
    ],
    properties: ['openFile', 'multiSelections'],
  });
  return result.canceled ? [] : result.filePaths;
});

// App version for update checks
ipcMain.handle('get-version', () => app.getVersion());

// -----------------------------------------------------------------------------
// App menu (macOS-native, Windows/Linux simplified)
// -----------------------------------------------------------------------------

function buildAppMenu() {
  const isMac = process.platform === 'darwin';

  const template = [
    ...(isMac ? [{
      label: 'Mindi',
      submenu: [
        { label: 'About Mindi', role: 'about' },
        { type: 'separator' },
        { label: 'Preferences...', accelerator: 'Cmd+,', click: () => mainWindow?.webContents.executeJavaScript("window.location.href='/settings'") },
        { type: 'separator' },
        { role: 'services' },
        { type: 'separator' },
        { role: 'hide' }, { role: 'hideOthers' }, { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' },
      ],
    }] : []),
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' }, { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' }, { role: 'copy' }, { role: 'paste' },
        { role: 'selectAll' },
      ],
    },
    {
      label: 'View',
      submenu: [
        { label: 'Brain Graph', accelerator: 'CmdOrCtrl+1', click: () => mainWindow?.webContents.executeJavaScript("window.location.href='/dashboard?panel=graph'") },
        { label: 'Chat', accelerator: 'CmdOrCtrl+2', click: () => mainWindow?.webContents.executeJavaScript("window.location.href='/dashboard?panel=chat'") },
        { type: 'separator' },
        { role: 'reload' }, { role: 'forceReload' },
        { type: 'separator' },
        { role: 'resetZoom' }, { role: 'zoomIn' }, { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
      ],
    },
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' }, { role: 'zoom' },
        ...(isMac ? [{ type: 'separator' }, { role: 'front' }] : [{ role: 'close' }]),
      ],
    },
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}
