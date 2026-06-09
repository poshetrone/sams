'use server'
import { revalidatePath } from 'next/cache'
import { createServiceClient } from '@/lib/supabase/server'
import { requireEdit } from '@/lib/auth'
import { parisDate, parisHM, parisWallToInstant } from '@/lib/format'

type Result = { ok: boolean; error?: string }

const MS_PER_MIN = 60000
const MS_PER_DAY = 86400000

/** Instant de début (ms epoch) d'une ligne, en priorité depuis `start_at` (UTC). */
function startInstantOf(row: { start_at: string | null; date: string | null; start: string | null }): number {
  if (row.start_at) return new Date(row.start_at).getTime()
  // Lignes anciennes (pré-migration) : date "DD/MM/YYYY" + heure "HH:MM" = heure de Paris.
  if (row.date && row.start) {
    const [d, mo, y] = row.date.split('/').map(Number)
    const [h, mi] = row.start.split(':').map(Number)
    if (y && mo && d) return parisWallToInstant(y, mo, d, h, mi).getTime()
  }
  return Date.now()
}

/** Prise de service du membre connecté. Stocke l'instant UTC + affichage Paris. */
export async function startShift(): Promise<Result> {
  let me
  try { me = await requireEdit('pointeuse') } catch (e) { return { ok: false, error: (e as Error).message } }
  const admin = createServiceClient()
  // Empêche un double pointage ouvert
  const { data: open } = await admin.from('timeclock').select('id').eq('member_id', me.id).is('end_at', null).is('end', null).maybeSingle()
  if (open) return { ok: false, error: 'Service déjà en cours' }
  const now = new Date()
  const { error } = await admin.from('timeclock').insert({
    member_id: me.id, name: me.name, grade: me.grade,
    start_at: now.toISOString(), end_at: null,
    date: parisDate(now), start: parisHM(now), end: null, minutes: 0,
  })
  if (error) return { ok: false, error: error.message }
  revalidatePath('/pointeuse')
  return { ok: true }
}

/** Fin de service (ferme le pointage ouvert du membre). Durée = écart d'instants UTC. */
export async function endShift(id: string): Promise<Result> {
  try { await requireEdit('pointeuse') } catch (e) { return { ok: false, error: (e as Error).message } }
  const admin = createServiceClient()
  const { data: row } = await admin.from('timeclock').select('start_at, date, start').eq('id', id).maybeSingle()
  if (!row) return { ok: false, error: 'Pointage introuvable' }
  const now = new Date()
  const minutes = Math.max(0, Math.round((now.getTime() - startInstantOf(row)) / MS_PER_MIN))
  const { error } = await admin.from('timeclock').update({
    end_at: now.toISOString(), end: parisHM(now), minutes,
  }).eq('id', id)
  if (error) return { ok: false, error: error.message }
  revalidatePath('/pointeuse')
  return { ok: true }
}

/**
 * Modifie les horaires d'une ligne (Direction). Les heures saisies sont
 * interprétées comme des heures de Paris sur le jour de la ligne, puis
 * reconverties en instants UTC.
 */
export async function updateTime(id: string, start: string, end: string | null): Promise<Result> {
  try { await requireEdit('pointeuse') } catch (e) { return { ok: false, error: (e as Error).message } }
  if (!start) return { ok: false, error: 'Heure de début requise' }
  const admin = createServiceClient()
  const { data: row } = await admin.from('timeclock').select('start_at, date').eq('id', id).maybeSingle()
  if (!row) return { ok: false, error: 'Pointage introuvable' }

  // Jour de référence (Paris) : depuis start_at si présent, sinon la date affichée, sinon aujourd'hui.
  const day = row.start_at ? parisDate(row.start_at) : (row.date || parisDate(new Date()))
  const [dd, mo, yy] = day.split('/').map(Number)
  const [sh, sm] = start.split(':').map(Number)
  const startInst = parisWallToInstant(yy, mo, dd, sh, sm)

  const patch: Record<string, unknown> = {
    start_at: startInst.toISOString(), start, date: parisDate(startInst),
  }
  if (end) {
    const [eh, em] = end.split(':').map(Number)
    let endInst = parisWallToInstant(yy, mo, dd, eh, em)
    if (endInst.getTime() < startInst.getTime()) endInst = new Date(endInst.getTime() + MS_PER_DAY) // service de nuit
    patch.end_at = endInst.toISOString()
    patch.end = end
    patch.minutes = Math.round((endInst.getTime() - startInst.getTime()) / MS_PER_MIN)
  } else {
    patch.end_at = null
    patch.end = null
    patch.minutes = 0
  }
  const { error } = await admin.from('timeclock').update(patch).eq('id', id)
  if (error) return { ok: false, error: error.message }
  revalidatePath('/pointeuse')
  return { ok: true }
}

/** Supprime une ligne de pointage (Direction). */
export async function deleteTime(id: string): Promise<Result> {
  try {
    await requireEdit('pointeuse')
  } catch (e) {
    return { ok: false, error: (e as Error).message }
  }
  const admin = createServiceClient()
  const { error } = await admin.from('timeclock').delete().eq('id', id)
  if (error) return { ok: false, error: error.message }
  revalidatePath('/pointeuse')
  return { ok: true }
}
