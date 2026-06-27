'use server'
import { revalidatePath } from 'next/cache'
import { apiPost, apiPatch, apiDelete } from '@/lib/api/client'
import type { Wounded, Fusillade } from '@/lib/types'

type Result = { ok: boolean; error?: string; id?: string }

export interface FusilladeInput {
  title: string
  zone: string
  x: number | null
  y: number | null
  severity: string
}

export async function createFusillade(input: FusilladeInput): Promise<Result> {
  const res = await apiPost('/fusillades', input)
  if (res.ok) revalidatePath('/fusillades')
  return res
}

/** Met à jour le statut et/ou les blessés d'une fusillade. */
export async function updateFusillade(id: string, patch: Partial<Pick<Fusillade, 'status' | 'wounded'>>): Promise<Result> {
  const res = await apiPatch(`/fusillades/${id}`, patch)
  if (res.ok) revalidatePath('/fusillades')
  return res
}

/** Supprime une fusillade (et ses blessés, stockés dans la même ligne). Direction uniquement. */
export async function deleteFusillade(id: string): Promise<Result> {
  const res = await apiDelete(`/fusillades/${id}`)
  if (res.ok) revalidatePath('/fusillades')
  return res
}

/** Crée un dossier patient depuis un blessé et le lie à la fusillade. */
export async function createPatientFromWounded(fusId: string, w: Wounded): Promise<Result> {
  const res = await apiPost(`/fusillades/${fusId}/patient-from-wounded`, w)
  if (res.ok) {
    revalidatePath('/fusillades')
    revalidatePath('/patients')
  }
  return res
}
