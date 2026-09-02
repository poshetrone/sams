/* ============ SAMS — Types des entités Supabase (cf. supabase_schema.sql) ============ */
import type { GradeKey } from './constants'

export interface Member {
  id: string
  name: string
  grade: GradeKey | string
  discord: string | null
  discord_id: string | null
  matricule: string | null
  status: string
  phone: string | null
  photo: string | null
  poles: string[]
  formations: string[]
  warnings: number
  /** Type d'absence en cours (clé de ABSENCE_TYPES ou 'autre') — null si présent. */
  absence: string | null
  /** Raison libre de l'absence (saisie par l'employé). */
  absence_reason: string | null
  /** Fin d'absence "JJ/MM/AAAA" — null si sans échéance. */
  absence_until: string | null
  prime: boolean
  bonus: number
  contract_photos: ContractPhoto[]
  since: string | null
  created_at?: string
}

export interface ContractPhoto { id: string; src: string; date: string }

export interface Access {
  id: string
  name: string | null
  discord: string | null
  discord_id: string | null
  grade: string
  status: 'pending' | 'approved'
  note: string | null
  requested_at?: string
}

export interface Emergency { name: string; link: string; phone: string }
export interface Vitals { tension: string; fc: string; spo2: string; temp: string }
export interface VitalsRecord extends Vitals { date: string }
export interface Treatment { name: string; pos: string }
export interface HistoryEntry { date: string; type: string; author: string; text: string }
export interface Appointment {
  id: string; date: string; dateIso?: string; time?: string
  reason: string; doctor?: string; place?: string; done: boolean
}
export interface PatientImage { id: string; src: string; type?: string; label?: string; date: string }
export interface Invoice {
  id: string; date: string; label: string; amount: number
  mutuelle?: string; status: string
}
export interface PatientDoc {
  id: string; type: string; title: string; date: string
  author: string; state: string; file?: string; fileName?: string; mime?: string
  /** Contenu structuré saisi dans l'éditeur (champs, textes, zones, sexe…). */
  content?: Record<string, unknown>
}

export interface Patient {
  id: string
  first_name: string
  last_name: string
  dob: string | null
  sex: 'M' | 'F' | string
  blood: string
  phone: string | null
  matricule: string | null
  allergies: string
  status: string
  care: string
  room: string | null
  last_visit: string | null
  notes: string | null
  antecedents: string | null
  photo: string | null
  id_card: string | null
  emergency: Emergency
  vitals: Vitals
  vitals_history: VitalsRecord[]
  treatments: Treatment[]
  history: HistoryEntry[]
  appointments: Appointment[]
  images: PatientImage[]
  invoices: Invoice[]
  docs: PatientDoc[]
  created_at?: string
}

/**
 * Champs d'identité communs au dossier complet (`Patient`) et à la ligne de
 * liste (`PatientListItem`) — l'en-tête des documents n'a besoin que de ceux-là.
 */
export interface PatientIdentity {
  first_name: string
  last_name: string
  dob: string | null
  blood: string
  matricule: string | null
}

/** Métadonnées de pagination renvoyées par l'API (paginator Lucid). */
export interface PageMeta {
  total: number
  perPage: number
  currentPage: number
  lastPage: number
}

/** Page de résultats : les lignes + leurs métadonnées. */
export interface Page<T> {
  items: T[]
  meta: PageMeta
}

/**
 * Ligne du tableau des patients — projection légère renvoyée par
 * `GET /patients?page=…`. Volontairement dépourvue des colonnes JSON
 * (imagerie, documents, historique…) : elles ne servent qu'au dossier détaillé
 * et pèsent plusieurs Mo par patient.
 */
export interface PatientListItem {
  id: string
  first_name: string
  last_name: string
  dob: string | null
  sex: 'M' | 'F' | string
  blood: string
  phone: string | null
  matricule: string | null
  status: string
  care: string
  last_visit: string | null
  photo: string | null
  /** Nombre de documents rattachés, compté en base. */
  docs_count: number
}

/** Compteurs du registre patients (vue Statistiques), agrégés par l'API. */
export interface PatientStats {
  total: number
  /** Nombre de documents par type (clés de `DOC_TYPES`). */
  docs_by_type: Record<string, number>
}

/** Rendez-vous non honoré, avec l'identité du patient concerné. */
export interface PatientReminder {
  patient_id: string
  first_name: string
  last_name: string
  appointment: Appointment
}

export interface CalendarEvent {
  id: string
  day: string // YYYY-MM-DD
  text: string
  author: string | null
  color: string
}

export interface TarifRow {
  id: string
  label: string
  sub: string | null
  price: number
  icon: string
  ord: number
}

export interface Contract {
  id: string
  company: string
  logo: string | null
  type: 'standard' | 'premium' | string
  tier: string
  employees: number | null
  status: string
  start: string | null
  end: string | null
  details: string | null
  created_at?: string
}

export interface Timeclock {
  id: string
  member_id: string | null
  name: string | null
  grade: string | null
  /** Instants UTC canoniques (timestamptz). Affichés toujours en Europe/Paris. */
  start_at: string | null
  end_at: string | null
  /** Champs d'affichage dérivés (heure de Paris) — back-compat / requêtes. */
  date: string | null
  start: string | null
  end: string | null
  minutes: number
  created_at?: string
}

export interface AcademyChapter {
  key: string
  title: string
  text: string
  items: string[]
}

/** Pièce jointe d'une formation : fichier téléversé dans Storage. */
export interface AcademyDocument {
  key: string
  name: string
  url: string
  mime: string | null
  size: number | null
}

export interface AcademyFormation {
  id: string
  ord: number
  eyebrow: string | null
  title: string
  subtitle: string | null
  chapters: AcademyChapter[]
  /** Pièces jointes proposées au téléchargement (PDF, images…). */
  documents: AcademyDocument[]
  /** Mise en situation : question ouverte posée au stagiaire. */
  question: string | null
  created_at?: string | null
  updated_at?: string | null
}

export interface AcademyAnswer {
  id: string
  formation_id: string
  member_id: string | null
  name: string | null
  grade: string | null
  answer: string | null
  completed: boolean
  created_at?: string | null
  updated_at?: string | null
}

export interface Tombola {
  id: number
  size: number
  tickets: Record<string, string>
  winner: { num: number; who: string } | null
  updated_at?: string
}

export type HelpBlock =
  | { id: string; type: 'heading'; text: string }
  | { id: string; type: 'text'; text: string }
  | { id: string; type: 'image'; url: string; caption?: string }

export interface HelpPage {
  id: number
  blocks: HelpBlock[]
  updated_at?: string
}

export interface FormationRow {
  key: string
  label: string
  short: string | null
  icon: string
  ord: number
}

export interface PoleRow {
  key: string
  label: string
  color: string
  icon: string
  /** Id du membre responsable du pôle (null si non défini). */
  lead: string | null
  ord: number
}

/** Prime de grade éditable (table `grade_primes`). Référencée par sa clé de grade. */
export interface GradePrimeRow {
  key: string
  prime: number
}

export interface MutuelleTier {
  key: string
  label: string
  price: number
}

/** Formule de couverture (table `mutuelles`), référencée par les contrats. */
export interface MutuelleRow {
  key: string
  label: string
  desc: string | null
  perks: string[]
  tiers: MutuelleTier[]
  /** Active le style « premium » (doré) côté interface. */
  premium: boolean
  ord: number
}

export interface PoleAppointment {
  id: string
  pole_key: string
  member_id: string | null
  author: string | null
  title: string
  /** Date "YYYY-MM-DD". */
  day: string
  /** Heure "HH:MM" (null si toute la journée). */
  time: string | null
  created_at?: string | null
}

export interface AuditEntry {
  id: string
  who: string | null
  grade: string | null
  action: string | null
  target: string | null
  time: string | null
  created_at?: string
}

/** Champs persistables d'un patient (colonnes de la table patients). */
export type PatientPatch = Partial<Omit<Patient, 'id' | 'created_at'>>
