import { createServiceClient } from '@/lib/supabase/server'
import PrimesView from '@/components/primes/PrimesView'
import type { Member } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function PrimesPage() {
  const admin = createServiceClient()
  const { data } = await admin.from('members').select('*').order('created_at', { ascending: true })
  return <PrimesView members={(data as Member[]) || []} />
}
