import { createServiceClient } from '@/lib/supabase/server'
import { getServerAccess } from '@/lib/auth'
import Restricted from '@/components/Restricted'
import PointeuseView from '@/components/pointeuse/PointeuseView'
import type { Timeclock } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function PointeusePage() {
  if ((await getServerAccess('pointeuse')) === 'none') return <Restricted />
  const admin = createServiceClient()
  const { data } = await admin.from('timeclock').select('*').order('created_at', { ascending: false })
  return <PointeuseView timeclock={(data as Timeclock[]) || []} />
}
