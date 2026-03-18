import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

/**
 * Browser-side Supabase client.
 * Only uses the PUBLIC anon key — safe to use in client components.
 * Singleton instance re-used across the app.
 */
export function createClient() {
  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}

// Default export for convenience
export const supabase = createClient()
