'use client'
import { useRef, useState } from 'react'
import { Icons } from '@/components/Icons'
import { uploadImage } from '@/lib/image'
import { addContractPhoto, deleteContractPhoto } from '@/lib/actions/members'
import type { Member } from '@/lib/types'

/**
 * Colonne « Contrat » d'une ligne employé — porté du prototype
 * (reference_design/views_contract.jsx → ContractCell). Classes : ct-signed,
 * ct-signed-thumb, ct-signed-txt, ct-signed-actions, ct-act, ct-add-tile.
 *
 * - Vignette cliquable (lightbox) si une/plusieurs photos — visible par tous.
 * - Compteur si plusieurs photos.
 * - Ajout / suppression de photo : Direction uniquement.
 * - « — » si aucune photo.
 * Photos stockées dans Storage (bucket media) ; URL persistée en base.
 */
export default function ContractCell({ member, isAdmin, editable = true, onChanged }: { member: Member; isAdmin: boolean; editable?: boolean; onChanged: () => void }) {
  const canWrite = isAdmin && editable
  const photos = member.contract_photos || []
  const last = photos[photos.length - 1]
  const fileRef = useRef<HTMLInputElement>(null)
  const [lightbox, setLightbox] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const upload = async (file?: File) => {
    if (!file) return
    setBusy(true)
    const url = await uploadImage(file, 'contracts/photos')
    if (url) await addContractPhoto(member.id, url)
    setBusy(false)
    onChanged()
  }
  const del = async (id: string) => {
    setBusy(true)
    await deleteContractPhoto(member.id, id)
    setBusy(false)
    onChanged()
  }

  return (
    <div onClick={(e) => e.stopPropagation()}>
      {last ? (
        <div className="ct-signed" onClick={() => setLightbox(last.src)}>
          <div className="ct-signed-thumb">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={last.src} alt="" />
          </div>
          <div className="ct-signed-txt">
            <b>SIGNÉ{photos.length > 1 ? ` · ${photos.length}` : ''}</b>
            <span>Cliquer pour voir</span>
          </div>
          {canWrite && (
            <div className="ct-signed-actions">
              <div className="ct-act" title="Ajouter une photo" onClick={(e) => { e.stopPropagation(); if (!busy) fileRef.current?.click() }}><Icons.plus size={13} /></div>
              <div className="ct-act del" title="Supprimer" onClick={(e) => { e.stopPropagation(); if (!busy) del(last.id) }}><Icons.trash size={13} /></div>
            </div>
          )}
          {canWrite && <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => upload(e.target.files?.[0])} />}
        </div>
      ) : canWrite ? (
        <div className="ct-add-tile" onClick={() => { if (!busy) fileRef.current?.click() }} title="Ajouter une photo du contrat">
          <Icons.camera size={15} />
          <span>{busy ? 'Envoi…' : 'Photo du contrat'}</span>
          <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => upload(e.target.files?.[0])} />
        </div>
      ) : (
        <span style={{ color: 'var(--ink-500)', fontSize: 12 }}>—</span>
      )}

      {lightbox && (
        <div className="modal-overlay" onClick={() => setLightbox(null)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={lightbox} alt="Contrat" style={{ maxWidth: '90vw', maxHeight: '88vh', borderRadius: 12, boxShadow: 'var(--shadow-pop)' }} onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </div>
  )
}
