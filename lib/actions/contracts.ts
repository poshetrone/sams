'use server'
import { revalidatePath } from 'next/cache'
import { createServiceClient } from '@/lib/supabase/server'
import { requireEdit } from '@/lib/auth'

export interface ContractInput {
  id?: string
  company: string
  logo?: string | null
  type: string
  tier: string
  employees?: number | string | null
  status: string
  start?: string | null
  end?: string | null
  details?: string | null
}

type Result = { ok: boolean; error?: string }

export async function saveContract(input: ContractInput): Promise<Result> {
  try {
    await requireEdit('contrats')
  } catch (e) {
    return { ok: false, error: (e as Error).message }
  }
  if (!input.company.trim()) return { ok: false, error: "Nom d'entreprise requis" }

  const admin = createServiceClient()
  const row = {
    company: input.company.trim(),
    logo: input.logo || null,
    type: input.type || 'standard',
    tier: input.tier || 't1',
    employees: input.employees === '' || input.employees == null ? null : Number(input.employees),
    status: input.status || 'actif',
    start: input.start || null,
    end: input.end || null,
    details: input.details || null,
  }
  if (input.id) {
    const { error } = await admin.from('contracts').update(row).eq('id', input.id)
    if (error) return { ok: false, error: error.message }
  } else {
    const { error } = await admin.from('contracts').insert(row)
    if (error) return { ok: false, error: error.message }
  }
  revalidatePath('/contrats')
  return { ok: true }
}

export async function deleteContract(id: string): Promise<Result> {
  try {
    await requireEdit('contrats')
  } catch (e) {
    return { ok: false, error: (e as Error).message }
  }
  const admin = createServiceClient()
  const { error } = await admin.from('contracts').delete().eq('id', id)
  if (error) return { ok: false, error: error.message }
  revalidatePath('/contrats')
  return { ok: true }
}
