'use server'
import { revalidatePath } from 'next/cache'
import { apiPut } from '@/lib/api/client'
import type { HelpBlock } from '@/lib/types'

type Result = { ok: boolean; error?: string }

/** Enregistre l'intégralité du contenu de la page d'aide (Direction). */
export async function saveHelp(blocks: HelpBlock[]): Promise<Result> {
  const res = await apiPut('/help', { blocks })
  if (res.ok) revalidatePath('/aide')
  return res
}
