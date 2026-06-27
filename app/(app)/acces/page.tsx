import { apiGet } from '@/lib/api/client'
import { getServerAccess } from '@/lib/auth'
import Restricted from '@/components/Restricted'
import AccessView from '@/components/acces/AccessView'
import type { Access, Member } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function AccesPage() {
  if ((await getServerAccess('access')) === 'none')
    return <Restricted>La gestion des accès est réservée à la Direction.</Restricted>
  const [all, members] = await Promise.all([
    apiGet<Access[]>('/accesses'),
    apiGet<Member[]>('/members'),
  ])
  const accesses = (all ?? []).filter((a) => a.status === 'pending')
  return <AccessView requests={accesses} members={members ?? []} />
}
