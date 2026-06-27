'use server'
import { revalidatePath } from 'next/cache'
import { apiPost, apiDelete } from '@/lib/api/client'

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
  const res = await apiPost('/contracts', input)
  if (res.ok) revalidatePath('/contrats')
  return res
}

export async function deleteContract(id: string): Promise<Result> {
  const res = await apiDelete(`/contracts/${id}`)
  if (res.ok) revalidatePath('/contrats')
  return res
}
