import 'server-only'
import { createServiceClient } from '@/lib/supabase/server'
import type { Member } from '@/lib/types'

/** Horodatage au format du proto : JJ/MM/AAAA HH:MM */
export function nowStamp(): string {
  const d = new Date()
  const p = (n: number) => String(n).padStart(2, '0')
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`
}

/** Journalise une action sensible dans audit_log. */
export async function logAudit(
  member: Pick<Member, 'name' | 'grade'> | null,
  action: string,
  target = ''
): Promise<void> {
  const admin = createServiceClient()
  await admin.from('audit_log').insert({
    who: member?.name ?? 'Système',
    grade: member?.grade ?? null,
    action,
    target,
    time: nowStamp(),
  })
}
