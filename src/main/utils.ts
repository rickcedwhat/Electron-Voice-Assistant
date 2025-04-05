import { BrowserWindow } from 'electron';
import { BrowserID, ProcessStatus } from '../shared/types'; // Adjust the import path as necessary
import { is } from '@electron-toolkit/utils';

interface InputEventOptions {
  bubbles: boolean;
  cancelable: boolean;
}

const typeIntoInput = (selector: string, text: string): void => {
  const input = document.querySelector(selector) as HTMLInputElement | null;
  if (input) {
    input.focus();
    input.value = text;
    const inputEvent = new Event('input', {
      bubbles: true,
      cancelable: true,
    } as InputEventOptions);
    input.dispatchEvent(inputEvent);
    input.dispatchEvent(
      new Event('change', { bubbles: true, cancelable: true } as InputEventOptions),
    );
    console.log(`Typed '${text}' into ${selector}`);
  } else {
    console.log(`Input element with selector '${selector}' not found.`);
  }
};

const clickButton = (selector: string): void => {
  const button = document.querySelector(selector) as HTMLButtonElement | null;
  if (button) {
    button.click();
  } else {
    console.log(`Button with selector '${selector}' not found.`);
  }
};

const removeElement = (selector: string): void => {
  const element = document.querySelector(selector);
  if (element) {
    element.remove();
  } else {
    console.log(`Element with selector '${selector}' not found.`);
  }
};

// Define a generic function type that takes any number of arguments and returns void
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type RendererFunction<T extends any[]> = (...args: T) => void | (() => void);

class SecondaryBrowser extends BrowserWindow {
  private mainWindow: BrowserWindow;
  constructor(options: Electron.BrowserWindowConstructorOptions, mainWindow: BrowserWindow) {
    super(options);
    this.mainWindow = mainWindow;
  }

  public sendMessageToRenderer(channel: string, ...args: unknown[]): void {
    this.mainWindow.webContents.send(channel, ...args);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public async executeJavaScript<T extends any[]>(
    func: RendererFunction<T>,
    ...args: T
  ): Promise<unknown> {
    return this.webContents.executeJavaScript(`(${func}).apply(null, ${JSON.stringify(args)})`);
  }

  public async typeIntoInput(selector: string, text: string): Promise<unknown> {
    return this.executeJavaScript(typeIntoInput, selector, text);
  }

  public async clickButton(selector: string): Promise<unknown> {
    return this.executeJavaScript(clickButton, selector);
  }

  public async removeElement(selector: string): Promise<unknown> {
    return this.executeJavaScript(removeElement, selector);
  }

  public async isLoggedIn(): Promise<boolean> {
    const cookies = await this.webContents.session.cookies.get({});
    const isLoggedIn = cookies.some((cookie) => cookie.name === 'someCookieName'); // Replace with actual cookie name
    return isLoggedIn;
  }

  public async waitFor(timeout: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, timeout));
  }
}

const launchPearsonBrowser = (
  mainWindow: BrowserWindow,
  username: string,
  password: string,
): SecondaryBrowser => {
  const headlessWin = new SecondaryBrowser(
    {
      width: 1500,
      height: 1000,
      show: false,
      webPreferences: {
        nodeIntegration: false, // Keep it secure
        contextIsolation: true,
        //   preload: join(__dirname, 'preload.js'), // Optional preload script
      },
    },
    mainWindow,
  );

  headlessWin.loadURL('https://portal.mypearson.com/portal');
  headlessWin.webContents.on('did-finish-load', async () => {
    const currentURLString = headlessWin!.webContents.getURL();
    const currentURL = new URL(currentURLString);
    const currentBaseURL = `${currentURL.origin}${currentURL.pathname}`;
    const loginBaseURL = 'https://login.pearson.com/v1/piapi/piui/signin';

    // Perform login automation only on the initial URL
    if (currentBaseURL === loginBaseURL) {
      console.log('Attempting to log in...');
      try {
        await headlessWin.waitFor(500);
        await headlessWin.removeElement('#browserCheckerMessage');
        await headlessWin.typeIntoInput('#username', username);
        await headlessWin.typeIntoInput('#password', password);
        await headlessWin.clickButton('#mainButton');

        // Wait for a specific condition indicating successful login
        // This could be a navigation event, the appearance of an element, or a specific cookie
        await new Promise((resolve) => setTimeout(resolve, 1500)); // Adjust timeout as needed
        console.log('Login attempt completed.');
        headlessWin.sendMessageToRenderer(
          'browser-window-creation',
          BrowserID.PEARSON,
          ProcessStatus.COMPLETE,
        );
        headlessWin.show();
      } catch {
        console.error('Login attempt failed.');
        headlessWin.sendMessageToRenderer(
          'browser-window-creation',
          BrowserID.PEARSON,
          ProcessStatus.ERROR,
        );
      }
    }
  });

  return headlessWin;
};

export const createSecondaryBrowser = (
  mainWindow: BrowserWindow,
  browserID: BrowserID,
  username: string,
  password: string,
  securityAnswer?: string,
): void => {
  let secondaryWindow: SecondaryBrowser | null = null;
  const thirdPartyWindows: SecondaryBrowser[] = [];
  switch (browserID) {
    case BrowserID.PEARSON:
      secondaryWindow = launchPearsonBrowser(mainWindow, username, password);
      console.log({ securityAnswer });
      break;
    default:
      console.error('Invalid browser ID');
      return;
  }
  secondaryWindow.on('closed', () => {
    secondaryWindow = null;
  });
  if (is.dev) {
    secondaryWindow.webContents.openDevTools(); // Open DevTools here
  }
  secondaryWindow.webContents.setWindowOpenHandler(({ url }) => {
    console.log('Intercepting window open event:', url);
    if (url === 'about:blank') {
      // carry on as usual
      return { action: 'allow' };
    }
    const newWindow: SecondaryBrowser = new SecondaryBrowser(
      {
        frame: true,
        closable: true,
        resizable: true,
        fullscreenable: true,
        backgroundColor: 'black',
        width: 1500,
        height: 1000,
      },
      mainWindow,
    );
    newWindow.loadURL(url);
    thirdPartyWindows.push(newWindow); // Store the new window in the array
    newWindow.on('closed', () => {
      const index = thirdPartyWindows.indexOf(newWindow);
      if (index > -1) {
        thirdPartyWindows.splice(index, 1); // Remove the closed window from the array
      }
    });

    return { action: 'deny' }; // Prevent the default browser window from opening
  });
};
