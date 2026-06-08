import { createServiceClient } from '@/lib/supabase/server'
import StatsView from '@/components/stats/StatsView'
import type { Member, Patient } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function StatsPage() {
  const admin = createServiceClient()
  const [{ data: members }, { data: patients }] = await Promise.all([
    admin.from('members').select('*').order('created_at', { ascending: true }),
    admin.from('patients').select('*').order('created_at', { ascending: true }),
  ])
  return <StatsView members={(members as Member[]) || []} patients={(patients as Patient[]) || []} />
}
