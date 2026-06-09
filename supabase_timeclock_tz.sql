-- ============================================================
-- SAMS — Pointeuse : stockage des horaires en UTC (timestamptz)
-- Supabase → SQL Editor → coller → Run (idempotent, ré-exécutable)
-- ============================================================
-- Corrige le bug de fuseau (heures avec ~2h d'avance) : on stocke
-- désormais l'INSTANT en UTC (`start_at` / `end_at`) ; l'application
-- AFFICHE toujours en heure de Paris (cf. lib/format.ts).
--
-- Les colonnes texte existantes (date / start / end / minutes) sont
-- conservées : elles servent de cache d'affichage (déjà en heure de
-- Paris) et de repli pour les lignes antérieures à la migration.
-- ============================================================

alter table public.timeclock add column if not exists start_at timestamptz;
alter table public.timeclock add column if not exists end_at   timestamptz;

-- Backfill best-effort des lignes existantes : on réinterprète la date
-- "DD/MM/YYYY" + l'heure "HH:MM" déjà stockées COMME DE L'HEURE DE PARIS,
-- puis on les convertit en instant UTC. (to_timestamp + AT TIME ZONE)
update public.timeclock
   set start_at = (to_timestamp(date || ' ' || start, 'DD/MM/YYYY HH24:MI')
                   at time zone 'Europe/Paris')
 where start_at is null and date is not null and start is not null;

update public.timeclock
   set end_at = (to_timestamp(date || ' ' || "end", 'DD/MM/YYYY HH24:MI')
                 at time zone 'Europe/Paris')
 where end_at is null and date is not null and "end" is not null;

-- Service de nuit : si la fin tombe avant le début, c'est le lendemain.
update public.timeclock
   set end_at = end_at + interval '1 day'
 where end_at is not null and start_at is not null and end_at < start_at;
