'use client'
import { useState } from 'react'
import { Icons } from '@/components/Icons'
import { exportPng } from '@/lib/export-png'
import { useApp } from '@/lib/app-context'
import DocPaper from './DocPaper'
import type { Patient } from '@/lib/types'

/**
 * Aperçu d'un document généré/rattaché, EN OVERLAY au-dessus du dossier patient
 * (on ne quitte pas la fiche). Rend le document pré-rempli via DocPaper et
 * propose le téléchargement PNG. Porté de reference_design/views_patient_docs.jsx.
 */
export default function DocViewer({ type, patient, onClose }: { type: string; patient: Patient; onClose: () => void }) {
  const { member } = useApp()
  const [toast, setToast] = useState<string | null>(null)
  const flash = (m: string) => {
    setToast(m)
    setTimeout(() => setToast(null), 2200)
  }

  return (
    <div className="modal-overlay" onClick={onClose} style={{ alignItems: 'flex-start', overflowY: 'auto', padding: 24 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ display: 'flex', flexDirection: 'column', gap: 14, alignItems: 'center', margin: 'auto' }}>
        <div className="paper-stage" style={{ maxWidth: '94vw' }}>
          <DocPaper type={type} patient={patient} user={member} />
        </div>
        <div style={{ display: 'flex', gap: 10, paddingBottom: 8 }}>
          <button className="btn btn-ghost" onClick={onClose}>Fermer</button>
          <button className="btn btn-gold" onClick={() => exportPng('sams-paper', `SAMS_${type}_${patient.last_name}`, flash)}>
            <Icons.download size={15} /> Télécharger (PNG)
          </button>
        </div>
      </div>
      {toast && <div style={{ position: 'fixed', bottom: 28, left: '50%', transform: 'translateX(-50%)', background: 'var(--navy-600)', border: '1px solid var(--gold-glow)', color: 'var(--gold-300)', padding: '12px 22px', borderRadius: 12, fontSize: 13.5, fontWeight: 600, zIndex: 95, boxShadow: 'var(--shadow-pop)' }}>{toast}</div>}
    </div>
  )
}
