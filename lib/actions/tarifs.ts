'use server'
import { revalidatePath } from 'next/cache'
import { apiPost, apiDelete } from '@/lib/api/client'

export interface TarifInput {
  id?: string
  label: string
  sub?: string | null
  price: number
  icon: string
}

type Result = { ok: boolean; error?: string }

export async function saveTarif(input: TarifInput): Promise<Result> {
  const res = await apiPost('/tarifs', input)
  if (res.ok) revalidatePath('/tarification')
  return res
}

export async function deleteTarif(id: string): Promise<Result> {
  const res = await apiDelete(`/tarifs/${id}`)
  if (res.ok) revalidatePath('/tarification')
  return res
}
