import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

let warnedMissingConfig = false;

export const createClient = (cookieStore: Awaited<ReturnType<typeof cookies>>) => {
  if (!supabaseUrl || !supabaseKey) {
    if (!warnedMissingConfig) {
      warnedMissingConfig = true;
      console.warn(
        "[MyDoctor] Supabase environment variables are missing (NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY). Server data access is unavailable until they are set."
      );
    }
    // Placeholder values keep API routes from crashing on import; queries fail
    // as normal PostgREST errors which each route already handles.
    return createServerClient("https://invalid.supabase.co", "missing-publishable-key", {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll() {
          // No-op: config is missing, so there is nothing useful to persist.
        },
      },
    });
  }

  return createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // The `setAll` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing
          // user sessions.
        }
      },
    },
  });
};