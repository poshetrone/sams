'use client'
import { useState, useEffect, useMemo } from 'react'
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

const PAGE_SIZE = 10

export default function PatientsListView({ patients }: { patients: Patient[] }) {
  const router = useRouter()
  const { search, canEdit } = useApp()
  const editable = canEdit('patients')
  const [filter, setFilter] = useState('tous')
  const [add, setAdd] = useState(false)
  const [page, setPage] = useState(1)

  const go = (id: string) => router.push(`/patients/${id}`)

  const filtered = useMemo(
    () =>
      patients.filter((p) => {
        const okF = filter === 'tous' || p.status === filter
        const okS = !search || `${p.first_name} ${p.last_name} ${p.matricule}`.toLowerCase().includes(search.toLowerCase())
        return okF && okS
      }),
    [patients, filter, search]
  )

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  // Revient en page 1 dès qu'on change de filtre / recherche.
  useEffect(() => setPage(1), [filter, search])
  // Garde la page courante dans les bornes si la liste rétrécit.
  useEffect(() => setPage((p) => Math.min(p, pageCount)), [pageCount])

  const start = (page - 1) * PAGE_SIZE
  const pageItems = filtered.slice(start, start + PAGE_SIZE)

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
        {editable && (
          <div style={{ marginLeft: 'auto' }}>
            <button className="btn btn-gold" onClick={() => setAdd(true)}>
              <Icons.plus size={16} /> Nouveau patient
            </button>
          </div>
        )}
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
            {pageItems.map((p) => {
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

      {filtered.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginTop: 14, flexWrap: 'wrap' }}>
          <div style={{ fontSize: 12.5, color: 'var(--ink-400)' }}>
            {start + 1}–{Math.min(start + PAGE_SIZE, filtered.length)} sur <b style={{ color: 'var(--ink-200)' }}>{filtered.length}</b> patient{filtered.length > 1 ? 's' : ''}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              className="btn btn-ghost"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              style={{ opacity: page <= 1 ? 0.45 : 1, cursor: page <= 1 ? 'default' : 'pointer' }}
            >
              <Icons.arrowL size={15} /> Précédent
            </button>
            <span style={{ fontSize: 13, color: 'var(--ink-300)', whiteSpace: 'nowrap' }}>
              Page <b style={{ color: 'var(--ink-100)' }}>{page}</b> / {pageCount}
            </span>
            <button
              className="btn btn-ghost"
              onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
              disabled={page >= pageCount}
              style={{ opacity: page >= pageCount ? 0.45 : 1, cursor: page >= pageCount ? 'default' : 'pointer' }}
            >
              Suivant <Icons.chevR size={15} />
            </button>
          </div>
        </div>
      )}

      {add && <PatientModal patient={null} onClose={() => setAdd(false)} onSaved={(id) => (id ? go(id) : router.refresh())} />}
    </div>
  )
}
