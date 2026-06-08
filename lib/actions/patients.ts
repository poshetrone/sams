'use server'
import { revalidatePath } from 'next/cache'
import { createServiceClient } from '@/lib/supabase/server'
import { getCurrentMember, requirePerm } from '@/lib/auth'
import { logAudit } from '@/lib/actions/audit'
import type { PatientPatch, PatientDoc, PatientImage } from '@/lib/types'

type Result = { ok: boolean; error?: string; id?: string }

/** Ajoute (prepend) un document au dossier patient. */
export async function attachPatientDoc(patientId: string, entry: PatientDoc): Promise<Result> {
  const me = await getCurrentMember()
  if (!me) return { ok: false, error: 'Non authentifié' }
  const admin = createServiceClient()
  const { data: p } = await admin.from('patients').select('docs').eq('id', patientId).maybeSingle()
  if (!p) return { ok: false, error: 'Patient introuvable' }
  const docs = [entry, ...((p.docs as PatientDoc[]) || [])]
  const { error } = await admin.from('patients').update({ docs }).eq('id', patientId)
  if (error) return { ok: false, error: error.message }
  await logAudit(me, 'a rattaché un document au dossier', '')
  revalidatePath(`/patients/${patientId}`)
  return { ok: true }
}

/** Ajoute (prepend) un cliché à l'imagerie du patient. */
export async function attachPatientImage(patientId: string, image: PatientImage): Promise<Result> {
  const me = await getCurrentMember()
  if (!me) return { ok: false, error: 'Non authentifié' }
  const admin = createServiceClient()
  const { data: p } = await admin.from('patients').select('images').eq('id', patientId).maybeSingle()
  if (!p) return { ok: false, error: 'Patient introuvable' }
  const images = [image, ...((p.images as PatientImage[]) || [])]
  const { error } = await admin.from('patients').update({ images }).eq('id', patientId)
  if (error) return { ok: false, error: error.message }
  await logAudit(me, "a ajouté un rapport d'imagerie", '')
  revalidatePath(`/patients/${patientId}`)
  return { ok: true }
}

/** Crée un dossier patient. Tout membre authentifié peut créer. */
export async function createPatient(input: PatientPatch & { first_name: string; last_name: string }): Promise<Result> {
  const me = await getCurrentMember()
  if (!me) return { ok: false, error: 'Non authentifié' }
  if (!input.first_name?.trim() || !input.last_name?.trim()) return { ok: false, error: 'Prénom et nom requis' }

  const admin = createServiceClient()
  const { data, error } = await admin.from('patients').insert(input).select('id').single()
  if (error) return { ok: false, error: error.message }

  await logAudit(me, 'a créé un dossier patient —', `${input.first_name} ${input.last_name}`)
  revalidatePath('/patients')
  return { ok: true, id: data.id }
}

/** Met à jour des champs d'un dossier patient. */
export async function updatePatient(id: string, patch: PatientPatch): Promise<Result> {
  const me = await getCurrentMember()
  if (!me) return { ok: false, error: 'Non authentifié' }

  const admin = createServiceClient()
  const { error } = await admin.from('patients').update(patch).eq('id', id)
  if (error) return { ok: false, error: error.message }

  revalidatePath(`/patients/${id}`)
  revalidatePath('/patients')
  return { ok: true }
}

/** Supprime un dossier patient (Direction / Responsable). */
export async function deletePatient(id: string, label: string): Promise<Result> {
  try {
    const me = await requirePerm('deletePatient')
    const admin = createServiceClient()
    const { error } = await admin.from('patients').delete().eq('id', id)
    if (error) return { ok: false, error: error.message }
    await logAudit(me, 'a supprimé un dossier patient —', label)
    revalidatePath('/patients')
    return { ok: true }
  } catch (e) {
    return { ok: false, error: (e as Error).message }
  }
}

/** Déclare un patient décédé (Médecin Senior et +). */
export async function declareDeath(id: string, label: string): Promise<Result> {
  try {
    const me = await requirePerm('declareDeath')
    const admin = createServiceClient()
    const { error } = await admin.from('patients').update({ status: 'deces', care: 'sorti' }).eq('id', id)
    if (error) return { ok: false, error: error.message }
    await logAudit(me, 'a déclaré le décès de', label)
    revalidatePath(`/patients/${id}`)
    revalidatePath('/patients')
    return { ok: true }
  } catch (e) {
    return { ok: false, error: (e as Error).message }
  }
}
