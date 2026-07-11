import { notFound } from 'next/navigation'
import { apiGet } from '@/lib/api/client'
import Restricted from '@/components/Restricted'
import PolePlanningView from '@/components/poles/PolePlanningView'
import { resolvePole } from '@/lib/pole-guard'
import type { PoleAppointment } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function PolePlanningPage({ params }: { params: { key: string } }) {
  const { pole, allowed } = await resolvePole(params.key)
  if (!pole) notFound()
  if (!allowed) return <Restricted />

  const appointments = (await apiGet<PoleAppointment[]>(`/poles/${pole.key}/appointments`)) ?? []

  return <PolePlanningView pole={pole} appointments={appointments} />
}
