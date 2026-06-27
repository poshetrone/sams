'use server'
import { revalidatePath } from 'next/cache'
import { apiPost, apiDelete } from '@/lib/api/client'

/** Ajoute un évènement au calendrier partagé (jour = YYYY-MM-DD). */
export async function addCalendarEvent(day: string, text: string, color: 'gold' | 'blue' = 'gold'): Promise<{ ok: boolean; error?: string }> {
  const res = await apiPost('/calendar-events', { day, text, color })
  if (res.ok) revalidatePath('/calendrier')
  return res
}

/** Supprime un évènement du calendrier. */
export async function deleteCalendarEvent(id: string): Promise<{ ok: boolean; error?: string }> {
  const res = await apiDelete(`/calendar-events/${id}`)
  if (res.ok) revalidatePath('/calendrier')
  return res
}
