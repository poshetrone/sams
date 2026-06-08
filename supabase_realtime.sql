-- ============================================================
-- SAMS — Activer Supabase Realtime sur les tables partagées
-- Supabase → SQL Editor → coller → Run (idempotent, ré-exécutable)
-- ============================================================
-- IMPORTANT : Realtime ne livre les `postgres_changes` à un client
-- (anon/authenticated) QUE si la RLS est activée + une policy de lecture
-- existe. Sans ça, seul le service-role (qui bypasse la RLS) reçoit les
-- événements — et donc le navigateur ne reçoit RIEN.
--
-- Ce script :
--   1. ajoute les tables à la publication `supabase_realtime` ;
--   2. active la RLS + crée une policy de LECTURE (select) sur chacune.
--
-- Sécurité : l'app lit/écrit via la clé service-role (côté serveur), qui
-- bypasse la RLS — donc activer la RLS ici ne casse rien. La policy n'ouvre
-- QUE la lecture (aucune écriture côté client). L'exposition en lecture est
-- la même qu'aujourd'hui (RLS désactivée laisse déjà lire via l'API).

-- 1) Publication realtime
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

-- 2) RLS + policy de lecture (nécessaire pour que le client reçoive les events)
do $$
declare t text;
begin
  foreach t in array array['calendar_events', 'trombi_posts', 'tombola', 'fusillades']
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists "%s_realtime_read" on public.%I', t, t);
    execute format('create policy "%s_realtime_read" on public.%I for select using (true)', t, t);
  end loop;
end $$;
