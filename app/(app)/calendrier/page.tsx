import { apiGet } from '@/lib/api/client'
import { getServerAccess } from '@/lib/auth'
import Restricted from '@/components/Restricted'
import CalendrierView from '@/components/calendrier/CalendrierView'
import type { CalendarEvent } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function CalendrierPage() {
  if ((await getServerAccess('calendrier')) === 'none') return <Restricted />
  const data = await apiGet<CalendarEvent[]>('/calendar-events')
  return <CalendrierView events={data ?? []} />
}
