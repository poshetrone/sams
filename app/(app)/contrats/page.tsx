import { createServiceClient } from '@/lib/supabase/server'
import { getServerAccess } from '@/lib/auth'
import Restricted from '@/components/Restricted'
import ContractsView from '@/components/contrats/ContractsView'
import type { Contract } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function ContratsPage() {
  if ((await getServerAccess('contrats')) === 'none') return <Restricted />
  const admin = createServiceClient()
  const { data } = await admin.from('contracts').select('*').order('created_at', { ascending: true })
  return <ContractsView contracts={(data as Contract[]) || []} />
}
