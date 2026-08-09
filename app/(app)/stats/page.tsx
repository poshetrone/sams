import { apiGet } from '@/lib/api/client'
import { getServerAccess } from '@/lib/auth'
import StatsView from '@/components/stats/StatsView'
import Restricted from '@/components/Restricted'
import type { Member, PatientStats } from '@/lib/types'

export const dynamic = 'force-dynamic'

const EMPTY_STATS: PatientStats = { total: 0, docs_by_type: {} }

export default async function StatsPage() {
  if ((await getServerAccess('stats')) === 'none')
    return <Restricted>Les statistiques sont réservées à la Direction.</Restricted>

  // Les compteurs patients sont agrégés en base plutôt que recalculés à partir
  // de tous les dossiers.
  const [members, patients] = await Promise.all([
    apiGet<Member[]>('/members'),
    apiGet<PatientStats>('/patients/stats'),
  ])
  return <StatsView members={members ?? []} patients={patients ?? EMPTY_STATS} />
}
