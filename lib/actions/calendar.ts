'use server'
import { revalidatePath } from 'next/cache'
import { createServiceClient } from '@/lib/supabase/server'
import { getCurrentMember } from '@/lib/auth'

/** Ajoute un évènement au calendrier partagé (jour = YYYY-MM-DD). */
export async function addCalendarEvent(day: string, text: string, color: 'gold' | 'blue' = 'gold'): Promise<{ ok: boolean; error?: string }> {
  if (!day || !text?.trim()) return { ok: false, error: 'Jour et texte requis' }
  const me = await getCurrentMember()
  const admin = createServiceClient()
  const { error } = await admin.from('calendar_events').insert({ day, text: text.trim(), author: me?.name ?? null, color })
  if (error) return { ok: false, error: error.message }
  revalidatePath('/calendrier')
  return { ok: true }
}

/** Supprime un évènement du calendrier. */
export async function deleteCalendarEvent(id: string): Promise<{ ok: boolean; error?: string }> {
  const me = await getCurrentMember()
  if (!me) return { ok: false, error: 'Non authentifié' }
  const admin = createServiceClient()
  const { error } = await admin.from('calendar_events').delete().eq('id', id)
  if (error) return { ok: false, error: error.message }
  revalidatePath('/calendrier')
  return { ok: true }
}
