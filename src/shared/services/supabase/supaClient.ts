import { createClient } from '@supabase/supabase-js';
import { getEnv } from '../../utils';

const supabaseURL = getEnv('VITE_SUPABASE_URL');
const supabaseAnonKey = getEnv('VITE_SUPABASE_ANON_KEY');

export const supaClient = createClient(supabaseURL, supabaseAnonKey);
