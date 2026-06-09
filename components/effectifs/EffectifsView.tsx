'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Icons } from '@/components/Icons'
import { Badge, GradePill, Card } from '@/components/ui'
import Modal from '@/components/Modal'
import EmployeeModal from './EmployeeModal'
import ContractEditor from './ContractEditor'
import ContractCell from './ContractCell'
import { GRADES, POLES, MEMBER_STATUS, type GradeKey } from '@/lib/constants'
import { fmtPhone, initialsOf } from '@/lib/format'
import { useApp } from '@/lib/app-context'
import { deleteMember } from '@/lib/actions/members'
import type { Member } from '@/lib/types'

function WarnCrosses({ n }: { n: number }) {
  const full = n >= 3
  return (
    <span className={`warn-crosses ${full ? 'fired' : ''}`} title={full ? 'À licencier (3/3)' : `${n}/3 avertissement(s)`}>
      <span className="wc-marks">
        {[1, 2, 3].map((i) => (
          <span key={i} className={`wc-x ${n >= i ? 'on' : ''}`}>
            ✕
          </span>
        ))}
      </span>
      {full && <span className="wc-fire">À LICENCIER</span>}
    </span>
  )
}

export default function EffectifsView({ members }: { members: Member[] }) {
  const router = useRouter()
  const { can, search, canEdit } = useApp()
  const editable = canEdit('effectifs')
  const isAdmin = can('manageStaff') && editable
  const [modal, setModal] = useState<'new' | { employee: Member } | null>(null)
  const [contract, setContract] = useState(false)
  const [confirmDel, setConfirmDel] = useState<Member | null>(null)
  const [busy, setBusy] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  const flash = (m: string) => {
    setToast(m)
    setTimeout(() => setToast(null), 2400)
  }

  const filtered = members
    .filter((m) => !search || `${m.name} ${m.discord} ${m.matricule}`.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => (GRADES[b.grade as GradeKey]?.rank ?? 0) - (GRADES[a.grade as GradeKey]?.rank ?? 0))

  const del = async (m: Member) => {
    setBusy(true)
    const res = await deleteMember(m.id, m.name)
    setBusy(false)
    setConfirmDel(null)
    if (res.ok) {
      router.refresh()
      flash(`${m.name} supprimé`)
    } else {
      flash(res.error || 'Erreur')
    }
  }

  return (
    <div className="view-anim">
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
        <div style={{ fontSize: 13.5, color: 'var(--ink-400)' }}>
          <b style={{ color: 'var(--ink-100)' }}>{members.length}</b> employés enregistrés
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 10 }}>
          {isAdmin && (
            <button className="btn btn-ghost" onClick={() => setContract(true)}>
              <Icons.doc size={15} /> Générer un contrat
            </button>
          )}
          {isAdmin && (
            <button className="btn btn-gold" onClick={() => setModal('new')}>
              <Icons.plus size={16} /> Ajouter un employé
            </button>
          )}
        </div>
      </div>

      <Card style={{ overflowX: 'auto' }}>
        <table className="tbl" style={{ minWidth: 1100 }}>
          <thead>
            <tr>
              <th>Employé</th>
              <th>Grade</th>
              <th>Pôles</th>
              <th>Téléphone</th>
              <th>Contrat</th>
              <th>Discord</th>
              <th>Matricule</th>
              <th>Statut</th>
              {isAdmin && <th></th>}
            </tr>
          </thead>
          <tbody>
            {filtered.map((m) => {
              const ms = MEMBER_STATUS[m.status] || MEMBER_STATUS.service
              return (
                <tr key={m.id} onClick={() => isAdmin && setModal({ employee: m })} style={{ cursor: isAdmin ? 'pointer' : 'default' }}>
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
                        <span>Depuis le {m.since || '—'}</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <GradePill grade={m.grade} />
                  </td>
                  <td>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                      {(m.poles || []).length === 0 && <span style={{ color: 'var(--ink-500)', fontSize: 12 }}>—</span>}
                      {(m.poles || []).map((pk) => {
                        const p = POLES.find((x) => x.key === pk)
                        return p ? (
                          <span key={pk} className="grade" style={{ color: p.color, background: p.bg }}>
                            {p.label.replace('Pôle ', '')}
                          </span>
                        ) : null
                      })}
                    </div>
                  </td>
                  <td style={{ color: m.phone ? 'var(--ink-200)' : 'var(--ink-500)', fontSize: 13, whiteSpace: 'nowrap' }}>{m.phone ? fmtPhone(m.phone) : '—'}</td>
                  <td onClick={(e) => e.stopPropagation()}>
                    <ContractCell member={m} isAdmin={isAdmin} editable={editable} onChanged={() => router.refresh()} />
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Icons.discord size={15} style={{ color: '#5865F2' }} />
                      <div>
                        <div style={{ color: 'var(--ink-200)', fontSize: 13 }}>@{m.discord || '—'}</div>
                        <div style={{ color: 'var(--ink-500)', fontSize: 11, fontFamily: 'monospace' }}>{m.discord_id || '— non rattaché —'}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ color: 'var(--ink-400)' }}>{m.matricule}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Badge cls={ms.cls}>{ms.label}</Badge>
                      <WarnCrosses n={m.warnings || 0} />
                    </div>
                  </td>
                  {isAdmin && (
                    <td style={{ textAlign: 'right' }} onClick={(e) => e.stopPropagation()}>
                      <div style={{ display: 'inline-flex', gap: 6 }}>
                        <div className="icon-btn" style={{ width: 34, height: 34 }} title="Modifier" onClick={() => setModal({ employee: m })}>
                          <Icons.edit size={15} />
                        </div>
                        <div className="icon-btn" style={{ width: 34, height: 34 }} title="Supprimer" onClick={() => setConfirmDel(m)}>
                          <Icons.trash size={15} />
                        </div>
                      </div>
                    </td>
                  )}
                </tr>
              )
            })}
          </tbody>
        </table>
      </Card>

      {modal && (
        <EmployeeModal
          employee={modal === 'new' ? null : modal.employee}
          editable={editable}
          onClose={() => setModal(null)}
          onSaved={() => router.refresh()}
        />
      )}

      {contract && <ContractEditor employees={members} editable={editable} onClose={() => setContract(false)} onSavedPhoto={() => router.refresh()} />}

      {confirmDel && (
        <Modal onClose={() => setConfirmDel(null)} title="Supprimer l'employé" icon={<Icons.trash size={20} />}>
          <p style={{ color: 'var(--ink-200)', fontSize: 14, lineHeight: 1.6 }}>
            Confirmer la suppression de <b style={{ color: 'var(--ink-100)' }}>{confirmDel.name}</b> ? Son accès au système sera
            définitivement retiré.
          </p>
          <div style={{ display: 'flex', gap: 10, marginTop: 22 }}>
            <button className="btn btn-ghost" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setConfirmDel(null)} disabled={busy}>
              Annuler
            </button>
            <button className="btn-refuse" style={{ flex: 1, justifyContent: 'center' }} onClick={() => del(confirmDel)} disabled={busy}>
              <Icons.trash size={15} /> {busy ? 'Suppression…' : 'Supprimer'}
            </button>
          </div>
        </Modal>
      )}

      {toast && (
        <div style={{ position: 'fixed', bottom: 28, left: '50%', transform: 'translateX(-50%)', background: 'var(--navy-600)', border: '1px solid var(--gold-glow)', color: 'var(--gold-300)', padding: '12px 22px', borderRadius: 12, fontSize: 13.5, fontWeight: 600, zIndex: 90, boxShadow: 'var(--shadow-pop)' }}>
          {toast}
        </div>
      )}
    </div>
  )
}
