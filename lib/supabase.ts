import { createClient } from '@/utils/supabase/client'

// Same browser singleton as createClient() everywhere else in the app, so the
// app never creates duplicate Supabase clients or duplicate auth listeners.
export const supabase = createClient()
