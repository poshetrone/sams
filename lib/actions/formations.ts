'use server'
import { revalidatePath } from 'next/cache'
import { createServiceClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth'

export interface FormationInput {
  key?: string
  label: string
  short: string
  icon?: string
}

type Result = { ok: boolean; error?: string }

const slugify = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '').slice(0, 20)

export async function saveFormation(input: FormationInput, existingKeys: string[]): Promise<Result> {
  try {
    await requireAdmin()
  } catch (e) {
    return { ok: false, error: (e as Error).message }
  }
  if (!input.label.trim()) return { ok: false, error: 'Nom requis' }
  const admin = createServiceClient()

  if (input.key) {
    const { error } = await admin
      .from('formations')
      .update({ label: input.label.trim(), short: (input.short.trim() || input.label.replace(/Formation/i, '').trim()).slice(0, 14) })
      .eq('key', input.key)
    if (error) return { ok: false, error: error.message }
  } else {
    let k = slugify(input.label.replace(/formation/i, '')) || 'f' + Date.now()
    const base = k
    let i = 2
    while (existingKeys.includes(k)) k = base + i++
    const { count } = await admin.from('formations').select('key', { count: 'exact', head: true })
    const { error } = await admin.from('formations').insert({
      key: k, label: input.label.trim(), short: (input.short.trim() || input.label.replace(/Formation/i, '').trim()).slice(0, 14), icon: 'medal', ord: count ?? 0,
    })
    if (error) return { ok: false, error: error.message }
  }
  revalidatePath('/formations')
  return { ok: true }
}

export async function deleteFormation(key: string): Promise<Result> {
  try {
    await requireAdmin()
  } catch (e) {
    return { ok: false, error: (e as Error).message }
  }
  const admin = createServiceClient()
  const { error } = await admin.from('formations').delete().eq('key', key)
  if (error) return { ok: false, error: error.message }
  // Retire la formation de tous les membres qui la possèdent
  const { data: members } = await admin.from('members').select('id, formations').contains('formations', [key])
  if (members) {
    for (const m of members) {
      await admin.from('members').update({ formations: (m.formations || []).filter((x: string) => x !== key) }).eq('id', m.id)
    }
  }
  revalidatePath('/formations')
  return { ok: true }
}
