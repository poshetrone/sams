'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Icons } from '@/components/Icons'
import { Badge, Card } from '@/components/ui'
import { STATUS_MAP, PATIENTS_PAGE_SIZE } from '@/lib/constants'
import { initialsOf } from '@/lib/format'
import { useApp } from '@/lib/app-context'
import { fetchPatientsPage } from '@/lib/actions/patients'
import PatientModal from './PatientModal'
import type { Page, PatientListItem } from '@/lib/types'

const FILTERS: [string, string][] = [
  ['tous', 'Tous'],
  ['stable', 'Stables'],
  ['suivi', 'En suivi'],
  ['critique', 'Critiques'],
  ['deces', 'Décédés'],
]

/** Délai avant d'interroger l'API pendant la frappe dans la recherche. */
const SEARCH_DEBOUNCE_MS = 300

export default function PatientsListView({ initial }: { initial: Page<PatientListItem> }) {
  const router = useRouter()
  const { search, canEdit } = useApp()
  const editable = canEdit('patients')
  const [filter, setFilter] = useState('tous')
  const [add, setAdd] = useState(false)
  const [page, setPage] = useState(1)
  const [data, setData] = useState(initial)
  const [loading, setLoading] = useState(false)

  const go = (id: string) => router.push(`/patients/${id}`)

  // Recherche temporisée : évite une requête par caractère saisi. Le retour en
  // page 1 est groupé avec la mise à jour du terme (et avec celle du filtre,
  // plus bas) pour ne déclencher qu'un seul chargement.
  const [term, setTerm] = useState(search)
  useEffect(() => {
    const t = setTimeout(() => {
      setTerm(search)
      setPage(1)
    }, SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(t)
  }, [search])

  const pickFilter = (k: string) => {
    setFilter(k)
    setPage(1)
  }

  // Ignore les réponses arrivées dans le désordre (une requête plus lente ne
  // doit pas écraser le résultat d'une requête plus récente).
  const reqId = useRef(0)

  const load = useCallback(
    async (target: number, q: string, status: string, silent = false) => {
      const id = ++reqId.current
      if (!silent) setLoading(true)
      try {
        const res = await fetchPatientsPage({ page: target, q, status })
        if (id !== reqId.current) return
        // La page demandée peut avoir disparu (suppression sur la dernière page).
        if (res.items.length === 0 && res.meta.currentPage > res.meta.lastPage) {
          setPage(res.meta.lastPage)
          return
        }
        setData(res)
      } finally {
        if (id === reqId.current) setLoading(false)
      }
    },
    []
  )

  // La première page est déjà rendue par le serveur : on ne la recharge pas au
  // montage, uniquement lors d'un changement de page / filtre / recherche.
  const mounted = useRef(false)
  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true
      return
    }
    void load(page, term, filter)
  }, [page, term, filter, load])

  const { items, meta } = data
  const pageCount = Math.max(1, meta.lastPage)
  const start = (meta.currentPage - 1) * (meta.perPage || PATIENTS_PAGE_SIZE)

  return (
    <div className="view-anim">
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
        <div className="chips">
          {FILTERS.map(([k, l]) => (
            <div key={k} className={`chip ${filter === k ? 'on' : ''}`} onClick={() => pickFilter(k)}>
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
        <table className="tbl" style={{ opacity: loading ? 0.55 : 1, transition: 'opacity .15s' }}>
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
            {items.map((p) => {
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
                  <td><span style={{ color: 'var(--ink-300)' }}>{p.docs_count}</span></td>
                  <td style={{ textAlign: 'right', color: 'var(--ink-500)' }}><Icons.chevR size={16} /></td>
                </tr>
              )
            })}
            {items.length === 0 && (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', color: 'var(--ink-500)', padding: 40 }}>
                  {loading ? 'Chargement…' : 'Aucun patient trouvé.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>

      {meta.total > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginTop: 14, flexWrap: 'wrap' }}>
          <div style={{ fontSize: 12.5, color: 'var(--ink-400)' }}>
            {start + 1}–{start + items.length} sur <b style={{ color: 'var(--ink-200)' }}>{meta.total}</b> patient{meta.total > 1 ? 's' : ''}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              className="btn btn-ghost"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || loading}
              style={{ opacity: page <= 1 ? 0.45 : 1, cursor: page <= 1 ? 'default' : 'pointer' }}
            >
              <Icons.arrowL size={15} /> Précédent
            </button>
            <span style={{ fontSize: 13, color: 'var(--ink-300)', whiteSpace: 'nowrap' }}>
              Page <b style={{ color: 'var(--ink-100)' }}>{meta.currentPage}</b> / {pageCount}
            </span>
            <button
              className="btn btn-ghost"
              onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
              disabled={page >= pageCount || loading}
              style={{ opacity: page >= pageCount ? 0.45 : 1, cursor: page >= pageCount ? 'default' : 'pointer' }}
            >
              Suivant <Icons.chevR size={15} />
            </button>
          </div>
        </div>
      )}

      {add && (
        <PatientModal
          patient={null}
          onClose={() => setAdd(false)}
          onSaved={(id) => (id ? go(id) : void load(page, term, filter, true))}
        />
      )}
    </div>
  )
}
