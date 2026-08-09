import { apiGet, apiGetPage } from '@/lib/api/client'
import { getMe } from '@/lib/api/session'
import { getServerAccess } from '@/lib/auth'
import Restricted from '@/components/Restricted'
import Overview from '@/components/dashboard/Overview'
import type { Member, PatientListItem, PatientReminder } from '@/lib/types'

export const dynamic = 'force-dynamic'

/** Nombre de dossiers affichés dans le tableau « Patients récents ». */
const RECENT_COUNT = 4
/** Nombre de rendez-vous affichés dans la carte « Rappels ». */
const REMINDERS_COUNT = 5

export default async function DashboardPage() {
  if ((await getServerAccess('dashboard')) === 'none') return <Restricted />
  // Le tableau de bord n'affiche qu'un extrait : on demande exactement les
  // lignes rendues plutôt que l'intégralité des dossiers.
  const [recent, reminders, members, me] = await Promise.all([
    apiGetPage<PatientListItem>(`/patients?page=1&per_page=${RECENT_COUNT}`, RECENT_COUNT),
    apiGet<{ reminders: PatientReminder[] }>(`/patients/reminders?limit=${REMINDERS_COUNT}`),
    apiGet<Member[]>('/members'),
    getMe(),
  ])
  return (
    <Overview
      patients={recent.items}
      patientCount={recent.meta.total}
      reminders={reminders?.reminders ?? []}
      members={members ?? []}
      reqCount={me?.reqCount ?? 0}
    />
  )
}
