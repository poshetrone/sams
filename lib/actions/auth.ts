'use server'
import { cookies } from 'next/headers'
import { apiPost, TOKEN_COOKIE } from '@/lib/api/client'

/** Déconnexion : révoque le token côté API et efface le cookie. */
export async function logout(): Promise<{ ok: boolean }> {
  try {
    await apiPost('/auth/discord/logout')
  } catch {
    // best-effort : on efface le cookie quoi qu'il arrive
  }
  cookies().delete(TOKEN_COOKIE)
  return { ok: true }
}
