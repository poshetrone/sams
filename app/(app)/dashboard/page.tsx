import { createServiceClient } from '@/lib/supabase/server'
import Overview from '@/components/dashboard/Overview'
import type { Patient, Member } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const admin = createServiceClient()
  const [{ data: patients }, { data: members }, { count }] = await Promise.all([
    admin.from('patients').select('*').order('created_at', { ascending: true }),
    admin.from('members').select('*').order('created_at', { ascending: true }),
    admin.from('accesses').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
  ])
  return <Overview patients={(patients as Patient[]) || []} members={(members as Member[]) || []} reqCount={count ?? 0} />
}
