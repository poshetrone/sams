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

export interface Wounded {
  id: string; name: string; group?: string; age?: string; sex?: string
  phone?: string; triage: string; photo?: string | null; idCard?: string | null
  info?: string; patientId?: string
}

export interface Fusillade {
  id: string
  title: string
  zone: string | null
  x: number | null
  y: number | null
  severity: string
  status: string
  time: string | null
  author: string | null
  wounded: Wounded[]
  created_at?: string
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

export interface TrombiPost {
  id: string
  author: string | null
  grade: string | null
  photo: string | null
  text: string | null
  likers: string[]
  time: string | null
  created_at?: string
}

export interface Tombola {
  id: number
  size: number
  tickets: Record<string, string>
  winner: { num: number; who: string } | null
  updated_at?: string
}

export interface FormationRow {
  key: string
  label: string
  short: string | null
  icon: string
  ord: number
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
