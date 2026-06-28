'use server'
import { revalidatePath } from 'next/cache'
import { apiPost, apiPut, apiDelete } from '@/lib/api/client'

type Result = { ok: boolean; error?: string }

/** Prise de service du membre connecté. */
export async function startShift(): Promise<Result> {
  const res = await apiPost('/timeclock/start')
  if (res.ok) revalidatePath('/pointeuse')
  return res
}

/** Fin de service (ferme le pointage ouvert du membre). */
export async function endShift(id: string): Promise<Result> {
  const res = await apiPost(`/timeclock/${id}/end`)
  if (res.ok) revalidatePath('/pointeuse')
  return res
}

/** Modifie les horaires et la date d'une ligne (Direction). `date` au format "DD/MM/YYYY". */
export async function updateTime(id: string, start: string, end: string | null, date?: string): Promise<Result> {
  const res = await apiPut(`/timeclock/${id}`, { start, end, date })
  if (res.ok) revalidatePath('/pointeuse')
  return res
}

/** Supprime une ligne de pointage (Direction). */
export async function deleteTime(id: string): Promise<Result> {
  const res = await apiDelete(`/timeclock/${id}`)
  if (res.ok) revalidatePath('/pointeuse')
  return res
}
