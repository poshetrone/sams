import 'server-only'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { can, isAdminGrade, type PermAction } from '@/lib/constants'
import { getAccess, permKey, type AccessLevel, type PermMap } from '@/lib/permissions'
import type { Member } from '@/lib/types'

/** Renvoie le membre SAMS correspondant à l'utilisateur connecté (ou null). */
export async function getCurrentMember(): Promise<Member | null> {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const meta = user.user_metadata || {}
  const discordId: string | undefined = meta.provider_id || user.identities?.[0]?.id
  if (!discordId) return null

  const admin = createServiceClient()
  const { data } = await admin.from('members').select('*').eq('discord_id', discordId).maybeSingle()
  return (data as Member) || null
}

/** Vérifie que le membre courant a le droit `action`. Lève une erreur sinon. */
export async function requirePerm(action: PermAction): Promise<Member> {
  const member = await getCurrentMember()
  if (!member) throw new Error('Non authentifié')
  if (!can(action, member.grade)) throw new Error('Action réservée à la Direction')
  return member
}

/** Vérifie que le membre courant est de la Direction (ADMIN_GRADES). */
export async function requireAdmin(): Promise<Member> {
  const member = await getCurrentMember()
  if (!member) throw new Error('Non authentifié')
  if (!isAdminGrade(member.grade)) throw new Error('Action réservée à la Direction')
  return member
}

/* ============================================================
 * Permissions configurables (matrice grade × catégorie)
 * ============================================================ */

/** Charge la matrice des permissions depuis la base (service-role). */
export async function getPermMap(): Promise<PermMap> {
  const admin = createServiceClient()
  const { data } = await admin.from('permissions').select('grade, category, level')
  const map: PermMap = {}
  for (const r of (data as { grade: string; category: string; level: AccessLevel }[]) || []) {
    map[permKey(r.grade, r.category)] = r.level
  }
  return map
}

/** Niveau d'accès effectif du membre connecté sur une catégorie. */
export async function getServerAccess(category: string): Promise<AccessLevel> {
  const member = await getCurrentMember()
  if (!member) return 'none'
  const map = await getPermMap()
  return getAccess(map, member.grade, category)
}

/**
 * Exige le niveau 'edit' sur `category` pour écrire. Lève une erreur sinon.
 * À appeler en tête de CHAQUE server action d'écriture (sécurité serveur).
 */
export async function requireEdit(category: string): Promise<Member> {
  const member = await getCurrentMember()
  if (!member) throw new Error('Non authentifié')
  const map = await getPermMap()
  if (getAccess(map, member.grade, category) !== 'edit') {
    throw new Error('Action non autorisée — droits insuffisants (lecture seule)')
  }
  return member
}

/** Variante : exige 'edit' sur AU MOINS une des catégories (ressource partagée). */
export async function requireEditAny(categories: string[]): Promise<Member> {
  const member = await getCurrentMember()
  if (!member) throw new Error('Non authentifié')
  const map = await getPermMap()
  const ok = categories.some((c) => getAccess(map, member.grade, c) === 'edit')
  if (!ok) throw new Error('Action non autorisée — droits insuffisants (lecture seule)')
  return member
}

export { isAdminGrade }
