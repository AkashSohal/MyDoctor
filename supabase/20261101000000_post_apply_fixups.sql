-- =============================================================================
-- MyDoctor — Post-apply fixups (run in Supabase SQL Editor, safe to re-run)
-- =============================================================================
-- WHY THIS FILE EXISTS (verified against the live database on 2026-11-01):
--
-- FIX 1: The sign-up trigger function is still the OLD profiles_security
--   version on the live database (it does not copy the email column). Proof:
--   a fresh sign-up created a profile with full_name set but email NULL,
--   even though 20261031000000_full_schema.sql was applied.
--   -> This file re-applies the NEW version. Alternative: re-run the entire
--      full_schema migration (it is fully idempotent).
--
-- FIX 2: The 3 seeded demo doctors exist in auth.users (message when signing
--   up with the same email: duplicate key on users_email_partial_key) but
--   password login returns "Invalid login credentials". This is the known
--   side effect of inserting auth users via SQL: no matching row is created
--   in auth.identities, which GoTrue requires for password sign-in.
--   -> This file adds the missing email identity rows (idempotent).
--
-- CLEANUP: removes the temporary end-to-end flow-test account that was
--   created while verifying signup/booking under RLS.
--
-- SAFETY: additive/idempotent only. No RLS is touched, no data is deleted
--   (except the explicitly-listed flow-test account).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- FIX 1: sign-up trigger — copy email (same body as full_schema section 1)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = NEW.id) THEN
    BEGIN
      INSERT INTO public.profiles (id, full_name, phone, role, email, created_at, updated_at)
      VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''),
        NULLIF(NEW.raw_user_meta_data ->> 'phone', ''),
        'patient',
        NULLIF(NEW.email, ''),
        NOW(),
        NOW()
      );
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'Could not create profile for user %: %', NEW.id, SQLERRM;
    END;
  END IF;
  RETURN NEW;
END;
$$;

-- One-time backfill: set profile email from auth.users where still NULL
UPDATE public.profiles p
SET email = u.email
FROM auth.users u
WHERE u.id = p.id AND p.email IS NULL AND u.email IS NOT NULL;

-- --------------------------------------------------------------------------
-- FIX 1b: protect_profile_update — allow self-promotion patient -> doctor
--   (doctor onboarding). The live DB still has the OLD profiles_security
--   version, which raises "You are not allowed to change your account role"
--   for a patient promoting themselves during doctor onboarding.
-- --------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.protect_profile_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_role TEXT;
BEGIN
  IF NEW.id IS DISTINCT FROM OLD.id THEN
    RAISE EXCEPTION 'Profile id cannot be changed';
  END IF;

  NEW.created_at := OLD.created_at;
  NEW.updated_at := NOW();

  IF NEW.role IS DISTINCT FROM OLD.role THEN
    IF auth.uid() IS NULL THEN
      RETURN NEW;
    END IF;
    IF OLD.role = 'patient' AND NEW.role = 'doctor' AND auth.uid() = NEW.id THEN
      RETURN NEW;
    END IF;
    SELECT role INTO caller_role FROM public.profiles WHERE id = auth.uid();
    IF caller_role IS DISTINCT FROM 'admin' THEN
      RAISE EXCEPTION 'You are not allowed to change your account role';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- -----------------------------------------------------------------------------
-- FIX 2: create the missing email identities for SQL-inserted auth users
-- -----------------------------------------------------------------------------
INSERT INTO auth.identities (user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at)
SELECT
  u.id,
  u.id,
  'email',
  jsonb_build_object('sub', u.id::text, 'email', u.email, 'email_verified', TRUE),
  NULL,
  NOW(),
  NOW()
FROM auth.users u
LEFT JOIN auth.identities i ON i.user_id = u.id AND i.provider = 'email'
WHERE i.user_id IS NULL
  AND u.email IS NOT NULL
ON CONFLICT (provider_id, provider) DO NOTHING;

-- -----------------------------------------------------------------------------
-- CLEANUP: delete the temporary flow-test account (cascades:
-- auth.users -> profiles -> appointments -> related rows)
-- -----------------------------------------------------------------------------
-- Uncomment before running if you want it included in the same execution:
--
-- DELETE FROM auth.users
-- WHERE email = 'flowtest@mydoctor.test'
--   AND id = '20cf1c2a-f4b9-4ff8-8f79-7c125ced3970';
--
-- Also remove the flow-test booking if you prefer to keep the account:
--
-- DELETE FROM public.appointments
-- WHERE patient_id = '20cf1c2a-f4b9-4ff8-8f79-7c125ced3970'
--   AND patient_message = 'RLS flow test';

-- -----------------------------------------------------------------------------
-- Verification queries (run separately):
--
--   -- new signups will now get emails:
--   SELECT proname, prosrc LIKE '%NULLIF(NEW.email%' FROM pg_proc
--   WHERE proname = 'handle_new_profile' AND pronamespace = 'public'::regnamespace;
--
--   -- demo doctors should now be password-signable:
--   SELECT u.email, (i.user_id IS NOT NULL) AS has_email_identity
--   FROM auth.users u
--   LEFT JOIN auth.identities i ON i.user_id = u.id AND i.provider = 'email'
--   WHERE u.email LIKE '%@mydoctor.test';
-- -----------------------------------------------------------------------------
