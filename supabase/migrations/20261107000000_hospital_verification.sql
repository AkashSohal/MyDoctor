-- ============================================================================
-- Hospital & Clinic Management — Part 1 (hospital submission + verification)
--
-- Adds to public.hospitals (no new tables; existing relationships reused):
--   * classification/location fields  (hospital_type, city, state, pin_code)
--   * verification workflow           (verification_status: pending/verified/rejected)
--   * submitter association           (added_by -> profiles, i.e. the registering doctor)
--   * duplicate prevention            (unique index on normalized name + address)
--
-- Security model:
--   * Admins keep full control (existing hospitals_*_admin policies untouched).
--   * Authenticated users may INSERT a facility only as 'pending' and only
--     attributed to themselves (RLS WITH CHECK + BEFORE trigger double-guard).
--   * Only admins can change verification_status (BEFORE trigger, mirrors
--     doctors_protect_update). Submitters may edit details only while pending.
--   * Predefined/admin-created hospitals default to 'verified' (column default),
--     doctor-submitted hospitals are always forced to 'pending' — never auto-
--     verified.
--
-- Idempotent: safe to re-run in the Supabase SQL Editor.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. hospitals: new columns
-- ---------------------------------------------------------------------------
alter table public.hospitals
  add column if not exists hospital_type text not null default 'Hospital',
  add column if not exists city text,
  add column if not exists state text,
  add column if not exists pin_code text,
  add column if not exists verification_status text not null default 'verified',
  add column if not exists added_by uuid references public.profiles (id) on delete set null;

-- Existing rows (predefined + admin-created) keep the 'verified' default;
-- nothing is removed and no fake records are created.

-- ---------------------------------------------------------------------------
-- 2. Check constraints (validation at the database level)
-- ---------------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'hospitals_type_check') then
    alter table public.hospitals
      add constraint hospitals_type_check
      check (hospital_type in ('Hospital', 'Clinic', 'Medical Centre', 'Other'));
  end if;

  if not exists (select 1 from pg_constraint where conname = 'hospitals_verification_status_check') then
    alter table public.hospitals
      add constraint hospitals_verification_status_check
      check (verification_status in ('pending', 'verified', 'rejected'));
  end if;

  if not exists (select 1 from pg_constraint where conname = 'hospitals_pin_code_check') then
    alter table public.hospitals
      add constraint hospitals_pin_code_check
      check (pin_code is null or pin_code ~ '^[1-9][0-9]{5}$');
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- 3. Duplicate prevention: same normalized name + address cannot be inserted
--    twice (covers admin and doctor submissions alike).
-- ---------------------------------------------------------------------------
create unique index if not exists hospitals_name_address_key
  on public.hospitals (lower(btrim(name)), lower(btrim(address)));

create index if not exists idx_hospitals_verification
  on public.hospitals (verification_status);

create index if not exists idx_hospitals_added_by
  on public.hospitals (added_by);

-- ---------------------------------------------------------------------------
-- 4. Trigger: doctors can never self-verify or re-attribute a hospital.
--    auth.uid() IS NULL = SQL Editor / service role, allowed by design
--    (same convention as protect_doctor_update).
-- ---------------------------------------------------------------------------
create or replace function public.hospitals_protect_submission()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    return new; -- SQL editor / service role
  end if;

  if tg_op = 'INSERT' then
    if public.is_admin() then
      return new; -- admins may create facilities directly (verified by default)
    end if;

    -- Non-admin submissions are always pending and always their own
    new.verification_status := 'pending';

    if new.added_by is distinct from auth.uid() then
      raise exception 'Hospital must be attributed to your account';
    end if;

    if coalesce(btrim(new.city), '') = ''
       or coalesce(btrim(new.state), '') = ''
       or coalesce(btrim(new.pin_code), '') = '' then
      raise exception 'City, state and PIN code are required';
    end if;

    return new;
  end if;

  -- UPDATE -----------------------------------------------------------------
  if new.added_by is distinct from old.added_by then
    raise exception 'Hospital submitter cannot be changed';
  end if;

  if new.verification_status is distinct from old.verification_status
     and not public.is_admin() then
    raise exception 'Only administrators can change verification status';
  end if;

  if not public.is_admin() and old.verification_status <> 'pending' then
    raise exception 'Only administrators can edit verified facilities';
  end if;

  return new;
end;
$$;

drop trigger if exists hospitals_protect_submission on public.hospitals;
create trigger hospitals_protect_submission
  before insert or update on public.hospitals
  for each row execute function public.hospitals_protect_submission();

-- ---------------------------------------------------------------------------
-- 5. RLS: allow doctors to submit their own pending facilities.
--    Existing admin policies (hospitals_*_admin) and public read are kept.
-- ---------------------------------------------------------------------------
drop policy if exists hospitals_insert_submitter on public.hospitals;
create policy hospitals_insert_submitter
  on public.hospitals
  for insert to authenticated
  with check (
    verification_status = 'pending'
    and added_by = auth.uid()
  );

-- Submitters may fix details only while the facility is pending review.
-- The trigger still blocks any verification_status change by non-admins.
drop policy if exists hospitals_update_submitter on public.hospitals;
create policy hospitals_update_submitter
  on public.hospitals
  for update to authenticated
  using (
    added_by = auth.uid()
    and verification_status = 'pending'
  )
  with check (
    added_by = auth.uid()
    and verification_status = 'pending'
  );

-- ---------------------------------------------------------------------------
-- 6. Grants (RLS remains the enforcer; mirrors the admin-dashboard migration)
-- ---------------------------------------------------------------------------
grant select, insert, update, delete on public.hospitals to anon, authenticated, service_role;
