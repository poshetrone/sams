'use server'
import { revalidatePath } from 'next/cache'
import { createServiceClient } from '@/lib/supabase/server'
import { getCurrentMember } from '@/lib/auth'

type Result = { ok: boolean; error?: string }

async function readTombola() {
  const admin = createServiceClient()
  const { data } = await admin.from('tombola').select('*').eq('id', 1).maybeSingle()
  return { admin, row: data }
}

/**
 * Change la taille de grille en conservant les attributions dans la plage.
 * Agrandir : tous les noms conservés. Réduire : seuls les tickets dont le
 * numéro dépasse la nouvelle taille sont retirés.
 */
export async function setTombolaSize(size: number): Promise<Result> {
  const me = await getCurrentMember()
  if (!me) return { ok: false, error: 'Non authentifié' }
  const { admin, row } = await readTombola()
  const prev: Record<string, string> = row?.tickets || {}
  const tickets: Record<string, string> = {}
  for (const [num, who] of Object.entries(prev)) {
    if (Number(num) <= size) tickets[num] = who
  }
  const winner = row?.winner && Number(row.winner.num) <= size ? row.winner : null
  const { error } = await admin.from('tombola').update({ size, tickets, winner }).eq('id', 1)
  if (error) return { ok: false, error: error.message }
  revalidatePath('/tombola')
  return { ok: true }
}

/** Attribue un ticket à un nom. */
export async function assignTicket(num: number, name: string): Promise<Result> {
  const me = await getCurrentMember()
  if (!me) return { ok: false, error: 'Non authentifié' }
  if (!name.trim()) return { ok: false, error: 'Nom requis' }
  const { admin, row } = await readTombola()
  const tickets = { ...(row?.tickets || {}), [num]: name.trim() }
  const { error } = await admin.from('tombola').update({ tickets }).eq('id', 1)
  if (error) return { ok: false, error: error.message }
  revalidatePath('/tombola')
  return { ok: true }
}

/** Libère un ticket. */
export async function freeTicket(num: number): Promise<Result> {
  const me = await getCurrentMember()
  if (!me) return { ok: false, error: 'Non authentifié' }
  const { admin, row } = await readTombola()
  const tickets = { ...(row?.tickets || {}) }
  delete tickets[num]
  const winner = row?.winner && row.winner.num === num ? null : row?.winner
  const { error } = await admin.from('tombola').update({ tickets, winner }).eq('id', 1)
  if (error) return { ok: false, error: error.message }
  revalidatePath('/tombola')
  return { ok: true }
}

/** Enregistre le gagnant du tirage. */
export async function setWinner(num: number, who: string): Promise<Result> {
  const me = await getCurrentMember()
  if (!me) return { ok: false, error: 'Non authentifié' }
  const admin = createServiceClient()
  const { error } = await admin.from('tombola').update({ winner: { num, who } }).eq('id', 1)
  if (error) return { ok: false, error: error.message }
  revalidatePath('/tombola')
  return { ok: true }
}

/** Vide la grille (tickets + gagnant). */
export async function clearTombola(): Promise<Result> {
  const me = await getCurrentMember()
  if (!me) return { ok: false, error: 'Non authentifié' }
  const admin = createServiceClient()
  const { error } = await admin.from('tombola').update({ tickets: {}, winner: null }).eq('id', 1)
  if (error) return { ok: false, error: error.message }
  revalidatePath('/tombola')
  return { ok: true }
}
