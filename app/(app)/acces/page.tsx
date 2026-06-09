import { createServiceClient } from '@/lib/supabase/server'
import { getServerAccess } from '@/lib/auth'
import Restricted from '@/components/Restricted'
import AccessView from '@/components/acces/AccessView'
import type { Access, Member } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function AccesPage() {
  if ((await getServerAccess('access')) === 'none')
    return <Restricted>La gestion des accès est réservée à la Direction.</Restricted>
  const admin = createServiceClient()
  const [{ data: requests }, { data: members }] = await Promise.all([
    admin.from('accesses').select('*').eq('status', 'pending').order('requested_at', { ascending: true }),
    admin.from('members').select('*').order('created_at', { ascending: true }),
  ])
  return <AccessView requests={(requests as Access[]) || []} members={(members as Member[]) || []} />
}
