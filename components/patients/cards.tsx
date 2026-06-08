'use client'
import { useState } from 'react'
import { Icons } from '@/components/Icons'
import { exportPng } from '@/lib/export-png'
import { fmtMoney, fmtPhone } from '@/lib/format'
import { STATUS_MAP, CARE_STATUS, MUTUELLES } from '@/lib/constants'
import type { Patient, Appointment, Invoice } from '@/lib/types'

function useToast() {
  const [toast, setToast] = useState<string | null>(null)
  const flash = (m: string) => {
    setToast(m)
    setTimeout(() => setToast(null), 2200)
  }
  const node = toast ? (
    <div style={{ position: 'fixed', bottom: 28, left: '50%', transform: 'translateX(-50%)', background: 'var(--navy-600)', border: '1px solid var(--gold-glow)', color: 'var(--gold-300)', padding: '12px 22px', borderRadius: 12, fontSize: 13.5, fontWeight: 600, zIndex: 95, boxShadow: 'var(--shadow-pop)' }}>{toast}</div>
  ) : null
  return { flash, node }
}

/* ---------- Carte de rendez-vous ---------- */
export function AppointmentCard({ patient, appt, onClose }: { patient: Patient; appt: Appointment; onClose: () => void }) {
  const { flash, node } = useToast()
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{ display: 'flex', flexDirection: 'column', gap: 14, alignItems: 'center' }}>
        <div className="rdv-card" id="rdv-card">
          <div className="rdv-bg"></div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="rdv-wm" src="/assets/sams-logo.png" alt="" />
          <div className="rdv-head">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/assets/sams-logo.png" alt="" />
            <div><h1>S.A.M.S</h1><p>San Andreas Medical Services</p></div>
            <div className="rdv-tag">Carte de rendez-vous</div>
          </div>
          <div className="rdv-body">
            <div className="rdv-patient">
              <span className="rdv-lbl">Patient</span>
              <span className="rdv-name">{patient.first_name} {patient.last_name}</span>
              <span className="rdv-cit">{patient.matricule}</span>
            </div>
            <div className="rdv-grid">
              <div className="rdv-field"><span className="rdv-lbl">Date</span><span className="rdv-val">{appt.date}</span></div>
              <div className="rdv-field"><span className="rdv-lbl">Heure</span><span className="rdv-val">{appt.time || '—'}</span></div>
              <div className="rdv-field"><span className="rdv-lbl">Praticien</span><span className="rdv-val">{appt.doctor || '—'}</span></div>
              <div className="rdv-field"><span className="rdv-lbl">Lieu</span><span className="rdv-val">{appt.place || 'Hôpital Pillbox'}</span></div>
            </div>
            <div className="rdv-reason">
              <span className="rdv-lbl">Motif du rendez-vous</span>
              <span className="rdv-val">{appt.reason}</span>
            </div>
            <div className="rdv-foot">
              <span>Présentez cette carte à l&apos;accueil le jour du rendez-vous.</span>
              <div className="rdv-stamp">SAMS<br />★ RDV ★</div>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-ghost" onClick={onClose}>Fermer</button>
          <button className="btn btn-gold" onClick={() => exportPng('rdv-card', `RDV_${patient.last_name}_${appt.date.replace(/\//g, '-')}`, flash)}><Icons.download size={15} /> Télécharger la carte (PNG)</button>
        </div>
      </div>
      {node}
    </div>
  )
}

/* ---------- Résumé du dossier ---------- */
export function DossierSummary({ patient, onClose }: { patient: Patient; onClose: () => void }) {
  const { flash, node } = useToast()
  const st = STATUS_MAP[patient.status]
  return (
    <div className="modal-overlay" onClick={onClose} style={{ alignItems: 'flex-start', overflowY: 'auto', padding: 24 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ display: 'flex', flexDirection: 'column', gap: 14, alignItems: 'center', margin: 'auto' }}>
        <div className="paper" id="dossier-summary" style={{ width: 720, minHeight: 'auto', padding: '46px 50px' }}>
          <div className="paper-head">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/assets/sams-logo.png" alt="" />
            <div className="ph-txt"><h1>S.A.M.S</h1><p>San Andreas Medical Services</p></div>
            <div className="ph-ref">Dossier patient<br /><b>{patient.matricule}</b></div>
          </div>
          <div className="paper-doctitle"><h2>Dossier médical — {patient.first_name} {patient.last_name}</h2><div className="rule"></div></div>

          <div className="paper-section">
            <div className="ps-label">Identité</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 32px' }}>
              <div className="prow"><div className="pl">Naissance</div><div className="pv">{patient.dob} ({patient.sex === 'M' ? 'H' : 'F'})</div></div>
              <div className="prow"><div className="pl">Groupe sanguin</div><div className="pv">{patient.blood}</div></div>
              <div className="prow"><div className="pl">Téléphone</div><div className="pv">{patient.phone ? fmtPhone(patient.phone) : '—'}</div></div>
              <div className="prow"><div className="pl">Allergies</div><div className="pv">{patient.allergies}</div></div>
              <div className="prow"><div className="pl">Statut</div><div className="pv">{st ? st.label : '—'} · {(CARE_STATUS[patient.care] || {}).label || ''}</div></div>
              <div className="prow"><div className="pl">À prévenir</div><div className="pv">{patient.emergency && patient.emergency.name ? `${patient.emergency.name} (${patient.emergency.link})` : '—'}</div></div>
            </div>
          </div>

          <div className="paper-section">
            <div className="ps-label">Antécédents &amp; traitements</div>
            <p style={{ fontSize: 13, color: '#2a3340', lineHeight: 1.6, marginBottom: 8 }}>{patient.antecedents || 'Aucun antécédent renseigné.'}</p>
            {(patient.treatments || []).map((t, i) => <div key={i} style={{ fontSize: 13, color: '#1a2330' }}>• <b>{t.name}</b> — {t.pos}</div>)}
          </div>

          <div className="paper-section">
            <div className="ps-label">Dernières constantes</div>
            <div style={{ display: 'flex', gap: 22, fontSize: 13 }}>
              <span>Tension <b>{patient.vitals.tension}</b></span>
              <span>FC <b>{patient.vitals.fc} bpm</b></span>
              <span>SpO₂ <b>{patient.vitals.spo2}%</b></span>
              <span>Temp <b>{patient.vitals.temp}°C</b></span>
            </div>
          </div>

          <div className="paper-section">
            <div className="ps-label">Historique récent</div>
            {(patient.history || []).slice(0, 5).map((h, i) => (
              <div key={i} style={{ fontSize: 12.5, color: '#2a3340', marginBottom: 6 }}><b style={{ color: '#0d2236' }}>{h.date}</b> · {h.type} ({h.author}) — {h.text}</div>
            ))}
            {(!patient.history || patient.history.length === 0) && <p style={{ fontSize: 13, color: '#8a93a1' }}>Aucun historique.</p>}
          </div>

          <div className="paper-legal">Document confidentiel — réservé au service médical SAMS. Secret médical applicable.</div>
        </div>
        <div style={{ display: 'flex', gap: 10, paddingBottom: 8 }}>
          <button className="btn btn-ghost" onClick={onClose}>Fermer</button>
          <button className="btn btn-gold" onClick={() => exportPng('dossier-summary', `Dossier_${patient.last_name}_${patient.first_name}`, flash)}><Icons.download size={15} /> Exporter le dossier (PNG)</button>
        </div>
      </div>
      {node}
    </div>
  )
}

/* ---------- Carte facture ---------- */
export function FactureCard({ patient, inv, onClose }: { patient: Patient; inv: Invoice; onClose: () => void }) {
  const { flash, node } = useToast()
  const mut = inv.mutuelle ? MUTUELLES[inv.mutuelle as 'standard' | 'premium'] : null
  return (
    <div className="modal-overlay" onClick={onClose} style={{ alignItems: 'flex-start', overflowY: 'auto' }}>
      <div onClick={(e) => e.stopPropagation()} style={{ display: 'flex', flexDirection: 'column', gap: 14, alignItems: 'center', margin: 'auto' }}>
        <div className="paper" id="facture-card" style={{ width: 680, minHeight: 'auto', padding: '46px 50px' }}>
          <div className="paper-head">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/assets/sams-logo.png" alt="" />
            <div className="ph-txt"><h1>S.A.M.S</h1><p>San Andreas Medical Services</p></div>
            <div className="ph-ref">Facture<br /><b>{inv.id.toUpperCase()}</b><br />{inv.date}</div>
          </div>
          <div className="paper-doctitle"><h2>Facture de prise en charge</h2><div className="rule"></div></div>
          <div className="paper-section"><div className="ps-label">Patient</div>
            <div className="prow"><div className="pl">Nom</div><div className="pv">{patient.last_name.toUpperCase()} {patient.first_name}</div></div>
            <div className="prow"><div className="pl">N° citoyen</div><div className="pv">{patient.matricule}</div></div>
          </div>
          <div className="paper-section"><div className="ps-label">Prestation</div>
            <div className="prow"><div className="pl">Désignation</div><div className="pv">{inv.label}</div></div>
            <div className="prow"><div className="pl">Couverture</div><div className="pv">{mut ? mut.label : 'Sans mutuelle'}</div></div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20 }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 12, color: '#5a6678', textTransform: 'uppercase', letterSpacing: '1px' }}>Montant total</div>
              <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 38, fontWeight: 700, color: '#0d2236' }}>{fmtMoney(inv.amount)}</div>
              <div style={{ fontSize: 12, color: mut ? '#1f7a52' : '#5a6678', marginTop: 2 }}>{mut ? 'Pris en charge par la mutuelle' : 'À la charge du patient'}</div>
            </div>
          </div>
          <div className="paper-legal">Facture émise par le San Andreas Medical Services. Conserver pour tout remboursement mutuelle.</div>
        </div>
        <div style={{ display: 'flex', gap: 10, paddingBottom: 8 }}>
          <button className="btn btn-ghost" onClick={onClose}>Fermer</button>
          <button className="btn btn-gold" onClick={() => exportPng('facture-card', `Facture_${patient.last_name}_${inv.id}`, flash)}><Icons.download size={15} /> Télécharger la facture (PNG)</button>
        </div>
      </div>
      {node}
    </div>
  )
}
