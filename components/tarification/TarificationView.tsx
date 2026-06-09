'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Icons } from '@/components/Icons'
import Modal from '@/components/Modal'
import { useApp } from '@/lib/app-context'
import { saveTarif, deleteTarif, type TarifInput } from '@/lib/actions/tarifs'
import type { TarifRow } from '@/lib/types'

const TARIF_ICONS = ['soin', 'pulse', 'ambu', 'visite', 'brain', 'spine', 'scalpel', 'complex', 'fusil', 'cash']

export function TarifIcon({ kind, size = 20 }: { kind: string; size?: number }) {
  const m: Record<string, React.ReactNode> = {
    soin: <Icons.shield size={size} />, pulse: <Icons.pulse size={size} />, ambu: <Icons.target size={size} />,
    visite: <Icons.patient size={size} />, brain: <Icons.brain size={size} />, spine: <Icons.body size={size} />,
    scalpel: <Icons.scalpel size={size} />, complex: <Icons.scalpel size={size} />, fusil: <Icons.alert size={size} />,
  }
  return <>{m[kind] || <Icons.cash size={size} />}</>
}

const fmtPrice = (n: number) => Number(n || 0).toLocaleString('fr-FR').replace(/ /g, ' ')

export default function TarificationView({ tarifs }: { tarifs: TarifRow[] }) {
  const router = useRouter()
  const { canEdit } = useApp()
  const editable = canEdit('tarification')
  const [edit, setEdit] = useState<TarifRow | 'new' | null>(null)

  return (
    <div className="view-anim">
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
        <div style={{ fontSize: 13.5, color: 'var(--ink-400)' }}>
          Fiche de prix des prestations · <b style={{ color: 'var(--gold-300)' }}>{tarifs.length}</b> lignes · tarifs en dollars ($)
        </div>
        {editable && (
          <button className="btn-neon-gold" style={{ marginLeft: 'auto' }} onClick={() => setEdit('new')}>
            <Icons.plus size={16} /> Ajouter une prestation
          </button>
        )}
      </div>

      <div className="tarif-table">
        <div className="tt-head">
          <div className="tt-c-ico"></div>
          <div>Prestation</div>
          <div className="tt-c-price">Tarif</div>
          {editable && <div className="tt-c-act"></div>}
        </div>
        {tarifs.map((t, i) => (
          <div className={`tt-row ${i % 2 ? 'blue' : 'gold'}`} key={t.id}>
            <div className="tt-c-ico"><div className="tt-ico"><TarifIcon kind={t.icon} /></div></div>
            <div className="tt-name">{t.label}{t.sub && <span className="tt-sub">{t.sub}</span>}</div>
            <div className="tt-c-price"><span className="tt-price">{fmtPrice(t.price)} <span className="tt-cur">$</span></span></div>
            {editable && <div className="tt-c-act"><div className="icon-btn" style={{ width: 32, height: 32 }} title="Modifier" onClick={() => setEdit(t)}><Icons.edit size={14} /></div></div>}
          </div>
        ))}
        <div className="tt-foot"><Icons.shield size={13} /> Les tarifs sont indiqués en dollars américains ($).</div>
      </div>

      {edit !== null && (
        <TarifModal
          item={edit === 'new' ? null : edit}
          onClose={() => setEdit(null)}
          onSaved={() => { setEdit(null); router.refresh() }}
        />
      )}
    </div>
  )
}

function TarifModal({ item, onClose, onSaved }: { item: TarifRow | null; onClose: () => void; onSaved: () => void }) {
  const [f, setF] = useState<TarifInput>(item ? { id: item.id, icon: item.icon, label: item.label, sub: item.sub || '', price: item.price } : { icon: 'cash', label: '', sub: '', price: 0 })
  const [busy, setBusy] = useState(false)
  const set = (k: keyof TarifInput, v: unknown) => setF((p) => ({ ...p, [k]: v }))

  const submit = async () => {
    if (!f.label.trim()) return
    setBusy(true)
    const res = await saveTarif(f)
    setBusy(false)
    if (res.ok) onSaved()
  }
  const remove = async () => {
    if (!item) return
    setBusy(true)
    const res = await deleteTarif(item.id)
    setBusy(false)
    if (res.ok) onSaved()
  }

  return (
    <Modal onClose={onClose} title={item ? 'Modifier la prestation' : 'Nouvelle prestation'} icon={<Icons.cash size={20} />}>
      <div className="editor-panel">
        <div className="ep-field"><label>Icône</label>
          <div className="chips">
            {TARIF_ICONS.map((ic) => (
              <div key={ic} className={`chip ${f.icon === ic ? 'on' : ''}`} onClick={() => set('icon', ic)} style={{ padding: '8px 11px' }}>
                <TarifIcon kind={ic} size={16} />
              </div>
            ))}
          </div>
        </div>
        <div className="ep-field"><label>Nom de la prestation</label><input value={f.label} onChange={(e) => set('label', e.target.value)} placeholder="Ex : Soin" autoFocus /></div>
        <div className="ep-field"><label>Précision <span style={{ color: 'var(--ink-500)', fontWeight: 400 }}>(optionnel)</span></label><input value={f.sub || ''} onChange={(e) => set('sub', e.target.value)} placeholder="Ex : (kiné, chir, psy)" /></div>
        <div className="ep-field"><label>Tarif ($)</label><input value={f.price || ''} onChange={(e) => set('price', +e.target.value.replace(/\D/g, '') || 0)} placeholder="600" /></div>
        <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
          {item && <button className="btn-refuse" onClick={remove} disabled={busy}><Icons.trash size={15} /></button>}
          <button className="btn btn-ghost" style={{ flex: 1, justifyContent: 'center' }} onClick={onClose} disabled={busy}>Annuler</button>
          <button className="btn btn-gold" style={{ flex: 1, justifyContent: 'center' }} onClick={submit} disabled={busy}><Icons.check size={15} /> {item ? 'Enregistrer' : 'Ajouter'}</button>
        </div>
      </div>
    </Modal>
  )
}
