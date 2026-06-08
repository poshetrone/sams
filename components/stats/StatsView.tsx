import { Icons } from '@/components/Icons'
import { Card, KPI } from '@/components/ui'
import { GRADES, DOC_TYPES, type GradeKey } from '@/lib/constants'
import type { Member, Patient } from '@/lib/types'

export default function StatsView({ members, patients }: { members: Member[]; patients: Patient[] }) {
  const byGrade = Object.entries(GRADES)
    .sort((a, b) => b[1].rank - a[1].rank)
    .map(([k, g]) => ({ ...g, key: k, count: members.filter((m) => m.grade === k).length }))
    .filter((g) => g.count > 0)
  const maxG = Math.max(...byGrade.map((g) => g.count), 1)

  const docByType = DOC_TYPES.map((t) => ({
    ...t,
    count: patients.reduce((n, p) => n + (p.docs || []).filter((d) => d.type === t.key).length, 0),
  }))
  const maxD = Math.max(...docByType.map((d) => d.count), 1)

  return (
    <div className="view-anim">
      <div className="kpi-grid" style={{ marginBottom: 24 }}>
        <KPI label="Effectif total" val={members.length} icon="effectifs" />
        <KPI label="Patients au registre" val={patients.length} icon="patients" />
        <KPI label="Documents au dossier" val={docByType.reduce((n, d) => n + d.count, 0)} icon="docs" />
        <KPI label="En service maintenant" val={members.filter((m) => m.status === 'service' || m.status === 'intervention').length} icon="pulse" />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, alignItems: 'start' }}>
        <Card>
          <div className="card-head"><h3>Répartition par grade</h3></div>
          <div className="card-pad" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {byGrade.map((g) => (
              <div key={g.key} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 130, fontSize: 12.5, color: 'var(--ink-300)', textAlign: 'right', flex: '0 0 130px' }}>{g.label}</div>
                <div style={{ flex: 1, height: 22, background: 'var(--navy-800)', borderRadius: 6, overflow: 'hidden' }}>
                  <div style={{ width: `${(g.count / maxG) * 100}%`, height: '100%', background: g.color, opacity: 0.85, borderRadius: 6, transition: 'width .5s' }}></div>
                </div>
                <div style={{ width: 24, fontSize: 13, fontWeight: 700, color: 'var(--ink-100)' }}>{g.count}</div>
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <div className="card-head"><h3>Documents par type</h3></div>
          <div className="card-pad" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {docByType.map((d) => {
              const I = Icons[d.icon] || Icons.doc
              return (
                <div key={d.key} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 130, fontSize: 12.5, color: 'var(--ink-300)', textAlign: 'right', flex: '0 0 130px', display: 'flex', alignItems: 'center', gap: 7, justifyContent: 'flex-end' }}>
                    <I size={14} style={{ color: 'var(--gold-400)' }} /> {d.title.split(' ').slice(0, 2).join(' ')}
                  </div>
                  <div style={{ flex: 1, height: 22, background: 'var(--navy-800)', borderRadius: 6, overflow: 'hidden' }}>
                    <div style={{ width: `${(d.count / maxD) * 100}%`, height: '100%', background: 'linear-gradient(90deg, var(--gold-600), var(--gold-400))', borderRadius: 6, transition: 'width .5s' }}></div>
                  </div>
                  <div style={{ width: 24, fontSize: 13, fontWeight: 700, color: 'var(--ink-100)' }}>{d.count}</div>
                </div>
              )
            })}
          </div>
        </Card>
      </div>
    </div>
  )
}
