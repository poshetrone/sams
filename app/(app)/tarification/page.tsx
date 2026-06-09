import { createServiceClient } from '@/lib/supabase/server'
import { getServerAccess } from '@/lib/auth'
import Restricted from '@/components/Restricted'
import TarificationView from '@/components/tarification/TarificationView'
import type { TarifRow } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function TarificationPage() {
  if ((await getServerAccess('tarification')) === 'none') return <Restricted />
  const admin = createServiceClient()
  const { data } = await admin.from('tarifs').select('*').order('ord', { ascending: true })
  return <TarificationView tarifs={(data as TarifRow[]) || []} />
}
