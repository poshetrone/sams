-- ============================================================
-- SAMS — Activer Supabase Realtime sur les tables partagées
-- Supabase → SQL Editor → coller → Run (idempotent, ré-exécutable)
-- ============================================================
-- Sans ça, le hook useRealtime ne reçoit aucun événement (pas d'erreur,
-- mais pas de mise à jour live). Une fois exécuté : calendrier, trombi,
-- tombola et fusillades se synchronisent en temps réel entre utilisateurs.

do $$
declare t text;
begin
  foreach t in array array['calendar_events', 'trombi_posts', 'tombola', 'fusillades']
  loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;
