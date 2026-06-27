import { apiGet } from '@/lib/api/client'
import { getServerAccess } from '@/lib/auth'
import Restricted from '@/components/Restricted'
import PointeuseView from '@/components/pointeuse/PointeuseView'
import type { Timeclock } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function PointeusePage() {
  if ((await getServerAccess('pointeuse')) === 'none') return <Restricted />
  const data = await apiGet<Timeclock[]>('/timeclock')
  return <PointeuseView timeclock={data ?? []} />
}
