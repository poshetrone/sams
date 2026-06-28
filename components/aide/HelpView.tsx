'use client'
import { useEffect, useRef, useState } from 'react'
import { Icons } from '@/components/Icons'
import { useApp } from '@/lib/app-context'
import { useRealtime } from '@/lib/useRealtime'
import { uploadImage } from '@/lib/image'
import { saveHelp } from '@/lib/actions/help'
import type { HelpBlock, HelpPage } from '@/lib/types'

/** Identifiant local d'un bloc (le serveur en régénère un si manquant). */
const newId = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `b${Date.now()}${Math.round(Math.random() * 1e6)}`

export default function HelpView({ help }: { help: HelpPage }) {
  useRealtime('help_page')
  const { canEdit } = useApp()
  const editable = canEdit('aide')

  const [editing, setEditing] = useState(false)
  const [blocks, setBlocks] = useState<HelpBlock[]>(help.blocks || [])
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  // Resynchronise sur les données serveur tant qu'on n'est pas en édition
  // (évite d'écraser une saisie en cours lors d'un refresh temps réel).
  useEffect(() => {
    if (!editing) setBlocks(help.blocks || [])
  }, [help, editing])

  const flash = (m: string) => {
    setToast(m)
    setTimeout(() => setToast(null), 2400)
  }

  /* ---------- Mutations locales ---------- */
  const update = (id: string, patch: Partial<HelpBlock>) =>
    setBlocks((bs) => bs.map((b) => (b.id === id ? ({ ...b, ...patch } as HelpBlock) : b)))

  const remove = (id: string) => setBlocks((bs) => bs.filter((b) => b.id !== id))

  const move = (id: string, dir: -1 | 1) =>
    setBlocks((bs) => {
      const i = bs.findIndex((b) => b.id === id)
      const j = i + dir
      if (i < 0 || j < 0 || j >= bs.length) return bs
      const copy = [...bs]
      ;[copy[i], copy[j]] = [copy[j], copy[i]]
      return copy
    })

  const add = (type: HelpBlock['type']) =>
    setBlocks((bs) => [
      ...bs,
      type === 'image'
        ? { id: newId(), type: 'image', url: '' }
        : { id: newId(), type, text: '' },
    ])

  const onPickImage = async (id: string, file?: File) => {
    if (!file) return
    flash('Téléversement de l’image…')
    const url = await uploadImage(file, 'help')
    if (url) update(id, { url })
    else flash('Échec du téléversement')
  }

  /* ---------- Enregistrement ---------- */
  const save = async () => {
    setSaving(true)
    // On ne conserve pas les blocs vides (sauf une image en cours d'ajout sans url → ignorée serveur).
    const clean = blocks.filter((b) =>
      b.type === 'image' ? !!b.url : (b.text || '').trim().length > 0
    )
    const res = await saveHelp(clean)
    setSaving(false)
    if (res.ok) {
      setEditing(false)
      flash('Modifications enregistrées')
    } else {
      flash(res.error || 'Erreur lors de l’enregistrement')
    }
  }

  const cancel = () => {
    setBlocks(help.blocks || [])
    setEditing(false)
  }

  /* ============================== Lecture ============================== */
  if (!editing) {
    return (
      <div className="help-doc">
        {editable && (
          <div className="help-bar">
            <button className="btn btn-gold" onClick={() => setEditing(true)}>
              <Icons.edit size={15} /> Modifier
            </button>
          </div>
        )}

        {blocks.length === 0 ? (
          <div className="help-empty">
            <Icons.help size={40} style={{ opacity: 0.4, marginBottom: 12 }} />
            <div>
              Aucun contenu d’aide pour le moment.
              {editable && ' Cliquez sur « Modifier » pour rédiger le guide.'}
            </div>
          </div>
        ) : (
          blocks.map((b) => <ReadBlock key={b.id} block={b} />)
        )}

        {toast && <Toast msg={toast} />}
      </div>
    )
  }

  /* ============================== Édition ============================== */
  return (
    <div className="help-doc">
      <div className="help-bar">
        <span className="spacer">Mode édition — réservé à la Direction</span>
        <button className="btn btn-ghost" onClick={cancel} disabled={saving}>
          Annuler
        </button>
        <button className="btn btn-gold" onClick={save} disabled={saving}>
          <Icons.check size={15} /> {saving ? 'Enregistrement…' : 'Enregistrer'}
        </button>
      </div>

      {blocks.map((b, i) => (
        <EditBlock
          key={b.id}
          block={b}
          first={i === 0}
          last={i === blocks.length - 1}
          onUpdate={(patch) => update(b.id, patch)}
          onRemove={() => remove(b.id)}
          onMove={(d) => move(b.id, d)}
          onPickImage={(file) => onPickImage(b.id, file)}
        />
      ))}

      <div className="help-add">
        <button className="btn btn-ghost" onClick={() => add('heading')}>
          <Icons.plus size={14} /> Titre
        </button>
        <button className="btn btn-ghost" onClick={() => add('text')}>
          <Icons.plus size={14} /> Paragraphe
        </button>
        <button className="btn btn-ghost" onClick={() => add('image')}>
          <Icons.image size={14} /> Image
        </button>
      </div>

      {toast && <Toast msg={toast} />}
    </div>
  )
}

/* ------------------------------------------------------------------ */

function ReadBlock({ block }: { block: HelpBlock }) {
  if (block.type === 'heading')
    return (
      <div className="help-block">
        <h3 className="help-h">{block.text}</h3>
      </div>
    )
  if (block.type === 'text')
    return (
      <div className="help-block">
        <p className="help-p">{block.text}</p>
      </div>
    )
  if (!block.url) return null
  return (
    <figure className="help-block help-fig">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={block.url} alt={block.caption || ''} />
      {block.caption && <figcaption className="help-cap">{block.caption}</figcaption>}
    </figure>
  )
}

function EditBlock({
  block,
  first,
  last,
  onUpdate,
  onRemove,
  onMove,
  onPickImage,
}: {
  block: HelpBlock
  first: boolean
  last: boolean
  onUpdate: (patch: Partial<HelpBlock>) => void
  onRemove: () => void
  onMove: (dir: -1 | 1) => void
  onPickImage: (file?: File) => void
}) {
  const fileRef = useRef<HTMLInputElement>(null)
  const label =
    block.type === 'heading' ? 'Titre' : block.type === 'text' ? 'Paragraphe' : 'Image'

  return (
    <div className="help-edit">
      <div className="help-edit-head">
        <span className="help-edit-tag">{label}</span>
        <div className="help-edit-ctrl">
          <button
            className="icon-btn"
            style={{ width: 30, height: 30 }}
            title="Monter"
            disabled={first}
            onClick={() => onMove(-1)}
          >
            <Icons.arrowUp size={15} />
          </button>
          <button
            className="icon-btn"
            style={{ width: 30, height: 30 }}
            title="Descendre"
            disabled={last}
            onClick={() => onMove(1)}
          >
            <Icons.arrowDown size={15} />
          </button>
          <button
            className="icon-btn"
            style={{ width: 30, height: 30 }}
            title="Supprimer ce bloc"
            onClick={onRemove}
          >
            <Icons.trash size={15} />
          </button>
        </div>
      </div>

      {block.type === 'image' ? (
        <div className="help-img-edit">
          {block.url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={block.url} alt="" onClick={() => fileRef.current?.click()} style={{ cursor: 'pointer' }} />
          ) : (
            <div className="help-img-drop" onClick={() => fileRef.current?.click()}>
              <Icons.upload size={20} />
              <span>Choisir une image</span>
            </div>
          )}
          <div className="help-img-side">
            <textarea
              className="help-area"
              rows={2}
              placeholder="Légende (facultatif)"
              value={block.caption || ''}
              onChange={(e) => onUpdate({ caption: e.target.value })}
            />
            <button
              className="btn btn-ghost"
              style={{ marginTop: 10 }}
              onClick={() => fileRef.current?.click()}
            >
              <Icons.upload size={14} /> {block.url ? 'Remplacer' : 'Téléverser'}
            </button>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={(e) => onPickImage(e.target.files?.[0])}
          />
        </div>
      ) : (
        <textarea
          className={`help-area ${block.type === 'heading' ? 'h' : ''}`}
          rows={block.type === 'heading' ? 1 : 5}
          placeholder={block.type === 'heading' ? 'Titre de la section…' : 'Votre texte…'}
          value={block.text}
          onChange={(e) => onUpdate({ text: e.target.value })}
        />
      )}
    </div>
  )
}

function Toast({ msg }: { msg: string }) {
  return (
    <div
      style={{
        position: 'fixed',
        bottom: 24,
        left: '50%',
        transform: 'translateX(-50%)',
        background: 'rgba(7,17,29,0.95)',
        border: '1px solid var(--gold-glow)',
        color: 'var(--gold-300)',
        padding: '11px 20px',
        borderRadius: 10,
        fontSize: 13,
        fontWeight: 600,
        zIndex: 80,
        boxShadow: '0 10px 30px -8px rgba(0,0,0,0.6)',
      }}
    >
      {msg}
    </div>
  )
}
