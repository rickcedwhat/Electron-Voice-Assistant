// import { ElectronAPI } from '@electron-toolkit/preload'

// declare global {
//   interface Window {
//     electron: ElectronAPI
//     api: unknown
//   }
// }

import { IpcRenderer } from 'electron'; // Import the interface

declare global {
  interface Window {
    electron: {
      ipcRenderer: {
        invoke: IpcRenderer['invoke'];
        send: IpcRenderer['send'];
        on: IpcRenderer['on'];
        once: IpcRenderer['once'];
        removeAllListeners: IpcRenderer['removeAllListeners'];
      };
      process: {
        versions: {
          chrome: string;
          electron: string;
          node: string;
        };
      };
      // Add any other APIs you expose in preload
    };
  }
}
