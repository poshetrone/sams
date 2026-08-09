'use server'
import { revalidatePath } from 'next/cache'
import { apiGet, apiPost, apiPut, apiPatch, apiDelete, apiGetPage } from '@/lib/api/client'
import { PATIENTS_PAGE_SIZE } from '@/lib/constants'
import type { Page, PatientPatch, PatientDoc, PatientImage, PatientListItem } from '@/lib/types'

type Result = { ok: boolean; error?: string; id?: string }

interface PatientsQuery {
  page?: number
  /** Recherche « prénom nom matricule ». */
  q?: string
  /** Statut à filtrer ; `tous` (ou vide) = pas de filtre. */
  status?: string
}

/**
 * Charge une page du tableau des patients. La pagination, le filtre statut et
 * la recherche sont exécutés par l'API : seules les lignes affichées transitent.
 */
export async function fetchPatientsPage({
  page = 1,
  q = '',
  status = 'tous',
}: PatientsQuery = {}): Promise<Page<PatientListItem>> {
  const params = new URLSearchParams({
    page: String(Math.max(1, Math.trunc(page) || 1)),
    per_page: String(PATIENTS_PAGE_SIZE),
  })
  if (q.trim()) params.set('q', q.trim())
  if (status && status !== 'tous') params.set('status', status)

  return apiGetPage<PatientListItem>(`/patients?${params}`, PATIENTS_PAGE_SIZE)
}

/**
 * Annuaire complet des patients en projection légère — pour les vues qui ont
 * besoin de tous les dossiers d'un coup (sélecteur de document, rattachement
 * d'un blessé) sans les colonnes JSON.
 */
export async function fetchPatientsLight(): Promise<PatientListItem[]> {
  return (await apiGet<PatientListItem[]>('/patients?view=list')) ?? []
}

/** Ajoute (prepend) un document au dossier patient. */
export async function attachPatientDoc(patientId: string, entry: PatientDoc): Promise<Result> {
  const res = await apiPost(`/patients/${patientId}/docs`, entry)
  if (res.ok) revalidatePath(`/patients/${patientId}`)
  return res
}

/** Met à jour un document existant du dossier (par id) — pas de doublon. */
export async function updatePatientDoc(patientId: string, docId: string, patch: Partial<PatientDoc>): Promise<Result> {
  const res = await apiPatch(`/patients/${patientId}/docs/${docId}`, patch)
  if (res.ok) revalidatePath(`/patients/${patientId}`)
  return res
}

/**
 * Importe un fichier (image/PDF) dans le bucket Storage `media` et rattache
 * l'URL PUBLIQUE au dossier patient (plus de data URL inline).
 */
export async function importPatientDoc(
  patientId: string,
  fileName: string,
  mime: string,
  dataUrl: string
): Promise<Result> {
  const res = await apiPost(`/patients/${patientId}/docs/import`, { fileName, mime, dataUrl })
  if (res.ok) revalidatePath(`/patients/${patientId}`)
  return res
}

/** Ajoute (prepend) un cliché à l'imagerie du patient. */
export async function attachPatientImage(patientId: string, image: PatientImage): Promise<Result> {
  const res = await apiPost(`/patients/${patientId}/images`, image)
  if (res.ok) revalidatePath(`/patients/${patientId}`)
  return res
}

/** Crée un dossier patient. Tout membre authentifié peut créer. */
export async function createPatient(input: PatientPatch & { first_name: string; last_name: string }): Promise<Result> {
  const res = await apiPost('/patients', input)
  if (res.ok) revalidatePath('/patients')
  return res
}

/** Met à jour des champs d'un dossier patient. */
export async function updatePatient(id: string, patch: PatientPatch): Promise<Result> {
  const res = await apiPut(`/patients/${id}`, patch)
  if (res.ok) {
    revalidatePath(`/patients/${id}`)
    revalidatePath('/patients')
  }
  return res
}

/** Supprime un dossier patient — RÉSERVÉ À LA DIRECTION. */
export async function deletePatient(id: string, label: string): Promise<Result> {
  const res = await apiDelete(`/patients/${id}`, { label })
  if (res.ok) revalidatePath('/patients')
  return res
}

/** Déclare un patient décédé — RÉSERVÉ À LA DIRECTION. */
export async function declareDeath(id: string, label: string): Promise<Result> {
  const res = await apiPost(`/patients/${id}/death`, { label })
  if (res.ok) {
    revalidatePath(`/patients/${id}`)
    revalidatePath('/patients')
  }
  return res
}
