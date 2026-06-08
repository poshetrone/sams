-- ============================================================
-- SAMS — RESET PRODUCTION (base vierge + accès Direction conservés)
-- Supabase → SQL Editor → coller → Run.
--
-- - Vide toutes les tables de contenu (patients, fusillades, calendrier,
--   contrats, pointeuse, trombi, tombola, audit, tarifs).
-- - Remet le catalogue de formations par défaut.
-- - members / accesses : ne garde QUE Titanium et Poshetrone, en
--   Direction Générale (directiongen) + accès approuvé.
-- - Ne supprime AUCUNE table. Les constantes (grades, pôles, types de
--   documents, mutuelles) sont dans le code, pas en base : intactes.
--
-- ⚠️ Destructif : efface définitivement les données de test.
-- ============================================================

begin;

-- 1) Tables de contenu : on vide tout
truncate table patients, fusillades, calendar_events, contracts,
               timeclock, trombi_posts, audit_log, tarifs;

-- 2) Tombola : état partagé remis à zéro (une seule ligne, id = 1)
truncate table tombola;
insert into tombola (id, size, tickets, winner) values (1, 100, '{}'::jsonb, null);

-- 3) Formations : catalogue par défaut (formations « par défaut » conservées)
truncate table formations;
insert into formations (key, label, short, icon, ord) values
  ('imagerie',    'Formation Imagerie',            'Imagerie',    'eye',     0),
  ('balle',       'Formation Opération par balle', 'Op. balle',   'alert',   1),
  ('visite',      'Formation Visite médicale',     'Visite méd.', 'shield',  2),
  ('taser',       'Formation Taser',               'Taser',       'pulse',   3),
  ('quine',       'Formation Kiné',                'Kiné',        'pill',    4),
  ('chirurgie',   'Formation Chirurgie',           'Chirurgie',   'patient', 5),
  ('psychologie', 'Formation Psychologie',         'Psycho.',     'brain',   6),
  ('henry',       'Formation Henry',               'Henry',       'doc',     7),
  ('fusillade',   'Formation Fusillade',           'Fusillade',   'alert',   8);

-- 4) MEMBERS : ne conserver que Titanium et Poshetrone
delete from members
 where discord_id is distinct from '466613706059415565'
   and discord_id is distinct from '643843071511101470';

-- discord_id est UNIQUE sur members → upsert
insert into members (name, grade, discord, discord_id, status, matricule)
values ('Titanium', 'directiongen', 'titanium_1817', '466613706059415565', 'service', 'SAMS-001')
on conflict (discord_id) do update set grade = 'directiongen', status = 'service';

insert into members (name, grade, discord, discord_id, status, matricule)
values ('Poshetrone', 'directiongen', 'poshetrone', '643843071511101470', 'service', 'SAMS-002')
on conflict (discord_id) do update set grade = 'directiongen', status = 'service';

-- 5) ACCESSES : ne conserver que les deux, en directiongen / approved
delete from accesses
 where discord_id is distinct from '466613706059415565'
   and discord_id is distinct from '643843071511101470';

-- accesses n'a pas de contrainte unique sur discord_id → update puis insert si absent
update accesses set grade = 'directiongen', status = 'approved'
 where discord_id = '466613706059415565';
insert into accesses (name, discord, discord_id, grade, status)
select 'Titanium', 'titanium_1817', '466613706059415565', 'directiongen', 'approved'
where not exists (select 1 from accesses where discord_id = '466613706059415565');

update accesses set grade = 'directiongen', status = 'approved'
 where discord_id = '643843071511101470';
insert into accesses (name, discord, discord_id, grade, status)
select 'Poshetrone', 'poshetrone', '643843071511101470', 'directiongen', 'approved'
where not exists (select 1 from accesses where discord_id = '643843071511101470');

commit;

-- Vérification (optionnel) :
-- select name, grade, discord_id, status from members;
-- select name, grade, discord_id, status from accesses;
