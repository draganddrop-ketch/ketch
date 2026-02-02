import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wuhspshflwfilniaflnx.supabase.co';
const supabaseAnonKey = 'sb_publishable_RFfx5ANY0M9JIjOuUdFm2g_R_X6BZqE';

console.log('Supabase initialized with URL:', supabaseUrl);

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
