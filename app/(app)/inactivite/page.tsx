import { apiGet } from '@/lib/api/client'
import { getServerAccess } from '@/lib/auth'
import Restricted from '@/components/Restricted'
import InactiviteView from '@/components/inactivite/InactiviteView'
import type { Member, Timeclock } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function InactivitePage() {
  if ((await getServerAccess('inactivite')) === 'none') return <Restricted />
  const [members, timeclock] = await Promise.all([
    apiGet<Member[]>('/members'),
    apiGet<Timeclock[]>('/timeclock'),
  ])
  return <InactiviteView members={members ?? []} timeclock={timeclock ?? []} />
}
