import { redirect } from 'next/navigation'
import { getMe } from '@/lib/api/session'
import AppShell from '@/components/AppShell'
import type { CurrentMember } from '@/lib/app-context'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const me = await getMe()
  if (!me) redirect('/login')
  if (!me.member) redirect('/pending')

  const m = me.member
  const current: CurrentMember = {
    id: m.id,
    name: m.name,
    grade: m.grade,
    discord: m.discord,
    photo: m.photo,
  }

  return (
    <AppShell member={current} reqCount={me.reqCount} perms={me.perms}>
      {children}
    </AppShell>
  )
}
