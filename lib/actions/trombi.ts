'use server'
import { revalidatePath } from 'next/cache'
import { createServiceClient } from '@/lib/supabase/server'
import { getCurrentMember, requireAdmin } from '@/lib/auth'

type Result = { ok: boolean; error?: string }

const stamp = () => {
  const d = new Date()
  const p = (n: number) => String(n).padStart(2, '0')
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`
}

/** Publie un message sur le mur du trombinoscope. */
export async function addPost(text: string, photo: string | null): Promise<Result> {
  const me = await getCurrentMember()
  if (!me) return { ok: false, error: 'Non authentifié' }
  if (!text.trim() && !photo) return { ok: false, error: 'Message vide' }
  const admin = createServiceClient()
  const { error } = await admin.from('trombi_posts').insert({
    author: me.name, grade: me.grade, photo: photo || me.photo || null, text: text.trim(), likers: [], time: stamp(),
  })
  if (error) return { ok: false, error: error.message }
  revalidatePath('/trombinoscope')
  return { ok: true }
}

/** Supprime un message (Direction). */
export async function deletePost(id: string): Promise<Result> {
  try {
    await requireAdmin()
  } catch (e) {
    return { ok: false, error: (e as Error).message }
  }
  const admin = createServiceClient()
  const { error } = await admin.from('trombi_posts').delete().eq('id', id)
  if (error) return { ok: false, error: error.message }
  revalidatePath('/trombinoscope')
  return { ok: true }
}

/** Aime / retire un like (par nom du membre courant). */
export async function toggleLike(id: string): Promise<Result> {
  const me = await getCurrentMember()
  if (!me) return { ok: false, error: 'Non authentifié' }
  const admin = createServiceClient()
  const { data: post } = await admin.from('trombi_posts').select('likers').eq('id', id).maybeSingle()
  if (!post) return { ok: false, error: 'Message introuvable' }
  const likers: string[] = post.likers || []
  const next = likers.includes(me.name) ? likers.filter((n) => n !== me.name) : [...likers, me.name]
  const { error } = await admin.from('trombi_posts').update({ likers: next }).eq('id', id)
  if (error) return { ok: false, error: error.message }
  revalidatePath('/trombinoscope')
  return { ok: true }
}
