import { getServerAccess, getPermMap } from '@/lib/auth'
import PermissionsView from '@/components/permissions/PermissionsView'
import Restricted from '@/components/Restricted'

export const dynamic = 'force-dynamic'

export default async function PermissionsPage() {
  // La Direction garde toujours 'edit' ici (garde-fou dans getAccess).
  const level = await getServerAccess('permissions')
  if (level === 'none') {
    return <Restricted>La configuration des permissions est réservée à la Direction.</Restricted>
  }
  const perms = await getPermMap()
  return <PermissionsView perms={perms} readOnly={level !== 'edit'} />
}
