import 'server-only'
import { apiGet } from '@/lib/api/client'
import { getCurrentMember, isAdminGrade } from '@/lib/auth'
import type { PoleRow } from '@/lib/types'

/**
 * Résout un pôle par sa clé et détermine si le membre connecté peut y accéder.
 * Accès autorisé aux membres du pôle ; la Direction peut consulter n'importe lequel.
 */
export async function resolvePole(
  key: string
): Promise<{ pole: PoleRow | null; allowed: boolean }> {
  const [me, poles] = await Promise.all([getCurrentMember(), apiGet<PoleRow[]>('/poles')])
  const pole = poles?.find((p) => p.key === key) ?? null
  const allowed = !!me && !!pole && ((me.poles || []).includes(pole.key) || isAdminGrade(me.grade))
  return { pole, allowed }
}
