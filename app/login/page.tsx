import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import LoginScreen from './LoginScreen'

export default async function LoginPage() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Déjà connecté -> on laisse la racine décider (app ou pending).
  if (user) redirect('/')

  return <LoginScreen />
}
