import { apiGet } from '@/lib/api/client'
import { getServerAccess } from '@/lib/auth'
import Restricted from '@/components/Restricted'
import ContractsView from '@/components/contrats/ContractsView'
import type { Contract } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function ContratsPage() {
  if ((await getServerAccess('contrats')) === 'none') return <Restricted />
  const data = await apiGet<Contract[]>('/contracts')
  return <ContractsView contracts={data ?? []} />
}
