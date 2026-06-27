import { apiGet } from '@/lib/api/client'
import { getMe } from '@/lib/api/session'
import { getServerAccess } from '@/lib/auth'
import Restricted from '@/components/Restricted'
import Overview from '@/components/dashboard/Overview'
import type { Patient, Member } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  if ((await getServerAccess('dashboard')) === 'none') return <Restricted />
  const [patients, members, me] = await Promise.all([
    apiGet<Patient[]>('/patients'),
    apiGet<Member[]>('/members'),
    getMe(),
  ])
  const reqCount = me?.reqCount ?? 0
  return <Overview patients={patients ?? []} members={members ?? []} reqCount={reqCount} />
}
