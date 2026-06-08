'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Icons } from '@/components/Icons'
import { Card, GradePill, SecTitle } from '@/components/ui'
import Modal from '@/components/Modal'
import { GRADES, type GradeKey } from '@/lib/constants'
import { fmtMoney, initialsOf } from '@/lib/format'
import { useApp } from '@/lib/app-context'
import { setPrime, setBonus, resetPrimes } from '@/lib/actions/members'
import type { Member } from '@/lib/types'

export default function PrimesView({ members: initial }: { members: Member[] }) {
  const router = useRouter()
  const { can, search } = useApp()
  const canEdit = can('manageStaff')
  const canReset = can('resetPrime')
  const [members, setMembers] = useState(initial)
  useEffect(() => setMembers(initial), [initial])
  const [confirmReset, setConfirmReset] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const flash = (m: string) => { setToast(m); setTimeout(() => setToast(null), 2400) }

  const list = members
    .filter((m) => !search || m.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => (GRADES[b.grade as GradeKey]?.rank ?? 0) - (GRADES[a.grade as GradeKey]?.rank ?? 0))

  const toggle = (m: Member) => {
    if (!canEdit) return
    const v = !m.prime
    setMembers((prev) => prev.map((x) => (x.id === m.id ? { ...x, prime: v } : x)))
    setPrime(m.id, v).then((r) => { if (!r.ok) flash(r.error || 'Erreur') })
  }
  const changeBonus = (id: string, val: number) => setMembers((prev) => prev.map((x) => (x.id === id ? { ...x, bonus: val } : x)))
  const persistBonus = (m: Member) => {
    if (!canEdit) return
    setBonus(m.id, +m.bonus || 0).then((r) => { if (!r.ok) flash(r.error || 'Erreur') })
  }

  const baseTotal = members.filter((m) => m.prime).reduce((s, m) => s + (GRADES[m.grade as GradeKey]?.prime ?? 0), 0)
  const bonusTotal = members.reduce((s, m) => s + (+m.bonus || 0), 0)
  const total = baseTotal + bonusTotal
  const beneficiaires = members.filter((m) => m.prime || (+m.bonus || 0) > 0).length

  const doReset = async () => {
    setConfirmReset(false)
    const r = await resetPrimes()
    if (r.ok) { setMembers((prev) => prev.map((m) => ({ ...m, prime: false, bonus: 0 }))); flash('Toutes les primes et bonus ont été réinitialisés') }
    else flash(r.error || 'Erreur')
  }

  return (
    <div className="view-anim">
      <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: 24 }}>
        <Card className="kpi">
          <div className="kpi-ico"><Icons.coin size={20} /></div>
          <div className="label">Total des primes attribuées</div>
          <div className="val" style={{ color: 'var(--gold-300)', fontSize: 34, whiteSpace: 'nowrap' }}>{fmtMoney(total)}</div>
          <div className="trend up" style={{ color: 'var(--ink-400)' }}>{`${beneficiaires} bénéficiaire${beneficiaires > 1 ? 's' : ''}`}</div>
        </Card>
        <Card className="kpi">
          <div className="kpi-ico"><Icons.effectifs size={20} /></div>
          <div className="label">Employés concernés</div>
          <div className="val">{beneficiaires}<small> / {members.length}</small></div>
        </Card>
        <Card className="kpi">
          <div className="kpi-ico"><Icons.cash size={20} /></div>
          <div className="label">Dont primes bonus</div>
          <div className="val" style={{ fontSize: 28, whiteSpace: 'nowrap', color: bonusTotal > 0 ? 'var(--gold-300)' : 'var(--ink-100)' }}>{fmtMoney(bonusTotal)}</div>
        </Card>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
        <SecTitle>Attribution des primes</SecTitle>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 10, alignItems: 'center', paddingBottom: 14 }}>
          {canReset ? (
            <button className="btn-refuse" onClick={() => setConfirmReset(true)}><Icons.reset size={15} /> RESET PRIME</button>
          ) : (
            <span style={{ fontSize: 12, color: 'var(--ink-500)', display: 'inline-flex', alignItems: 'center', gap: 6 }} title="Réservé au Co-Directeur et au-dessus">
              <Icons.lock size={13} /> RESET réservé à la Direction
            </span>
          )}
        </div>
      </div>

      <Card>
        <table className="tbl">
          <thead><tr><th style={{ width: 56 }}></th><th>Employé</th><th>Grade</th><th>Prime de grade</th><th>Prime bonus</th><th style={{ textAlign: 'right' }}>Total</th></tr></thead>
          <tbody>
            {list.map((m) => {
              const g = GRADES[m.grade as GradeKey]
              const rowTotal = (m.prime ? g?.prime ?? 0 : 0) + (+m.bonus || 0)
              return (
                <tr key={m.id}>
                  <td onClick={canEdit ? () => toggle(m) : undefined} style={{ cursor: canEdit ? 'pointer' : 'default' }}>
                    <div className={`cbx ${m.prime ? 'on' : ''}`} style={{ width: 20, height: 20 }}>{m.prime && <Icons.check size={14} style={{ color: '#1a1206' }} />}</div>
                  </td>
                  <td onClick={canEdit ? () => toggle(m) : undefined} style={{ cursor: canEdit ? 'pointer' : 'default' }}><div className="person"><div className="av-sm">{initialsOf(m.name)}</div><div className="pn"><b>{m.name}</b><span>{m.matricule}</span></div></div></td>
                  <td><GradePill grade={m.grade} /></td>
                  <td onClick={canEdit ? () => toggle(m) : undefined} style={{ cursor: canEdit ? 'pointer' : 'default', fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 600, color: m.prime ? 'var(--gold-300)' : 'var(--ink-500)' }}>{m.prime ? fmtMoney(g?.prime ?? 0) : '—'}</td>
                  <td>
                    <div className="bonus-input">
                      <span>$</span>
                      <input
                        value={(+m.bonus || 0) === 0 ? '' : Number(m.bonus).toLocaleString('fr-FR')}
                        onChange={(e) => changeBonus(m.id, +e.target.value.replace(/\D/g, '') || 0)}
                        onBlur={() => persistBonus(m)}
                        placeholder="0"
                        disabled={!canEdit}
                      />
                    </div>
                  </td>
                  <td style={{ textAlign: 'right', fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 600, color: rowTotal > 0 ? 'var(--gold-300)' : 'var(--ink-500)', whiteSpace: 'nowrap' }}>{rowTotal > 0 ? fmtMoney(rowTotal) : '—'}</td>
                </tr>
              )
            })}
          </tbody>
          <tfoot>
            <tr style={{ borderTop: '2px solid var(--navy-line)' }}>
              <td colSpan={4} style={{ padding: '16px 22px', fontSize: 13, color: 'var(--ink-400)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.5px' }}>
                Total à verser <span style={{ color: 'var(--ink-500)', textTransform: 'none', letterSpacing: 0 }}>(primes {fmtMoney(baseTotal)} + bonus {fmtMoney(bonusTotal)})</span>
              </td>
              <td colSpan={2} style={{ padding: '16px 22px', textAlign: 'right', fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 600, color: 'var(--gold-300)', whiteSpace: 'nowrap' }}>{fmtMoney(total)}</td>
            </tr>
          </tfoot>
        </table>
      </Card>

      {confirmReset && (
        <Modal onClose={() => setConfirmReset(false)} title="Réinitialiser les primes" icon={<Icons.reset size={20} />}>
          <p style={{ color: 'var(--ink-200)', fontSize: 14, lineHeight: 1.6 }}>Cette action va <b style={{ color: 'var(--crit)' }}>décocher toutes les primes</b> de l&apos;ensemble des employés. Le total repassera à 0 $. Continuer ?</p>
          <div style={{ display: 'flex', gap: 10, marginTop: 22 }}>
            <button className="btn btn-ghost" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setConfirmReset(false)}>Annuler</button>
            <button className="btn-refuse" style={{ flex: 1, justifyContent: 'center' }} onClick={doReset}><Icons.reset size={15} /> Tout réinitialiser</button>
          </div>
        </Modal>
      )}

      {toast && <div style={{ position: 'fixed', bottom: 28, left: '50%', transform: 'translateX(-50%)', background: 'var(--navy-600)', border: '1px solid var(--gold-glow)', color: 'var(--gold-300)', padding: '12px 22px', borderRadius: 12, fontSize: 13.5, fontWeight: 600, zIndex: 90, boxShadow: 'var(--shadow-pop)' }}>{toast}</div>}
    </div>
  )
}
