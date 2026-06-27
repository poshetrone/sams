import 'server-only'
import { getMe } from '@/lib/api/session'
import { getAccess, type AccessLevel, type PermMap } from '@/lib/permissions'
import { isAdminGrade } from '@/lib/constants'
import type { Member } from '@/lib/types'

/**
 * Helpers d'authentification serveur — désormais adossés à l'API (api-sams)
 * via l'endpoint `/me`, en remplacement de Supabase. Les contrôles d'écriture
 * (requireEdit…) sont appliqués CÔTÉ API ; ces helpers ne servent qu'au
 * rendu/gating des Server Components.
 */

/** Membre SAMS correspondant à l'utilisateur connecté (ou null). */
export async function getCurrentMember(): Promise<Member | null> {
  const me = await getMe()
  return me?.member ?? null
}

/** Matrice des permissions effective (depuis l'API). */
export async function getPermMap(): Promise<PermMap> {
  const me = await getMe()
  return me?.perms ?? {}
}

/** Niveau d'accès effectif du membre connecté sur une catégorie. */
export async function getServerAccess(category: string): Promise<AccessLevel> {
  const me = await getMe()
  if (!me?.member) return 'none'
  return getAccess(me.perms, me.member.grade, category)
}

export { isAdminGrade }
