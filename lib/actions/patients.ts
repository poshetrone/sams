'use server'
import { revalidatePath } from 'next/cache'
import { apiPost, apiPut, apiPatch, apiDelete } from '@/lib/api/client'
import type { PatientPatch, PatientDoc, PatientImage } from '@/lib/types'

type Result = { ok: boolean; error?: string; id?: string }

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
