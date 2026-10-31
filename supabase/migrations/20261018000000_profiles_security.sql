-- MyDoctor: profiles table setup + security (columns, sign-up trigger, RLS)
--
-- HOW TO RUN (manual step, not applied yet):
--   Supabase Dashboard -> SQL Editor -> New query -> paste this file -> Run.
--   The script is idempotent: nothing is dropped except overly broad policies
--   on public.profiles, which are replaced by the own-row policies below.
--   It never overwrites or deletes existing table data.
--
-- Inspected state of the connected project before writing this script:
--   public.profiles exists with columns: id, full_name, phone, role, created_at
--   (no updated_at, no public.users table, no sign-up trigger was found).

-- ---------------------------------------------------------------------------
-- 1. Columns and defaults
-- ---------------------------------------------------------------------------
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;
ALTER TABLE public.profiles ALTER COLUMN role SET DEFAULT 'patient';

UPDATE public.profiles
SET updated_at = COALESCE(updated_at, created_at, NOW())
WHERE updated_at IS NULL;

-- ---------------------------------------------------------------------------
-- 2. Reference auth.users (skipped with a notice if orphan rows exist)
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    JOIN pg_class f ON f.oid = c.confrelid
    JOIN pg_namespace fn ON fn.oid = f.relnamespace
    WHERE c.contype = 'f'
      AND n.nspname = 'public'
      AND t.relname = 'profiles'
      AND fn.nspname = 'auth'
      AND f.relname = 'users'
  ) THEN
    BEGIN
      ALTER TABLE public.profiles
        ADD CONSTRAINT profiles_id_fkey
        FOREIGN KEY (id) REFERENCES auth.users (id) ON DELETE CASCADE;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'profiles_id_fkey was not added: %', SQLERRM;
    END;
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 3. Create the profile automatically when a user registers.
--    Always inserts role = 'patient'; a failure only raises a warning so the
--    sign-up itself never breaks (the app backfills missing profiles too).
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = NEW.id) THEN
    BEGIN
      INSERT INTO public.profiles (id, full_name, phone, role, created_at, updated_at)
      VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''),
        NULLIF(NEW.raw_user_meta_data ->> 'phone', ''),
        'patient',
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

DROP TRIGGER IF EXISTS on_auth_user_created_profile ON auth.users;

CREATE TRIGGER on_auth_user_created_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_profile();

-- ---------------------------------------------------------------------------
-- 4. Protect privileged fields: id, created_at and role cannot be changed by
--    ordinary users. Only an admin (or the service role / SQL Editor, where
--    auth.uid() is null) may change a role, so users cannot make themselves
--    admin or doctor. updated_at is stamped on every update.
-- ---------------------------------------------------------------------------
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
    IF auth.uid() IS NOT NULL THEN
      SELECT role INTO caller_role FROM public.profiles WHERE id = auth.uid();
      IF caller_role IS DISTINCT FROM 'admin' THEN
        RAISE EXCEPTION 'You are not allowed to change your account role';
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_protect_update ON public.profiles;

CREATE TRIGGER profiles_protect_update
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_profile_update();

-- ---------------------------------------------------------------------------
-- 5. Row Level Security: enabled first, then own-row policies are created,
--    and only afterwards any broader existing policy is removed. There is
--    deliberately no DELETE policy and no policy for the anon role.
-- ---------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'profiles'
      AND policyname = 'profiles_select_own'
  ) THEN
    CREATE POLICY profiles_select_own ON public.profiles
      FOR SELECT TO authenticated
      USING (auth.uid() = id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'profiles'
      AND policyname = 'profiles_update_own'
  ) THEN
    CREATE POLICY profiles_update_own ON public.profiles
      FOR UPDATE TO authenticated
      USING (auth.uid() = id)
      WITH CHECK (auth.uid() = id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'profiles'
      AND policyname = 'profiles_insert_own'
  ) THEN
    CREATE POLICY profiles_insert_own ON public.profiles
      FOR INSERT TO authenticated
      WITH CHECK (auth.uid() = id AND COALESCE(role, 'patient') = 'patient');
  END IF;
END $$;

DO $$
DECLARE
  policy_record RECORD;
BEGIN
  FOR policy_record IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'profiles'
      AND policyname NOT IN (
        'profiles_select_own',
        'profiles_update_own',
        'profiles_insert_own'
      )
  LOOP
    EXECUTE format('DROP POLICY %I ON public.profiles', policy_record.policyname);
    RAISE NOTICE 'Dropped broader profiles policy: %', policy_record.policyname;
  END LOOP;
END $$;

-- ---------------------------------------------------------------------------
-- Verification queries (run them separately if you want to double-check):
--   SELECT policyname, cmd FROM pg_policies WHERE tablename = 'profiles';
--   SELECT rolname, rolsuper FROM pg_roles WHERE rolname = 'authenticated';
--   SELECT tgname FROM pg_trigger WHERE tgrelid = 'public.profiles'::regclass;
--   SELECT tgname FROM pg_trigger WHERE tgrelid = 'auth.users'::regclass;
-- ---------------------------------------------------------------------------
