import { createServiceClient } from '@/lib/supabase/server'
import TarificationView from '@/components/tarification/TarificationView'
import type { TarifRow } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function TarificationPage() {
  const admin = createServiceClient()
  const { data } = await admin.from('tarifs').select('*').order('ord', { ascending: true })
  return <TarificationView tarifs={(data as TarifRow[]) || []} />
}
