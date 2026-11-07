-- ============================================================================
-- Doctor Account Management — Part 2
--
-- Part 1 already provides everything needed for hospital submission,
-- verification and doctor <-> hospital relationships:
--   * public.hospitals.added_by / verification_status / type / city / state / pin
--   * hospitals_insert_submitter / hospitals_update_submitter RLS policies
--   * doctor_hospitals_manage_own RLS policy (add/remove own affiliations)
--
-- This migration intentionally adds NO new tables and does NOT touch existing
-- data. The only missing capability is a public storage bucket where doctors
-- can upload profile photos (the existing admin-uploads bucket is admin-only).
--
-- Idempotent: safe to re-run in the Supabase SQL Editor.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Storage bucket for doctor profile photos
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'doctor-uploads',
  'doctor-uploads',
  true,
  5242880, -- 5 MB
  array['image/png', 'image/jpeg', 'image/webp']
)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- 2. Storage RLS
--    * anyone may read (public profile photos)
--    * a signed-in doctor may only write inside a folder named after their
--      own auth uid (path convention: <auth.uid()>/<timestamp>-<random>.<ext>)
-- ---------------------------------------------------------------------------
drop policy if exists "doctor_uploads_public_read" on storage.objects;
create policy "doctor_uploads_public_read"
  on storage.objects for select
  to public
  using (bucket_id = 'doctor-uploads');

drop policy if exists "doctor_uploads_owner_insert" on storage.objects;
create policy "doctor_uploads_owner_insert"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'doctor-uploads'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "doctor_uploads_owner_update" on storage.objects;
create policy "doctor_uploads_owner_update"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'doctor-uploads'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'doctor-uploads'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "doctor_uploads_owner_delete" on storage.objects;
create policy "doctor_uploads_owner_delete"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'doctor-uploads'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
