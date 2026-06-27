import { apiGet } from '@/lib/api/client'
import { getServerAccess } from '@/lib/auth'
import Restricted from '@/components/Restricted'
import FormationsView from '@/components/formations/FormationsView'
import type { Member, FormationRow } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function FormationsPage() {
  if ((await getServerAccess('formations')) === 'none') return <Restricted />
  const [members, formations] = await Promise.all([
    apiGet<Member[]>('/members'),
    apiGet<FormationRow[]>('/formations'),
  ])
  return <FormationsView members={members ?? []} formations={formations ?? []} />
}
