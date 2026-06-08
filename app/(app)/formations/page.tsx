import { createServiceClient } from '@/lib/supabase/server'
import FormationsView from '@/components/formations/FormationsView'
import type { Member, FormationRow } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function FormationsPage() {
  const admin = createServiceClient()
  const [{ data: members }, { data: formations }] = await Promise.all([
    admin.from('members').select('*').order('created_at', { ascending: true }),
    admin.from('formations').select('*').order('ord', { ascending: true }),
  ])
  return <FormationsView members={(members as Member[]) || []} formations={(formations as FormationRow[]) || []} />
}
