import { contextBridge } from 'electron';
import { electronAPI } from '@electron-toolkit/preload';
import { ipcRenderer } from 'electron';
// Custom APIs for renderer
const api = {};

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', {
      ipcRenderer: {
        invoke: (channel, data) => ipcRenderer.invoke(channel, data),
        send: (channel, data) => ipcRenderer.send(channel, data),
        on: (channel, callback) => ipcRenderer.on(channel, callback),
        removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel),
        once: (channel, callback) => ipcRenderer.once(channel, callback),
        // off: (channel, callback) => ipcRenderer.off(channel, callback), neither it or removeListener works correctly
      },
      process: {
        versions: {
          chrome: electronAPI.process.versions.chrome,
          electron: electronAPI.process.versions.electron,
          node: electronAPI.process.versions.node,
        },
      },
      // You can also expose other safe APIs here if your renderer needs them
    });
    // contextBridge.exposeInMainWorld('electron', electronAPI);
    contextBridge.exposeInMainWorld('api', api);
  } catch (error) {
    console.error(error);
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI;
  // @ts-ignore (define in dts)
  window.api = api;
}
