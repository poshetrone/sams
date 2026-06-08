'use server'
import { revalidatePath } from 'next/cache'
import { createServiceClient } from '@/lib/supabase/server'
import { getCurrentMember, requireAdmin } from '@/lib/auth'

type Result = { ok: boolean; error?: string }

const pad2 = (n: number) => String(n).padStart(2, '0')
const nowHM = () => {
  const d = new Date()
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`
}
const todayDate = () => {
  const d = new Date()
  return `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}/${d.getFullYear()}`
}
function diffMin(start: string, end: string): number {
  const [sh, sm] = start.split(':').map(Number)
  const [eh, em] = end.split(':').map(Number)
  let d = eh * 60 + em - (sh * 60 + sm)
  if (d < 0) d += 1440
  return d
}

/** Prise de service du membre connecté. */
export async function startShift(): Promise<Result> {
  const me = await getCurrentMember()
  if (!me) return { ok: false, error: 'Non authentifié' }
  const admin = createServiceClient()
  // Empêche un double pointage ouvert
  const { data: open } = await admin.from('timeclock').select('id').eq('member_id', me.id).is('end', null).maybeSingle()
  if (open) return { ok: false, error: 'Service déjà en cours' }
  const { error } = await admin.from('timeclock').insert({
    member_id: me.id, name: me.name, grade: me.grade, date: todayDate(), start: nowHM(), end: null, minutes: 0,
  })
  if (error) return { ok: false, error: error.message }
  revalidatePath('/pointeuse')
  return { ok: true }
}

/** Fin de service (ferme le pointage ouvert du membre). */
export async function endShift(id: string): Promise<Result> {
  const me = await getCurrentMember()
  if (!me) return { ok: false, error: 'Non authentifié' }
  const admin = createServiceClient()
  const { data: row } = await admin.from('timeclock').select('start').eq('id', id).maybeSingle()
  if (!row) return { ok: false, error: 'Pointage introuvable' }
  const end = nowHM()
  const { error } = await admin.from('timeclock').update({ end, minutes: diffMin(row.start, end) }).eq('id', id)
  if (error) return { ok: false, error: error.message }
  revalidatePath('/pointeuse')
  return { ok: true }
}

/** Modifie les horaires d'une ligne (Direction). */
export async function updateTime(id: string, start: string, end: string | null): Promise<Result> {
  try {
    await requireAdmin()
  } catch (e) {
    return { ok: false, error: (e as Error).message }
  }
  const admin = createServiceClient()
  const { error } = await admin.from('timeclock').update({ start, end: end || null, minutes: end ? diffMin(start, end) : 0 }).eq('id', id)
  if (error) return { ok: false, error: error.message }
  revalidatePath('/pointeuse')
  return { ok: true }
}

/** Supprime une ligne de pointage (Direction). */
export async function deleteTime(id: string): Promise<Result> {
  try {
    await requireAdmin()
  } catch (e) {
    return { ok: false, error: (e as Error).message }
  }
  const admin = createServiceClient()
  const { error } = await admin.from('timeclock').delete().eq('id', id)
  if (error) return { ok: false, error: error.message }
  revalidatePath('/pointeuse')
  return { ok: true }
}
