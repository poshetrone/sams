/* ============ SAMS — Constantes statiques (portées depuis data.js) ============ */

export type GradeKey =
  | 'ambulancier' | 'interne' | 'medecin' | 'medecin1' | 'medecin2'
  | 'medsenior' | 'medchef' | 'responsable' | 'codirecteur' | 'directeur' | 'directiongen'

export interface GradeDef {
  label: string
  color: string
  bg: string
  rank: number
  prime: number
  supreme?: boolean
}

export const GRADES: Record<GradeKey, GradeDef> = {
  ambulancier:  { label: 'Ambulancier',        color: '#9fb2c7', bg: 'rgba(159,178,199,0.12)', rank: 1,  prime: 65000 },
  interne:      { label: 'Interne',            color: '#7e93b0', bg: 'rgba(126,147,176,0.14)', rank: 2,  prime: 70000 },
  medecin:      { label: 'Médecin',            color: '#45b98a', bg: 'rgba(69,185,138,0.13)',  rank: 3,  prime: 75000 },
  medecin1:     { label: 'Médecin 1',          color: '#3fb7a0', bg: 'rgba(63,183,160,0.13)',  rank: 4,  prime: 80000 },
  medecin2:     { label: 'Médecin 2',          color: '#4aaec0', bg: 'rgba(74,174,192,0.13)',  rank: 5,  prime: 85000 },
  medsenior:    { label: 'Médecin Senior',     color: '#5aa0d6', bg: 'rgba(90,160,214,0.14)',  rank: 6,  prime: 90000 },
  medchef:      { label: 'Médecin Chef',       color: '#7f9fe0', bg: 'rgba(127,159,224,0.14)', rank: 7,  prime: 95000 },
  responsable:  { label: 'Responsable',        color: '#a98fd6', bg: 'rgba(169,143,214,0.14)', rank: 8,  prime: 105000 },
  codirecteur:  { label: 'Co-Directeur',       color: '#ecd49a', bg: 'rgba(201,163,90,0.12)',  rank: 9,  prime: 110000 },
  directeur:    { label: 'Directeur',          color: '#c9a35a', bg: 'rgba(201,163,90,0.16)',  rank: 10, prime: 110000 },
  directiongen: { label: 'Direction Générale', color: '#ddbd78', bg: 'rgba(201,163,90,0.20)',  rank: 11, prime: 110000, supreme: true },
}

/** Grades disposant des droits d'administration. */
export const ADMIN_GRADES: GradeKey[] = ['directiongen', 'directeur', 'codirecteur']

/* ---- Permissions par grade ---- */
export type PermAction =
  | 'signDoc' | 'declareDeath' | 'deletePatient' | 'manageAccess'
  | 'resetPrime' | 'manageStaff' | 'billing'

export const PERMS: Record<PermAction, string[]> = {
  signDoc:       ['medecin', 'medecin1', 'medecin2', 'medsenior', 'medchef', 'responsable', 'codirecteur', 'directeur', 'directiongen'],
  declareDeath:  ['medsenior', 'medchef', 'responsable', 'codirecteur', 'directeur', 'directiongen'],
  deletePatient: ['responsable', 'codirecteur', 'directeur', 'directiongen'],
  manageAccess:  ADMIN_GRADES,
  resetPrime:    ADMIN_GRADES,
  manageStaff:   ADMIN_GRADES,
  billing:       ['medchef', 'responsable', 'codirecteur', 'directeur', 'directiongen'],
}

export const can = (action: PermAction, grade: string | null | undefined): boolean =>
  !!grade && (PERMS[action] || []).includes(grade)

export const isAdminGrade = (grade: string | null | undefined): boolean =>
  !!grade && (ADMIN_GRADES as string[]).includes(grade)

/* ---- Statuts ---- */
interface StatusDef { label: string; cls: string }

export const STATUS_MAP: Record<string, StatusDef> = {
  stable:   { label: 'Stable',   cls: 'ok' },
  suivi:    { label: 'En suivi', cls: 'info' },
  critique: { label: 'Critique', cls: 'crit' },
  deces:    { label: 'Décédé',   cls: 'crit' },
}

export const MEMBER_STATUS: Record<string, StatusDef> = {
  service:      { label: 'En service',   cls: 'ok' },
  intervention: { label: 'Intervention', cls: 'warn' },
  repos:        { label: 'Repos',        cls: 'info' },
  formation:    { label: 'Formation',    cls: 'gold' },
}

export const CARE_STATUS: Record<string, StatusDef> = {
  ambulatoire: { label: 'Ambulatoire', cls: 'ok' },
  admis:       { label: 'Admis',       cls: 'warn' },
  soins:       { label: 'En soins',    cls: 'info' },
  hospit:      { label: 'Hospitalisé', cls: 'crit' },
  sorti:       { label: 'Sorti',       cls: 'ok' },
}

/* ---- Documents ---- */
export interface DocType { key: string; title: string; desc: string; icon: string }

export const DOC_TYPES: DocType[] = [
  { key: 'aptitude',   title: "Fiche d'aptitude médicale",            desc: "Certificat d'aptitude (emploi, port d'arme).", icon: 'shield' },
  { key: 'bilan',      title: 'Rapport médical — Fiche bilan secours', desc: "Bilan complet d'intervention (victime, constantes, gestes…).", icon: 'pulse' },
  { key: 'imagerie',   title: "Rapport d'imagerie médicale",          desc: "Sélection d'un cliché + interprétation radiologique.", icon: 'eye' },
  { key: 'rapport',    title: "Rapport d'opération",                  desc: 'Schéma corporel + zones touchées détaillées.', icon: 'body' },
  { key: 'psy',        title: 'Visite psychologique',                 desc: 'Compte-rendu et conclusions du suivi.', icon: 'brain' },
  { key: 'ordonnance', title: 'Ordonnance',                           desc: 'Prescription médicamenteuse datée.', icon: 'pill' },
  { key: 'arret',      title: 'Arrêt de travail',                     desc: 'Interruption temporaire de service.', icon: 'pause' },
  { key: 'accident',   title: 'Accident de travail',                  desc: "Déclaration officielle d'accident.", icon: 'alert' },
  { key: 'deces',      title: 'Acte de décès',                        desc: 'Constat officiel de décès.', icon: 'cross' },
]

/* ---- Formations ---- */
export interface Formation { key: string; label: string; short: string; icon: string }

export const FORMATIONS: Formation[] = [
  { key: 'imagerie',    label: 'Formation Imagerie',            short: 'Imagerie',   icon: 'eye' },
  { key: 'balle',       label: 'Formation Opération par balle', short: 'Op. balle',  icon: 'alert' },
  { key: 'visite',      label: 'Formation Visite médicale',     short: 'Visite méd.', icon: 'shield' },
  { key: 'taser',       label: 'Formation Taser',               short: 'Taser',      icon: 'pulse' },
  { key: 'quine',       label: 'Formation Kiné',                short: 'Kiné',       icon: 'pill' },
  { key: 'chirurgie',   label: 'Formation Chirurgie',           short: 'Chirurgie',  icon: 'patient' },
  { key: 'psychologie', label: 'Formation Psychologie',         short: 'Psycho.',    icon: 'brain' },
  { key: 'henry',       label: 'Formation Henry',               short: 'Henry',      icon: 'doc' },
  { key: 'fusillade',   label: 'Formation Fusillade',           short: 'Fusillade',  icon: 'alert' },
]

/* ---- Pôles ---- */
export interface Pole { key: string; label: string; color: string; bg: string }

export const POLES: Pole[] = [
  { key: 'chirurgie', label: 'Pôle Chirurgie',      color: '#7f9fe0', bg: 'rgba(127,159,224,0.14)' },
  { key: 'kine',      label: 'Pôle Kinésithérapie', color: '#45b98a', bg: 'rgba(69,185,138,0.14)' },
  { key: 'psy',       label: 'Pôle Psychologie',    color: '#a98fd6', bg: 'rgba(169,143,214,0.14)' },
]

/* ---- Tarification ---- */
export interface Tarif { icon: string; label: string; sub?: string; price: number }

export const TARIFS: Tarif[] = [
  { icon: 'soin',    label: 'Soin', price: 600 },
  { icon: 'pulse',   label: 'Réanimation', price: 700 },
  { icon: 'ambu',    label: 'Réanimation + Déplacement', price: 1200 },
  { icon: 'visite',  label: 'Visite médicale', price: 1000 },
  { icon: 'brain',   label: 'Visite psy', price: 1500 },
  { icon: 'spine',   label: 'Consultation spé', sub: '(kiné, chir, psy)', price: 1500 },
  { icon: 'scalpel', label: 'Opération simple', price: 1400 },
  { icon: 'complex', label: 'Opération complexe', price: 1800 },
  { icon: 'fusil',   label: 'Fusillade', price: 6000 },
]

/* ---- Mutuelles ---- */
export interface MutuelleTier { key: string; label: string; price: number }
export interface MutuelleDef { label: string; desc: string; perks: string[]; tiers: MutuelleTier[] }

export const MUTUELLES: Record<'standard' | 'premium', MutuelleDef> = {
  standard: {
    label: 'Mutuelle',
    desc: 'Réanimation gratuite + déplacement gratuit compris en service',
    perks: ['Réanimation gratuite', 'Déplacement gratuit en service'],
    tiers: [
      { key: 't1', label: '10 à 15 employés', price: 45000 },
      { key: 't2', label: '15 à 20 employés', price: 50000 },
      { key: 't3', label: '20 employés et +', price: 55000 },
    ],
  },
  premium: {
    label: 'Mutuelle Premium',
    desc: 'Réanimation + soins + déplacement gratuit + imagerie médicale en service',
    perks: ['Réanimation', 'Soins', 'Déplacement gratuit', 'Imagerie médicale en service'],
    tiers: [
      { key: 't1', label: '10 à 15 employés', price: 90000 },
      { key: 't2', label: '15 à 20 employés', price: 110000 },
      { key: 't3', label: '20 employés et +', price: 130000 },
    ],
  },
}

export const mutuellePrice = (type: 'standard' | 'premium', tier: string): number => {
  const m = MUTUELLES[type]
  const t = m && m.tiers.find((x) => x.key === tier)
  return t ? t.price : 0
}

/* ---- Fusillades / triage ---- */
export const TRIAGE: Record<string, { label: string; cls: string; color: string }> = {
  urgent: { label: 'Urgence absolue',  cls: 'crit', color: '#e85c52' },
  grave:  { label: 'Urgence relative', cls: 'warn', color: '#e3a83f' },
  leger:  { label: 'Blessé léger',     cls: 'ok',   color: '#45b98a' },
  deces:  { label: 'Décédé',           cls: 'crit', color: '#7286a0' },
}

export const SEVERITY: Record<string, { cls: string }> = {
  'légère':   { cls: 'ok' },
  'modérée':  { cls: 'warn' },
  'critique': { cls: 'crit' },
}

export const GTA_ZONES = [
  'Downtown', 'Vinewood', 'Del Perro', 'Vespucci Beach', 'Rockford Hills', 'Mirror Park',
  'Strawberry', 'Davis', 'La Mesa', 'Sandy Shores', 'Paleto Bay', 'Grapeseed',
  'Harmony', 'Chumash', 'Pacific Bluffs', 'Little Seoul',
]

/* ---- Calendrier ---- */
export const MONTHS_FR = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
]
export const WEEKDAYS_FR = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']

/* ---- Navigation (sidebar) ---- */
export interface NavItem { key: string; label: string; icon: string; admin?: boolean; badge?: string; route: string }
export interface NavGroup { group: string; items: NavItem[] }

export const NAV: NavGroup[] = [
  { group: 'Pilotage', items: [
    { key: 'dashboard',  label: 'Tableau de bord', icon: 'dashboard', route: '/dashboard' },
    { key: 'calendrier', label: 'Calendrier',      icon: 'calendar',  route: '/calendrier' },
    { key: 'trombi',     label: 'Trombinoscope',   icon: 'patients',  route: '/trombinoscope' },
  ]},
  { group: 'Médical', items: [
    { key: 'patients',     label: 'Dossiers patients',   icon: 'patients',  route: '/patients' },
    { key: 'documents',    label: 'Documents',           icon: 'docs',      route: '/documents' },
    { key: 'fusillade',    label: 'Fusillades',          icon: 'target',    route: '/fusillades' },
    { key: 'contrats',     label: 'Contrats & mutuelles', icon: 'briefcase', route: '/contrats' },
    { key: 'tarification', label: 'Tarification',        icon: 'cash',      route: '/tarification' },
  ]},
  { group: 'Administration', items: [
    { key: 'access',     label: 'Gestion des accès', icon: 'access',    admin: true, badge: 'reqCount', route: '/acces' },
    { key: 'effectifs',  label: 'Effectifs',         icon: 'effectifs', route: '/effectifs' },
    { key: 'pointeuse',  label: 'Pointeuse',         icon: 'clock',     route: '/pointeuse' },
    { key: 'formations', label: 'Formations',        icon: 'medal',     route: '/formations' },
    { key: 'primes',     label: 'Primes',            icon: 'cash',      route: '/primes' },
    { key: 'tombola',    label: 'Tombola',           icon: 'medal',     route: '/tombola' },
    { key: 'audit',      label: "Journal d'audit",   icon: 'clock',     route: '/audit' },
    { key: 'stats',      label: 'Statistiques',      icon: 'stats',     route: '/stats' },
  ]},
]

export const PAGE_META: Record<string, { title: string; sub: string }> = {
  dashboard:    { title: 'Tableau de bord', sub: "Vue d'ensemble du service médical" },
  calendrier:   { title: 'Calendrier 2026', sub: 'Agenda partagé du service — tout le monde peut écrire' },
  trombi:       { title: 'Trombinoscope', sub: 'Mur du service — partagez votre photo et discutez' },
  patients:     { title: 'Dossiers patients', sub: 'Gestion des fiches et antécédents' },
  documents:    { title: 'Documents médicaux', sub: 'Générer, éditer et archiver les pièces officielles' },
  fusillade:    { title: 'Fusillades & interventions', sub: 'Cartographie des interventions et triage des blessés' },
  contrats:     { title: 'Contrats & mutuelles', sub: 'Entreprises partenaires et formules de couverture' },
  tarification: { title: 'Tarification', sub: 'Fiche de prix des prestations du service' },
  access:       { title: 'Gestion des accès', sub: 'Validation Discord & permissions du personnel' },
  effectifs:    { title: 'Effectifs', sub: 'Personnel du service et grades' },
  pointeuse:    { title: 'Pointeuse', sub: 'Badgeage des services — prise et fin de poste' },
  formations:   { title: 'Formations', sub: 'Suivi des formations validées par employé' },
  primes:       { title: 'Primes', sub: 'Attribution des primes selon le grade' },
  tombola:      { title: 'Tombola', sub: 'Tirage au sort — grille partagée avec le service' },
  audit:        { title: "Journal d'audit", sub: 'Historique des actions du personnel' },
  stats:        { title: 'Statistiques', sub: "Indicateurs d'activité du service" },
}
