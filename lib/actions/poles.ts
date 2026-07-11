'use server'
import { revalidatePath } from 'next/cache'
import { apiPost, apiDelete } from '@/lib/api/client'

export interface PoleInput {
  key?: string
  label: string
  color: string
  icon: string
  lead: string | null
}

type Result = { ok: boolean; error?: string }

export async function savePole(input: PoleInput): Promise<Result> {
  const res = await apiPost('/poles', input)
  if (res.ok) revalidatePath('/effectifs')
  return res
}

export async function deletePole(key: string): Promise<Result> {
  const res = await apiDelete(`/poles/${key}`)
  if (res.ok) revalidatePath('/effectifs')
  return res
}
