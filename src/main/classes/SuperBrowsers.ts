import { BrowserWindow, ipcMain } from 'electron';
import { BrowserID } from '../../shared/services/supabase/types';
import { SuperBrowser } from './SuperBrowser';
import { join } from 'path';
import { is } from '@electron-toolkit/utils';
import { debugMode } from '..';
import { LoginBrowserConfig } from '../loginBrowserConfigs';
import { pearsonConfig } from '../loginBrowserConfigs/pearsonConfig';
import { handleSteps } from '../steps';
import { canvasFIUConfig } from '../loginBrowserConfigs/canvasFIUConfig';
import { ProcessStatus } from '../../shared/types';

const browserConfigs = [pearsonConfig, canvasFIUConfig];

const launchBrowser = <T extends Record<string, any>>(
  config: LoginBrowserConfig<T>,
  argObject: T,
) => {
  const { loginHeadless, loginUI } = SuperBrowsers.createLoginPair(config.loginURL);
  const mainWindow = SuperBrowsers.getMainWindow();

  loginHeadless.webContents.once('did-finish-load', async () => {
    await handleSteps(config, argObject, loginHeadless, loginUI, mainWindow);
  });

  return { loginHeadless, loginUI };
};

export class SuperBrowsers {
  private static browsers: Set<SuperBrowser> = new Set();
  private static mainWindow: BrowserWindow;

  constructor() {}

  static getMainWindow() {
    return SuperBrowsers.mainWindow;
  }

  static setMainWindow(mainWindow: BrowserWindow) {
    SuperBrowsers.mainWindow = mainWindow;
  }

  static removeBrowser(browserToRemove: SuperBrowser): void {
    if (SuperBrowsers.browsers.has(browserToRemove)) {
      SuperBrowsers.browsers.delete(browserToRemove);
      console.log('SuperBrowser removed. Total:', SuperBrowsers.browsers.size);
    }
  }

  static addBrowser(browserToAdd: SuperBrowser): void {
    if (!SuperBrowsers.browsers.has(browserToAdd)) {
      SuperBrowsers.browsers.add(browserToAdd);
    }
  }

  /**
   * Creates a pair of browser windows: one for headless login operations and another for UI interactions.
   *
   * @param loginURL - The URL to be loaded in the headless login browser.
   * @returns An object containing two browser instances:
   * - `loginHeadless`: A headless browser window for handling login operations.
   * - `loginUI`: A browser window for displaying the login UI.
   *
   * The `loginUI` window will load a local HTML file or a development server URL depending on the environment.
   * In development mode, the DevTools will be opened automatically for the `loginUI` window.
   * Dev should use loginHeadless.once('did-finish-load') to dictate the login process
   */
  static createLoginPair(loginURL: string) {
    const loginHeadless = SuperBrowser.create(
      {
        width: 1500,
        height: 1000,
        show: false,
        backgroundColor: 'black',
        webPreferences: {
          preload: join(__dirname, '../preload/index.mjs'),
          nodeIntegration: false,
          contextIsolation: true,
          sandbox: false,
        },
      },
      `loginHeadless-for-${loginURL}`,
    );
    const loginUI = SuperBrowser.create(
      {
        width: 800,
        height: 500,
        show: false,
        backgroundColor: 'black',
        webPreferences: {
          preload: join(__dirname, '../preload/index.mjs'),
          nodeIntegration: false,
          contextIsolation: true,
          sandbox: false,
        },
      },
      `loginUI-for-${loginURL}`,
    );
    if (is.dev) {
      loginUI.loadURL(`http://localhost:5173/companions/LoginUI/index.html`);
    } else {
      loginUI.loadFile(join(__dirname, '../companions/LoginUI/index.html'));
    }
    loginUI.on('ready-to-show', () => {
      loginUI.show();
    });
    loginHeadless.loadURL(loginURL);
    return { loginHeadless, loginUI };
  }

  static closeAll() {
    const browsers = Array.from(SuperBrowsers.browsers);
    browsers.forEach((br) => br.close());
  }

  static createBrowser(
    options: Electron.BrowserWindowConstructorOptions,
    name: string,
  ): SuperBrowser {
    const newBrowser = SuperBrowser.create(options, name);
    SuperBrowsers.addBrowser(newBrowser);
    console.log('SuperBrowser created. Total:', SuperBrowsers.browsers.size);
    return newBrowser;
  }

  //   used for logging in to student's account
  static createLoginBrowser = (
    browserID: BrowserID,
    username: string,
    password: string,
    securityAnswer?: string,
  ) => {
    console.log({ securityAnswer });
    const browserConfig = browserConfigs.find((config) => config.browserID === browserID);
    if (!browserConfig) {
      SuperBrowsers.mainWindow.webContents.send(
        'browser-window-creation',
        browserID,
        ProcessStatus.ERROR,
      );
      return;
    }
    const { loginHeadless, loginUI } = launchBrowser(browserConfig, { username, password });
    SuperBrowsers.addBrowser(loginHeadless);
    SuperBrowsers.addBrowser(loginUI);

    if (is.dev && debugMode) {
      loginHeadless.webContents.openDevTools(); // Open DevTools here
    }
    loginHeadless.webContents.setWindowOpenHandler(({ url }) => {
      console.log('Intercepting window open event:', url);
      if (url === 'about:blank') {
        // carry on as usual
        return { action: 'allow' };
      }
      const newWindow = SuperBrowsers.createBrowser(
        {
          frame: true,
          closable: true,
          resizable: true,
          fullscreenable: true,
          backgroundColor: 'black',
          width: 1500,
          height: 1000,
        },
        url,
      );
      newWindow.loadURL(url);
      return { action: 'deny' }; // Prevent the default browser window from opening
    });
  };
}
