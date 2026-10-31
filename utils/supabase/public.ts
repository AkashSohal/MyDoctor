import { createClient as createSupabaseClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

let warnedMissingConfig = false
let client: SupabaseClient | null = null

/**
 * Anon client with no cookies/session, used only for publicly readable data
 * (verified doctors, specialties, hospitals) so responses can be cached with ISR.
 * RLS already restricts these tables to public/verified rows.
 */
export function createPublicClient(): SupabaseClient {
  if (!client) {
    if (!supabaseUrl || !supabaseKey) {
      if (!warnedMissingConfig) {
        warnedMissingConfig = true
        console.warn(
          '[MyDoctor] Supabase environment variables are missing (NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY). Public data fetches will fail until they are set.'
        )
      }
      // Placeholder values keep server pages rendering with empty data instead
      // of crashing on import; callers already treat query failures as empty.
      return createSupabaseClient('https://invalid.supabase.co', 'missing-publishable-key', {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
        },
      })
    }

    client = createSupabaseClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    })
  }
  return client
}
