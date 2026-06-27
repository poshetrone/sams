import 'server-only'
import { cache } from 'react'
import { apiGet } from './client'
import type { Member } from '@/lib/types'
import type { PermMap } from '@/lib/permissions'

export interface MeResponse {
  member: Member | null
  perms: PermMap
  reqCount: number
  account: { discordId: string; username: string | null } | null
}

/**
 * Profil de session courant (membre + permissions + compteur de demandes).
 * `cache()` déduplique l'appel `/me` au sein d'un même rendu serveur.
 * Renvoie `null` si non authentifié (token absent/invalide → 401).
 */
export const getMe = cache(async (): Promise<MeResponse | null> => {
  return apiGet<MeResponse>('/me')
})
