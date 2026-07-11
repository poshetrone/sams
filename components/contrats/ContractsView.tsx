'use client'
import { useState, type MouseEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Icons } from '@/components/Icons'
import { Badge, Card } from '@/components/ui'
import { SecTitle } from '@/components/ui'
import Modal from '@/components/Modal'
import { fmtMoney, parseFrDate, fmtFrDate, isExpiredFrDate } from '@/lib/format'
import { useApp } from '@/lib/app-context'
import { saveContract, deleteContract, type ContractInput } from '@/lib/actions/contracts'
import { saveMutuelle, deleteMutuelle, type MutuelleInput } from '@/lib/actions/mutuelles'
import { useRealtime } from '@/lib/useRealtime'
import { handleImageUpload } from '@/lib/image'
import type { Contract, MutuelleRow, MutuelleTier } from '@/lib/types'

const TIER_BADGE: Record<string, string> = { actif: 'ok', 'expiré': 'crit', 'en attente': 'warn' }
/** Statut effectif : un contrat dont l'échéance est dépassée est considéré « expiré ». */
const effectiveStatus = (c: Contract) => (isExpiredFrDate(c.end) ? 'expiré' : c.status)

function FormulaCard({ m, editable, onEdit }: { m: MutuelleRow; editable: boolean; onEdit: () => void }) {
  const premium = m.premium
  return (
    <Card className="card-pad" style={premium ? { borderColor: 'var(--gold-glow)' } : undefined}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <div className="kpi-ico" style={{ position: 'static' }}>{premium ? <Icons.shield size={18} /> : <Icons.pulse size={18} />}</div>
        <div><h3 style={{ fontSize: 16, color: premium ? 'var(--gold-300)' : 'var(--ink-100)', fontWeight: 600 }}>{m.label}</h3></div>
        {premium && <span className="badge gold" style={{ marginLeft: 'auto' }}>Premium</span>}
        {editable && (
          <div className="icon-btn" style={{ width: 32, height: 32, marginLeft: premium ? 8 : 'auto' }} title="Modifier la formule" onClick={onEdit}>
            <Icons.edit size={14} />
          </div>
        )}
      </div>
      {m.desc && <p style={{ fontSize: 12.5, color: 'var(--ink-400)', lineHeight: 1.55, marginBottom: 14 }}>{m.desc}</p>}
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
        {m.tiers.length === 0 && <span style={{ fontSize: 12.5, color: 'var(--ink-500)' }}>Aucune tranche définie.</span>}
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
  const { search, canEdit, mutuelles, mutuelleByKey, mutuellePrice } = useApp()
  const editable = canEdit('contrats')
  useRealtime(['contracts', 'mutuelles'])
  const [modal, setModal] = useState<Contract | 'new' | null>(null)
  const [formulaModal, setFormulaModal] = useState<MutuelleRow | 'new' | null>(null)
  const [renewing, setRenewing] = useState<string | null>(null)

  const contractPrice = (c: { type: string; tier: string }) => mutuellePrice(c.type, c.tier)
  const list = contracts.filter((c) => !search || c.company.toLowerCase().includes(search.toLowerCase()))
  const totalActif = contracts.filter((c) => effectiveStatus(c) === 'actif').reduce((s, c) => s + contractPrice(c), 0)

  /** Renouvelle le contrat d'une semaine : repousse l'échéance de 7 jours et le réactive. */
  const renew = async (c: Contract, e: MouseEvent) => {
    e.stopPropagation()
    setRenewing(c.id)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const end = parseFrDate(c.end)
    const base = end && end.getTime() > today.getTime() ? end : today // repart d'aujourd'hui si déjà expiré
    base.setDate(base.getDate() + 7)
    const res = await saveContract({
      id: c.id, company: c.company, logo: c.logo, type: c.type, tier: c.tier,
      employees: c.employees ?? '', status: 'actif', start: c.start || '',
      end: fmtFrDate(base), details: c.details || '',
    })
    setRenewing(null)
    if (res.ok) router.refresh()
  }

  return (
    <div className="view-anim">
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 4 }}>
        <SecTitle>Formules de couverture</SecTitle>
        {editable && <button className="btn btn-gold" style={{ marginLeft: 'auto' }} onClick={() => setFormulaModal('new')}><Icons.plus size={16} /> Ajouter une formule</button>}
      </div>
      {mutuelles.length === 0 ? (
        <Card className="card-pad" style={{ textAlign: 'center', color: 'var(--ink-500)', fontSize: 13.5, marginBottom: 8 }}>
          Aucune formule de couverture.{editable ? ' Créez-en une pour commencer.' : ''}
        </Card>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: mutuelles.length > 1 ? '1fr 1fr' : '1fr', gap: 18, marginBottom: 8 }}>
          {mutuelles.map((m) => (
            <FormulaCard key={m.key} m={m} editable={editable} onEdit={() => setFormulaModal(m)} />
          ))}
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 14, margin: '26px 0 16px' }}>
        <SecTitle>Entreprises partenaires</SecTitle>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 16, paddingBottom: 14 }}>
          <div style={{ fontSize: 13, color: 'var(--ink-400)' }}>
            Revenu hebdomadaire actif : <b style={{ color: 'var(--gold-300)', fontFamily: 'var(--font-display)', fontSize: 17 }}>{fmtMoney(totalActif)}</b>
          </div>
          {editable && <button className="btn btn-gold" onClick={() => setModal('new')} disabled={mutuelles.length === 0}><Icons.plus size={16} /> Ajouter un contrat</button>}
        </div>
      </div>

      <div className="contract-grid">
        {list.map((c) => {
          const m = mutuelleByKey(c.type)
          const premium = !!m?.premium
          const status = effectiveStatus(c)
          const expired = status === 'expiré'
          return (
            <Card key={c.id} className="contract-card" onClick={editable ? () => setModal(c) : undefined} style={{ cursor: editable ? 'pointer' : 'default', ...(expired ? { borderColor: 'var(--crit)' } : null) }}>
              <div className="cc-head">
                <CompanyLogo logo={c.logo} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h4 style={{ fontSize: 15, color: 'var(--ink-100)', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.company}</h4>
                  <div style={{ marginTop: 5, display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                    <span className={`badge ${premium ? 'gold' : 'info'}`}>{m?.label ?? 'Formule supprimée'}</span>
                    <Badge cls={TIER_BADGE[status] || 'info'}>{status}</Badge>
                  </div>
                </div>
                {editable && (
                  <button
                    className="btn btn-ghost"
                    title="Renouveler le contrat d'une semaine"
                    onClick={(e) => renew(c, e)}
                    disabled={renewing === c.id}
                    style={{ alignSelf: 'flex-start', padding: 8, ...(expired ? { borderColor: 'var(--gold-glow)', color: 'var(--gold-300)' } : null) }}
                  >
                    <Icons.reset size={15} />
                  </button>
                )}
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
          mutuelles={mutuelles}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); router.refresh() }}
        />
      )}

      {formulaModal && (
        <MutuelleModal
          formula={formulaModal === 'new' ? null : formulaModal}
          onClose={() => setFormulaModal(null)}
          onSaved={() => { setFormulaModal(null); router.refresh() }}
        />
      )}
    </div>
  )
}

function ContractModal({ contract, mutuelles, onClose, onSaved }: { contract: Contract | null; mutuelles: MutuelleRow[]; onClose: () => void; onSaved: () => void }) {
  const isNew = !contract
  const first = mutuelles[0]
  const [f, setF] = useState<ContractInput>(
    contract
      ? { id: contract.id, company: contract.company, logo: contract.logo, type: contract.type, tier: contract.tier, employees: contract.employees ?? '', status: contract.status, start: contract.start || '', end: contract.end || '', details: contract.details || '' }
      : { company: '', logo: null, type: first?.key ?? '', tier: first?.tiers[0]?.key ?? '', employees: '', status: 'actif', start: '', end: '', details: '' }
  )
  const [busy, setBusy] = useState(false)
  const set = (k: keyof ContractInput, v: unknown) => setF((p) => ({ ...p, [k]: v }))
  const onLogo = (file?: File) => {
    handleImageUpload(file, 'contracts/logos', (url) => set('logo', url), { maxWidth: 400 })
  }
  const selected = mutuelles.find((m) => m.key === f.type)
  const tiers = selected?.tiers ?? []
  const price = tiers.find((t) => t.key === f.tier)?.price ?? 0

  /** Change de formule : réaligne la tranche sur la première tranche disponible. */
  const setType = (key: string) => {
    const m = mutuelles.find((x) => x.key === key)
    setF((p) => ({ ...p, type: key, tier: m?.tiers[0]?.key ?? '' }))
  }

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
            <select value={f.type} onChange={(e) => setType(e.target.value)}>
              {mutuelles.map((m) => <option key={m.key} value={m.key}>{m.label}</option>)}
            </select>
          </div>
          <div className="ep-field"><label>Tranche d&apos;effectif</label>
            <select value={f.tier} onChange={(e) => set('tier', e.target.value)} disabled={tiers.length === 0}>
              {tiers.map((t) => <option key={t.key} value={t.key}>{t.label} — {fmtMoney(t.price)}</option>)}
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

/** Génère une clé de tranche unique côté client pour les nouvelles lignes. */
const newTierKey = () => (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID().slice(0, 8) : `t${Date.now()}${Math.floor(Math.random() * 1000)}`)

function MutuelleModal({ formula, onClose, onSaved }: { formula: MutuelleRow | null; onClose: () => void; onSaved: () => void }) {
  const isNew = !formula
  const [f, setF] = useState<MutuelleInput>(
    formula
      ? { key: formula.key, label: formula.label, desc: formula.desc || '', perks: [...formula.perks], tiers: formula.tiers.map((t) => ({ ...t })), premium: formula.premium }
      : { label: '', desc: '', perks: [], tiers: [{ key: newTierKey(), label: '', price: 0 }], premium: false }
  )
  const [busy, setBusy] = useState(false)
  const set = (k: keyof MutuelleInput, v: unknown) => setF((p) => ({ ...p, [k]: v }))

  const setPerk = (i: number, v: string) => setF((p) => ({ ...p, perks: p.perks.map((x, j) => (j === i ? v : x)) }))
  const addPerk = () => setF((p) => ({ ...p, perks: [...p.perks, ''] }))
  const removePerk = (i: number) => setF((p) => ({ ...p, perks: p.perks.filter((_, j) => j !== i) }))

  const setTier = (i: number, patch: Partial<MutuelleTier>) => setF((p) => ({ ...p, tiers: p.tiers.map((t, j) => (j === i ? { ...t, ...patch } : t)) }))
  const addTier = () => setF((p) => ({ ...p, tiers: [...p.tiers, { key: newTierKey(), label: '', price: 0 }] }))
  const removeTier = (i: number) => setF((p) => ({ ...p, tiers: p.tiers.filter((_, j) => j !== i) }))

  const submit = async () => {
    if (!f.label.trim()) return
    setBusy(true)
    const res = await saveMutuelle({
      ...f,
      perks: f.perks.map((p) => p.trim()).filter(Boolean),
      tiers: f.tiers.filter((t) => t.label.trim()),
    })
    setBusy(false)
    if (res.ok) onSaved()
  }
  const remove = async () => {
    if (!formula) return
    setBusy(true)
    const res = await deleteMutuelle(formula.key)
    setBusy(false)
    if (res.ok) onSaved()
  }

  return (
    <Modal onClose={onClose} title={isNew ? 'Nouvelle formule' : 'Modifier la formule'} icon={<Icons.shield size={20} />} wide>
      <div className="editor-panel">
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 14 }}>
          <div className="ep-field"><label>Nom de la formule</label><input value={f.label} onChange={(e) => set('label', e.target.value)} placeholder="Ex : Mutuelle Premium" autoFocus /></div>
          <div className="ep-field"><label>Type</label>
            <select value={f.premium ? 'premium' : 'standard'} onChange={(e) => set('premium', e.target.value === 'premium')}>
              <option value="standard">Standard</option>
              <option value="premium">Premium (doré)</option>
            </select>
          </div>
        </div>

        <div className="ep-field"><label>Description</label>
          <textarea value={f.desc ?? ''} onChange={(e) => set('desc', e.target.value)} style={{ minHeight: 64 }} placeholder="Résumé des garanties de la formule…" />
        </div>

        <div className="ep-field">
          <label>Avantages</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {f.perks.map((p, i) => (
              <div key={i} style={{ display: 'flex', gap: 8 }}>
                <input style={{ flex: 1 }} value={p} onChange={(e) => setPerk(i, e.target.value)} placeholder="Ex : Réanimation gratuite" />
                <button className="btn btn-ghost" onClick={() => removePerk(i)} title="Retirer"><Icons.trash size={14} /></button>
              </div>
            ))}
            <button className="btn btn-ghost" style={{ alignSelf: 'flex-start' }} onClick={addPerk}><Icons.plus size={14} /> Ajouter un avantage</button>
          </div>
        </div>

        <div className="ep-field">
          <label>Tranches d&apos;effectif &amp; tarifs hebdomadaires</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {f.tiers.map((t, i) => (
              <div key={t.key} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr auto', gap: 8, alignItems: 'center' }}>
                <input value={t.label} onChange={(e) => setTier(i, { label: e.target.value })} placeholder="Ex : 10 à 15 employés" />
                <div style={{ position: 'relative' }}>
                  <input value={t.price || ''} onChange={(e) => setTier(i, { price: +e.target.value.replace(/\D/g, '') || 0 })} placeholder="45000" style={{ paddingRight: 26 }} />
                  <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-500)', fontSize: 12 }}>$</span>
                </div>
                <button className="btn btn-ghost" onClick={() => removeTier(i)} title="Retirer la tranche" disabled={f.tiers.length === 1}><Icons.trash size={14} /></button>
              </div>
            ))}
            <button className="btn btn-ghost" style={{ alignSelf: 'flex-start' }} onClick={addTier}><Icons.plus size={14} /> Ajouter une tranche</button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
          {!isNew && <button className="btn-refuse" onClick={remove} disabled={busy}><Icons.trash size={15} /></button>}
          <button className="btn btn-ghost" style={{ flex: 1, justifyContent: 'center' }} onClick={onClose} disabled={busy}>Annuler</button>
          <button className="btn btn-gold" style={{ flex: 1, justifyContent: 'center' }} onClick={submit} disabled={busy}><Icons.check size={15} /> {isNew ? 'Créer la formule' : 'Enregistrer'}</button>
        </div>
      </div>
    </Modal>
  )
}
