'use server'
import { revalidatePath } from 'next/cache'
import { apiPost } from '@/lib/api/client'

/** Met à jour la photo de profil du membre connecté (upload Storage `media`). */
export async function updateMyPhoto(dataUrl: string): Promise<{ ok: boolean; url?: string; error?: string }> {
  const res = await apiPost('/me/photo', { dataUrl })
  if (res.ok) revalidatePath('/', 'layout')
  return res
}
