import { BrowserWindow } from 'electron';
import { BrowserID, ProcessStatus } from '../../shared/types';
import { SuperBrowser } from './SuperBrowser';
import { join } from 'path';
import { is } from '@electron-toolkit/utils';
import { debugMode } from '..';

type LoginStep =
  | WaitForStep
  | RemoveElementStep
  | TypeIntoInputStep
  | ClickButtonStep
  | SendMessageToRendererStep
  | ShowStep
  | CloseUIStep
  | WaitForElementStep
  | RequestOTPStep;

interface BaseLoginStep {
  action: string;
  description?: string;
}

interface WaitForStep extends BaseLoginStep {
  action: 'waitFor';
  delay: number;
}

interface RemoveElementStep extends BaseLoginStep {
  action: 'removeElement';
  selector: string;
}

interface TypeIntoInputStep extends BaseLoginStep {
  action: 'typeIntoInput';
  selector: string;
  value: string; // The actual value to type (or a key like 'username'/'password')
}

interface ClickButtonStep extends BaseLoginStep {
  action: 'clickButton';
  selector: string;
}

interface SendMessageToRendererStep extends BaseLoginStep {
  action: 'sendMessageToRenderer';
  channel: string;
  args: unknown[];
}

interface ShowStep extends BaseLoginStep {
  action: 'show';
}

interface CloseUIStep extends BaseLoginStep {
  action: 'closeUI';
}

interface WaitForElementStep extends BaseLoginStep {
  action: 'waitForElement';
  selector: string;
}

interface RequestOTPStep extends BaseLoginStep {
  action: 'requestOTP';
  // You might add more properties here if needed, like a message to display
}

interface LaunchLoginBrowser {
  loginHeadless: SuperBrowser;
  loginUI: SuperBrowser;
}

const launchPearsonBrowser = (loginSteps: LoginStep[]): LaunchLoginBrowser => {
  const { loginHeadless, loginUI } = SuperBrowsers.createLoginPair(
    'https://portal.mypearson.com/portal',
  );

  loginHeadless.webContents.on('did-finish-load', async () => {
    console.log('Attempting Pearson login (with UI updates)...');
    // [ ] refactor this as its own function
    try {
      for (const step of loginSteps) {
        if (step.description) {
          loginUI.webContents.send('login-update', step.description);
        }

        switch (step.action) {
          case 'waitFor':
            await loginHeadless.waitFor(step.delay);
            break;
          case 'removeElement':
            await loginHeadless.removeElement(step.selector);
            break;
          case 'typeIntoInput':
            await loginHeadless.typeIntoInput(step.selector, step.value);
            break;
          case 'clickButton':
            await loginHeadless.clickButton(step.selector);
            break;
          // case 'requestOTP':
          //   // Logic to inform loginUI to request OTP and then receive it
          //   loginUI.webContents.send('request-otp');
          //   const otp = await new Promise((resolve) => {
          //     ipcMain.once('otp-submitted', (event, otpValue) => {
          //       resolve(otpValue);
          //     });
          //   });
          //   console.log('Received OTP:', otp);
          //   // Now you would have a step to input the OTP into loginHeadless
          //   // await loginHeadless.typeIntoInput('#otp-field', otp);
          //   break;
          default:
            console.log(`Unknown action: ${step.action}`);
        }
      }

      console.log('Pearson login attempt completed.');
      loginHeadless.sendMessageToRenderer(
        'browser-window-creation',
        BrowserID.PEARSON,
        ProcessStatus.COMPLETE,
      );
      loginHeadless.show();
      loginUI.close();
    } catch (error) {
      console.error('Pearson login attempt failed.', error);
      loginHeadless.sendMessageToRenderer(
        'browser-window-creation',
        BrowserID.PEARSON,
        ProcessStatus.ERROR,
      );
      loginUI.webContents.send('login-error', (error as Error).message || 'Login failed.');
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

  static createBrowser(options: Electron.BrowserWindowConstructorOptions): SuperBrowser {
    const newBrowser = SuperBrowser.create(options, SuperBrowsers.mainWindow);
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
    let loginHeadless: SuperBrowser | null = null;
    let loginUI: SuperBrowser | null = null;
    console.log(`Launching ${browserID}`);
    switch (browserID) {
      case BrowserID.PEARSON:
        const steps: LoginStep[] = [
          { action: 'waitFor', delay: 500, description: 'Closing popup' },
          {
            action: 'removeElement',
            selector: '#browserCheckerMessage',
            description: 'Removing browser check message',
          },
          {
            action: 'typeIntoInput',
            selector: '#username',
            value: username,
            description: `Entering username ${
              username.slice(0, 3) +
              Array.from({ length: username.length - 3 })
                .fill('*')
                .join('')
            }`,
          },
          {
            action: 'typeIntoInput',
            selector: '#password',
            value: password,
            description: `Entering password ${password ? '********' : 'null'}`,
          },
          { action: 'clickButton', selector: '#mainButton', description: 'Clicking login button' },
          { action: 'waitFor', delay: 1500, description: 'Waiting after login attempt' },
          // Example of a step that might require user input (OTP)
          // { action: 'requestOTP', description: 'Waiting for OTP input' },
        ];
        const pearsonBrowsers = launchPearsonBrowser(steps);
        loginHeadless = pearsonBrowsers.loginHeadless;
        loginUI = pearsonBrowsers.loginUI;
        console.log({ securityAnswer });
        break;
      default:
        console.error('Invalid browser ID');
        return;
    }
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
      const newWindow = SuperBrowsers.createBrowser({
        frame: true,
        closable: true,
        resizable: true,
        fullscreenable: true,
        backgroundColor: 'black',
        width: 1500,
        height: 1000,
      });
      newWindow.loadURL(url);
      return { action: 'deny' }; // Prevent the default browser window from opening
    });
  };
}
