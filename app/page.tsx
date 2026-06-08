import { redirect } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export default async function RootGate() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const meta = user.user_metadata || {}
  const discordId: string | undefined = meta.provider_id || user.identities?.[0]?.id

  if (discordId) {
    const admin = createServiceClient()
    const { data: member } = await admin
      .from('members')
      .select('id')
      .eq('discord_id', discordId)
      .maybeSingle()
    if (member) redirect('/dashboard')
  }

  redirect('/pending')
}
