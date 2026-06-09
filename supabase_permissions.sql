-- ============================================================
-- SAMS — Système de permissions configurable (catégorie "Permissions")
-- Supabase → SQL Editor → coller → Run (idempotent, ré-exécutable)
-- ============================================================
-- Une ligne = un niveau d'accès (edit/view/none) pour un croisement
-- (grade, catégorie). L'absence de ligne => niveau par défaut calculé
-- côté application (voir lib/permissions.ts) :
--   • 'edit' pour la Direction (directiongen / directeur / codirecteur) ;
--   • 'none' pour les catégories sensibles (access, audit, permissions)
--     pour tous les autres grades ;
--   • 'view' pour tout le monde sinon.
--
-- L'app lit/écrit cette table via la clé service-role (côté serveur), qui
-- bypasse la RLS. On active quand même la RLS + une policy de LECTURE pour
-- pouvoir, si besoin, livrer les changements via Realtime sans rien ouvrir
-- en écriture côté client.

create table if not exists public.permissions (
  grade    text not null,
  category text not null,
  level    text not null default 'view' check (level in ('edit', 'view', 'none')),
  primary key (grade, category)
);

-- RLS + policy de lecture (aucune écriture côté client ; l'écriture passe
-- exclusivement par les server actions en service-role).
alter table public.permissions enable row level security;
drop policy if exists "permissions_read" on public.permissions;
create policy "permissions_read" on public.permissions for select using (true);

-- (Optionnel) Realtime : décommenter pour pousser les changements en direct.
-- do $$
-- begin
--   if not exists (
--     select 1 from pg_publication_tables
--     where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'permissions'
--   ) then
--     alter publication supabase_realtime add table public.permissions;
--   end if;
-- end $$;
