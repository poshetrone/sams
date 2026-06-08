'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Icons } from '@/components/Icons'
import { Badge, Card } from '@/components/ui'
import { STATUS_MAP } from '@/lib/constants'
import { initialsOf } from '@/lib/format'
import { useApp } from '@/lib/app-context'
import PatientModal from './PatientModal'
import type { Patient } from '@/lib/types'

const FILTERS: [string, string][] = [
  ['tous', 'Tous'],
  ['stable', 'Stables'],
  ['suivi', 'En suivi'],
  ['critique', 'Critiques'],
  ['deces', 'Décédés'],
]

export default function PatientsListView({ patients }: { patients: Patient[] }) {
  const router = useRouter()
  const { search } = useApp()
  const [filter, setFilter] = useState('tous')
  const [add, setAdd] = useState(false)

  const go = (id: string) => router.push(`/patients/${id}`)

  const filtered = patients.filter((p) => {
    const okF = filter === 'tous' || p.status === filter
    const okS = !search || `${p.first_name} ${p.last_name} ${p.matricule}`.toLowerCase().includes(search.toLowerCase())
    return okF && okS
  })

  return (
    <div className="view-anim">
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
        <div className="chips">
          {FILTERS.map(([k, l]) => (
            <div key={k} className={`chip ${filter === k ? 'on' : ''}`} onClick={() => setFilter(k)}>
              {l}
            </div>
          ))}
        </div>
        <div style={{ marginLeft: 'auto' }}>
          <button className="btn btn-gold" onClick={() => setAdd(true)}>
            <Icons.plus size={16} /> Nouveau patient
          </button>
        </div>
      </div>
      <Card>
        <table className="tbl">
          <thead>
            <tr>
              <th>Patient</th>
              <th>N° Citoyen</th>
              <th>Groupe</th>
              <th>État</th>
              <th>Dernière visite</th>
              <th>Documents</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => {
              const st = STATUS_MAP[p.status] || STATUS_MAP.stable
              return (
                <tr key={p.id} onClick={() => go(p.id)} style={{ cursor: 'pointer' }}>
                  <td>
                    <div className="person">
                      <div className="av-sm">
                        {p.photo ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={p.photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                        ) : (
                          initialsOf(`${p.first_name} ${p.last_name}`)
                        )}
                      </div>
                      <div className="pn">
                        <b>{p.first_name} {p.last_name}</b>
                        <span>{p.sex} · {p.dob}</span>
                      </div>
                    </div>
                  </td>
                  <td style={{ color: 'var(--ink-400)' }}>{p.matricule}</td>
                  <td><span className="badge gold">{p.blood}</span></td>
                  <td><Badge cls={st.cls}>{st.label}</Badge></td>
                  <td>{p.last_visit}</td>
                  <td><span style={{ color: 'var(--ink-300)' }}>{(p.docs || []).length}</span></td>
                  <td style={{ textAlign: 'right', color: 'var(--ink-500)' }}><Icons.chevR size={16} /></td>
                </tr>
              )
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', color: 'var(--ink-500)', padding: 40 }}>
                  Aucun patient trouvé.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>

      {add && <PatientModal patient={null} onClose={() => setAdd(false)} onSaved={(id) => (id ? go(id) : router.refresh())} />}
    </div>
  )
}
