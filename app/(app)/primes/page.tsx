import { apiGet } from '@/lib/api/client'
import { getServerAccess } from '@/lib/auth'
import Restricted from '@/components/Restricted'
import PrimesView from '@/components/primes/PrimesView'
import type { Member } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function PrimesPage() {
  if ((await getServerAccess('primes')) === 'none') return <Restricted />
  const data = await apiGet<Member[]>('/members')
  return <PrimesView members={data ?? []} />
}
