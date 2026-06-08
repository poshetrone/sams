'use server'
import { revalidatePath } from 'next/cache'
import { createServiceClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth'

export interface TarifInput {
  id?: string
  label: string
  sub?: string | null
  price: number
  icon: string
}

type Result = { ok: boolean; error?: string }

export async function saveTarif(input: TarifInput): Promise<Result> {
  try {
    await requireAdmin()
  } catch (e) {
    return { ok: false, error: (e as Error).message }
  }
  if (!input.label.trim()) return { ok: false, error: 'Nom requis' }
  const admin = createServiceClient()
  const row = { label: input.label.trim(), sub: input.sub?.trim() || null, price: input.price || 0, icon: input.icon || 'cash' }
  if (input.id) {
    const { error } = await admin.from('tarifs').update(row).eq('id', input.id)
    if (error) return { ok: false, error: error.message }
  } else {
    const { count } = await admin.from('tarifs').select('id', { count: 'exact', head: true })
    const { error } = await admin.from('tarifs').insert({ ...row, ord: count ?? 0 })
    if (error) return { ok: false, error: error.message }
  }
  revalidatePath('/tarification')
  return { ok: true }
}

export async function deleteTarif(id: string): Promise<Result> {
  try {
    await requireAdmin()
  } catch (e) {
    return { ok: false, error: (e as Error).message }
  }
  const admin = createServiceClient()
  const { error } = await admin.from('tarifs').delete().eq('id', id)
  if (error) return { ok: false, error: error.message }
  revalidatePath('/tarification')
  return { ok: true }
}
