// ============================================================
//  supabase.js
//  Initialises the Supabase client used by every page.
//  IMPORTANT: Replace the two placeholder values below with
//  your actual Supabase Project URL and anon (public) key.
//  NEVER put the secret/service-role key here.
// ============================================================

const SUPABASE_URL = "https://YOUR_PROJECT_ID.supabase.co";
const SUPABASE_ANON_KEY = "YOUR_SUPABASE_ANON_KEY";

// Create a single shared client instance.
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
