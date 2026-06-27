import { apiGet } from '@/lib/api/client'
import { getServerAccess } from '@/lib/auth'
import StatsView from '@/components/stats/StatsView'
import Restricted from '@/components/Restricted'
import type { Member, Patient } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function StatsPage() {
  if ((await getServerAccess('stats')) === 'none')
    return <Restricted>Les statistiques sont réservées à la Direction.</Restricted>

  const [members, patients] = await Promise.all([
    apiGet<Member[]>('/members'),
    apiGet<Patient[]>('/patients'),
  ])
  return <StatsView members={members ?? []} patients={patients ?? []} />
}
