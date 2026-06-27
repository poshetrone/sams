'use server'
import { revalidatePath } from 'next/cache'
import { apiPut } from '@/lib/api/client'

type Result = { ok: boolean; error?: string }

/**
 * Change la taille de grille en conservant les attributions dans la plage.
 * Agrandir : tous les noms conservés. Réduire : seuls les tickets dont le
 * numéro dépasse la nouvelle taille sont retirés.
 */
export async function setTombolaSize(size: number): Promise<Result> {
  const res = await apiPut('/tombola/size', { size })
  if (res.ok) revalidatePath('/tombola')
  return res
}

/** Attribue un ticket à un nom. */
export async function assignTicket(num: number, name: string): Promise<Result> {
  const res = await apiPut('/tombola/assign', { num, name })
  if (res.ok) revalidatePath('/tombola')
  return res
}

/** Libère un ticket. */
export async function freeTicket(num: number): Promise<Result> {
  const res = await apiPut('/tombola/free', { num })
  if (res.ok) revalidatePath('/tombola')
  return res
}

/** Enregistre le gagnant du tirage. */
export async function setWinner(num: number, who: string): Promise<Result> {
  const res = await apiPut('/tombola/winner', { num, who })
  if (res.ok) revalidatePath('/tombola')
  return res
}

/** Vide la grille (tickets + gagnant). */
export async function clearTombola(): Promise<Result> {
  const res = await apiPut('/tombola/clear')
  if (res.ok) revalidatePath('/tombola')
  return res
}
