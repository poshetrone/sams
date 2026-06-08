import { createServiceClient } from '@/lib/supabase/server'
import { getCurrentMember, isAdminGrade } from '@/lib/auth'
import { Card, GradePill, SecTitle } from '@/components/ui'
import Restricted from '@/components/Restricted'
import type { AuditEntry } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function AuditPage() {
  const me = await getCurrentMember()
  if (!isAdminGrade(me?.grade)) return <Restricted>Le journal d&apos;audit est réservé à la Direction.</Restricted>

  const admin = createServiceClient()
  const { data } = await admin.from('audit_log').select('*').order('created_at', { ascending: false }).limit(200)
  const log = (data as AuditEntry[]) || []

  return (
    <div className="view-anim">
      <SecTitle>Journal d&apos;audit — traçabilité des actions</SecTitle>
      <Card>
        <table className="tbl">
          <thead>
            <tr><th>Horodatage</th><th>Agent</th><th>Grade</th><th>Action</th></tr>
          </thead>
          <tbody>
            {log.map((e) => (
              <tr key={e.id}>
                <td style={{ color: 'var(--ink-400)', whiteSpace: 'nowrap' }}>{e.time}</td>
                <td><b style={{ color: 'var(--ink-100)' }}>{e.who}</b></td>
                <td>{e.grade ? <GradePill grade={e.grade} /> : '—'}</td>
                <td style={{ color: 'var(--ink-200)' }}>{e.action} <b style={{ color: 'var(--gold-300)' }}>{e.target}</b></td>
              </tr>
            ))}
            {log.length === 0 && (
              <tr><td colSpan={4} style={{ textAlign: 'center', color: 'var(--ink-500)', padding: 40 }}>Aucune action enregistrée.</td></tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  )
}
