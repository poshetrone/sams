import { getServerAccess, getCurrentMember } from '@/lib/auth'
import Restricted from '@/components/Restricted'
import MonAbsenceView from '@/components/absence/MonAbsenceView'

export const dynamic = 'force-dynamic'

export default async function MonAbsencePage() {
  if ((await getServerAccess('absence')) === 'none') return <Restricted />
  const me = await getCurrentMember()
  if (!me) return <Restricted />
  return <MonAbsenceView member={me} />
}
