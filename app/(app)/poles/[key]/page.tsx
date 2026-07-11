import { notFound } from 'next/navigation'
import { apiGet } from '@/lib/api/client'
import Restricted from '@/components/Restricted'
import PoleView from '@/components/poles/PoleView'
import { resolvePole } from '@/lib/pole-guard'
import type { Member } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function PolePage({ params }: { params: { key: string } }) {
  const { pole, allowed } = await resolvePole(params.key)
  if (!pole) notFound()
  if (!allowed) return <Restricted />

  const members = (await apiGet<Member[]>('/members')) ?? []
  const team = members.filter((m) => (m.poles || []).includes(pole.key))

  return <PoleView pole={pole} team={team} />
}
