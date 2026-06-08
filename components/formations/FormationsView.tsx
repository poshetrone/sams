'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Icons } from '@/components/Icons'
import { Card } from '@/components/ui'
import Modal from '@/components/Modal'
import { GRADES, type GradeKey } from '@/lib/constants'
import { initialsOf } from '@/lib/format'
import { useApp } from '@/lib/app-context'
import { updateMemberFormations } from '@/lib/actions/members'
import { saveFormation, deleteFormation } from '@/lib/actions/formations'
import type { Member, FormationRow } from '@/lib/types'

export default function FormationsView({ members: initialMembers, formations }: { members: Member[]; formations: FormationRow[] }) {
  const router = useRouter()
  const { search, isAdmin } = useApp()
  const [members, setMembers] = useState(initialMembers)
  useEffect(() => setMembers(initialMembers), [initialMembers])
  const [modal, setModal] = useState<FormationRow | 'new' | null>(null)

  const total = formations.length
  const list = members
    .filter((m) => !search || m.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => (GRADES[b.grade as GradeKey]?.rank ?? 0) - (GRADES[a.grade as GradeKey]?.rank ?? 0))

  const toggle = (id: string, fk: string) => {
    if (!isAdmin) return
    setMembers((prev) =>
      prev.map((m) => {
        if (m.id !== id) return m
        const cur = m.formations || []
        const next = cur.includes(fk) ? cur.filter((x) => x !== fk) : [...cur, fk]
        updateMemberFormations(id, next)
        return { ...m, formations: next }
      })
    )
  }
  const colCount = (fk: string) => members.filter((m) => (m.formations || []).includes(fk)).length

  return (
    <div className="view-anim">
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
        <div style={{ fontSize: 13.5, color: 'var(--ink-400)' }}>
          Cochez les formations validées par chaque membre · <b style={{ color: 'var(--ink-100)' }}>{total}</b> formations au catalogue
        </div>
        {isAdmin && <button className="btn btn-gold" style={{ marginLeft: 'auto' }} onClick={() => setModal('new')}><Icons.plus size={16} /> Ajouter une formation</button>}
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
        {formations.map((f) => {
          const I = Icons[f.icon] || Icons.medal
          return (
            <span key={f.key} className="form-chip" onClick={isAdmin ? () => setModal(f) : undefined} style={{ cursor: isAdmin ? 'pointer' : 'default' }} title={isAdmin ? 'Modifier' : undefined}>
              <I size={12} style={{ color: 'var(--gold-400)' }} /> {f.label}{isAdmin && <Icons.edit size={11} style={{ opacity: 0.5, marginLeft: 2 }} />}
            </span>
          )
        })}
      </div>

      <Card style={{ overflowX: 'auto' }}>
        <table className="tbl form-matrix" style={{ minWidth: 880 }}>
          <thead>
            <tr>
              <th style={{ position: 'sticky', left: 0, background: 'var(--navy-800)', zIndex: 2, minWidth: 220 }}>Employé</th>
              {formations.map((f) => (
                <th key={f.key} style={{ textAlign: 'center', minWidth: 74, cursor: isAdmin ? 'pointer' : 'default' }} title={isAdmin ? `${f.label} — cliquer pour modifier` : f.label} onClick={isAdmin ? () => setModal(f) : undefined}>{f.short}</th>
              ))}
              <th style={{ textAlign: 'center', minWidth: 90 }}>Progression</th>
            </tr>
          </thead>
          <tbody>
            {list.map((m) => {
              const fs = m.formations || []
              const valid = fs.filter((k) => formations.some((f) => f.key === k)).length
              const pct = total ? Math.round((valid / total) * 100) : 0
              return (
                <tr key={m.id} style={{ cursor: 'default' }}>
                  <td style={{ position: 'sticky', left: 0, background: 'var(--navy-850)', zIndex: 1 }}>
                    <div className="person">
                      <div className="av-sm">{m.photo ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={m.photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                      ) : initialsOf(m.name)}</div>
                      <div style={{ lineHeight: 1.3, minWidth: 0 }}>
                        <b style={{ fontSize: 13.5, color: 'var(--ink-100)', fontWeight: 600, whiteSpace: 'nowrap', display: 'block' }}>{m.name}</b>
                        <span style={{ fontSize: 11, fontWeight: 600, color: GRADES[m.grade as GradeKey]?.color, whiteSpace: 'nowrap' }}>{GRADES[m.grade as GradeKey]?.label}</span>
                      </div>
                    </div>
                  </td>
                  {formations.map((f) => {
                    const on = fs.includes(f.key)
                    return (
                      <td key={f.key} style={{ textAlign: 'center', cursor: isAdmin ? 'pointer' : 'default' }} onClick={isAdmin ? () => toggle(m.id, f.key) : undefined}>
                        <div className={`form-cell ${on ? 'on' : ''}`}>{on && <Icons.check size={15} />}</div>
                      </td>
                    )
                  })}
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                      <div style={{ flex: 1, height: 7, background: 'var(--navy-800)', borderRadius: 5, overflow: 'hidden', minWidth: 44 }}>
                        <div style={{ width: `${pct}%`, height: '100%', background: pct === 100 ? 'linear-gradient(90deg,var(--gold-600),var(--gold-300))' : 'var(--gold-500)', borderRadius: 5, transition: 'width .4s' }}></div>
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 700, color: pct === 100 ? 'var(--gold-300)' : 'var(--ink-300)', minWidth: 32 }}>{valid}/{total}</span>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
          <tfoot>
            <tr style={{ borderTop: '2px solid var(--navy-line)' }}>
              <td style={{ position: 'sticky', left: 0, background: 'var(--navy-800)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '.5px', color: 'var(--ink-500)', fontWeight: 700 }}>Validations</td>
              {formations.map((f) => (
                <td key={f.key} style={{ textAlign: 'center', fontSize: 13, fontWeight: 700, color: 'var(--gold-400)' }}>{colCount(f.key)}</td>
              ))}
              <td></td>
            </tr>
          </tfoot>
        </table>
      </Card>

      {modal && (
        <FormationModal
          formation={modal === 'new' ? null : modal}
          existingKeys={formations.map((f) => f.key)}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); router.refresh() }}
        />
      )}
    </div>
  )
}

function FormationModal({ formation, existingKeys, onClose, onSaved }: { formation: FormationRow | null; existingKeys: string[]; onClose: () => void; onSaved: () => void }) {
  const isNew = !formation
  const [label, setLabel] = useState(formation ? formation.label : '')
  const [short, setShort] = useState(formation ? formation.short || '' : '')
  const [busy, setBusy] = useState(false)

  const save = async () => {
    if (!label.trim()) return
    setBusy(true)
    const res = await saveFormation({ key: formation?.key, label, short }, existingKeys)
    setBusy(false)
    if (res.ok) onSaved()
  }
  const remove = async () => {
    if (!formation) return
    setBusy(true)
    const res = await deleteFormation(formation.key)
    setBusy(false)
    if (res.ok) onSaved()
  }

  return (
    <Modal onClose={onClose} title={isNew ? 'Nouvelle formation' : 'Modifier la formation'} icon={<Icons.medal size={20} />}>
      <div className="editor-panel">
        <div className="ep-field"><label>Nom de la formation</label><input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Ex : Formation Chirurgie" autoFocus /></div>
        <div className="ep-field"><label>Abréviation <span style={{ color: 'var(--ink-500)', fontWeight: 400 }}>(en-tête de colonne)</span></label><input value={short} onChange={(e) => setShort(e.target.value)} placeholder="Ex : Chirurgie" /></div>
        <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
          {!isNew && <button className="btn-refuse" onClick={remove} disabled={busy}><Icons.trash size={15} /></button>}
          <button className="btn btn-ghost" style={{ flex: 1, justifyContent: 'center' }} onClick={onClose} disabled={busy}>Annuler</button>
          <button className="btn btn-gold" style={{ flex: 1, justifyContent: 'center' }} onClick={save} disabled={busy}><Icons.check size={15} /> {isNew ? 'Ajouter' : 'Enregistrer'}</button>
        </div>
      </div>
    </Modal>
  )
}
