'use client'
import { useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Icons } from '@/components/Icons'
import { Card, GradePill, SecTitle } from '@/components/ui'
import Modal from '@/components/Modal'
import { fmtFileSize, initialsOf } from '@/lib/format'
import { useApp } from '@/lib/app-context'
import { uploadFile, MAX_UPLOAD_BYTES } from '@/lib/image'
import {
  saveFormation,
  deleteFormation,
  reorderFormations,
  answerFormation,
  deleteAnswer,
} from '@/lib/actions/academy'
import FormationReader from './FormationReader'
import type { AcademyAnswer, AcademyChapter, AcademyDocument, AcademyFormation } from '@/lib/types'

type Tab = 'parcours' | 'formations' | 'reponses'

const TABS: { key: Tab; label: string; icon: keyof typeof Icons }[] = [
  { key: 'parcours', label: 'Parcours', icon: 'medal' },
  { key: 'formations', label: 'Formations', icon: 'edit' },
  { key: 'reponses', label: 'Réponses', icon: 'docs' },
]

const newChapter = (): AcademyChapter => ({
  key: Math.random().toString(36).slice(2, 10),
  title: '',
  text: '',
  items: [],
})

export default function AcademyView({
  formations,
  answers,
}: {
  formations: AcademyFormation[]
  answers: AcademyAnswer[]
}) {
  const router = useRouter()
  const { member, canEdit } = useApp()
  const editable = canEdit('academy')

  const [tab, setTab] = useState<Tab>('parcours')
  const [editRow, setEditRow] = useState<AcademyFormation | null>(null)
  const [creating, setCreating] = useState(false)
  const [busy, setBusy] = useState(false)

  // Réponses du membre connecté, par formation — pilote l'état de validation.
  const mine = useMemo(() => {
    const m = new Map<string, AcademyAnswer>()
    for (const a of answers) if (a.member_id === member.id) m.set(a.formation_id, a)
    return m
  }, [answers, member.id])

  const doneCount = formations.filter((f) => mine.get(f.id)?.completed).length
  const pct = formations.length ? Math.round((doneCount / formations.length) * 100) : 0

  const del = async (id: string) => {
    setBusy(true)
    await deleteFormation(id)
    setBusy(false)
    router.refresh()
  }
  const move = async (id: string, dir: -1 | 1) => {
    const ids = formations.map((f) => f.id)
    const i = ids.indexOf(id)
    const j = i + dir
    if (i < 0 || j < 0 || j >= ids.length) return
    ;[ids[i], ids[j]] = [ids[j], ids[i]]
    setBusy(true)
    await reorderFormations(ids)
    setBusy(false)
    router.refresh()
  }

  return (
    <div className="view-anim">
      <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(3,1fr)', marginBottom: 24 }}>
        <Card className="kpi">
          <div className="kpi-ico"><Icons.medal size={20} /></div>
          <div className="label">Formations au programme</div>
          <div className="val">{formations.length}</div>
        </Card>
        <Card className="kpi">
          <div className="kpi-ico"><Icons.check size={20} /></div>
          <div className="label">Ma progression</div>
          <div className="val" style={{ fontSize: 32 }}>{pct}%</div>
        </Card>
        <Card className="kpi">
          <div className="kpi-ico"><Icons.docs size={20} /></div>
          <div className="label">Réponses reçues</div>
          <div className="val">{answers.length}</div>
        </Card>
      </div>

      <div className="ptabs">
        {TABS.map((t) => {
          // Édition et réponses n'ont d'intérêt que pour qui peut administrer.
          if (t.key !== 'parcours' && !editable) return null
          const Ico = Icons[t.icon]
          return (
            <div key={t.key} className={`ptab ${tab === t.key ? 'on' : ''}`} onClick={() => setTab(t.key)}>
              <Ico size={15} /> {t.label}
            </div>
          )
        })}
      </div>

      {tab === 'parcours' && (
        <ParcoursTab
          formations={formations}
          mine={mine}
          busy={busy}
          setBusy={setBusy}
          onDone={() => router.refresh()}
        />
      )}

      {tab === 'formations' && editable && (
        <>
          <SecTitle
            action={
              <button className="btn btn-gold" onClick={() => setCreating(true)} disabled={busy}>
                <Icons.plus size={15} /> Nouvelle formation
              </button>
            }
          >
            Contenu du parcours
          </SecTitle>
          <Card style={{ overflowX: 'auto' }}>
            <table className="tbl" style={{ minWidth: 720 }}>
              <thead>
                <tr>
                  <th style={{ width: 60 }}>Ordre</th>
                  <th>Formation</th>
                  <th style={{ textAlign: 'right' }}>Chapitres</th>
                  <th>Mise en situation</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {formations.map((f, i) => (
                  <tr key={f.id}>
                    <td style={{ color: 'var(--ink-400)', fontFamily: 'var(--font-display)' }}>
                      {String(i).padStart(2, '0')}
                    </td>
                    <td>
                      <b style={{ color: 'var(--ink-100)', display: 'block' }}>{f.title}</b>
                      {f.subtitle && (
                        <span style={{ fontSize: 11.5, color: 'var(--ink-400)' }}>{f.subtitle}</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'right', color: 'var(--ink-300)' }}>{f.chapters.length}</td>
                    <td>
                      {f.question ? (
                        <span className="badge ok" style={{ padding: '2px 8px' }}>
                          <span className="b-dot"></span> oui
                        </span>
                      ) : (
                        <span style={{ color: 'var(--ink-500)' }}>—</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: 6 }}>
                        <div
                          className="icon-btn"
                          style={{ width: 32, height: 32, opacity: i === 0 ? 0.35 : 1 }}
                          title="Monter"
                          onClick={() => !busy && i > 0 && move(f.id, -1)}
                        >
                          <Icons.arrowUp size={14} />
                        </div>
                        <div
                          className="icon-btn"
                          style={{ width: 32, height: 32, opacity: i === formations.length - 1 ? 0.35 : 1 }}
                          title="Descendre"
                          onClick={() => !busy && i < formations.length - 1 && move(f.id, 1)}
                        >
                          <Icons.arrowDown size={14} />
                        </div>
                        <div className="icon-btn" style={{ width: 32, height: 32 }} title="Modifier" onClick={() => setEditRow(f)}>
                          <Icons.edit size={14} />
                        </div>
                        <div className="icon-btn" style={{ width: 32, height: 32 }} title="Supprimer" onClick={() => !busy && del(f.id)}>
                          <Icons.trash size={14} />
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
                {formations.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', color: 'var(--ink-500)', padding: 40 }}>
                      Aucune formation. Créez la première.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </Card>
        </>
      )}

      {tab === 'reponses' && editable && <ReponsesTab formations={formations} answers={answers} onRefresh={() => router.refresh()} />}

      {(editRow || creating) && (
        <FormationModal
          row={editRow}
          onClose={() => {
            setEditRow(null)
            setCreating(false)
          }}
          onSaved={() => {
            setEditRow(null)
            setCreating(false)
            router.refresh()
          }}
        />
      )}
    </div>
  )
}

/* ============================ Parcours ============================ */

function ParcoursTab({
  formations,
  mine,
  busy,
  setBusy,
  onDone,
}: {
  formations: AcademyFormation[]
  mine: Map<string, AcademyAnswer>
  busy: boolean
  setBusy: (b: boolean) => void
  onDone: () => void
}) {
  const [open, setOpen] = useState(0)
  const current = formations[open]
  const answer = current ? mine.get(current.id) : undefined
  const [text, setText] = useState('')

  if (!current) {
    return (
      <Card style={{ textAlign: 'center', color: 'var(--ink-500)', padding: 40 }}>
        Le parcours est vide pour le moment.
      </Card>
    )
  }

  const validate = async () => {
    setBusy(true)
    await answerFormation(current.id, current.question ? text || answer?.answer || '' : null, true)
    setBusy(false)
    setText('')
    onDone()
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 20, alignItems: 'start' }}>
      <Card style={{ padding: 10 }}>
        {formations.map((f, i) => {
          const done = mine.get(f.id)?.completed
          return (
            <div
              key={f.id}
              onClick={() => setOpen(i)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 12px',
                borderRadius: 9,
                cursor: 'pointer',
                background: i === open ? 'rgba(201,163,90,0.12)' : 'transparent',
              }}
            >
              <span
                style={{
                  width: 26,
                  height: 26,
                  flex: '0 0 26px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 11,
                  fontWeight: 700,
                  border: '1px solid var(--navy-line)',
                  color: done ? 'var(--navy-900)' : 'var(--ink-400)',
                  background: done ? 'var(--gold-400)' : 'transparent',
                }}
              >
                {done ? '✓' : String(i).padStart(2, '0')}
              </span>
              <span style={{ fontSize: 13, fontWeight: 600, color: i === open ? 'var(--gold-300)' : 'var(--ink-200)' }}>
                {f.title}
              </span>
            </div>
          )
        })}
      </Card>

      <div>
        <SecTitle
          action={
            answer?.completed ? (
              <span className="badge ok" style={{ padding: '2px 10px' }}>
                <span className="b-dot"></span> validée
              </span>
            ) : undefined
          }
        >
          {current.title}
        </SecTitle>
        <FormationReader formation={current} />

        <Card className="card-pad" style={{ marginTop: 18, background: 'var(--navy-800)' }}>
          <div style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: 1, color: 'var(--gold-300)', marginBottom: 8 }}>
            VALIDATION DE L&apos;ÉTAPE
          </div>
          {current.question ? (
            <>
              <div style={{ color: 'var(--ink-200)', fontSize: 14, marginBottom: 10 }}>{current.question}</div>
              <textarea
                className="ptextarea"
                placeholder="Votre réponse…"
                value={text || answer?.answer || ''}
                onChange={(e) => setText(e.target.value)}
              />
            </>
          ) : (
            <div style={{ color: 'var(--ink-400)', fontSize: 13.5, marginBottom: 12 }}>
              Confirmez votre lecture pour marquer cette formation comme acquise.
            </div>
          )}
          <button className="btn btn-gold" style={{ marginTop: 12 }} onClick={validate} disabled={busy}>
            <Icons.check size={15} /> {answer?.completed ? 'Mettre à jour ma réponse' : "J'ai terminé cette formation"}
          </button>
        </Card>
      </div>
    </div>
  )
}

/* ============================ Réponses ============================ */

function ReponsesTab({
  formations,
  answers,
  onRefresh,
}: {
  formations: AcademyFormation[]
  answers: AcademyAnswer[]
  onRefresh: () => void
}) {
  const [busy, setBusy] = useState(false)
  const titleOf = (id: string) => formations.find((f) => f.id === id)?.title || '—'

  const del = async (id: string) => {
    setBusy(true)
    await deleteAnswer(id)
    setBusy(false)
    onRefresh()
  }

  return (
    <>
      <SecTitle>Réponses des stagiaires</SecTitle>
      <Card style={{ overflowX: 'auto' }}>
        <table className="tbl" style={{ minWidth: 820 }}>
          <thead>
            <tr>
              <th>Stagiaire</th>
              <th>Grade</th>
              <th>Formation</th>
              <th>Réponse</th>
              <th>Statut</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {answers.map((a) => (
              <tr key={a.id}>
                <td>
                  <div className="person">
                    <div className="av-sm">{initialsOf(a.name || '')}</div>
                    <div className="pn"><b>{a.name || '—'}</b></div>
                  </div>
                </td>
                <td><GradePill grade={a.grade || 'ambulancier'} /></td>
                <td style={{ color: 'var(--ink-300)' }}>{titleOf(a.formation_id)}</td>
                <td style={{ maxWidth: 320, color: 'var(--ink-300)' }}>
                  {a.answer || <span style={{ color: 'var(--ink-500)' }}>—</span>}
                </td>
                <td>
                  {a.completed ? (
                    <span className="badge ok" style={{ padding: '2px 8px' }}>
                      <span className="b-dot"></span> validée
                    </span>
                  ) : (
                    <span style={{ color: 'var(--ink-500)' }}>en cours</span>
                  )}
                </td>
                <td style={{ textAlign: 'right' }}>
                  <div className="icon-btn" style={{ width: 32, height: 32, display: 'inline-flex' }} title="Supprimer la réponse" onClick={() => !busy && del(a.id)}>
                    <Icons.trash size={14} />
                  </div>
                </td>
              </tr>
            ))}
            {answers.length === 0 && (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', color: 'var(--ink-500)', padding: 40 }}>
                  Aucune réponse pour le moment.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </>
  )
}

/* ======================= Édition d'une formation ======================= */

function FormationModal({
  row,
  onClose,
  onSaved,
}: {
  row: AcademyFormation | null
  onClose: () => void
  onSaved: () => void
}) {
  const [title, setTitle] = useState(row?.title || '')
  const [eyebrow, setEyebrow] = useState(row?.eyebrow || '')
  const [subtitle, setSubtitle] = useState(row?.subtitle || '')
  const [question, setQuestion] = useState(row?.question || '')
  const [chapters, setChapters] = useState<AcademyChapter[]>(row?.chapters?.length ? row.chapters : [newChapter()])
  const [documents, setDocuments] = useState<AcademyDocument[]>(row?.documents || [])
  const [busy, setBusy] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [docError, setDocError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const patch = (i: number, p: Partial<AcademyChapter>) =>
    setChapters((cs) => cs.map((c, k) => (k === i ? { ...c, ...p } : c)))

  const patchDoc = (key: string, p: Partial<AcademyDocument>) =>
    setDocuments((ds) => ds.map((d) => (d.key === key ? { ...d, ...p } : d)))

  // Le fichier part dans Storage tout de suite : on ne garde que son URL.
  const onPickFiles = async (files: FileList | null) => {
    if (!files?.length) return
    setDocError(null)
    setUploading(true)
    for (const file of Array.from(files)) {
      if (file.size > MAX_UPLOAD_BYTES) {
        setDocError(`« ${file.name} » dépasse ${fmtFileSize(MAX_UPLOAD_BYTES)}.`)
        continue
      }
      const url = await uploadFile(file, 'academy')
      if (!url) {
        setDocError(`Échec du téléversement de « ${file.name} ».`)
        continue
      }
      setDocuments((ds) => [
        ...ds,
        {
          key: Math.random().toString(36).slice(2, 10),
          name: file.name,
          url,
          mime: file.type || null,
          size: file.size,
        },
      ])
    }
    setUploading(false)
    if (fileRef.current) fileRef.current.value = ''
  }

  const save = async () => {
    if (!title.trim()) return
    setBusy(true)
    await saveFormation({
      id: row?.id,
      title: title.trim(),
      eyebrow: eyebrow.trim() || null,
      subtitle: subtitle.trim() || null,
      question: question.trim() || null,
      chapters,
      documents,
    })
    setBusy(false)
    onSaved()
  }

  return (
    <Modal onClose={onClose} wide title={row ? 'Modifier la formation' : 'Nouvelle formation'} icon={<Icons.medal size={20} />}>
      <div className="editor-panel">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
          <div className="ep-field">
            <label>Titre</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Communication Radio EMS" />
          </div>
          <div className="ep-field">
            <label>Sur-titre</label>
            <input value={eyebrow} onChange={(e) => setEyebrow(e.target.value)} placeholder="Formation 01" />
          </div>
        </div>
        <div className="ep-field" style={{ marginBottom: 14 }}>
          <label>Sous-titre</label>
          <input value={subtitle} onChange={(e) => setSubtitle(e.target.value)} placeholder="Parler clair, court et utile." />
        </div>
        <div className="ep-field" style={{ marginBottom: 18 }}>
          <label>
            Mise en situation <span style={{ color: 'var(--ink-500)', fontWeight: 400 }}>(vide = simple validation de lecture)</span>
          </label>
          <input value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="Rédigez votre transmission radio." />
        </div>

        <SecTitle
          action={
            <button className="btn btn-ghost" onClick={() => setChapters((c) => [...c, newChapter()])}>
              <Icons.plus size={14} /> Chapitre
            </button>
          }
        >
          Chapitres
        </SecTitle>

        <div style={{ display: 'grid', gap: 12, marginBottom: 18 }}>
          {chapters.map((c, i) => (
            <Card key={c.key} className="card-pad" style={{ background: 'var(--navy-800)' }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 10 }}>
                <span style={{ color: 'var(--gold-400)', fontFamily: 'var(--font-display)' }}>
                  {String(i + 1).padStart(2, '0')}
                </span>
                <input
                  className="tinput b"
                  value={c.title}
                  onChange={(e) => patch(i, { title: e.target.value })}
                  placeholder="Titre du chapitre"
                />
                <div
                  className="icon-btn"
                  style={{ width: 30, height: 30, flex: '0 0 30px' }}
                  title="Retirer le chapitre"
                  onClick={() => setChapters((cs) => cs.filter((_, k) => k !== i))}
                >
                  <Icons.trash size={13} />
                </div>
              </div>
              <textarea
                className="ptextarea"
                style={{ minHeight: 70 }}
                value={c.text}
                onChange={(e) => patch(i, { text: e.target.value })}
                placeholder="Paragraphe (facultatif)"
              />
              <textarea
                className="ptextarea"
                style={{ minHeight: 70, marginTop: 10 }}
                value={c.items.join('\n')}
                onChange={(e) => patch(i, { items: e.target.value.split('\n') })}
                placeholder="Une puce par ligne (facultatif)"
              />
            </Card>
          ))}
        </div>

        <SecTitle
          action={
            <button className="btn btn-ghost" onClick={() => fileRef.current?.click()} disabled={uploading}>
              <Icons.upload size={14} /> {uploading ? 'Téléversement…' : 'Ajouter un document'}
            </button>
          }
        >
          Documents
        </SecTitle>

        <input
          ref={fileRef}
          type="file"
          multiple
          style={{ display: 'none' }}
          onChange={(e) => onPickFiles(e.target.files)}
        />

        <div style={{ display: 'grid', gap: 8, marginBottom: 18 }}>
          {documents.map((d) => (
            <Card key={d.key} style={{ background: 'var(--navy-800)', padding: '10px 12px' }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <Icons.file size={16} style={{ color: 'var(--gold-400)', flex: '0 0 16px' }} />
                <input
                  className="tinput"
                  value={d.name}
                  onChange={(e) => patchDoc(d.key, { name: e.target.value })}
                  placeholder="Nom affiché du document"
                />
                <span style={{ fontSize: 11.5, color: 'var(--ink-500)', whiteSpace: 'nowrap' }}>
                  {fmtFileSize(d.size)}
                </span>
                <a
                  className="icon-btn"
                  href={d.url}
                  target="_blank"
                  rel="noreferrer"
                  style={{ width: 30, height: 30, flex: '0 0 30px' }}
                  title="Ouvrir"
                >
                  <Icons.eye size={13} />
                </a>
                <div
                  className="icon-btn"
                  style={{ width: 30, height: 30, flex: '0 0 30px' }}
                  title="Retirer le document"
                  onClick={() => setDocuments((ds) => ds.filter((x) => x.key !== d.key))}
                >
                  <Icons.trash size={13} />
                </div>
              </div>
            </Card>
          ))}
          {documents.length === 0 && !uploading && (
            <div style={{ fontSize: 12.5, color: 'var(--ink-500)' }}>
              Aucun document joint. Les stagiaires en verront la liste sous les chapitres.
            </div>
          )}
          {docError && <div style={{ fontSize: 12.5, color: 'var(--crit)' }}>{docError}</div>}
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-ghost" style={{ flex: 1, justifyContent: 'center' }} onClick={onClose} disabled={busy}>
            Annuler
          </button>
          <button
            className="btn btn-gold"
            style={{ flex: 1, justifyContent: 'center' }}
            onClick={save}
            disabled={busy || !title.trim()}
          >
            <Icons.check size={15} /> Enregistrer
          </button>
        </div>
      </div>
    </Modal>
  )
}
