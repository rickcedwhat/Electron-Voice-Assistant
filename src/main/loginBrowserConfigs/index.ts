import { BrowserID } from '../../shared/services/supabase/types';
import { LoginStep } from '../steps';

export type LoginBrowserConfig<T extends Record<string, any> = Record<string, any>> = {
  loginURL: string; // don't remove - storing this in database would not make it accessible in main.ts
  steps: LoginStep[] | ((argObject: T) => LoginStep[]);
  browserID: BrowserID;
};

/* TODO:
    [ ] maybe add elements to remove/disable from the page once logged in elementsToRemove:['selector1','selector2']
    [ ] optional cookie(s) to save for next time this browser is opened cookies:['cookie1','cookie2']
        - would be checked before logging in manually
    [ ] maybe allow context menu
    [ ] add features
        - show downloads
        - show history buttons
        - ctrl+f
    
 */
