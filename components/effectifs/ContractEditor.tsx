'use client'
import { useEffect, useRef, useState } from 'react'
import { Icons } from '@/components/Icons'
import { GRADES, type GradeKey } from '@/lib/constants'
import { fmtMoney, fmtPhone } from '@/lib/format'
import { exportPng } from '@/lib/export-png'
import { uploadImage } from '@/lib/image'
import { addContractPhoto } from '@/lib/actions/members'
import type { Member } from '@/lib/types'

/* Champ éditable (porté à l'identique de reference_design/views_contract.jsx → CEdit) */
function CEdit({ initial = '', ph = '', cls = 'pv', tag = 'div', style }: { initial?: string; ph?: string; cls?: string; tag?: 'div' | 'span'; style?: React.CSSProperties }) {
  const ref = useRef<HTMLElement>(null)
  useEffect(() => {
    if (ref.current && initial) ref.current.textContent = initial
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  const Tag = tag as keyof React.JSX.IntrinsicElements
  return (
    // @ts-expect-error ref typing for dynamic tag
    <Tag ref={ref} className={cls} contentEditable suppressContentEditableWarning data-empty={ph} spellCheck={false} style={style} />
  )
}

function CtRow({ label, initial, ph }: { label: string; initial?: string; ph?: string }) {
  return (
    <div className="prow">
      <div className="pl">{label}</div>
      <CEdit cls="pv" initial={initial} ph={ph || '…'} />
    </div>
  )
}

/**
 * Éditeur de contrat de travail — porté à l'identique du prototype
 * (reference_design/views_contract.jsx → ContractEditor). Même structure HTML,
 * mêmes classes CSS. Ajout d'un sélecteur d'employé pour le pré-remplissage.
 */
export default function ContractEditor({ employees, onClose, onSavedPhoto }: { employees: Member[]; onClose: () => void; onSavedPhoto?: () => void }) {
  const [selectedId, setSelectedId] = useState('')
  const [toast, setToast] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const refNo = useRef(`CT-${Math.floor(1000 + Math.random() * 8999)}/26`).current
  const flash = (m: string) => { setToast(m); setTimeout(() => setToast(null), 2400) }

  const employee = employees.find((e) => e.id === selectedId) || null
  const g = employee ? GRADES[employee.grade as GradeKey] : null

  const download = () => exportPng('contract-paper', `Contrat_${(employee ? employee.name : 'SAMS').replace(/\s+/g, '_')}`, flash)

  const clearAll = () => {
    document.querySelectorAll('#contract-paper [contenteditable]').forEach((n) => { (n as HTMLElement).textContent = '' })
    flash('Champs vidés')
  }

  const onPhoto = async (file?: File) => {
    if (!file) return
    if (!employee) { flash('Sélectionnez un employé pour rattacher la photo'); return }
    flash('Upload de la photo…')
    const url = await uploadImage(file, 'contracts/photos')
    if (!url) { flash("Échec de l'upload de la photo") ; return }
    const res = await addContractPhoto(employee.id, url)
    if (res.ok) { flash('Photo du contrat ajoutée ✓'); onSavedPhoto?.() } else flash(res.error || 'Erreur')
  }

  return (
    <div className="contract-overlay">
      <div className="contract-toolbar">
        <div className="ct-hint"><Icons.edit size={15} style={{ color: 'var(--gold-400)' }} /> Cliquez dans les champs pointillés pour remplir le contrat — puis téléchargez en PNG</div>
        <select className="acc-select" style={{ maxWidth: 220 }} value={selectedId} onChange={(e) => setSelectedId(e.target.value)} title="Pré-remplir avec un employé">
          <option value="">— Contrat vierge —</option>
          {employees.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>
        <div className="ct-tools">
          <button className="btn btn-ghost" onClick={clearAll}><Icons.reset size={14} /> Vider</button>
          <button className="btn btn-ghost" onClick={() => fileRef.current?.click()} title="Uploader la photo du contrat signé (rattachée à l'employé sélectionné)"><Icons.camera size={14} /> Photo du contrat</button>
          <button className="btn btn-gold" onClick={download}><Icons.download size={14} /> Télécharger PNG</button>
          <button className="btn btn-ghost" onClick={onClose}><Icons.x size={15} /> Fermer</button>
          <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => onPhoto(e.target.files?.[0])} />
        </div>
      </div>

      <div className="contract-scroll">
        <div className="paper" id="contract-paper" key={selectedId}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="paper-wm" src="/assets/sams-logo.png" alt="" />
          <div className="paper-head">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/assets/sams-logo.png" alt="" />
            <div className="ph-txt"><h1>S.A.M.S</h1><p>San Andreas Medical Services</p></div>
            <div className="ph-ref">Contrat de travail<br />Réf. <b>{refNo}</b><br />Émis le 08/06/2026</div>
          </div>

          <div className="paper-doctitle"><h2>Contrat de travail</h2><div className="rule"></div></div>

          <p className="ct-intro">Le présent contrat de travail est conclu entre le <b>San Andreas Medical Services</b>, service médical de Los Santos, représenté par sa Direction, ci-après dénommé « l&apos;Employeur », et la personne désignée ci-dessous, ci-après dénommée « le Salarié ».</p>

          <div className="paper-section">
            <div className="ps-label">1 · Identité du salarié</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: '0 32px' }}>
              <CtRow label="Nom & prénom" initial={employee ? employee.name : ''} ph="Nom Prénom" />
              <CtRow label="Téléphone" initial={employee ? fmtPhone(employee.phone) : ''} ph="(000) 000-0000" />
              <CtRow label="Matricule" initial={employee ? employee.matricule || '' : ''} ph="SAMS-000" />
              <CtRow label="Date de naissance" ph="JJ/MM/AAAA" />
            </div>
          </div>

          <div className="paper-section">
            <div className="ps-label">2 · Poste & contrat</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr) minmax(0,1fr)', gap: '0 28px' }}>
              <CtRow label="Poste occupé" initial={g ? g.label : ''} ph="…" />
              <CtRow label="Type de contrat" initial="CDI" ph="CDI / CDD" />
              <CtRow label="Grade" initial={g ? g.label : ''} ph="…" />
              <CtRow label="Date d'embauche" initial={employee ? employee.since || '' : ''} ph="JJ/MM/AAAA" />
              <CtRow label="Fin de période d'essai" ph="JJ/MM/AAAA" />
              <CtRow label="Lieu de travail" initial="Hôpital Pillbox" ph="…" />
            </div>
          </div>

          <div className="paper-section">
            <div className="ps-label">3 · Rémunération</div>
            <div className="ct-pay">
              <div className="ct-paycol"><span className="pl">Prime de grade</span><CEdit cls="pv big" initial={g ? fmtMoney(g.prime) : ''} ph="…" /></div>
              <div className="ct-paycol"><span className="pl">Versement</span><CEdit cls="pv" initial="Hebdomadaire" ph="…" /></div>
            </div>
            <p className="ct-note">Le Salarié perçoit une prime liée à son grade ainsi que d&apos;éventuelles primes bonus attribuées à la discrétion de la Direction selon son implication et son ancienneté.</p>
          </div>

          <div className="paper-section">
            <div className="ps-label">4 · Obligations du salarié</div>
            <ul className="ct-list">
              <li>Respecter le règlement intérieur et la hiérarchie du service.</li>
              <li>Porter la tenue réglementaire et adopter une attitude professionnelle.</li>
              <li>Assurer le secret médical et la confidentialité des dossiers patients.</li>
              <li>Maintenir ses formations et son aptitude médicale à jour.</li>
              <li>Déclarer fidèlement ses interventions et actes médicaux.</li>
            </ul>
          </div>

          <div className="paper-section">
            <div className="ps-label">5 · Rupture du contrat</div>
            <p className="ct-intro" style={{ margin: 0 }}>Le présent contrat peut être rompu par l&apos;une ou l&apos;autre des parties moyennant un préavis de <CEdit tag="span" cls="pv inline" initial="7" ph="…" /> jours. Tout manquement grave au règlement intérieur (faute professionnelle, absences répétées, comportement nuisant au service) pourra entraîner un <b>licenciement immédiat</b> sans préavis ni indemnité.</p>
          </div>

          <div className="paper-foot">
            <div className="sign-box"><div className="sl">L&apos;Employeur — Direction SAMS</div><div className="sline"></div><CEdit cls="pv" ph="Nom & signature" style={{ fontWeight: 600, border: 'none' }} /></div>
            <div className="sign-box"><div className="sl">Le Salarié · « lu et approuvé »</div><div className="sline"></div><CEdit cls="pv" initial={employee ? employee.name : ''} ph="Nom & signature" style={{ fontWeight: 600, border: 'none' }} /></div>
            <div className="scachet">SAMS<br />CONTRAT<br />★ OFFICIEL ★</div>
          </div>

          <div className="paper-legal">Contrat établi conformément au règlement intérieur du San Andreas Medical Services. Fait à Los Santos, le 08/06/2026 — Document contractuel interne.</div>
        </div>
      </div>

      {toast && <div className="tom-toast">{toast}</div>}
    </div>
  )
}
