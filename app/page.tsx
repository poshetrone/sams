import { redirect } from 'next/navigation'
import { getMe } from '@/lib/api/session'

/** Aiguillage racine : non connecté → /login ; membre → /dashboard ; sinon → /pending. */
export default async function RootGate() {
  const me = await getMe()
  if (!me) redirect('/login')
  if (me.member) redirect('/dashboard')
  redirect('/pending')
}
