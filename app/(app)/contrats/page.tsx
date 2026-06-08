import { createServiceClient } from '@/lib/supabase/server'
import ContractsView from '@/components/contrats/ContractsView'
import type { Contract } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function ContratsPage() {
  const admin = createServiceClient()
  const { data } = await admin.from('contracts').select('*').order('created_at', { ascending: true })
  return <ContractsView contracts={(data as Contract[]) || []} />
}
