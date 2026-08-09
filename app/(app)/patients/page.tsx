import { getServerAccess } from '@/lib/auth'
import Restricted from '@/components/Restricted'
import PatientsListView from '@/components/patients/PatientsListView'
import { fetchPatientsPage } from '@/lib/actions/patients'

export const dynamic = 'force-dynamic'

export default async function PatientsPage() {
  if ((await getServerAccess('patients')) === 'none') return <Restricted />
  // Première page rendue côté serveur ; la navigation, le filtre et la
  // recherche rechargent ensuite page par page via la même action.
  const initial = await fetchPatientsPage({ page: 1 })
  return <PatientsListView initial={initial} />
}
