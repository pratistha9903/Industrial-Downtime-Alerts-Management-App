// supabase.js
import 'expo-sqlite/localStorage/install';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://sgbcaggovqcnnjxdydqu.supabase.co';  // From Step 1
const supabaseAnonKey = 'sb_publishable_u9d8-l2ieFnOun1HlVz1tA_Js355fWh';  // From Step 1

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: localStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false
  }
});
