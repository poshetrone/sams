import { apiGet } from '@/lib/api/client'
import { getServerAccess } from '@/lib/auth'
import Restricted from '@/components/Restricted'
import TarificationView from '@/components/tarification/TarificationView'
import type { TarifRow } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function TarificationPage() {
  if ((await getServerAccess('tarification')) === 'none') return <Restricted />
  const data = await apiGet<TarifRow[]>('/tarifs')
  return <TarificationView tarifs={data ?? []} />
}
