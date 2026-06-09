import { notFound } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/server'
import { getServerAccess } from '@/lib/auth'
import Restricted from '@/components/Restricted'
import PatientDetailView from '@/components/patients/PatientDetailView'
import type { Patient } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function PatientPage({ params }: { params: { id: string } }) {
  if ((await getServerAccess('patients')) === 'none') return <Restricted />
  const admin = createServiceClient()
  const { data } = await admin.from('patients').select('*').eq('id', params.id).maybeSingle()
  if (!data) notFound()
  return <PatientDetailView initialPatient={data as Patient} />
}
