import 'server-only'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { can, isAdminGrade, type PermAction } from '@/lib/constants'
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

export { isAdminGrade }
