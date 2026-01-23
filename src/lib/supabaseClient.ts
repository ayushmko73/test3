import { createClient } from '@supabase/supabase-js';

// NOTE: In a real environment, use import.meta.env.VITE_SUPABASE_URL
// For this demo structure, we assume these are set or user will replace them.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);