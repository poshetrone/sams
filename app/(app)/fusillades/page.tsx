import { createServiceClient } from '@/lib/supabase/server'
import { getServerAccess } from '@/lib/auth'
import Restricted from '@/components/Restricted'
import FusilladesView from '@/components/fusillades/FusilladesView'
import type { Fusillade, Patient } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function FusilladesPage() {
  if ((await getServerAccess('fusillade')) === 'none') return <Restricted />
  const admin = createServiceClient()
  const [{ data: fusillades }, { data: patients }] = await Promise.all([
    admin.from('fusillades').select('*').order('created_at', { ascending: false }),
    admin.from('patients').select('*').order('created_at', { ascending: true }),
  ])
  return <FusilladesView fusillades={(fusillades as Fusillade[]) || []} patients={(patients as Patient[]) || []} />
}
