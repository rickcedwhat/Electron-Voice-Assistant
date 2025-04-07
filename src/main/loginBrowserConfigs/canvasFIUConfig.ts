import { LoginBrowserConfig } from '../loginBrowserConfigs';
import { BrowserID } from '../../shared/types';

export const canvasFIUConfig: LoginBrowserConfig<{ username: string; password: string }> = {
  loginURL: 'https://login.fiu.edu/',
  browserID: BrowserID.CANVAS_FIU,
  steps: ({ username, password }) => {
    return [
      {
        action: 'typeIntoInput',
        selector: '#username',
        value: username,
        description: `Entering username${username ? '...' : ': missing'}`,
      },
      {
        action: 'typeIntoInput',
        selector: '#password',
        value: password,
        description: `Entering password${password ? '...' : ': missing'}`,
      },
      { action: 'clickButton', selector: '[@name="submit"]', description: 'Clicking login button' },
      { action: 'waitFor', delay: 1500, description: 'Waiting after login attempt' },
      // Example of a step that might require user input (OTP)
      // { action: 'requestOTP', description: 'Waiting for OTP input' },
    ];
  },
};
