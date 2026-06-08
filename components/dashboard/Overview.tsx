'use client'
import { useRouter } from 'next/navigation'
import { Icons } from '@/components/Icons'
import { Badge, Card, KPI, SecTitle } from '@/components/ui'
import { STATUS_MAP } from '@/lib/constants'
import { initialsOf } from '@/lib/format'
import type { Patient, Member, Appointment } from '@/lib/types'

const weekData = [
  { d: 'Lun', v: 62 }, { d: 'Mar', v: 80 }, { d: 'Mer', v: 48 },
  { d: 'Jeu', v: 95 }, { d: 'Ven', v: 73 }, { d: 'Sam', v: 100 }, { d: 'Dim', v: 55 },
]

export default function Overview({ patients, members, reqCount }: { patients: Patient[]; members: Member[]; reqCount: number }) {
  const router = useRouter()
  const onDuty = members.filter((m) => m.status === 'service' || m.status === 'intervention').length
  const maxV = 100

  const reminders: { p: Patient; a: Appointment }[] = []
  patients.forEach((p) => (p.appointments || []).filter((a) => !a.done).forEach((a) => reminders.push({ p, a })))
  reminders.sort((x, y) => (x.a.dateIso || '').localeCompare(y.a.dateIso || ''))

  const go = (id: string) => router.push(`/patients/${id}`)

  return (
    <div className="view-anim">
      <div className="kpi-grid" style={{ marginBottom: 24 }}>
        <KPI label="Patients suivis" val={patients.length} trend="+2 cette semaine" dir="up" icon="patients" />
        <KPI label="Documents émis (mois)" val="38" trend="+12%" dir="up" icon="docs" />
        <KPI label="Personnel en service" val={onDuty} unit={`/ ${members.length}`} icon="effectifs" />
        <KPI label="Demandes d'accès" val={reqCount} trend="à traiter" dir={reqCount ? 'up' : 'down'} icon="access" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 24, alignItems: 'start' }}>
        <Card>
          <div className="card-head">
            <h3>Activité — interventions par jour</h3>
            <span className="sub">7 derniers jours</span>
            <div className="spacer"></div>
            <Badge cls="ok">+18% vs sem. dern.</Badge>
          </div>
          <div className="card-pad">
            <div className="bars">
              {weekData.map((d, i) => (
                <div className="bar-col" key={d.d}>
                  <div className={`bar ${i === 5 ? '' : i % 3 === 1 ? 'muted' : ''}`} style={{ height: `${(d.v / maxV) * 100}%` }}></div>
                  <div className="bar-lbl">{d.d}</div>
                </div>
              ))}
            </div>
          </div>
        </Card>

        <Card>
          <div className="card-head"><h3>Rappels &amp; rendez-vous</h3><Icons.calendar size={16} style={{ color: 'var(--gold-400)', marginLeft: 'auto' }} /></div>
          <div className="card-pad" style={{ paddingTop: 8, paddingBottom: 8 }}>
            {reminders.length === 0 && <p style={{ color: 'var(--ink-500)', fontSize: 13, padding: '12px 0' }}>Aucun rendez-vous à venir.</p>}
            <div className="timeline">
              {reminders.slice(0, 5).map(({ p, a }, i) => (
                <div className="tl-item" key={i} onClick={() => go(p.id)} style={{ cursor: 'pointer' }}>
                  <div className="tl-dot"><Icons.calendar size={13} /></div>
                  <div className="tl-body"><p><b>{a.date}</b> — {a.reason}</p><div className="t">{p.first_name} {p.last_name} · {a.time}</div></div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      <SecTitle action={<span className="btn btn-ghost" onClick={() => router.push('/patients')}>Voir tous les patients <Icons.chevR size={14} /></span>}>Patients récents</SecTitle>
      <Card>
        <table className="tbl">
          <thead><tr><th>Patient</th><th>N° Citoyen</th><th>État</th><th>Dernière visite</th><th>Documents</th></tr></thead>
          <tbody>
            {patients.slice(0, 4).map((p) => {
              const stt = STATUS_MAP[p.status] || STATUS_MAP.stable
              return (
                <tr key={p.id} onClick={() => go(p.id)} style={{ cursor: 'pointer' }}>
                  <td>
                    <div className="person">
                      <div className="av-sm">{p.photo ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                      ) : initialsOf(`${p.first_name} ${p.last_name}`)}</div>
                      <div className="pn"><b>{p.first_name} {p.last_name}</b><span>{p.sex} · {p.dob}</span></div>
                    </div>
                  </td>
                  <td style={{ color: 'var(--ink-400)' }}>{p.matricule}</td>
                  <td><Badge cls={stt.cls}>{stt.label}</Badge></td>
                  <td>{p.last_visit}</td>
                  <td><span className="badge gold">{(p.docs || []).length} pièce{(p.docs || []).length > 1 ? 's' : ''}</span></td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </Card>
    </div>
  )
}
