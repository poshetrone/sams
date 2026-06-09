'use client'
import { useRef, useState } from 'react'
import { Icons } from '@/components/Icons'
import { exportPng } from '@/lib/export-png'
import { useApp } from '@/lib/app-context'
import { updatePatientDoc } from '@/lib/actions/patients'
import DocPaper from './DocPaper'
import type { Patient, PatientDoc } from '@/lib/types'

/**
 * Aperçu / édition d'un document rattaché, EN OVERLAY au-dessus du dossier
 * patient (on ne quitte pas la fiche). Rend le document PRÉ-REMPLI avec le
 * contenu sauvegardé (doc.content) via DocPaper, permet de le modifier puis de
 * ré-enregistrer la même ligne (pas de doublon), et propose le PNG.
 */
export default function DocViewer({
  doc,
  patient,
  onClose,
  onSaved,
}: {
  doc: PatientDoc
  patient: Patient
  onClose: () => void
  onSaved?: () => void
}) {
  const { member, canEdit } = useApp()
  const editable = canEdit('documents')
  const [toast, setToast] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const contentRef = useRef<Record<string, unknown>>({ ...(doc.content || {}) })
  const flash = (m: string) => {
    setToast(m)
    setTimeout(() => setToast(null), 2200)
  }

  const save = async () => {
    setSaving(true)
    const res = await updatePatientDoc(patient.id, doc.id, { content: { ...contentRef.current } })
    setSaving(false)
    if (res.ok) {
      flash('Modifications enregistrées ✓')
      onSaved?.()
    } else flash(res.error || 'Erreur')
  }

  return (
    <div className="modal-overlay" onClick={onClose} style={{ alignItems: 'flex-start', overflowY: 'auto', padding: 24 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ display: 'flex', flexDirection: 'column', gap: 14, alignItems: 'center', margin: 'auto' }}>
        <div className="paper-stage" style={{ maxWidth: '94vw' }}>
          <DocPaper type={doc.type} patient={patient} user={member} content={doc.content} contentRef={contentRef} />
        </div>
        <div style={{ display: 'flex', gap: 10, paddingBottom: 8 }}>
          <button className="btn btn-ghost" onClick={onClose}>Fermer</button>
          {editable && (
            <button className="btn btn-ghost" style={{ color: 'var(--gold-300)', borderColor: 'var(--gold-glow)' }} onClick={save} disabled={saving}>
              <Icons.check size={15} /> {saving ? 'Enregistrement…' : 'Enregistrer les modifications'}
            </button>
          )}
          <button className="btn btn-gold" onClick={() => exportPng('sams-paper', `SAMS_${doc.type}_${patient.last_name}`, flash)}>
            <Icons.download size={15} /> Télécharger (PNG)
          </button>
        </div>
      </div>
      {toast && <div style={{ position: 'fixed', bottom: 28, left: '50%', transform: 'translateX(-50%)', background: 'var(--navy-600)', border: '1px solid var(--gold-glow)', color: 'var(--gold-300)', padding: '12px 22px', borderRadius: 12, fontSize: 13.5, fontWeight: 600, zIndex: 95, boxShadow: 'var(--shadow-pop)' }}>{toast}</div>}
    </div>
  )
}
