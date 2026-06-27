import { apiGet } from '@/lib/api/client'
import { getServerAccess } from '@/lib/auth'
import Restricted from '@/components/Restricted'
import TrombiView from '@/components/trombinoscope/TrombiView'
import type { TrombiPost } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function TrombinoscopePage() {
  if ((await getServerAccess('trombi')) === 'none') return <Restricted />
  const data = await apiGet<TrombiPost[]>('/trombi-posts')
  return <TrombiView posts={data ?? []} />
}
