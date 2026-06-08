'use client'
import { useState } from 'react'
import Modal from '@/components/Modal'
import { Icons } from '@/components/Icons'
import { GRADES, POLES } from '@/lib/constants'
import { fmtPhone } from '@/lib/format'
import { createMember, updateMember, type MemberInput } from '@/lib/actions/members'
import type { Member } from '@/lib/types'

const STATUS_OPTS: [string, string][] = [
  ['service', 'En service'],
  ['intervention', 'Intervention'],
  ['repos', 'Repos'],
  ['formation', 'Formation'],
]

export default function EmployeeModal({
  employee,
  onClose,
  onSaved,
}: {
  employee: Member | null
  onClose: () => void
  onSaved: () => void
}) {
  const isNew = !employee
  const [f, setF] = useState<MemberInput>(
    employee
      ? {
          id: employee.id,
          name: employee.name,
          grade: employee.grade,
          discord: employee.discord || '',
          discord_id: employee.discord_id || '',
          matricule: employee.matricule || '',
          status: employee.status,
          poles: employee.poles || [],
          formations: employee.formations || [],
          warnings: employee.warnings || 0,
          phone: employee.phone || '',
          since: employee.since || '',
        }
      : { name: '', grade: 'ambulancier', discord: '', discord_id: '', matricule: '', status: 'service', poles: [], formations: [], warnings: 0, phone: '' }
  )
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const set = (k: keyof MemberInput, v: unknown) => setF((prev) => ({ ...prev, [k]: v }))
  const togglePole = (pk: string) => {
    const cur = f.poles || []
    set('poles', cur.includes(pk) ? cur.filter((x) => x !== pk) : [...cur, pk])
  }

  const save = async () => {
    if (!f.name.trim()) {
      setError('Le nom est requis')
      return
    }
    setBusy(true)
    setError(null)
    const res = isNew ? await createMember(f) : await updateMember(f)
    setBusy(false)
    if (!res.ok) {
      setError(res.error || 'Erreur')
      return
    }
    onSaved()
    onClose()
  }

  return (
    <Modal onClose={onClose} title={isNew ? 'Ajouter un employé' : "Modifier l'employé"} icon={<Icons.effectifs size={20} />}>
      <div className="editor-panel">
        <div className="ep-field">
          <label>Nom &amp; prénom</label>
          <input value={f.name} onChange={(e) => set('name', e.target.value)} placeholder="Prénom Nom" autoFocus />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <div className="ep-field">
            <label>Grade</label>
            <select value={f.grade} onChange={(e) => set('grade', e.target.value)}>
              {Object.entries(GRADES)
                .sort((a, b) => a[1].rank - b[1].rank)
                .map(([k, g]) => (
                  <option key={k} value={k}>
                    {g.label}
                  </option>
                ))}
            </select>
          </div>
          <div className="ep-field">
            <label>Matricule</label>
            <input value={f.matricule} onChange={(e) => set('matricule', e.target.value)} placeholder="SAMS-000" />
          </div>
        </div>
        <div className="ep-field">
          <label>Pseudo Discord</label>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: 12, top: 10, color: 'var(--ink-500)' }}>@</span>
            <input style={{ paddingLeft: 24 }} value={f.discord} onChange={(e) => set('discord', e.target.value)} placeholder="pseudo.discord" />
          </div>
        </div>
        <div className="ep-field">
          <label>
            ID Discord <span style={{ color: 'var(--ink-500)', fontWeight: 400 }}>(rattachement du compte)</span>
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--navy-800)', border: '1px solid var(--navy-line-soft)', borderRadius: 9, padding: '0 12px' }}>
            <Icons.discord size={16} style={{ color: '#5865F2', flex: '0 0 auto' }} />
            <input style={{ background: 'none', border: 'none', padding: '10px 0' }} value={f.discord_id} onChange={(e) => set('discord_id', e.target.value.replace(/\D/g, ''))} placeholder="ex : 184920113377091584" />
          </div>
        </div>
        <div className="ep-field">
          <label>Téléphone</label>
          <input value={fmtPhone(f.phone)} onChange={(e) => set('phone', e.target.value.replace(/\D/g, '').slice(0, 10))} placeholder="(205) 489-6589" />
        </div>
        <div className="ep-field">
          <label>Statut</label>
          <select value={f.status} onChange={(e) => set('status', e.target.value)}>
            {STATUS_OPTS.map(([k, l]) => (
              <option key={k} value={k}>
                {l}
              </option>
            ))}
          </select>
        </div>
        <div className="ep-field">
          <label>Avertissements</label>
          <div className="chips">
            {[0, 1, 2, 3].map((n) => (
              <div
                key={n}
                className={`chip ${(f.warnings || 0) === n ? 'on' : ''}`}
                onClick={() => set('warnings', n)}
                style={(f.warnings || 0) === n && n > 0 ? { color: n === 1 ? '#e3a83f' : '#e85c52', borderColor: n === 1 ? 'rgba(227,168,63,0.5)' : 'rgba(232,92,82,0.5)', background: 'transparent' } : undefined}
              >
                {n === 0 ? 'Aucun' : `Avertissement ${n}`}
              </div>
            ))}
          </div>
        </div>
        <div className="ep-field">
          <label>
            Pôles rattachés <span style={{ color: 'var(--ink-500)', fontWeight: 400 }}>(sélection multiple)</span>
          </label>
          <div className="chips">
            {POLES.map((p) => {
              const on = (f.poles || []).includes(p.key)
              return (
                <div key={p.key} className={`chip ${on ? 'on' : ''}`} onClick={() => togglePole(p.key)} style={on ? { color: p.color, borderColor: p.color, background: p.bg } : undefined}>
                  {on && <Icons.check size={12} style={{ verticalAlign: -1, marginRight: 4 }} />}
                  {p.label}
                </div>
              )
            })}
          </div>
        </div>
        {error && <div style={{ color: 'var(--crit)', fontSize: 13, marginTop: 12 }}>{error}</div>}
        <div style={{ display: 'flex', gap: 10, marginTop: 22 }}>
          <button className="btn btn-ghost" style={{ flex: 1, justifyContent: 'center' }} onClick={onClose} disabled={busy}>
            Annuler
          </button>
          <button className="btn btn-gold" style={{ flex: 1, justifyContent: 'center' }} onClick={save} disabled={busy}>
            <Icons.check size={15} /> {busy ? 'Enregistrement…' : isNew ? 'Ajouter' : 'Enregistrer'}
          </button>
        </div>
      </div>
    </Modal>
  )
}
