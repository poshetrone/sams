import { redirect } from 'next/navigation'
import { getMe } from '@/lib/api/session'
import { apiGet } from '@/lib/api/client'
import AppShell from '@/components/AppShell'
import type { CurrentMember } from '@/lib/app-context'
import type { PoleRow, MutuelleRow } from '@/lib/types'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const me = await getMe()
  if (!me) redirect('/login')
  if (!me.member) redirect('/pending')

  const [poles, mutuelles] = await Promise.all([
    apiGet<PoleRow[]>('/poles').then((r) => r ?? []),
    apiGet<MutuelleRow[]>('/mutuelles').then((r) => r ?? []),
  ])

  const m = me.member
  const current: CurrentMember = {
    id: m.id,
    name: m.name,
    grade: m.grade,
    discord: m.discord,
    photo: m.photo,
    poles: m.poles ?? [],
  }

  return (
    <AppShell member={current} reqCount={me.reqCount} perms={me.perms} poles={poles} mutuelles={mutuelles}>
      {children}
    </AppShell>
  )
}
