'use client'
import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Icons } from '@/components/Icons'
import { SecTitle } from '@/components/ui'
import { DOC_TYPES } from '@/lib/constants'
import { useApp } from '@/lib/app-context'
import { exportPng, capturePng } from '@/lib/export-png'
import { attachPatientDoc, attachPatientImage, deletePatient } from '@/lib/actions/patients'
import DocPaper, { DOC_META } from './DocPaper'
import type { Patient } from '@/lib/types'

const todayFull = () => {
  const d = new Date()
  const p = (n: number) => String(n).padStart(2, '0')
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()}`
}

export default function DocumentsView({
  patients,
  initialPatientId,
  initialType,
  death,
}: {
  patients: Patient[]
  initialPatientId?: string
  initialType?: string
  death?: boolean
}) {
  const router = useRouter()
  const { member, can } = useApp()
  const [type, setType] = useState<string | null>(initialType || null)
  const [patient, setPatient] = useState<Patient | null>(patients.find((p) => p.id === initialPatientId) || null)
  const [deathDone, setDeathDone] = useState(false)
  const contentRef = useRef<Record<string, unknown>>({})
  const [toast, setToast] = useState<string | null>(null)
  const flash = (m: string) => { setToast(m); setTimeout(() => setToast(null), 2600) }

  const typeLabel = type ? DOC_TYPES.find((t) => t.key === type)?.title || DOC_META[type]?.name || '' : ''

  const doDownload = () => exportPng('sams-paper', `SAMS_${typeLabel.replace(/\s+/g, '_')}_${patient ? patient.last_name : 'document'}`, flash)

  const attach = async () => {
    if (!patient || !type) return
    if (type === 'imagerie') {
      flash('Génération…')
      const src = await capturePng('sams-paper')
      if (!src) { flash('Erreur capture'); return }
      const res = await attachPatientImage(patient.id, { id: 'im' + Date.now(), src, type: 'Compte-rendu imagerie', label: `Rapport d'imagerie — ${patient.last_name}`, date: todayFull() })
      flash(res.ok ? `Rapport ajouté à l'imagerie de ${patient.first_name} ✓` : res.error || 'Erreur')
      return
    }
    const res = await attachPatientDoc(patient.id, { id: 'd' + Date.now(), type, title: `${typeLabel} — ${patient.last_name}`, date: todayFull(), author: member.name, state: 'rattaché', content: { ...contentRef.current } })
    flash(res.ok ? `Document rattaché au dossier de ${patient.first_name} ✓` : res.error || 'Erreur')
  }

  const back = () => { setType(null); setPatient(null) }

  /* ---------- Mode éditeur ---------- */
  if (type) {
    return (
      <div className="view-anim">
        <div className="doc-toolbar no-print">
          <div className="dt-back" onClick={back}><Icons.arrowL size={16} /> Modèles</div>
          <div style={{ width: 1, height: 22, background: 'var(--navy-line-soft)' }}></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 13, color: 'var(--ink-400)' }}>Patient :</span>
            <select value={patient?.id || ''} onChange={(e) => setPatient(patients.find((p) => p.id === e.target.value) || null)}
              style={{ background: 'var(--navy-800)', border: '1px solid var(--navy-line-soft)', color: 'var(--ink-100)', borderRadius: 8, padding: '8px 12px', fontSize: 13, fontFamily: 'var(--font-ui)' }}>
              <option value="">— Saisie manuelle —</option>
              {patients.map((p) => <option key={p.id} value={p.id}>{p.first_name} {p.last_name} · {p.matricule}</option>)}
            </select>
          </div>
          <div className="spacer"></div>
          {patient && (
            <button className="btn btn-ghost" style={{ color: 'var(--gold-300)', borderColor: 'var(--gold-glow)' }} onClick={attach}>
              <Icons.patient size={15} /> {type === 'imagerie' ? "Ajouter à l'imagerie" : 'Rattacher au dossier'}
            </button>
          )}
          <button className="btn btn-gold" onClick={doDownload}><Icons.download size={15} /> Télécharger (PNG)</button>
        </div>

        {death && patient && !deathDone && (
          <div className="no-print" style={{ display: 'flex', alignItems: 'center', gap: 14, background: 'var(--crit-bg)', border: '1px solid rgba(232,92,82,0.3)', borderRadius: 10, padding: '14px 18px', marginBottom: 16 }}>
            <Icons.cross size={18} style={{ color: 'var(--crit)', flex: '0 0 auto' }} />
            <div style={{ flex: 1, fontSize: 13.5, color: 'var(--ink-200)' }}>Acte de décès généré pour <b style={{ color: 'var(--ink-100)' }}>{patient.first_name} {patient.last_name}</b>. Voulez-vous supprimer définitivement son dossier ?</div>
            <button className="btn btn-ghost" onClick={() => setDeathDone(true)}>Conserver le dossier</button>
            {can('deletePatient') && (
              <button className="btn-refuse" onClick={async () => { await deletePatient(patient.id, `${patient.first_name} ${patient.last_name}`); setDeathDone(true); flash('Dossier supprimé'); router.push('/patients') }}>
                <Icons.trash size={14} /> Supprimer le dossier
              </button>
            )}
          </div>
        )}

        <div style={{ background: 'rgba(201,163,90,0.06)', border: '1px solid var(--navy-line)', borderRadius: 10, padding: '10px 16px', marginBottom: 16, fontSize: 12.5, color: 'var(--ink-300)', display: 'flex', alignItems: 'center', gap: 9 }} className="no-print">
          <Icons.edit size={15} style={{ color: 'var(--gold-400)' }} /> Cliquez directement sur les champs pointillés du document pour les remplir. « Télécharger (PNG) » enregistre le document en une seule image sur votre PC.
        </div>

        <div className="paper-stage">
          <DocPaper key={type} type={type} patient={patient} user={member} contentRef={contentRef} />
        </div>

        {toast && <div style={{ position: 'fixed', bottom: 28, left: '50%', transform: 'translateX(-50%)', background: 'var(--navy-600)', border: '1px solid var(--gold-glow)', color: 'var(--gold-300)', padding: '12px 22px', borderRadius: 12, fontSize: 13.5, fontWeight: 600, zIndex: 90, boxShadow: 'var(--shadow-pop)' }} className="no-print">{toast}</div>}
      </div>
    )
  }

  /* ---------- Mode sélection ---------- */
  return (
    <div className="view-anim">
      <SecTitle>Générer un nouveau document</SecTitle>
      <div className="doc-types">
        {DOC_TYPES.map((t) => {
          const I = Icons[t.icon] || Icons.doc
          return (
            <div className="doc-type" key={t.key} onClick={() => setType(t.key)}>
              <div className="dt-go"><Icons.chevR size={16} /></div>
              <div className="dt-ico"><I size={22} /></div>
              <h4>{t.title}</h4>
              <p>{t.desc}</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
