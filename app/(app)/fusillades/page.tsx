import { createServiceClient } from '@/lib/supabase/server'
import FusilladesView from '@/components/fusillades/FusilladesView'
import type { Fusillade, Patient } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function FusilladesPage() {
  const admin = createServiceClient()
  const [{ data: fusillades }, { data: patients }] = await Promise.all([
    admin.from('fusillades').select('*').order('created_at', { ascending: false }),
    admin.from('patients').select('*').order('created_at', { ascending: true }),
  ])
  return <FusilladesView fusillades={(fusillades as Fusillade[]) || []} patients={(patients as Patient[]) || []} />
}
