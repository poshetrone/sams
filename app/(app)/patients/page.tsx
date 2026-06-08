import { createServiceClient } from '@/lib/supabase/server'
import PatientsListView from '@/components/patients/PatientsListView'
import type { Patient } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function PatientsPage() {
  const admin = createServiceClient()
  const { data } = await admin.from('patients').select('*').order('created_at', { ascending: true })
  return <PatientsListView patients={(data as Patient[]) || []} />
}
