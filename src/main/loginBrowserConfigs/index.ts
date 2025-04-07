import { BrowserID } from '../../shared/types';
import { LoginStep } from '../steps';

export type LoginBrowserConfig<T extends Record<string, any> = Record<string, any>> = {
  loginURL: string;
  steps: LoginStep[] | ((argObject: T) => LoginStep[]);
  browserID: BrowserID;
};
