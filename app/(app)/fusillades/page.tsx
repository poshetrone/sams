import { apiGet } from '@/lib/api/client'
import { getServerAccess } from '@/lib/auth'
import Restricted from '@/components/Restricted'
import FusilladesView from '@/components/fusillades/FusilladesView'
import { fetchPatientsLight } from '@/lib/actions/patients'
import type { Fusillade } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function FusilladesPage() {
  if ((await getServerAccess('fusillade')) === 'none') return <Restricted />
  // Les patients ne servent qu'à rattacher un blessé à un dossier existant :
  // identité, téléphone et photo suffisent.
  const [fusillades, patients] = await Promise.all([
    apiGet<Fusillade[]>('/fusillades'),
    fetchPatientsLight(),
  ])
  return <FusilladesView fusillades={fusillades ?? []} patients={patients} />
}
