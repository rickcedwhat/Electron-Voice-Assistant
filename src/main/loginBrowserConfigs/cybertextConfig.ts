import { LoginBrowserConfig } from '../loginBrowserConfigs';

export const cybertextConfig: LoginBrowserConfig<{ username: string; password: string }> = {
  loginURL: 'https://www.cybertext.com/myBookBB/IndexPage.aspx',
  browserID: 'cybertext',
  steps: ({ username, password }) => {
    return [
      { action: 'clickButton', selector: '#lnkLogin', description: 'Opening Login Dropdown' },
      {
        action: 'typeIntoInput',
        selector: '#txtuserName',
        value: username,
        description: `Entering username${username ? '...' : ': missing'}`,
      },
      {
        action: 'typeIntoInput',
        selector: '#txtPassword',
        value: password,
        description: `Entering password${password ? '...' : ': missing'}`,
      },
      { action: 'clickButton', selector: '#btnLoginMain', description: 'Clicking login button' },
      { action: 'waitFor', delay: 1500, description: 'Waiting after login attempt' },
      // Example of a step that might require user input (OTP)
      // { action: 'requestOTP', description: 'Waiting for OTP input' },
    ];
  },
};
