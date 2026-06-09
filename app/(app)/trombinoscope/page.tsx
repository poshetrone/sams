import { createServiceClient } from '@/lib/supabase/server'
import { getServerAccess } from '@/lib/auth'
import Restricted from '@/components/Restricted'
import TrombiView from '@/components/trombinoscope/TrombiView'
import type { TrombiPost } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function TrombinoscopePage() {
  if ((await getServerAccess('trombi')) === 'none') return <Restricted />
  const admin = createServiceClient()
  const { data } = await admin.from('trombi_posts').select('*').order('created_at', { ascending: true })
  return <TrombiView posts={(data as TrombiPost[]) || []} />
}
