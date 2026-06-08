import { createServiceClient } from '@/lib/supabase/server'
import PointeuseView from '@/components/pointeuse/PointeuseView'
import type { Timeclock } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function PointeusePage() {
  const admin = createServiceClient()
  const { data } = await admin.from('timeclock').select('*').order('created_at', { ascending: false })
  return <PointeuseView timeclock={(data as Timeclock[]) || []} />
}
