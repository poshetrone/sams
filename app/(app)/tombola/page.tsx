import { apiGet } from '@/lib/api/client'
import { getServerAccess } from '@/lib/auth'
import Restricted from '@/components/Restricted'
import TombolaView from '@/components/tombola/TombolaView'
import type { Tombola } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function TombolaPage() {
  if ((await getServerAccess('tombola')) === 'none') return <Restricted />
  const data = await apiGet<Tombola>('/tombola')
  const tombola = data || { id: 1, size: 100, tickets: {}, winner: null }
  return <TombolaView tombola={tombola} />
}
