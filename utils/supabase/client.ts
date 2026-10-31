import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

let warnedMissingConfig = false;

function warnMissingConfig() {
  if (warnedMissingConfig) return;
  warnedMissingConfig = true;
  console.warn(
    "[MyDoctor] Supabase environment variables are missing (NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY). Authentication and profile data are unavailable until they are set in .env.local."
  );
}

export const createClient = () => {
  if (!supabaseUrl || !supabaseKey) {
    warnMissingConfig();
    // Placeholder values keep the app rendering instead of crashing at import;
    // every request fails as a normal network error, which the UI reports.
    return createBrowserClient(
      "https://invalid.supabase.co",
      "missing-publishable-key"
    );
  }

  return createBrowserClient(supabaseUrl, supabaseKey);
};
