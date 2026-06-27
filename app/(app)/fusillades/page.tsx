import { apiGet } from '@/lib/api/client'
import { getServerAccess } from '@/lib/auth'
import Restricted from '@/components/Restricted'
import FusilladesView from '@/components/fusillades/FusilladesView'
import type { Fusillade, Patient } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function FusilladesPage() {
  if ((await getServerAccess('fusillade')) === 'none') return <Restricted />
  const [fusillades, patients] = await Promise.all([
    apiGet<Fusillade[]>('/fusillades'),
    apiGet<Patient[]>('/patients'),
  ])
  return <FusilladesView fusillades={fusillades ?? []} patients={patients ?? []} />
}
