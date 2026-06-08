'use client'
import { useState } from 'react'
import Modal from '@/components/Modal'
import { Icons } from '@/components/Icons'
import { useApp } from '@/lib/app-context'
import { handleImageInput } from '@/lib/image'
import type { Appointment, VitalsRecord, HistoryEntry, PatientImage, Invoice } from '@/lib/types'

const toFr = (iso: string) => {
  if (!iso) return ''
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}
const stamp = () => {
  const d = new Date()
  const p = (n: number) => String(n).padStart(2, '0')
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`
}
const todayShort = () => {
  const d = new Date()
  const p = (n: number) => String(n).padStart(2, '0')
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}`
}
const todayFull = () => {
  const d = new Date()
  const p = (n: number) => String(n).padStart(2, '0')
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()}`
}

/* ---------- Rendez-vous ---------- */
export function AppointmentModal({ onClose, onSave }: { onClose: () => void; onSave: (a: Appointment) => void }) {
  const { member } = useApp()
  const [f, setF] = useState({ dateIso: '2026-06-15', time: '14:00', reason: '', doctor: member.name, place: 'Hôpital Pillbox' })
  const set = (k: string, v: string) => setF((p) => ({ ...p, [k]: v }))
  const save = () => {
    if (!f.reason.trim()) return
    onSave({ id: 'ap' + Date.now(), dateIso: f.dateIso, date: toFr(f.dateIso), time: f.time, reason: f.reason, doctor: f.doctor, place: f.place, done: false })
    onClose()
  }
  return (
    <Modal onClose={onClose} title="Fixer un rendez-vous" icon={<Icons.calendar size={20} />}>
      <div className="editor-panel">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <div className="ep-field"><label>Date</label><input type="date" value={f.dateIso} onChange={(e) => set('dateIso', e.target.value)} /></div>
          <div className="ep-field"><label>Heure</label><input type="time" value={f.time} onChange={(e) => set('time', e.target.value)} /></div>
        </div>
        <div className="ep-field"><label>Motif du rendez-vous</label><input value={f.reason} onChange={(e) => set('reason', e.target.value)} placeholder="Ex : suivi post-opératoire, contrôle…" autoFocus /></div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <div className="ep-field"><label>Praticien</label><input value={f.doctor} onChange={(e) => set('doctor', e.target.value)} /></div>
          <div className="ep-field"><label>Lieu</label><input value={f.place} onChange={(e) => set('place', e.target.value)} /></div>
        </div>
        <div style={{ background: 'rgba(90,160,214,0.08)', border: '1px solid rgba(90,160,214,0.25)', borderRadius: 9, padding: '10px 14px', fontSize: 12.5, color: 'var(--ink-300)', display: 'flex', gap: 8, alignItems: 'center' }}>
          <Icons.calendar size={15} style={{ color: '#7fb8e0' }} /> Le rendez-vous sera ajouté au calendrier partagé et une carte RDV sera générée.
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
          <button className="btn btn-ghost" style={{ flex: 1, justifyContent: 'center' }} onClick={onClose}>Annuler</button>
          <button className="btn btn-gold" style={{ flex: 1, justifyContent: 'center' }} onClick={save}><Icons.check size={15} /> Fixer &amp; générer la carte</button>
        </div>
      </div>
    </Modal>
  )
}

/* ---------- Constantes ---------- */
export function VitalsModal({ onClose, onSave }: { onClose: () => void; onSave: (v: VitalsRecord) => void }) {
  const [f, setF] = useState({ date: todayShort(), tension: '', fc: '', spo2: '', temp: '' })
  const set = (k: string, v: string) => setF((p) => ({ ...p, [k]: v }))
  return (
    <Modal onClose={onClose} title="Nouveau relevé de constantes" icon={<Icons.pulse size={20} />}>
      <div className="editor-panel">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 12 }}>
          <div className="ep-field"><label>Date</label><input value={f.date} onChange={(e) => set('date', e.target.value)} placeholder="08/06" /></div>
          <div className="ep-field"><label>Tension</label><input value={f.tension} onChange={(e) => set('tension', e.target.value)} placeholder="12/8" /></div>
          <div className="ep-field"><label>FC</label><input value={f.fc} onChange={(e) => set('fc', e.target.value)} placeholder="75" /></div>
          <div className="ep-field"><label>SpO₂</label><input value={f.spo2} onChange={(e) => set('spo2', e.target.value)} placeholder="98" /></div>
          <div className="ep-field"><label>Temp</label><input value={f.temp} onChange={(e) => set('temp', e.target.value)} placeholder="37.0" /></div>
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
          <button className="btn btn-ghost" style={{ flex: 1, justifyContent: 'center' }} onClick={onClose}>Annuler</button>
          <button className="btn btn-gold" style={{ flex: 1, justifyContent: 'center' }} onClick={() => { onSave({ date: f.date, tension: f.tension || '—', fc: f.fc || '0', spo2: f.spo2 || '0', temp: f.temp || '—' }); onClose() }}><Icons.check size={15} /> Enregistrer</button>
        </div>
      </div>
    </Modal>
  )
}

/* ---------- Suivi (historique) ---------- */
export function HistoryModal({ onClose, onSave }: { onClose: () => void; onSave: (h: HistoryEntry) => void }) {
  const { member } = useApp()
  const [f, setF] = useState({ type: 'Consultation', text: '' })
  return (
    <Modal onClose={onClose} title="Ajouter au suivi" icon={<Icons.doc size={20} />}>
      <div className="editor-panel">
        <div className="ep-field"><label>Type</label>
          <select value={f.type} onChange={(e) => setF((p) => ({ ...p, type: e.target.value }))}>
            {['Consultation', 'Intervention', 'Admission', 'Soin', 'Sortie', 'Note'].map((t) => <option key={t}>{t}</option>)}
          </select>
        </div>
        <div className="ep-field"><label>Détail</label><textarea value={f.text} onChange={(e) => setF((p) => ({ ...p, text: e.target.value }))} style={{ minHeight: 90 }} placeholder="Décrivez l'acte ou l'observation…" autoFocus /></div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-ghost" style={{ flex: 1, justifyContent: 'center' }} onClick={onClose}>Annuler</button>
          <button className="btn btn-gold" style={{ flex: 1, justifyContent: 'center' }} onClick={() => { if (f.text.trim()) { onSave({ date: stamp(), type: f.type, author: member.name, text: f.text.trim() }); onClose() } }}><Icons.check size={15} /> Ajouter</button>
        </div>
      </div>
    </Modal>
  )
}

/* ---------- Imagerie ---------- */
export const PRESET_RADIOS: { type: string; src: string }[] = [
  { type: 'Radio — Poumons', src: '/assets/radios/poumons.png' },
  { type: 'Radio — Thorax', src: '/assets/radios/thorax.png' },
  { type: 'Radio — Bras', src: '/assets/radios/bras.png' },
  { type: 'Radio — Jambe', src: '/assets/radios/jambe.png' },
  { type: 'Radio — Bassin', src: '/assets/radios/bassin.png' },
  { type: 'Radio — Crâne', src: '/assets/radios/crane.png' },
  { type: 'Radio — Colonne', src: '/assets/radios/colonne.png' },
  { type: 'Radio — Main', src: '/assets/radios/main.png' },
  { type: 'Radio — Côtes', src: '/assets/radios/cotes.png' },
  { type: 'Radio — Sternum', src: '/assets/radios/sternum.png' },
  { type: 'Radio — Clavicule', src: '/assets/radios/clavicule.png' },
  { type: 'Radio — Omoplate', src: '/assets/radios/scapula.png' },
  { type: 'Radio — Épaule', src: '/assets/radios/epaule.png' },
  { type: 'Radio — Coude', src: '/assets/radios/coude.png' },
  { type: 'Radio — Poignet', src: '/assets/radios/poignet.png' },
  { type: 'Radio — Hanche', src: '/assets/radios/hanche.png' },
  { type: 'Radio — Fémur', src: '/assets/radios/femur.png' },
  { type: 'Radio — Genou', src: '/assets/radios/genou.png' },
  { type: 'Radio — Jambe (Tibia/Fibula)', src: '/assets/radios/tibia.png' },
  { type: 'Radio — Cheville', src: '/assets/radios/cheville.png' },
  { type: 'Radio — Pied', src: '/assets/radios/pied.png' },
  { type: 'Radio — Vertèbres cervicales', src: '/assets/radios/cervicales.png' },
  { type: 'Radio — Vertèbres lombaires', src: '/assets/radios/lombaires.png' },
  { type: 'Scanner', src: '/assets/radios/scanner.png' },
  { type: 'IRM', src: '/assets/radios/irm.png' },
  { type: 'Échographie', src: '/assets/radios/echographie.png' },
  { type: 'Photo de plaie', src: '/assets/radios/plaie.png' },
  { type: 'Autre', src: '/assets/radios/autre.png' },
]
const IMAGING_TYPES = PRESET_RADIOS.map((r) => r.type)

export function ImagingModal({ onClose, onSave }: { onClose: () => void; onSave: (im: PatientImage) => void }) {
  const [type, setType] = useState('Radio — Poumons')
  const [label, setLabel] = useState('')
  const [src, setSrc] = useState<string | null>(null)
  const onFile = (file?: File) => {
    handleImageInput(file, setSrc)
  }
  return (
    <Modal onClose={onClose} title="Ajouter un cliché" icon={<Icons.eye size={20} />}>
      <div className="editor-panel">
        <div className="ep-field"><label>Type d&apos;imagerie</label>
          <select value={type} onChange={(e) => setType(e.target.value)}>{IMAGING_TYPES.map((t) => <option key={t}>{t}</option>)}</select>
        </div>
        <div className="ep-field"><label>Libellé (optionnel)</label><input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Ex : face + profil, contrôle J+7…" /></div>
        <div className="ep-field"><label>Modèles pré-faits <span style={{ color: 'var(--ink-500)', fontWeight: 400 }}>(banque d&apos;imagerie SAMS)</span></label>
          <div className="radio-presets">
            {PRESET_RADIOS.map((r) => (
              <div key={r.type} className={`radio-preset ${src === r.src ? 'on' : ''}`} onClick={() => { setSrc(r.src); setType(r.type) }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={r.src} alt="" />
                <span>{r.type.replace('Radio — ', '')}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="ep-field"><label>Cliché</label>
          {src ? (
            <div style={{ position: 'relative' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" style={{ width: '100%', maxHeight: 220, objectFit: 'contain', borderRadius: 10, background: 'var(--navy-900)', border: '1px solid var(--navy-line-soft)' }} />
              <label className="btn btn-ghost" style={{ position: 'absolute', bottom: 8, right: 8, cursor: 'pointer' }}>
                <Icons.upload size={13} /> Remplacer
                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => onFile(e.target.files?.[0])} />
              </label>
            </div>
          ) : (
            <label className="upload-zone" style={{ display: 'block', cursor: 'pointer' }}>
              <div className="uz-ico"><Icons.upload size={22} /></div>
              <h4>Importer une image</h4>
              <p>radio, scanner, photo… (PNG, JPG)</p>
              <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => onFile(e.target.files?.[0])} />
            </label>
          )}
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
          <button className="btn btn-ghost" style={{ flex: 1, justifyContent: 'center' }} onClick={onClose}>Annuler</button>
          <button className="btn btn-gold" style={{ flex: 1, justifyContent: 'center', opacity: src ? 1 : 0.5, pointerEvents: src ? 'auto' : 'none' }} onClick={() => { if (src) { onSave({ id: 'im' + Date.now(), src, type, label: label || type, date: todayFull() }); onClose() } }}><Icons.check size={15} /> Ajouter le cliché</button>
        </div>
      </div>
    </Modal>
  )
}

/* ---------- Facture ---------- */
export function FactureModal({ onClose, onSave }: { onClose: () => void; onSave: (inv: Invoice) => void }) {
  const [f, setF] = useState({ label: '', amount: '', mutuelle: '', status: 'à régler' })
  const set = (k: string, v: string) => setF((p) => ({ ...p, [k]: v }))
  return (
    <Modal onClose={onClose} title="Nouvelle facture" icon={<Icons.coin size={20} />}>
      <div className="editor-panel">
        <div className="ep-field"><label>Désignation de la prestation</label><input value={f.label} onChange={(e) => set('label', e.target.value)} placeholder="Ex : Intervention + immobilisation" autoFocus /></div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <div className="ep-field"><label>Montant ($)</label><input value={f.amount} onChange={(e) => set('amount', e.target.value.replace(/[^\d]/g, ''))} placeholder="12000" /></div>
          <div className="ep-field"><label>Mutuelle</label>
            <select value={f.mutuelle} onChange={(e) => set('mutuelle', e.target.value)}>
              <option value="">Sans mutuelle</option><option value="standard">Mutuelle</option><option value="premium">Mutuelle Premium</option>
            </select>
          </div>
        </div>
        <div className="ep-field"><label>Statut</label>
          <select value={f.status} onChange={(e) => set('status', e.target.value)}><option value="à régler">À régler</option><option value="payée">Payée</option></select>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-ghost" style={{ flex: 1, justifyContent: 'center' }} onClick={onClose}>Annuler</button>
          <button className="btn btn-gold" style={{ flex: 1, justifyContent: 'center' }} onClick={() => { if (f.label.trim()) { onSave({ id: 'inv' + Date.now(), date: todayFull(), label: f.label.trim(), amount: +f.amount || 0, mutuelle: f.mutuelle, status: f.status }); onClose() } }}><Icons.check size={15} /> Créer la facture</button>
        </div>
      </div>
    </Modal>
  )
}
