import { LoginStep } from '../steps';

type LoginBrowserConfig<T extends Record<string, any> = Record<string, any>> = {
  loginURL: string;
  steps: LoginStep[] | ((argObject: T) => LoginStep[]);
};

export const PearsonConfig: LoginBrowserConfig<{ username: string; password: string }> = {
  loginURL: 'https://login.fiu.edu/',
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
      { action: 'clickButton', selector: '#mainButton', description: 'Clicking login button' },
      { action: 'waitFor', delay: 1500, description: 'Waiting after login attempt' },
      // Example of a step that might require user input (OTP)
      // { action: 'requestOTP', description: 'Waiting for OTP input' },
    ];
  },
};
