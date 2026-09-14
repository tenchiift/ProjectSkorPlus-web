import { createClient } from '@supabase/supabase-js';

// The anon key is public by design (RLS protects the data), but keep the
// values overridable per environment via Vite env vars.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://ujcgwezmroashxemfyqc.supabase.co';
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVqY2d3ZXptcm9hc2h4ZW1meXFjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQwMTE3NzIsImV4cCI6MjA5OTU4Nzc3Mn0.xDyX6NLfcA-3dbPZWD_z_ZMsKfU5OY5QCueRGDBlbTM';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: localStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});
