import { LoginBrowserConfig } from '../loginBrowserConfigs';

export const pearsonConfig: LoginBrowserConfig<{ username: string; password: string }> = {
  loginURL: 'https://portal.mypearson.com/portal',
  browserID: 'pearson',
  steps: ({ username, password }) => {
    return [
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
  },
};
