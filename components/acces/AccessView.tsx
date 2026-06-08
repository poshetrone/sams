'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Icons } from '@/components/Icons'
import { Card, SecTitle } from '@/components/ui'
import { GRADES, type GradeKey } from '@/lib/constants'
import { initialsOf } from '@/lib/format'
import { useApp } from '@/lib/app-context'
import { approveAccess, refuseAccess, linkAccess } from '@/lib/actions/access'
import { updateMember, deleteMember, type MemberInput } from '@/lib/actions/members'
import type { Access, Member } from '@/lib/types'

const gradeOpts = Object.entries(GRADES).sort((a, b) => b[1].rank - a[1].rank)

export default function AccessView({ requests, members }: { requests: Access[]; members: Member[] }) {
  const router = useRouter()
  const { member: me, isAdmin } = useApp()
  const [toast, setToast] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [linkForm, setLinkForm] = useState({ memberId: '', discordId: '', grade: 'ambulancier' })
  const flash = (m: string) => { setToast(m); setTimeout(() => setToast(null), 2400) }

  // Sélection d'un employé dans le pré-ajout → pré-remplit ID Discord + grade.
  const pickMember = (id: string) => {
    const m = members.find((x) => x.id === id)
    setLinkForm({ memberId: id, discordId: m?.discord_id || '', grade: m?.grade || 'ambulancier' })
  }

  if (!isAdmin) {
    return (
      <div className="placeholder-view view-anim">
        <div className="pv-ico"><Icons.lock size={28} /></div>
        <h3>Accès restreint</h3>
        <p>La gestion des accès est réservée à la Direction (Directeur, Co-Directeur, Direction Générale).</p>
      </div>
    )
  }

  const accept = async (r: Access) => {
    setBusy(true)
    const res = await approveAccess(r.id)
    setBusy(false)
    if (res.ok) { flash(`Accès accordé à ${r.name || r.discord}`); router.refresh() } else flash(res.error || 'Erreur')
  }
  const refuse = async (r: Access) => {
    setBusy(true)
    const res = await refuseAccess(r.id, r.name || r.discord || '')
    setBusy(false)
    if (res.ok) { flash(`Demande de ${r.name || r.discord} refusée`); router.refresh() } else flash(res.error || 'Erreur')
  }
  const changeGrade = async (m: Member, grade: string) => {
    const input: MemberInput = {
      id: m.id, name: m.name, grade, discord: m.discord || '', discord_id: m.discord_id || '',
      matricule: m.matricule || '', status: m.status, phone: m.phone || '', poles: m.poles, formations: m.formations,
      warnings: m.warnings, since: m.since || '',
    }
    const res = await updateMember(input)
    if (res.ok) router.refresh()
    else flash(res.error || 'Erreur')
  }
  const remove = async (m: Member) => {
    setBusy(true)
    const res = await deleteMember(m.id, m.name)
    setBusy(false)
    if (res.ok) { flash(`Accès de ${m.name} retiré`); router.refresh() } else flash(res.error || 'Erreur')
  }
  const doLink = async () => {
    if (!linkForm.memberId) { flash('Sélectionnez un employé'); return }
    if (!linkForm.discordId.trim()) { flash('ID Discord requis'); return }
    setBusy(true)
    const res = await linkAccess(linkForm.memberId, linkForm.discordId, linkForm.grade)
    setBusy(false)
    if (res.ok) { setLinkForm({ memberId: '', discordId: '', grade: 'ambulancier' }); flash('Accès Discord rattaché ✓'); router.refresh() } else flash(res.error || 'Erreur')
  }

  return (
    <div className="view-anim">
      <SecTitle>
        Demandes en attente {requests.length > 0 && <span className="badge crit" style={{ marginLeft: 4 }}>{requests.length}</span>}
      </SecTitle>
      <Card style={{ marginBottom: 28 }}>
        {requests.length === 0 && <div style={{ padding: 36, textAlign: 'center', color: 'var(--ink-500)', fontSize: 13.5 }}>Aucune demande en attente. ✓</div>}
        {requests.map((r, i) => (
          <div className="req-card" key={r.id} style={{ borderBottom: i < requests.length - 1 ? '1px solid var(--navy-line-soft)' : 'none' }}>
            <div className="av" style={{ background: '#5865F2' }}>{initialsOf(r.name || r.discord || '?')}</div>
            <div className="ri">
              <b>{r.name}</b>
              <span className="disc"> · <Icons.discord size={12} style={{ verticalAlign: -1, color: '#5865F2' }} /> {r.discord}</span>
              <div className="meta">{r.note}</div>
            </div>
            <div className="req-actions">
              <button className="btn-refuse" onClick={() => refuse(r)} disabled={busy}><Icons.x size={15} /> Refuser</button>
              <button className="btn-accept" onClick={() => accept(r)} disabled={busy}><Icons.check size={15} /> Accepter</button>
            </div>
          </div>
        ))}
      </Card>

      <SecTitle>Comptes Discord autorisés</SecTitle>

      <div className="acc-addform" style={{ marginBottom: 18 }}>
        <div className="acc-add-head"><Icons.discord size={18} style={{ color: '#5865F2' }} /> <b>Pré-ajouter un accès</b></div>
        <div className="acc-add-grid" style={{ gridTemplateColumns: '1.4fr 1fr 1fr auto' }}>
          <div className="ep-field">
            <label>Employé</label>
            <select className="acc-select" style={{ width: '100%', maxWidth: 'none' }} value={linkForm.memberId} onChange={(e) => pickMember(e.target.value)}>
              <option value="">— Choisir un employé —</option>
              {members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </div>
          <div className="ep-field">
            <label>ID Discord (snowflake)</label>
            <input value={linkForm.discordId} onChange={(e) => setLinkForm((p) => ({ ...p, discordId: e.target.value.replace(/\D/g, '') }))} placeholder="184920113377091584" />
          </div>
          <div className="ep-field">
            <label>Grade</label>
            <select className="acc-select" style={{ width: '100%', maxWidth: 'none' }} value={linkForm.grade} onChange={(e) => setLinkForm((p) => ({ ...p, grade: e.target.value }))}>
              {gradeOpts.map(([k, gg]) => <option key={k} value={k}>{gg.label}</option>)}
            </select>
          </div>
          <button className="btn-neon-gold acc-authorize" onClick={doLink} disabled={busy}><Icons.check size={16} /> Rattacher</button>
        </div>
      </div>

      <Card style={{ overflowX: 'auto', marginBottom: 28 }}>
        <table className="tbl acc-tbl" style={{ minWidth: 860 }}>
          <thead><tr><th>Compte Discord</th><th>ID</th><th>Grade</th><th>Statut</th><th>Ajouté le</th><th style={{ textAlign: 'right' }}>Actions</th></tr></thead>
          <tbody>
            {members.map((m) => {
              const gc = GRADES[m.grade as GradeKey] || GRADES.ambulancier
              const current = m.id === me.id
              return (
                <tr key={m.id}>
                  <td>
                    <div className="person">
                      <div className="av-sm" style={{ background: '#5865F2', color: '#fff' }}>{initialsOf((m.discord || m.name).replace(/[._]/g, ' '))}</div>
                      <div className="pn"><b style={{ color: gc.color }}>@{m.discord || '—'}{current && <span className="acc-current">session actuelle</span>}</b><span>{m.name}</span></div>
                    </div>
                  </td>
                  <td style={{ color: 'var(--ink-400)', fontSize: 12, fontFamily: 'monospace' }}>{m.discord_id || '—'}</td>
                  <td>
                    <select className="acc-select grade" value={m.grade} onChange={(e) => changeGrade(m, e.target.value)} style={{ color: gc.color, borderColor: gc.color }}>
                      {gradeOpts.map(([k, gg]) => <option key={k} value={k}>{gg.label}</option>)}
                    </select>
                  </td>
                  <td><span className="badge ok">Actif</span></td>
                  <td style={{ color: 'var(--ink-400)', fontSize: 12.5 }}>{m.since || '—'}</td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: 6 }}>
                      {!current ? (
                        <div className="icon-btn" style={{ width: 32, height: 32 }} title="Retirer l'accès" onClick={() => remove(m)}><Icons.trash size={14} /></div>
                      ) : (
                        <div className="icon-btn" style={{ width: 32, height: 32, opacity: 0.4, pointerEvents: 'none' }}><Icons.shield size={14} /></div>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </Card>

      {toast &&<div style={{ position: 'fixed', bottom: 28, left: '50%', transform: 'translateX(-50%)', background: 'var(--navy-600)', border: '1px solid var(--gold-glow)', color: 'var(--gold-300)', padding: '12px 22px', borderRadius: 12, fontSize: 13.5, fontWeight: 600, zIndex: 90, boxShadow: 'var(--shadow-pop)' }}>{toast}</div>}
    </div>
  )
}
