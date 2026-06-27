'use server'
import { revalidatePath } from 'next/cache'
import { apiPost, apiDelete } from '@/lib/api/client'

export interface FormationInput {
  key?: string
  label: string
  short: string
  icon?: string
}

type Result = { ok: boolean; error?: string }

export async function saveFormation(input: FormationInput, _existingKeys: string[]): Promise<Result> {
  const res = await apiPost('/formations', input)
  if (res.ok) revalidatePath('/formations')
  return res
}

export async function deleteFormation(key: string): Promise<Result> {
  const res = await apiDelete(`/formations/${key}`)
  if (res.ok) revalidatePath('/formations')
  return res
}
