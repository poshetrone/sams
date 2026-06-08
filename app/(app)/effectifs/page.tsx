import { createServiceClient } from '@/lib/supabase/server'
import EffectifsView from '@/components/effectifs/EffectifsView'
import type { Member } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function EffectifsPage() {
  const admin = createServiceClient()
  const { data } = await admin.from('members').select('*').order('created_at', { ascending: true })
  return <EffectifsView members={(data as Member[]) || []} />
}
