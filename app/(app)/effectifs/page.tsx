import { apiGet } from '@/lib/api/client'
import { getServerAccess } from '@/lib/auth'
import Restricted from '@/components/Restricted'
import EffectifsView from '@/components/effectifs/EffectifsView'
import type { Member } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function EffectifsPage() {
  if ((await getServerAccess('effectifs')) === 'none') return <Restricted />
  const data = await apiGet<Member[]>('/members')
  return <EffectifsView members={data ?? []} />
}
