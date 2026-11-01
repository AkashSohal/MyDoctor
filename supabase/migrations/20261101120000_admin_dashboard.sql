-- ============================================================================
-- Admin Dashboard support schema
-- Adds: patient suspend status, hospital media/facilities, hospital<->specialty
-- join, admin audit log, admin review deletion, upload storage bucket.
-- Uses existing tables wherever possible (no duplicates).
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. profiles: account status + login tracking
-- ---------------------------------------------------------------------------
alter table public.profiles
  add column if not exists status text not null default 'active',
  add column if not exists last_login_at timestamptz;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'profiles_status_check'
  ) then
    alter table public.profiles
      add constraint profiles_status_check
      check (status in ('active', 'suspended'));
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- 2. hospitals: image, facilities, active flag
-- ---------------------------------------------------------------------------
alter table public.hospitals
  add column if not exists image_url text,
  add column if not exists facilities text[] not null default '{}',
  add column if not exists is_active boolean not null default true;

-- ---------------------------------------------------------------------------
-- 3. hospital_specialties: which specialties each hospital offers
-- ---------------------------------------------------------------------------
create table if not exists public.hospital_specialties (
  id uuid primary key default gen_random_uuid(),
  hospital_id uuid not null references public.hospitals(id) on delete cascade,
  specialty_id uuid not null references public.specialties(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (hospital_id, specialty_id)
);

alter table public.hospital_specialties enable row level security;

drop policy if exists "hospital_specialties_public_select" on public.hospital_specialties;
create policy "hospital_specialties_public_select"
  on public.hospital_specialties for select
  to anon, authenticated
  using (true);

drop policy if exists "hospital_specialties_admin_insert" on public.hospital_specialties;
create policy "hospital_specialties_admin_insert"
  on public.hospital_specialties for insert
  to authenticated
  with check (public.is_admin());

drop policy if exists "hospital_specialties_admin_delete" on public.hospital_specialties;
create policy "hospital_specialties_admin_delete"
  on public.hospital_specialties for delete
  to authenticated
  using (public.is_admin());

grant usage on schema public to anon, authenticated, service_role;
grant select, insert, update, delete on public.hospital_specialties to anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 4. admin_audit_logs: immutable trail of administrative actions
-- ---------------------------------------------------------------------------
create table if not exists public.admin_audit_logs (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid not null references public.profiles(id) on delete cascade,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  reason text,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_admin_audit_logs_created_at
  on public.admin_audit_logs (created_at desc);
create index if not exists idx_admin_audit_logs_admin_id
  on public.admin_audit_logs (admin_id);

alter table public.admin_audit_logs enable row level security;

drop policy if exists "admin_audit_logs_admin_select" on public.admin_audit_logs;
create policy "admin_audit_logs_admin_select"
  on public.admin_audit_logs for select
  to authenticated
  using (public.is_admin());

drop policy if exists "admin_audit_logs_admin_insert" on public.admin_audit_logs;
create policy "admin_audit_logs_admin_insert"
  on public.admin_audit_logs for insert
  to authenticated
  with check (public.is_admin() and admin_id = auth.uid());

grant select, insert, update, delete on public.admin_audit_logs to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 5. reviews: allow admins to permanently remove inappropriate reviews
--    (previous schema only allowed status changes; removal requires audit)
-- ---------------------------------------------------------------------------
drop policy if exists "reviews_admin_delete" on public.reviews;
create policy "reviews_admin_delete"
  on public.reviews for delete
  to authenticated
  using (public.is_admin());

-- ---------------------------------------------------------------------------
-- 6. protect_profile_update: also guard status changes
--    (admins/service-role only; patients can never escalate or unsuspend self)
-- ---------------------------------------------------------------------------
create or replace function public.protect_profile_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  caller_role text;
begin
  if tg_op = 'INSERT' then
    return new;
  end if;

  if old.id is distinct from new.id then
    raise exception 'Profile id cannot be changed';
  end if;

  if old.created_at is distinct from new.created_at then
    new.created_at := old.created_at;
  end if;

  new.updated_at := now();

  -- SQL editor / service role: allow everything
  if auth.uid() is null then
    return new;
  end if;

  -- Role changes: only admins (except self patient->doctor promotion)
  if old.role is distinct from new.role then
    if not (old.role = 'patient' and new.role = 'doctor') then
      select role into caller_role from public.profiles where id = auth.uid();
      if caller_role is distinct from 'admin' then
        raise exception 'You are not allowed to change your account role';
      end if;
    end if;
  end if;

  -- Status (suspend/reactivate) changes: only admins / service role
  if old.status is distinct from new.status then
    select role into caller_role from public.profiles where id = auth.uid();
    if caller_role is distinct from 'admin' then
      raise exception 'Only administrators can change account status';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists profiles_protect_update on public.profiles;
create trigger profiles_protect_update
  before update on public.profiles
  for each row execute function public.protect_profile_update();

-- ---------------------------------------------------------------------------
-- 7. Storage bucket for admin-uploaded images (hospital photos, specialty icons)
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('admin-uploads', 'admin-uploads', true)
on conflict (id) do nothing;

drop policy if exists "admin_uploads_public_read" on storage.objects;
create policy "admin_uploads_public_read"
  on storage.objects for select
  to public
  using (bucket_id = 'admin-uploads');

drop policy if exists "admin_uploads_admin_insert" on storage.objects;
create policy "admin_uploads_admin_insert"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'admin-uploads' and public.is_admin());

drop policy if exists "admin_uploads_admin_update" on storage.objects;
create policy "admin_uploads_admin_update"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'admin-uploads' and public.is_admin());

drop policy if exists "admin_uploads_admin_delete" on storage.objects;
create policy "admin_uploads_admin_delete"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'admin-uploads' and public.is_admin());
