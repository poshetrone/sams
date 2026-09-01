import { apiGet } from '@/lib/api/client'
import { getServerAccess } from '@/lib/auth'
import Restricted from '@/components/Restricted'
import AcademyView from '@/components/academy/AcademyView'
import type { AcademyAnswer, AcademyFormation } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function AcademyPage() {
  if ((await getServerAccess('academy')) === 'none') return <Restricted />
  const [formations, answers] = await Promise.all([
    apiGet<AcademyFormation[]>('/academy/formations'),
    apiGet<AcademyAnswer[]>('/academy/answers'),
  ])
  return <AcademyView formations={formations ?? []} answers={answers ?? []} />
}
