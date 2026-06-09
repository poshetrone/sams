import { redirect } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { getPermMap } from '@/lib/auth'
import AppShell from '@/components/AppShell'
import type { CurrentMember } from '@/lib/app-context'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const meta = user.user_metadata || {}
  const discordId: string | undefined = meta.provider_id || user.identities?.[0]?.id

  const admin = createServiceClient()
  const { data: member } = discordId
    ? await admin
        .from('members')
        .select('id, name, grade, discord, photo')
        .eq('discord_id', discordId)
        .maybeSingle()
    : { data: null }

  if (!member) redirect('/pending')

  const { count } = await admin
    .from('accesses')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'pending')

  const perms = await getPermMap()

  const current: CurrentMember = {
    id: member.id,
    name: member.name,
    grade: member.grade,
    discord: member.discord,
    photo: member.photo,
  }

  return (
    <AppShell member={current} reqCount={count ?? 0} perms={perms}>
      {children}
    </AppShell>
  )
}
