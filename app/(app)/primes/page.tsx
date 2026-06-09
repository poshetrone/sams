import { createServiceClient } from '@/lib/supabase/server'
import { getServerAccess } from '@/lib/auth'
import Restricted from '@/components/Restricted'
import PrimesView from '@/components/primes/PrimesView'
import type { Member } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function PrimesPage() {
  if ((await getServerAccess('primes')) === 'none') return <Restricted />
  const admin = createServiceClient()
  const { data } = await admin.from('members').select('*').order('created_at', { ascending: true })
  return <PrimesView members={(data as Member[]) || []} />
}
