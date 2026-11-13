import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let browserClient: SupabaseClient | null = null;
let initialized = false;

export function createSupabaseBrowserClient(): SupabaseClient | null {
  if (initialized) return browserClient;
  initialized = true;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  // Prefer the configured replacement key, then retain compatible public-key names.
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) return null;
  browserClient = createClient(url, key);
  return browserClient;
}
