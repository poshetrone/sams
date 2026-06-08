import { createServiceClient } from '@/lib/supabase/server'
import TombolaView from '@/components/tombola/TombolaView'
import type { Tombola } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function TombolaPage() {
  const admin = createServiceClient()
  const { data } = await admin.from('tombola').select('*').eq('id', 1).maybeSingle()
  const tombola = (data as Tombola) || { id: 1, size: 100, tickets: {}, winner: null }
  return <TombolaView tombola={tombola} />
}
