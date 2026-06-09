'use server'
import { revalidatePath } from 'next/cache'
import { createServiceClient } from '@/lib/supabase/server'
import { requireEdit, requireEditAny } from '@/lib/auth'
import { can } from '@/lib/constants'
import { logAudit } from '@/lib/actions/audit'
import type { PatientPatch, PatientDoc, PatientImage } from '@/lib/types'

type Result = { ok: boolean; error?: string; id?: string }

/** Ajoute (prepend) un document au dossier patient. */
export async function attachPatientDoc(patientId: string, entry: PatientDoc): Promise<Result> {
  let me
  try { me = await requireEditAny(['patients', 'documents']) } catch (e) { return { ok: false, error: (e as Error).message } }
  const admin = createServiceClient()
  const { data: p } = await admin.from('patients').select('docs').eq('id', patientId).maybeSingle()
  if (!p) return { ok: false, error: 'Patient introuvable — rechargez la page (F5) et resélectionnez le patient.' }
  const docs = [entry, ...((p.docs as PatientDoc[]) || [])]
  const { error } = await admin.from('patients').update({ docs }).eq('id', patientId)
  if (error) return { ok: false, error: error.message }
  await logAudit(me, 'a rattaché un document au dossier', '')
  revalidatePath(`/patients/${patientId}`)
  return { ok: true }
}

/** Met à jour un document existant du dossier (par id) — pas de doublon. */
export async function updatePatientDoc(patientId: string, docId: string, patch: Partial<PatientDoc>): Promise<Result> {
  let me
  try { me = await requireEditAny(['patients', 'documents']) } catch (e) { return { ok: false, error: (e as Error).message } }
  const admin = createServiceClient()
  const { data: p } = await admin.from('patients').select('docs').eq('id', patientId).maybeSingle()
  if (!p) return { ok: false, error: 'Patient introuvable' }
  let found = false
  const docs = ((p.docs as PatientDoc[]) || []).map((d) => {
    if (d.id !== docId) return d
    found = true
    return { ...d, ...patch }
  })
  if (!found) return { ok: false, error: 'Document introuvable' }
  const { error } = await admin.from('patients').update({ docs }).eq('id', patientId)
  if (error) return { ok: false, error: error.message }
  await logAudit(me, 'a mis à jour un document du dossier', '')
  revalidatePath(`/patients/${patientId}`)
  return { ok: true }
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
  let me
  try { me = await requireEditAny(['patients', 'documents']) } catch (e) { return { ok: false, error: (e as Error).message } }

  const match = dataUrl.match(/^data:(.+?);base64,(.*)$/)
  if (!match) return { ok: false, error: 'Fichier invalide' }
  const contentType = mime || match[1] || 'application/octet-stream'
  const buffer = Buffer.from(match[2], 'base64')

  const admin = createServiceClient()
  // S'assure que le bucket existe (idempotent ; ignore l'erreur « déjà créé »)
  await admin.storage.createBucket('media', { public: true })

  const safe = fileName.replace(/[^a-zA-Z0-9._-]/g, '_').slice(-80)
  const path = `patient-docs/${patientId}/${Date.now()}-${safe}`
  const { error: upErr } = await admin.storage.from('media').upload(path, buffer, { contentType, upsert: true })
  if (upErr) return { ok: false, error: upErr.message }
  const { data: pub } = admin.storage.from('media').getPublicUrl(path)

  const { data: p } = await admin.from('patients').select('docs, first_name, last_name').eq('id', patientId).maybeSingle()
  if (!p) return { ok: false, error: 'Patient introuvable' }

  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  const today = `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`
  const entry: PatientDoc = {
    id: 'd' + Date.now(), type: 'import', title: fileName.replace(/\.[^.]+$/, ''),
    date: today, author: me.name, state: 'importé', file: pub.publicUrl, fileName, mime: contentType,
  }
  const docs = [entry, ...((p.docs as PatientDoc[]) || [])]
  const { error } = await admin.from('patients').update({ docs }).eq('id', patientId)
  if (error) return { ok: false, error: error.message }

  await logAudit(me, 'a importé un document —', `${p.first_name} ${p.last_name}`)
  revalidatePath(`/patients/${patientId}`)
  return { ok: true }
}

/** Ajoute (prepend) un cliché à l'imagerie du patient. */
export async function attachPatientImage(patientId: string, image: PatientImage): Promise<Result> {
  let me
  try { me = await requireEditAny(['patients', 'documents']) } catch (e) { return { ok: false, error: (e as Error).message } }
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
  let me
  try { me = await requireEdit('patients') } catch (e) { return { ok: false, error: (e as Error).message } }
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
  try { await requireEdit('patients') } catch (e) { return { ok: false, error: (e as Error).message } }

  const admin = createServiceClient()
  const { error } = await admin.from('patients').update(patch).eq('id', id)
  if (error) return { ok: false, error: error.message }

  revalidatePath(`/patients/${id}`)
  revalidatePath('/patients')
  return { ok: true }
}

/** Supprime un dossier patient — RÉSERVÉ À LA DIRECTION. */
export async function deletePatient(id: string, label: string): Promise<Result> {
  try {
    const me = await requireEdit('patients')
    // Garde-fou : « Edit » sur Patients ne suffit pas, il faut être Direction.
    if (!can('deletePatient', me.grade)) return { ok: false, error: 'Suppression de dossier réservée à la Direction' }
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

/** Déclare un patient décédé — RÉSERVÉ À LA DIRECTION. */
export async function declareDeath(id: string, label: string): Promise<Result> {
  try {
    const me = await requireEdit('patients')
    // Garde-fou : « Edit » sur Patients ne suffit pas, il faut être Direction.
    if (!can('declareDeath', me.grade)) return { ok: false, error: 'Déclaration de décès réservée à la Direction' }
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
