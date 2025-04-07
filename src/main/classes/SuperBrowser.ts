import { BrowserWindow } from 'electron';
import { SuperBrowsers } from './SuperBrowsers';
import { v4 as uuidv4 } from 'uuid';

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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type RendererFunction<T extends any[]> = (...args: T) => void | (() => void) | Promise<void>;

export class SuperBrowser extends BrowserWindow {
  private mainWindow: BrowserWindow;
  private browserName: string;
  public browserInstance: string;

  private constructor(
    options: Electron.BrowserWindowConstructorOptions,
    mainWindow: BrowserWindow,
    name: string,
  ) {
    super(options);
    this.mainWindow = mainWindow;
    this.browserName = name;
    this.setupCloseListener();
    this.setupNewWindowHandler();
    this.browserInstance = uuidv4();
  }

  static create(
    options: Electron.BrowserWindowConstructorOptions,
    mainWindow: BrowserWindow,
    name: string,
  ): SuperBrowser {
    return new SuperBrowser(options, mainWindow, name);
  }

  private setupCloseListener(): void {
    this.on('closed', () => {
      SuperBrowsers.removeBrowser(this); // Inform the manager
      console.log(`SuperBrowser ${this.browserName} closed.`);
      // Potentially clean up other resources associated with this SuperBrowser
    });
  }

  private setupNewWindowHandler(): void {
    this.webContents.setWindowOpenHandler(({ url }) => {
      console.log('Intercepting window open event:', url);
      if (url === 'about:blank') {
        // carry on as usual
        return { action: 'allow' };
      }
      SuperBrowsers.createBrowser(
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
      return { action: 'deny' };
    });
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

  public async simulateTrustedTabKeyDown(): Promise<void> {
    this.webContents.sendInputEvent({
      type: 'keyDown',
      keyCode: 'Tab',
    });
    console.log('Tab key pressed');
    await this.waitFor(100);
  }

  public async simulateTextEntry(text: string): Promise<void> {
    for (const char of text) {
      this.webContents.sendInputEvent({
        type: 'keyDown',
        keyCode: char,
      });
      await this.waitFor(50);
      this.webContents.sendInputEvent({
        type: 'char',
        keyCode: char,
      });
      await this.waitFor(50);

      this.webContents.sendInputEvent({
        type: 'keyUp',
        keyCode: char,
      });
      await this.waitFor(50);
    }
  }
}
