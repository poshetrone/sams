import { apiGet } from '@/lib/api/client'
import PublicAcademy from '@/components/academy/PublicAcademy'
import type { AcademyFormation } from '@/lib/types'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'SAMS Academy — Parcours de formation EMS',
}

/** Parcours en accès libre : aucune session requise (cf. middleware.ts). */
export default async function PublicAcademyPage() {
  const formations = await apiGet<AcademyFormation[]>('/public/academy/formations')
  return <PublicAcademy formations={formations ?? []} />
}
