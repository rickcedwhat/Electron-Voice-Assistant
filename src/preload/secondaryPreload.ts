// secondaryPreload.js
import { contextBridge } from 'electron';
import { electronAPI } from '@electron-toolkit/preload';

// Custom APIs for the secondary renderer (can be different from 'api')
const secondaryApi = {};

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('secondaryElectron', electronAPI);
    contextBridge.exposeInMainWorld('secondaryApi', secondaryApi);
  } catch (error) {
    console.error(error);
  }
} else {
  // @ts-ignore (define in dts)
  window.secondaryElectron = electronAPI;
  // @ts-ignore (define in dts)
  window.secondaryApi = secondaryApi;
}
