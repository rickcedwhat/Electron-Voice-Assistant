import { Tables } from './supabase';

export type Student = Tables<'student'>;
export type ThirdPartyCredential = Tables<'third_party_credential'>;
export type Browser = Tables<'browser'>;
export type User = Tables<'user'>;

export type StudentWithUser = Student & { user: User };
export type ThirdPartyCredentialWithBrowser = ThirdPartyCredential & { browser: Browser };
export type BrowserID = Browser['id'];
