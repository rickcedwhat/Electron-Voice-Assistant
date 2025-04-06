import { LoginStep } from '../steps';

type LoginBrowserConfig<T extends Record<string, any> = Record<string, any>> = {
  loginURL: string;
  steps: LoginStep[] | ((argObject: T) => LoginStep[]);
};

export const PearsonConfig: LoginBrowserConfig<{ username: string; password: string }> = {
  loginURL: 'https://portal.mypearson.com/portal',
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
