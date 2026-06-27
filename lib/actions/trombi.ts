'use server'
import { revalidatePath } from 'next/cache'
import { apiPost, apiDelete } from '@/lib/api/client'

type Result = { ok: boolean; error?: string }

/** Publie un message sur le mur du trombinoscope. */
export async function addPost(text: string, photo: string | null): Promise<Result> {
  const res = await apiPost('/trombi-posts', { text, photo })
  if (res.ok) revalidatePath('/trombinoscope')
  return res
}

/** Supprime un message (Direction). */
export async function deletePost(id: string): Promise<Result> {
  const res = await apiDelete(`/trombi-posts/${id}`)
  if (res.ok) revalidatePath('/trombinoscope')
  return res
}

/** Aime / retire un like (par nom du membre courant). */
export async function toggleLike(id: string): Promise<Result> {
  const res = await apiPost(`/trombi-posts/${id}/like`)
  if (res.ok) revalidatePath('/trombinoscope')
  return res
}
