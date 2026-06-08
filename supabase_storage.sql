-- ============================================================
-- SAMS — Policies Storage du bucket "media"
-- Supabase → SQL Editor → Run (idempotent)
--
-- Lecture PUBLIQUE + upload pour utilisateurs AUTHENTIFIÉS.
-- (Les uploads de l'app passent par la clé service-role et bypassent la RLS ;
--  ces policies couvrent l'accès public en lecture et tout upload côté client.)
-- ============================================================

-- Le bucket doit exister et être public.
insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do update set public = true;

-- Lecture publique des objets du bucket media
drop policy if exists "media public read" on storage.objects;
create policy "media public read"
  on storage.objects for select
  to public
  using (bucket_id = 'media');

-- Upload (insert) réservé aux utilisateurs authentifiés
drop policy if exists "media authenticated upload" on storage.objects;
create policy "media authenticated upload"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'media');

-- Remplacement (update / upsert) par les utilisateurs authentifiés
drop policy if exists "media authenticated update" on storage.objects;
create policy "media authenticated update"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'media')
  with check (bucket_id = 'media');
