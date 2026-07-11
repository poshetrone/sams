'use client'
import { useState } from 'react'
import Modal from '@/components/Modal'
import { Icons } from '@/components/Icons'
import { hexToRgba } from '@/lib/format'
import { savePole, deletePole } from '@/lib/actions/poles'
import type { Member, PoleRow } from '@/lib/types'

/** Icônes proposées pour un pôle (sous-ensemble pertinent de Icons). */
const POLE_ICONS = ['scalpel', 'pill', 'brain', 'heart', 'pulse', 'shield', 'body', 'patient', 'cross', 'eye', 'target', 'briefcase', 'medal', 'bell'] as const

type Draft = { key?: string; label: string; color: string; icon: string; lead: string | null }

const EMPTY: Draft = { label: '', color: '#7f9fe0', icon: 'medal', lead: null }

export default function PolesManager({
  poles,
  members,
  onClose,
  onChanged,
}: {
  poles: PoleRow[]
  members: Member[]
  onClose: () => void
  onChanged: () => void
}) {
  const [draft, setDraft] = useState<Draft | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirmDel, setConfirmDel] = useState<PoleRow | null>(null)

  const set = (k: keyof Draft, v: unknown) => setDraft((d) => (d ? { ...d, [k]: v } : d))
  const leadName = (id: string | null) => members.find((m) => m.id === id)?.name || null

  const save = async () => {
    if (!draft) return
    if (!draft.label.trim()) {
      setError('Le nom est requis')
      return
    }
    setBusy(true)
    setError(null)
    const res = await savePole({ key: draft.key, label: draft.label.trim(), color: draft.color, icon: draft.icon, lead: draft.lead })
    setBusy(false)
    if (!res.ok) {
      setError(res.error || 'Erreur')
      return
    }
    setDraft(null)
    onChanged()
  }

  const remove = async (p: PoleRow) => {
    setBusy(true)
    const res = await deletePole(p.key)
    setBusy(false)
    setConfirmDel(null)
    if (res.ok) {
      if (draft?.key === p.key) setDraft(null)
      onChanged()
    } else {
      setError(res.error || 'Erreur')
    }
  }

  return (
    <Modal onClose={onClose} title="Gérer les pôles" icon={<Icons.effectifs size={20} />} wide>
      <div style={{ fontSize: 13, color: 'var(--ink-400)', marginBottom: 14 }}>
        Les pôles sont des spécialités rattachables aux membres depuis leur fiche. Réservé à la Direction.
      </div>

      {/* Liste des pôles existants */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 18 }}>
        {poles.length === 0 && <div style={{ color: 'var(--ink-500)', fontSize: 13 }}>Aucun pôle pour le moment.</div>}
        {poles.map((p) => {
          const I = Icons[p.icon as keyof typeof Icons] || Icons.medal
          const lead = leadName(p.lead)
          return (
            <div
              key={p.key}
              style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 10, background: 'var(--navy-800)', border: `1px solid ${draft?.key === p.key ? p.color : 'var(--navy-line-soft)'}` }}
            >
              <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 34, height: 34, borderRadius: 9, color: p.color, background: hexToRgba(p.color) }}>
                <I size={16} />
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ color: 'var(--ink-100)', fontWeight: 600, fontSize: 14 }}>{p.label}</div>
                <div style={{ color: 'var(--ink-500)', fontSize: 12 }}>
                  {lead ? <>Responsable : <b style={{ color: 'var(--ink-300)' }}>{lead}</b></> : 'Sans responsable'}
                </div>
              </div>
              <div className="icon-btn" style={{ width: 34, height: 34 }} title="Modifier" onClick={() => { setError(null); setDraft({ key: p.key, label: p.label, color: p.color, icon: p.icon, lead: p.lead }) }}>
                <Icons.edit size={15} />
              </div>
              <div className="icon-btn" style={{ width: 34, height: 34 }} title="Supprimer" onClick={() => setConfirmDel(p)}>
                <Icons.trash size={15} />
              </div>
            </div>
          )
        })}
      </div>

      {/* Éditeur (création ou modification) */}
      {draft ? (
        <div className="editor-panel" style={{ borderTop: '1px solid var(--navy-line)', paddingTop: 16 }}>
          <div style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '.5px', color: 'var(--ink-500)', fontWeight: 700, marginBottom: 12 }}>
            {draft.key ? 'Modifier le pôle' : 'Nouveau pôle'}
          </div>
          <div className="ep-field">
            <label>Nom du pôle</label>
            <input value={draft.label} onChange={(e) => set('label', e.target.value)} placeholder="Ex : Pôle Chirurgie" autoFocus />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div className="ep-field">
              <label>Couleur</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <input type="color" value={draft.color} onChange={(e) => set('color', e.target.value)} style={{ width: 44, height: 38, padding: 2, background: 'var(--navy-800)', border: '1px solid var(--navy-line-soft)', borderRadius: 9, cursor: 'pointer' }} />
                <input value={draft.color} onChange={(e) => set('color', e.target.value)} style={{ flex: 1 }} placeholder="#7f9fe0" />
              </div>
            </div>
            <div className="ep-field">
              <label>Responsable</label>
              <select value={draft.lead ?? ''} onChange={(e) => set('lead', e.target.value || null)}>
                <option value="">— Aucun —</option>
                {[...members]
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
              </select>
            </div>
          </div>
          <div className="ep-field">
            <label>Icône</label>
            <div className="chips">
              {POLE_ICONS.map((ik) => {
                const I = Icons[ik] || Icons.medal
                const on = draft.icon === ik
                return (
                  <div key={ik} className={`chip ${on ? 'on' : ''}`} onClick={() => set('icon', ik)} style={on ? { color: draft.color, borderColor: draft.color, background: hexToRgba(draft.color) } : undefined}>
                    <I size={15} />
                  </div>
                )
              })}
            </div>
          </div>
          {error && <div style={{ color: 'var(--crit)', fontSize: 13, marginTop: 8 }}>{error}</div>}
          <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
            <button className="btn btn-ghost" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setDraft(null)} disabled={busy}>
              Annuler
            </button>
            <button className="btn btn-gold" style={{ flex: 1, justifyContent: 'center' }} onClick={save} disabled={busy}>
              <Icons.check size={15} /> {busy ? 'Enregistrement…' : draft.key ? 'Enregistrer' : 'Créer le pôle'}
            </button>
          </div>
        </div>
      ) : (
        <button className="btn btn-gold" style={{ width: '100%', justifyContent: 'center' }} onClick={() => { setError(null); setDraft({ ...EMPTY }) }}>
          <Icons.plus size={16} /> Ajouter un pôle
        </button>
      )}

      {/* Confirmation de suppression */}
      {confirmDel && (
        <div className="modal-overlay" onClick={() => setConfirmDel(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 440 }}>
            <div className="modal-head">
              <div className="kpi-ico" style={{ position: 'static' }}><Icons.trash size={20} /></div>
              <div><h3 style={{ fontSize: 17, color: 'var(--ink-100)', fontWeight: 600 }}>Supprimer le pôle</h3></div>
              <div className="modal-x" onClick={() => setConfirmDel(null)}><Icons.x size={18} /></div>
            </div>
            <div className="modal-body">
              <p style={{ color: 'var(--ink-200)', fontSize: 14, lineHeight: 1.6 }}>
                Supprimer <b style={{ color: 'var(--ink-100)' }}>{confirmDel.label}</b> ? Il sera retiré de tous les membres qui y sont rattachés.
              </p>
              <div style={{ display: 'flex', gap: 10, marginTop: 22 }}>
                <button className="btn btn-ghost" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setConfirmDel(null)} disabled={busy}>Annuler</button>
                <button className="btn-refuse" style={{ flex: 1, justifyContent: 'center' }} onClick={() => remove(confirmDel)} disabled={busy}>
                  <Icons.trash size={15} /> {busy ? 'Suppression…' : 'Supprimer'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Modal>
  )
}
