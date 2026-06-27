import { apiGet } from '@/lib/api/client'
import { getServerAccess } from '@/lib/auth'
import Restricted from '@/components/Restricted'
import PatientsListView from '@/components/patients/PatientsListView'
import type { Patient } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function PatientsPage() {
  if ((await getServerAccess('patients')) === 'none') return <Restricted />
  const data = await apiGet<Patient[]>('/patients')
  return <PatientsListView patients={data ?? []} />
}
