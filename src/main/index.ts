// src/main/index.ts
import { app, shell, BrowserWindow, ipcMain } from 'electron';
import { join } from 'path';
import { electronApp, optimizer, is } from '@electron-toolkit/utils';
import icon from '../../resources/icon.png?asset';
import { ChildProcessWithoutNullStreams, spawn } from 'child_process';

let pythonProcess: ChildProcessWithoutNullStreams; // Store the Python process object

function createWindow(): void {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1500,
    height: 1000,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      nodeIntegration: true,
      contextIsolation: true,
    },
  });

  mainWindow.on('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url);
    return { action: 'deny' };
  });

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL']);
    mainWindow.webContents.openDevTools(); // Open DevTools here
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'));
  }

  const pythonScriptPath = join(app.getAppPath(), 'backend', 'websocket_server.py'); // Adjust 'backend' if needed
  console.log('Python script path:', pythonScriptPath);
  pythonProcess = spawn('python', [pythonScriptPath]);

  // Handle server output (optional, but good for debugging)
  pythonProcess.stdout.on('data', (data: Buffer) => {
    console.log(`Python server stdout: ${data}`);
  });

  pythonProcess.stderr.on('data', (data: Buffer) => {
    console.error(`Python server stderr: ${data}`);
  });

  pythonProcess.on('close', (code: number | null) => {
    console.log(`Python server process exited with code ${code}`);
  });
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron');

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window);
  });

  // IPC test
  ipcMain.on('ping', () => console.log('pong'));

  createWindow();

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Ensure Python server is killed when the Electron app closes
app.on('before-quit', () => {
  if (pythonProcess) {
    pythonProcess.kill();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
