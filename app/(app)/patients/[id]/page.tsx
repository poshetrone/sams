import { notFound } from 'next/navigation'
import { apiGet } from '@/lib/api/client'
import { getServerAccess } from '@/lib/auth'
import Restricted from '@/components/Restricted'
import PatientDetailView from '@/components/patients/PatientDetailView'
import type { Patient } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function PatientPage({ params }: { params: { id: string } }) {
  if ((await getServerAccess('patients')) === 'none') return <Restricted />
  const data = await apiGet<Patient>(`/patients/${params.id}`)
  if (!data) notFound()
  return <PatientDetailView initialPatient={data as Patient} />
}
