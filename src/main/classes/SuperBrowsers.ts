import { BrowserWindow } from 'electron';
import { BrowserID, ProcessStatus } from '../../shared/types';
import { SuperBrowser } from './SuperBrowser';
import { join } from 'path';
import { is } from '@electron-toolkit/utils';
import { debugMode } from '..';
import { LoginBrowserConfig } from '../loginBrowserConfigs';
import { PearsonConfig } from '../loginBrowserConfigs/pearsonConfig';
import { LoginStep, handleSteps } from '../steps';

const launchBrowser = <T extends Record<string, any>>(
  config: LoginBrowserConfig<T>,
  argObject: T,
) => {
  const { loginHeadless, loginUI } = SuperBrowsers.createLoginPair(config.loginURL);

  loginHeadless.webContents.on('did-finish-load', async () => {
    console.log('Attempting login with UI updates...');
    try {
      const steps: LoginStep[] = Array.isArray(config.steps)
        ? config.steps
        : config.steps(argObject);
      await handleSteps(steps, loginHeadless, loginUI);

      loginHeadless.sendMessageToRenderer(
        'browser-window-creation',
        BrowserID.PEARSON,
        ProcessStatus.COMPLETE,
      );
      loginHeadless.show();
      // loginUI.close();
    } catch (error) {
      console.error('Login attempt failed.', error);
      loginHeadless.sendMessageToRenderer(
        'browser-window-creation',
        BrowserID.PEARSON,
        ProcessStatus.ERROR,
      );
    }
  });

  return { loginHeadless, loginUI };
};

export class SuperBrowsers {
  private static browsers: Set<SuperBrowser> = new Set();
  private static mainWindow: BrowserWindow;
  constructor() {}

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
   * Dev should use loginHeadless.on('did-finish-load') to dictate the login process
   */
  static createLoginPair(loginURL: string) {
    const loginHeadless = SuperBrowser.create(
      {
        width: 1500,
        height: 1000,
        show: false,
        webPreferences: {
          preload: join(__dirname, '../preload/index.js'),
          nodeIntegration: false,
          contextIsolation: true,
          sandbox: false,
        },
      },
      SuperBrowsers.mainWindow,
      `loginHeadless-for-${loginURL}`,
    );
    const loginUI = SuperBrowser.create(
      {
        width: 800,
        height: 500,
        show: false,
        webPreferences: {
          preload: join(__dirname, '../preload/index.js'),
          nodeIntegration: false,
          contextIsolation: true,
          sandbox: false,
        },
      },
      SuperBrowsers.mainWindow,
      `loginUI-for-${loginURL}`,
    );
    if (is.dev) {
      loginUI.loadURL('http://localhost:5173/companions/LoginUI/index.html');
      if (debugMode) {
        loginUI.webContents.openDevTools();
      }
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
    const newBrowser = SuperBrowser.create(options, SuperBrowsers.mainWindow, name);
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
    let browserConfig: LoginBrowserConfig<Record<string, any>> | null = null;
    switch (browserID) {
      case BrowserID.PEARSON:
        browserConfig = PearsonConfig as LoginBrowserConfig<Record<string, any>>;
        break;
      default:
        console.error('Invalid browser ID');
        return;
    }
    const { loginHeadless, loginUI } = launchBrowser(browserConfig, { username, password });
    SuperBrowsers.addBrowser(loginHeadless);
    if (loginUI) {
      SuperBrowsers.addBrowser(loginUI);
    }

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
