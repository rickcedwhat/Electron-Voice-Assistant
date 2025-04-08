import { BrowserWindow } from 'electron';
import { SuperBrowser } from '../classes/SuperBrowser';
import { LoginBrowserConfig } from '../loginBrowserConfigs';
import { ProcessStatus } from '../../shared/types';

export type LoginStep =
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

export const handleSteps = async <T extends Record<string, any>>(
  // loginSteps: LoginStep[],
  config: LoginBrowserConfig<T>,
  argObject: T,
  loginHeadless: SuperBrowser,
  loginUI: SuperBrowser,
  mainWindow: BrowserWindow,
): Promise<void> => {
  try {
    const steps: LoginStep[] = Array.isArray(config.steps) ? config.steps : config.steps(argObject);
    for (const step of steps) {
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
    mainWindow.webContents.send(
      'browser-window-creation',
      config.browserID,
      ProcessStatus.COMPLETE,
    );
    loginUI.close();
    loginHeadless.show();
  } catch (error) {
    mainWindow.webContents.send('browser-window-creation', config.browserID, ProcessStatus.ERROR);
    loginUI.webContents.send('login-error', (error as Error).message);
  }
};
