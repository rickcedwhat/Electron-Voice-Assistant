import { BrowserWindow } from 'electron';
import { BrowserID, ProcessStatus } from '../../shared/types';
import { SuperBrowser } from './SuperBrowser';
import { join } from 'path';
import { is } from '@electron-toolkit/utils';

interface LaunchLoginBrowser {
  headlessWin: SuperBrowser;
  loginDummy: SuperBrowser;
}

const launchPearsonBrowser = (
  mainWindow: BrowserWindow,
  username: string,
  password: string,
): LaunchLoginBrowser => {
  const headlessWin = SuperBrowser.create(
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
  const loginDummy = SuperBrowser.create(
    {
      width: 800,
      height: 500,
      show: true,
      webPreferences: {
        nodeIntegration: false, // Keep it secure
        contextIsolation: true,
      },
    },
    mainWindow,
  );

  if (is.dev) {
    loginDummy.loadURL('http://localhost:5173/companions/LoginDummy/index.html');
  } else {
    loginDummy.loadFile(join(__dirname, '../companions/LoginDummy/index.html'));
  }
  loginDummy.webContents.openDevTools();
  loginDummy.webContents.on('did-finish-load', async () => {
    console.log('dummy finished loading');
  });
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
        loginDummy.close();
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

  return { headlessWin, loginDummy };
};

export class SuperBrowsers {
  private static browsers: BrowserWindow[] = [];
  private mainWindow: BrowserWindow;
  constructor(mainWindow: BrowserWindow) {
    this.mainWindow = mainWindow;
  }

  static removeBrowser(browserToRemove: SuperBrowser): void {
    const index = SuperBrowsers.browsers.indexOf(browserToRemove);
    if (index > -1) {
      SuperBrowsers.browsers.splice(index, 1);
      console.log('SuperBrowser removed. Total:', SuperBrowsers.browsers.length);
    }
  }

  static createBrowser(
    options: Electron.BrowserWindowConstructorOptions,
    mainWindow: BrowserWindow,
  ): SuperBrowser {
    const newBrowser = SuperBrowser.create(options, mainWindow);
    SuperBrowsers.browsers.push(newBrowser);
    console.log('SuperBrowser created. Total:', SuperBrowsers.browsers.length);
    return newBrowser;
  }

  //   used for logging in to student's account
  public createLoginBrowser = (
    browserID: BrowserID,
    username: string,
    password: string,
    securityAnswer?: string,
  ) => {
    let secondaryWindow: SuperBrowser | null = null;
    let loginDummy: SuperBrowser | null = null;
    switch (browserID) {
      case BrowserID.PEARSON:
        const { headlessWin, loginDummy: dummy } = launchPearsonBrowser(
          this.mainWindow,
          username,
          password,
        );
        secondaryWindow = headlessWin;
        loginDummy = dummy;
        console.log({ securityAnswer });
        break;
      default:
        console.error('Invalid browser ID');
        return;
    }
    SuperBrowsers.browsers.push(secondaryWindow);
    if (loginDummy) {
      SuperBrowsers.browsers.push(loginDummy);
    }

    if (is.dev) {
      secondaryWindow.webContents.openDevTools(); // Open DevTools here
    }
    secondaryWindow.webContents.setWindowOpenHandler(({ url }) => {
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
        this.mainWindow,
      );
      // const newWindow: SuperBrowser = new SuperBrowser(
      //   {
      //     frame: true,
      //     closable: true,
      //     resizable: true,
      //     fullscreenable: true,
      //     backgroundColor: 'black',
      //     width: 1500,
      //     height: 1000,
      //   },
      //   this.mainWindow,
      // );
      // newWindow.loadURL(url);
      // newWindow.webContents.on('did-finish-load', async () => {
      //   SuperBrowsers.browsers.push(newWindow); // Store the new window in the array
      //   newWindow.executeJavaScript(() => console.log('hello from new window'));
      //   await newWindow.waitFor(5000);
      //   await newWindow.simulateTrustedTabKeyDown();
      //   await newWindow.simulateTrustedTabKeyDown();
      //   await newWindow.simulateTrustedTabKeyDown();
      //   await newWindow.simulateTrustedTabKeyDown();
      //   await newWindow.simulateTextEntry('25.72');
      // });

      return { action: 'deny' }; // Prevent the default browser window from opening
    });
  };
}
