'use server'
import { revalidatePath } from 'next/cache'
import { apiPost, apiDelete } from '@/lib/api/client'
import type { MutuelleTier } from '@/lib/types'

export interface MutuelleInput {
  key?: string
  label: string
  desc?: string | null
  perks: string[]
  tiers: MutuelleTier[]
  premium: boolean
}

type Result = { ok: boolean; error?: string }

export async function saveMutuelle(input: MutuelleInput): Promise<Result> {
  const res = await apiPost('/mutuelles', input)
  if (res.ok) revalidatePath('/contrats')
  return res
}

export async function deleteMutuelle(key: string): Promise<Result> {
  const res = await apiDelete(`/mutuelles/${key}`)
  if (res.ok) revalidatePath('/contrats')
  return res
}
