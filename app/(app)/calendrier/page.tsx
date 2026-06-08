import { createServiceClient } from '@/lib/supabase/server'
import CalendrierView from '@/components/calendrier/CalendrierView'
import type { CalendarEvent } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function CalendrierPage() {
  const admin = createServiceClient()
  const { data } = await admin.from('calendar_events').select('*').order('day', { ascending: true })
  return <CalendrierView events={(data as CalendarEvent[]) || []} />
}
