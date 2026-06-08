'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Icons } from '@/components/Icons'
import { Badge, Card } from '@/components/ui'
import { SecTitle } from '@/components/ui'
import Modal from '@/components/Modal'
import { MUTUELLES, mutuellePrice } from '@/lib/constants'
import { fmtMoney } from '@/lib/format'
import { useApp } from '@/lib/app-context'
import { saveContract, deleteContract, type ContractInput } from '@/lib/actions/contracts'
import { handleImageInput } from '@/lib/image'
import type { Contract } from '@/lib/types'

const TIER_BADGE: Record<string, string> = { actif: 'ok', 'expiré': 'crit', 'en attente': 'warn' }
const contractPrice = (c: { type: string; tier: string }) => mutuellePrice(c.type as 'standard' | 'premium', c.tier)

function FormulaCard({ type }: { type: 'standard' | 'premium' }) {
  const m = MUTUELLES[type]
  const premium = type === 'premium'
  return (
    <Card className="card-pad" style={premium ? { borderColor: 'var(--gold-glow)' } : undefined}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <div className="kpi-ico" style={{ position: 'static' }}>{premium ? <Icons.shield size={18} /> : <Icons.pulse size={18} />}</div>
        <div><h3 style={{ fontSize: 16, color: premium ? 'var(--gold-300)' : 'var(--ink-100)', fontWeight: 600 }}>{m.label}</h3></div>
        {premium && <span className="badge gold" style={{ marginLeft: 'auto' }}>Premium</span>}
      </div>
      <p style={{ fontSize: 12.5, color: 'var(--ink-400)', lineHeight: 1.55, marginBottom: 14 }}>{m.desc}</p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
        {m.perks.map((p) => (
          <span key={p} className="badge" style={{ background: 'var(--navy-800)', color: 'var(--ink-300)', border: '1px solid var(--navy-line-soft)' }}>
            <Icons.check size={11} style={{ color: 'var(--ok)' }} /> {p}
          </span>
        ))}
      </div>
      <div style={{ borderTop: '1px solid var(--navy-line-soft)', paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ fontSize: 10.5, letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--ink-500)', fontWeight: 700, marginBottom: 2 }}>Tarifs par semaine</div>
        {m.tiers.map((t) => (
          <div key={t.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 13, color: 'var(--ink-300)' }}>{t.label}</span>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 19, fontWeight: 600, color: premium ? 'var(--gold-300)' : 'var(--ink-100)', whiteSpace: 'nowrap' }}>
              {fmtMoney(t.price)}<span style={{ fontFamily: 'var(--font-ui)', fontSize: 10.5, color: 'var(--ink-500)' }}> /sem.</span>
            </span>
          </div>
        ))}
      </div>
    </Card>
  )
}

function CompanyLogo({ logo, size = 52 }: { logo?: string | null; size?: number }) {
  return (
    <div className="company-logo" style={{ width: size, height: size, flex: `0 0 ${size}px` }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {logo ? <img src={logo} alt="" /> : <Icons.building size={size * 0.45} />}
    </div>
  )
}

export default function ContractsView({ contracts }: { contracts: Contract[] }) {
  const router = useRouter()
  const { search, isAdmin } = useApp()
  const [modal, setModal] = useState<Contract | 'new' | null>(null)

  const list = contracts.filter((c) => !search || c.company.toLowerCase().includes(search.toLowerCase()))
  const totalActif = contracts.filter((c) => c.status === 'actif').reduce((s, c) => s + contractPrice(c), 0)

  return (
    <div className="view-anim">
      <SecTitle>Formules de couverture</SecTitle>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, marginBottom: 8 }}>
        <FormulaCard type="standard" />
        <FormulaCard type="premium" />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 14, margin: '26px 0 16px' }}>
        <SecTitle>Entreprises partenaires</SecTitle>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 16, paddingBottom: 14 }}>
          <div style={{ fontSize: 13, color: 'var(--ink-400)' }}>
            Revenu hebdomadaire actif : <b style={{ color: 'var(--gold-300)', fontFamily: 'var(--font-display)', fontSize: 17 }}>{fmtMoney(totalActif)}</b>
          </div>
          {isAdmin && <button className="btn btn-gold" onClick={() => setModal('new')}><Icons.plus size={16} /> Ajouter un contrat</button>}
        </div>
      </div>

      <div className="contract-grid">
        {list.map((c) => {
          const m = MUTUELLES[c.type as 'standard' | 'premium']
          const premium = c.type === 'premium'
          return (
            <Card key={c.id} className="contract-card" onClick={isAdmin ? () => setModal(c) : undefined} style={{ cursor: isAdmin ? 'pointer' : 'default' }}>
              <div className="cc-head">
                <CompanyLogo logo={c.logo} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h4 style={{ fontSize: 15, color: 'var(--ink-100)', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.company}</h4>
                  <div style={{ marginTop: 5, display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                    <span className={`badge ${premium ? 'gold' : 'info'}`}>{m?.label}</span>
                    <Badge cls={TIER_BADGE[c.status] || 'info'}>{c.status}</Badge>
                  </div>
                </div>
              </div>
              <p className="cc-details">{c.details}</p>
              <div className="cc-foot">
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--ink-400)', fontSize: 12.5 }}><Icons.effectifs size={14} /> {c.employees || '—'} employés</div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 21, fontWeight: 600, color: 'var(--gold-300)', whiteSpace: 'nowrap' }}>
                  {fmtMoney(contractPrice(c))}<span style={{ fontFamily: 'var(--font-ui)', fontSize: 11, color: 'var(--ink-500)' }}> /sem.</span>
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      {modal && (
        <ContractModal
          contract={modal === 'new' ? null : modal}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); router.refresh() }}
        />
      )}
    </div>
  )
}

function ContractModal({ contract, onClose, onSaved }: { contract: Contract | null; onClose: () => void; onSaved: () => void }) {
  const isNew = !contract
  const [f, setF] = useState<ContractInput>(
    contract
      ? { id: contract.id, company: contract.company, logo: contract.logo, type: contract.type, tier: contract.tier, employees: contract.employees ?? '', status: contract.status, start: contract.start || '', end: contract.end || '', details: contract.details || '' }
      : { company: '', logo: null, type: 'standard', tier: 't1', employees: '', status: 'actif', start: '', end: '', details: '' }
  )
  const [busy, setBusy] = useState(false)
  const set = (k: keyof ContractInput, v: unknown) => setF((p) => ({ ...p, [k]: v }))
  const onLogo = (file?: File) => {
    handleImageInput(file, (dataUrl) => set('logo', dataUrl), { maxWidth: 400 })
  }
  const price = mutuellePrice(f.type as 'standard' | 'premium', f.tier)

  const submit = async () => {
    if (!f.company.trim()) return
    setBusy(true)
    const res = await saveContract(f)
    setBusy(false)
    if (res.ok) onSaved()
  }
  const remove = async () => {
    if (!contract) return
    setBusy(true)
    const res = await deleteContract(contract.id)
    setBusy(false)
    if (res.ok) onSaved()
  }

  return (
    <Modal onClose={onClose} title={isNew ? 'Nouveau contrat' : 'Modifier le contrat'} icon={<Icons.briefcase size={20} />} wide>
      <div className="editor-panel">
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
          <CompanyLogo logo={f.logo} size={70} />
          <div>
            <label style={{ display: 'block', marginBottom: 6 }}>Logo de l&apos;entreprise</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <label className="btn btn-ghost" style={{ cursor: 'pointer' }}>
                <Icons.upload size={14} /> Importer un logo
                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => onLogo(e.target.files?.[0])} />
              </label>
              {f.logo && <button className="btn btn-ghost" onClick={() => set('logo', null)}><Icons.trash size={14} /></button>}
            </div>
          </div>
        </div>

        <div className="ep-field"><label>Nom de l&apos;entreprise</label><input value={f.company} onChange={(e) => set('company', e.target.value)} placeholder="Ex : Bennys Motorworks" autoFocus /></div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <div className="ep-field"><label>Formule</label>
            <select value={f.type} onChange={(e) => set('type', e.target.value)}><option value="standard">Mutuelle</option><option value="premium">Mutuelle Premium</option></select>
          </div>
          <div className="ep-field"><label>Tranche d&apos;effectif</label>
            <select value={f.tier} onChange={(e) => set('tier', e.target.value)}>
              {MUTUELLES[f.type as 'standard' | 'premium'].tiers.map((t) => <option key={t.key} value={t.key}>{t.label} — {fmtMoney(t.price)}</option>)}
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(201,163,90,0.07)', border: '1px solid var(--navy-line)', borderRadius: 10, padding: '12px 16px', margin: '4px 0 14px' }}>
          <span style={{ fontSize: 13, color: 'var(--ink-300)', fontWeight: 600 }}>Montant hebdomadaire du contrat</span>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 600, color: 'var(--gold-300)', whiteSpace: 'nowrap' }}>{fmtMoney(price)}<span style={{ fontFamily: 'var(--font-ui)', fontSize: 12, color: 'var(--ink-500)' }}> /sem.</span></span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
          <div className="ep-field"><label>Nb. d&apos;employés</label><input value={f.employees ?? ''} onChange={(e) => set('employees', e.target.value.replace(/\D/g, ''))} placeholder="18" /></div>
          <div className="ep-field"><label>Début</label><input value={f.start ?? ''} onChange={(e) => set('start', e.target.value)} placeholder="JJ/MM/AAAA" /></div>
          <div className="ep-field"><label>Échéance</label><input value={f.end ?? ''} onChange={(e) => set('end', e.target.value)} placeholder="JJ/MM/AAAA" /></div>
        </div>

        <div className="ep-field"><label>Statut</label>
          <select value={f.status} onChange={(e) => set('status', e.target.value)}>
            <option value="actif">Actif</option><option value="en attente">En attente</option><option value="expiré">Expiré</option>
          </select>
        </div>

        <div className="ep-field"><label>Détails du contrat</label>
          <textarea value={f.details ?? ''} onChange={(e) => set('details', e.target.value)} style={{ minHeight: 110 }} placeholder="Conditions, prestations couvertes, modalités, clauses…" />
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
          {!isNew && <button className="btn-refuse" onClick={remove} disabled={busy}><Icons.trash size={15} /></button>}
          <button className="btn btn-ghost" style={{ flex: 1, justifyContent: 'center' }} onClick={onClose} disabled={busy}>Annuler</button>
          <button className="btn btn-gold" style={{ flex: 1, justifyContent: 'center' }} onClick={submit} disabled={busy}><Icons.check size={15} /> {isNew ? 'Créer le contrat' : 'Enregistrer'}</button>
        </div>
      </div>
    </Modal>
  )
}
