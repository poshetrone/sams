'use server'
import { revalidatePath } from 'next/cache'
import { apiPost, apiDelete } from '@/lib/api/client'

type Result = { ok: boolean; error?: string }

/** Valide une demande d'accès : crée le membre (grade aspirant = ambulancier) et retire la demande. */
export async function approveAccess(accessId: string): Promise<Result> {
  const res = await apiPost(`/accesses/${accessId}/approve`)
  if (res.ok) {
    revalidatePath('/acces')
    revalidatePath('/effectifs')
  }
  return res
}

/**
 * Pré-ajoute / rattache un accès Discord à un employé existant :
 * met à jour le discord_id + le grade du membre, et crée/relie l'entrée
 * approuvée dans la table accesses.
 */
export async function linkAccess(memberId: string, discordId: string, grade: string): Promise<Result> {
  const res = await apiPost('/accesses/link', { member_id: memberId, discord_id: discordId, grade })
  if (res.ok) {
    revalidatePath('/acces')
    revalidatePath('/effectifs')
  }
  return res
}

/** Refuse (supprime) une demande d'accès. */
export async function refuseAccess(accessId: string, label: string): Promise<Result> {
  const res = await apiDelete(`/accesses/${accessId}`, { label })
  if (res.ok) revalidatePath('/acces')
  return res
}
