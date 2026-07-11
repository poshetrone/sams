'use client'
import { Icons } from '@/components/Icons'
import { Card, GradePill } from '@/components/ui'
import { GRADES, type GradeKey } from '@/lib/constants'
import { initialsOf, hexToRgba } from '@/lib/format'
import { useApp } from '@/lib/app-context'
import type { Member, PoleRow } from '@/lib/types'

export default function PoleView({ pole, team }: { pole: PoleRow; team: Member[] }) {
  const { search } = useApp()
  const I = Icons[pole.icon] || Icons.medal
  const lead = team.find((m) => m.id === pole.lead) || null

  const list = team
    .filter((m) => !search || m.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      // Responsable en tête, puis par rang de grade décroissant.
      if (a.id === pole.lead) return -1
      if (b.id === pole.lead) return 1
      return (GRADES[b.grade as GradeKey]?.rank ?? 0) - (GRADES[a.grade as GradeKey]?.rank ?? 0)
    })

  return (
    <div className="view-anim">
      {/* En-tête du pôle */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 52, height: 52, borderRadius: 14, color: pole.color, background: hexToRgba(pole.color), flex: '0 0 auto' }}>
          <I size={26} />
        </span>
        <div style={{ minWidth: 0 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--ink-100)', margin: 0 }}>{pole.label}</h2>
          <div style={{ fontSize: 13, color: 'var(--ink-400)', marginTop: 2 }}>
            <b style={{ color: 'var(--ink-100)' }}>{team.length}</b> membre{team.length > 1 ? 's' : ''}
            {lead && <> · Responsable : <b style={{ color: pole.color }}>{lead.name}</b></>}
          </div>
        </div>
      </div>

      <Card style={{ overflowX: 'auto' }}>
        <table className="tbl" style={{ minWidth: 640 }}>
          <thead>
            <tr>
              <th>Membre</th>
              <th>Grade</th>
              <th>Rôle</th>
            </tr>
          </thead>
          <tbody>
            {list.length === 0 && (
              <tr>
                <td colSpan={3} style={{ color: 'var(--ink-500)', fontSize: 13, padding: '18px 12px' }}>
                  Aucun membre dans ce pôle.
                </td>
              </tr>
            )}
            {list.map((m) => {
              const isLead = m.id === pole.lead
              return (
                <tr key={m.id}>
                  <td>
                    <div className="person">
                      <div className="av-sm">
                        {m.photo ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={m.photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                        ) : (
                          initialsOf(m.name)
                        )}
                      </div>
                      <div className="pn">
                        <b>{m.name}</b>
                        <span>{m.matricule || '—'}</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <GradePill grade={m.grade} />
                  </td>
                  <td>
                    {isLead ? (
                      <span className="grade" style={{ color: pole.color, background: hexToRgba(pole.color) }}>
                        <Icons.shield size={12} style={{ verticalAlign: -2, marginRight: 4 }} />
                        Responsable
                      </span>
                    ) : (
                      <span style={{ color: 'var(--ink-500)', fontSize: 13 }}>Membre</span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </Card>
    </div>
  )
}
