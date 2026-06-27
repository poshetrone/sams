import { redirect } from 'next/navigation'
import { getMe } from '@/lib/api/session'
import LoginScreen from './LoginScreen'

export default async function LoginPage() {
  const me = await getMe()
  // Déjà authentifié -> la racine décide (app ou pending).
  if (me) redirect('/')

  return <LoginScreen />
}
