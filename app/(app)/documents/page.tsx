import { getServerAccess } from '@/lib/auth'
import Restricted from '@/components/Restricted'
import DocumentsView from '@/components/documents/DocumentsView'
import { fetchPatientsLight } from '@/lib/actions/patients'

export const dynamic = 'force-dynamic'

export default async function DocumentsPage({
  searchParams,
}: {
  searchParams: { patient?: string; type?: string; death?: string }
}) {
  if ((await getServerAccess('documents')) === 'none') return <Restricted />
  // Seules l'identité et les constantes du dossier servent ici (sélecteur et
  // en-tête du document) : l'annuaire léger suffit.
  const patients = await fetchPatientsLight()
  return (
    <DocumentsView
      patients={patients}
      initialPatientId={searchParams.patient}
      initialType={searchParams.type}
      death={searchParams.death === '1'}
    />
  )
}
