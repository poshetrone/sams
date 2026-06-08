import { redirect } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import PendingScreen from './PendingScreen'

export default async function PendingPage() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const meta = user.user_metadata || {}
  const discordId: string | undefined = meta.provider_id || user.identities?.[0]?.id

  // Si l'utilisateur est en fait déjà membre, on l'envoie dans l'app.
  if (discordId) {
    const admin = createServiceClient()
    const { data: member } = await admin
      .from('members')
      .select('id')
      .eq('discord_id', discordId)
      .maybeSingle()
    if (member) redirect('/')
  }

  const name: string = meta.full_name || meta.name || 'Membre Discord'
  const pseudo: string = meta.name || meta.preferred_username || meta.user_name || ''

  return <PendingScreen name={name} pseudo={pseudo} />
}
