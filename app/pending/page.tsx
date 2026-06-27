import { redirect } from 'next/navigation'
import { getMe } from '@/lib/api/session'
import PendingScreen from './PendingScreen'

export default async function PendingPage() {
  const me = await getMe()
  if (!me) redirect('/login')
  // Déjà membre -> dans l'app.
  if (me.member) redirect('/')

  const name = me.account?.username || 'Membre Discord'
  const pseudo = me.account?.username || ''

  return <PendingScreen name={name} pseudo={pseudo} />
}
