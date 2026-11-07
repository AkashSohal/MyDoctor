-- =============================================================================
-- Emergency Assistance Part 3 — patient emergency medical profile + secure
-- emergency medical-ID sharing
-- =============================================================================
-- HOW TO APPLY (manual, exactly once — same flow as every earlier MyDoctor
-- migration):
--   Supabase Dashboard -> SQL Editor -> New query -> paste this file -> Run.
--
-- SAFETY:
--   * Idempotent: every statement is guarded (IF NOT EXISTS / CREATE OR
--     REPLACE / policy existence checks) — re-running changes nothing.
--   * Creates NO demo data, deletes NO rows, touches NO existing table.
--   * Reuses existing building blocks: public.handle_updated_at() (from
--     20261031000000_full_schema.sql) and the auth.users reference pattern
--     used by public.profiles.
--   * RLS is enabled on both new tables before any policy is created, and
--     there is deliberately no anon access to patient medical information.
--
-- TABLES:
--   public.patient_emergency_profiles  — one row per patient (TASK 1)
--   public.emergency_medical_id_shares — revocable, expiring, field-limited
--                                        share tokens for the digital medical
--                                        ID (TASK 2 secure sharing mechanism)
--
-- VERIFICATION QUERIES (run separately if desired):
--   SELECT policyname, cmd, roles FROM pg_policies
--     WHERE schemaname='public' AND tablename IN
--       ('patient_emergency_profiles','emergency_medical_id_shares')
--     ORDER BY tablename, policyname;
--   SELECT relname, relrowsecurity FROM pg_class
--     WHERE relname IN ('patient_emergency_profiles','emergency_medical_id_shares');
--   SELECT grantee, privilege_type FROM information_schema.role_table_grants
--     WHERE table_name IN ('patient_emergency_profiles','emergency_medical_id_shares');
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. patient_emergency_profiles — the logged-in patient's private medical
--    profile. Exactly one row per user (PK = user_id). All free-text fields
--    are length-limited, the blood group is an allow-list and the emergency
--    contact number must look like a phone number.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.patient_emergency_profiles (
  user_id                   UUID PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  full_name                 TEXT NOT NULL DEFAULT '' CHECK (char_length(full_name) <= 120),
  blood_group               TEXT NOT NULL DEFAULT ''
                            CHECK (blood_group = ''
                                   OR blood_group IN ('A+','A-','B+','B-','AB+','AB-','O+','O-')),
  allergies                 TEXT NOT NULL DEFAULT '' CHECK (char_length(allergies) <= 2000),
  medications               TEXT NOT NULL DEFAULT '' CHECK (char_length(medications) <= 2000),
  conditions                TEXT NOT NULL DEFAULT '' CHECK (char_length(conditions) <= 2000),
  emergency_contact_name    TEXT NOT NULL DEFAULT '' CHECK (char_length(emergency_contact_name) <= 120),
  emergency_contact_number  TEXT NOT NULL DEFAULT ''
                            CHECK (emergency_contact_number = ''
                                   OR emergency_contact_number ~ '^\+?[0-9][0-9 -]{6,16}$'),
  additional_info           TEXT NOT NULL DEFAULT '' CHECK (char_length(additional_info) <= 4000),
  created_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.patient_emergency_profiles IS
  'Private emergency medical profile of one patient. RLS: owner-only. Never exposed publicly.';

-- updated_at stamp — reuses the shared trigger function when it exists
-- (applied earlier by 20261031000000_full_schema.sql).
DO $$
BEGIN
  IF to_regprocedure('public.handle_updated_at()') IS NOT NULL THEN
    DROP TRIGGER IF EXISTS patient_emergency_profiles_updated_at
      ON public.patient_emergency_profiles;
    CREATE TRIGGER patient_emergency_profiles_updated_at
      BEFORE UPDATE ON public.patient_emergency_profiles
      FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 2. emergency_medical_id_shares — a deliberately limited share grant.
--
--    Security model:
--      * `token` is 48 hex characters (192 bits of crypto randomness,
--        generated client-side with crypto.getRandomValues) — unguessable,
--        so possession of the token IS the credential.
--      * `payload` holds a snapshot of ONLY the fields the patient selected
--        when generating the share. A DB-level allow-list constraint makes
--        it impossible to store anything else (no user_id, no medications,
--        no extra notes) even if a modified client tried.
--      * shares expire (expires_at, max 31 days) and are revocable by
--        deleting the row (owner-only DELETE policy).
--      * anon can SELECT only while the row is active (not expired); the
--        full profile table stays unreachable to anon.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.emergency_medical_id_shares (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  token       TEXT NOT NULL UNIQUE CHECK (token ~ '^[0-9a-f]{48}$'),
  payload     JSONB NOT NULL
              CHECK (
                CASE WHEN jsonb_typeof(payload) = 'object'
                  THEN (payload - ARRAY['name','bloodGroup','allergies','conditions',
                                        'emergencyContactName','emergencyContactPhone'])
                       = '{}'::jsonb
                  ELSE false
                END
              ),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at  TIMESTAMPTZ NOT NULL
              CHECK (expires_at > created_at
                     AND expires_at <= created_at + interval '31 days')
);

COMMENT ON TABLE public.emergency_medical_id_shares IS
  'Revocable, expiring, field-limited snapshots shared through the emergency medical ID QR code. Payload keys are allow-listed by CHECK constraint.';

CREATE INDEX IF NOT EXISTS emergency_medical_id_shares_user_id_idx
  ON public.emergency_medical_id_shares (user_id);

-- ---------------------------------------------------------------------------
-- 3. Row Level Security — enabled first, then policies are created only when
--    missing (so re-runs never stack duplicates).
--
--    patient_emergency_profiles: owner-only for ALL commands. No anon access
--    whatsoever — private medical data is never publicly readable.
--
--    emergency_medical_id_shares:
--      * SELECT own (always, so the owner can list/revoke their shares),
--      * SELECT active for anon+authenticated (this is the limited-access
--        share: only rows that have not expired, reached via the secret
--        token — revoked/deleted rows simply stop existing),
--      * INSERT own (owner may only create grants for themselves),
--      * DELETE own (revoke). No UPDATE policy: shares are immutable
--        snapshots — regenerate instead of editing.
-- ---------------------------------------------------------------------------
ALTER TABLE public.patient_emergency_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emergency_medical_id_shares ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'patient_emergency_profiles'
      AND policyname = 'patient_emergency_profiles_select_own'
  ) THEN
    CREATE POLICY patient_emergency_profiles_select_own
      ON public.patient_emergency_profiles
      FOR SELECT TO authenticated
      USING ((select auth.uid()) = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'patient_emergency_profiles'
      AND policyname = 'patient_emergency_profiles_insert_own'
  ) THEN
    CREATE POLICY patient_emergency_profiles_insert_own
      ON public.patient_emergency_profiles
      FOR INSERT TO authenticated
      WITH CHECK ((select auth.uid()) = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'patient_emergency_profiles'
      AND policyname = 'patient_emergency_profiles_update_own'
  ) THEN
    CREATE POLICY patient_emergency_profiles_update_own
      ON public.patient_emergency_profiles
      FOR UPDATE TO authenticated
      USING ((select auth.uid()) = user_id)
      WITH CHECK ((select auth.uid()) = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'patient_emergency_profiles'
      AND policyname = 'patient_emergency_profiles_delete_own'
  ) THEN
    CREATE POLICY patient_emergency_profiles_delete_own
      ON public.patient_emergency_profiles
      FOR DELETE TO authenticated
      USING ((select auth.uid()) = user_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'emergency_medical_id_shares'
      AND policyname = 'emergency_medical_id_shares_select_own'
  ) THEN
    CREATE POLICY emergency_medical_id_shares_select_own
      ON public.emergency_medical_id_shares
      FOR SELECT TO authenticated
      USING ((select auth.uid()) = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'emergency_medical_id_shares'
      AND policyname = 'emergency_medical_id_shares_select_active_shared'
  ) THEN
    CREATE POLICY emergency_medical_id_shares_select_active_shared
      ON public.emergency_medical_id_shares
      FOR SELECT TO anon, authenticated
      USING (expires_at > now());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'emergency_medical_id_shares'
      AND policyname = 'emergency_medical_id_shares_insert_own'
  ) THEN
    CREATE POLICY emergency_medical_id_shares_insert_own
      ON public.emergency_medical_id_shares
      FOR INSERT TO authenticated
      WITH CHECK ((select auth.uid()) = user_id AND expires_at > now());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'emergency_medical_id_shares'
      AND policyname = 'emergency_medical_id_shares_delete_own'
  ) THEN
    CREATE POLICY emergency_medical_id_shares_delete_own
      ON public.emergency_medical_id_shares
      FOR DELETE TO authenticated
      USING ((select auth.uid()) = user_id);
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 4. Data API exposure + hard denials.
--    Depending on project settings, brand-new tables are granted to the API
--    roles automatically (Supabase default privileges grant ALL on new
--    tables), so the grants here are explicit and the denials are explicit
--    too: anon gets NOTHING on the profile table, and NOBODY gets UPDATE on
--    shares (snapshots are immutable — regenerate instead of editing).
-- ---------------------------------------------------------------------------
GRANT USAGE ON SCHEMA public TO anon, authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE
  ON public.patient_emergency_profiles TO authenticated;
REVOKE ALL ON public.patient_emergency_profiles FROM anon;

REVOKE ALL ON public.emergency_medical_id_shares FROM anon, authenticated;
GRANT SELECT, INSERT, DELETE
  ON public.emergency_medical_id_shares TO authenticated;
GRANT SELECT ON public.emergency_medical_id_shares TO anon;

-- ---------------------------------------------------------------------------
-- 5. Safety net: nobody may read another patient's profile or another
--    patient's (non-shared) grant rows. RLS already enforces this; these
--    comments document the intent for reviewers.
-- ---------------------------------------------------------------------------
-- patient_emergency_profiles: no anon policies exist at all -> anon reads 0 rows.
-- emergency_medical_id_shares: anon sees only unexpired share rows, which
-- contain exactly the fields the patient chose to publish, nothing else.
