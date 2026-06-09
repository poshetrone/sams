import { createServiceClient } from '@/lib/supabase/server'
import { getServerAccess } from '@/lib/auth'
import Restricted from '@/components/Restricted'
import DocumentsView from '@/components/documents/DocumentsView'
import type { Patient } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function DocumentsPage({
  searchParams,
}: {
  searchParams: { patient?: string; type?: string; death?: string }
}) {
  if ((await getServerAccess('documents')) === 'none') return <Restricted />
  const admin = createServiceClient()
  const { data } = await admin.from('patients').select('*').order('created_at', { ascending: true })
  return (
    <DocumentsView
      patients={(data as Patient[]) || []}
      initialPatientId={searchParams.patient}
      initialType={searchParams.type}
      death={searchParams.death === '1'}
    />
  )
}
