'use client'
import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Icons } from '@/components/Icons'
import { Badge, Card, SecTitle } from '@/components/ui'
import Modal from '@/components/Modal'
import { SEVERITY, TRIAGE, GTA_ZONES } from '@/lib/constants'
import { fmtPhone, initialsOf } from '@/lib/format'
import { useApp } from '@/lib/app-context'
import { createFusillade, updateFusillade, createPatientFromWounded, deleteFusillade, type FusilladeInput } from '@/lib/actions/fusillades'
import { handleImageUpload } from '@/lib/image'
import { useRealtime } from '@/lib/useRealtime'
import { recentOwnFusillades } from '@/lib/notifications-context'
import type { Fusillade, Wounded, Patient } from '@/lib/types'

/* Carte GTA */
function GtaMap({ marker, onPick, max = 560 }: { marker?: { x: number | null; y: number | null }; onPick?: (p: { x: number; y: number }) => void; max?: number }) {
  const handle = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!onPick) return
    const r = e.currentTarget.getBoundingClientRect()
    const x = +(((e.clientX - r.left) / r.width) * 100).toFixed(1)
    const y = +(((e.clientY - r.top) / r.height) * 100).toFixed(1)
    onPick({ x, y })
  }
  return (
    <div className={`gta-map ${onPick ? 'pick' : ''}`} style={{ maxWidth: max }} onClick={handle}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/assets/gta-map.png" alt="Carte de San Andreas" crossOrigin="anonymous" />
      {marker && marker.x != null && (
        <div className="map-marker" style={{ left: `${marker.x}%`, top: `${marker.y}%` }}>
          <span className="mm-ring"></span><span className="mm-dot"></span>
        </div>
      )}
    </div>
  )
}

export default function FusilladesView({ fusillades: initial, patients }: { fusillades: Fusillade[]; patients: Patient[] }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { search, isAdmin } = useApp()
  useRealtime('fusillades')
  const [fusillades, setFusillades] = useState(initial)
  useEffect(() => setFusillades(initial), [initial])
  const [sel, setSel] = useState<string | null>(null)
  const [addF, setAddF] = useState(false)
  const [confirmDel, setConfirmDel] = useState<Fusillade | null>(null)

  // Ouverture directe d'une fusillade via ?open=<id> (clic sur une notification)
  useEffect(() => {
    const o = searchParams.get('open')
    if (o) setSel(o)
  }, [searchParams])

  const current = sel ? fusillades.find((f) => f.id === sel) : null

  const confirmModal = confirmDel && (
    <Modal onClose={() => setConfirmDel(null)} title="Supprimer la fusillade" icon={<Icons.trash size={20} />}>
      <p style={{ color: 'var(--ink-200)', fontSize: 14, lineHeight: 1.6 }}>
        Supprimer définitivement <b style={{ color: 'var(--ink-100)' }}>{confirmDel.title}</b> ? Les blessés enregistrés sur cette intervention seront aussi retirés. Cette action est irréversible.
      </p>
      <div style={{ display: 'flex', gap: 10, marginTop: 22 }}>
        <button className="btn btn-ghost" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setConfirmDel(null)}>Annuler</button>
        <button className="btn-refuse" style={{ flex: 1, justifyContent: 'center' }} onClick={() => removeFusillade(confirmDel)}><Icons.trash size={15} /> Supprimer</button>
      </div>
    </Modal>
  )

  const update = (f: Fusillade, patch: Partial<Pick<Fusillade, 'status' | 'wounded'>>) => {
    setFusillades((prev) => prev.map((x) => (x.id === f.id ? { ...x, ...patch } : x)))
    updateFusillade(f.id, patch)
  }
  const removeFusillade = async (f: Fusillade) => {
    setFusillades((prev) => prev.filter((x) => x.id !== f.id))
    setConfirmDel(null)
    if (sel === f.id) setSel(null)
    await deleteFusillade(f.id)
    router.refresh()
  }

  if (current) {
    return (
      <>
        <FusilladeDetail
          fus={current}
          patients={patients}
          isAdmin={isAdmin}
          onBack={() => setSel(null)}
          onUpdate={update}
          onDelete={() => setConfirmDel(current)}
          onCreatePatient={async (w) => {
            const res = await createPatientFromWounded(current.id, w)
            if (res.ok && res.id) router.push(`/patients/${res.id}`)
          }}
          onOpenPatient={(id) => router.push(`/patients/${id}`)}
        />
        {confirmModal}
      </>
    )
  }

  const list = fusillades.filter((f) => !search || `${f.title} ${f.zone}`.toLowerCase().includes(search.toLowerCase()))
  const enCours = fusillades.filter((f) => f.status === 'en cours').length

  return (
    <div className="view-anim">
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
        <div style={{ fontSize: 13.5, color: 'var(--ink-400)' }}><b style={{ color: 'var(--crit)' }}>{enCours}</b> intervention(s) en cours · partagé avec tout le service</div>
        <div style={{ marginLeft: 'auto' }}><button className="btn btn-gold" onClick={() => setAddF(true)}><Icons.target size={16} /> Nouvelle fusillade</button></div>
      </div>

      <div className="fus-grid">
        {list.map((f) => {
          const sev = SEVERITY[f.severity] || SEVERITY['modérée']
          const urgent = (f.wounded || []).filter((w) => w.triage === 'urgent').length
          return (
            <Card key={f.id} className="fus-card" onClick={() => setSel(f.id)} style={{ position: 'relative' }}>
              {isAdmin && (
                <div className="fus-del" title="Supprimer la fusillade" onClick={(e) => { e.stopPropagation(); setConfirmDel(f) }}>
                  <Icons.trash size={15} />
                </div>
              )}
              <div className="fus-map-mini">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/assets/gta-map.png" alt="" />
                <div className="map-marker" style={{ left: `${f.x}%`, top: `${f.y}%` }}><span className="mm-ring"></span><span className="mm-dot"></span></div>
              </div>
              <div style={{ padding: 16, flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <Badge cls={f.status === 'en cours' ? 'crit' : 'ok'}>{f.status}</Badge>
                  <Badge cls={sev.cls}>{f.severity}</Badge>
                </div>
                <h4 style={{ fontSize: 15, color: 'var(--ink-100)', fontWeight: 600, lineHeight: 1.3 }}>{f.title}</h4>
                <div style={{ display: 'flex', gap: 14, color: 'var(--ink-400)', fontSize: 12.5, marginTop: 8 }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><Icons.mapPin size={13} style={{ color: 'var(--gold-400)' }} /> {f.zone}</span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><Icons.patient size={13} /> {(f.wounded || []).length} blessé(s)</span>
                  {urgent > 0 && <span style={{ color: 'var(--crit)', fontWeight: 600 }}>{urgent} UA</span>}
                </div>
                <div style={{ fontSize: 11.5, color: 'var(--ink-500)', marginTop: 8 }}>{f.time} · {f.author}</div>
              </div>
            </Card>
          )
        })}
      </div>

      {addF && <NewFusilladeModal onClose={() => setAddF(false)} onSaved={() => { setAddF(false); router.refresh() }} />}
      {confirmModal}
    </div>
  )
}

function FusilladeDetail({ fus, patients, isAdmin, onBack, onUpdate, onDelete, onCreatePatient, onOpenPatient }: {
  fus: Fusillade
  patients: Patient[]
  isAdmin: boolean
  onBack: () => void
  onUpdate: (f: Fusillade, patch: Partial<Pick<Fusillade, 'status' | 'wounded'>>) => void
  onDelete: () => void
  onCreatePatient: (w: Wounded) => void
  onOpenPatient: (id: string) => void
}) {
  const [addW, setAddW] = useState(false)
  const [lightbox, setLightbox] = useState<string | null>(null)
  const sev = SEVERITY[fus.severity] || SEVERITY['modérée']

  const addWounded = (w: Wounded) => onUpdate(fus, { wounded: [...(fus.wounded || []), w] })
  const delWounded = (id: string) => onUpdate(fus, { wounded: (fus.wounded || []).filter((x) => x.id !== id) })
  const toggleStatus = () => onUpdate(fus, { status: fus.status === 'en cours' ? 'clôturée' : 'en cours' })

  return (
    <div className="view-anim">
      <div className="doc-toolbar">
        <div className="dt-back" onClick={onBack}><Icons.arrowL size={16} /> Toutes les fusillades</div>
        <div className="spacer"></div>
        <button className="btn btn-ghost" onClick={toggleStatus}>{fus.status === 'en cours' ? <><Icons.check size={14} /> Clôturer</> : <><Icons.pulse size={14} /> Rouvrir</>}</button>
        <button className="btn btn-gold" onClick={() => setAddW(true)}><Icons.plus size={15} /> Ajouter un blessé</button>
        {isAdmin && <button className="btn-revoke" onClick={onDelete}><Icons.trash size={13} style={{ verticalAlign: -2 }} /> Supprimer</button>}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, alignItems: 'start' }}>
        <div>
          <div style={{ marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <h2 style={{ fontSize: 21, color: 'var(--ink-100)', fontWeight: 600 }}>{fus.title}</h2>
              <Badge cls={fus.status === 'en cours' ? 'crit' : 'ok'}>{fus.status}</Badge>
            </div>
            <div style={{ display: 'flex', gap: 16, color: 'var(--ink-400)', fontSize: 13, flexWrap: 'wrap' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><Icons.mapPin size={14} style={{ color: 'var(--gold-400)' }} /> {fus.zone || 'Zone'}</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><Icons.clock size={14} /> {fus.time}</span>
              <Badge cls={sev.cls}>Gravité {fus.severity}</Badge>
            </div>
          </div>
          <GtaMap marker={{ x: fus.x, y: fus.y }} max={9999} />
        </div>

        <div>
          <SecTitle>Blessés pris en charge <span className="badge gold" style={{ marginLeft: 4 }}>{(fus.wounded || []).length}</span></SecTitle>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {(fus.wounded || []).length === 0 && <Card className="card-pad"><p style={{ color: 'var(--ink-500)', fontSize: 13.5, textAlign: 'center', padding: 20 }}>Aucun blessé enregistré. Cliquez sur « Ajouter un blessé ».</p></Card>}
            {(fus.wounded || []).map((w) => {
              const t = TRIAGE[w.triage] || TRIAGE.leger
              return (
                <Card key={w.id} className="wounded-card">
                  <div className="wounded-photo">{w.photo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={w.photo} alt="" />
                  ) : <Icons.patient size={24} />}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <b style={{ fontSize: 15, color: 'var(--ink-100)' }}>{w.name}</b>
                      <span className="grade" style={{ color: t.color, background: 'transparent', border: `1px solid ${t.color}` }}>{t.label}</span>
                    </div>
                    <div style={{ fontSize: 12.5, color: 'var(--ink-400)', marginTop: 3 }}>
                      {w.group && <span style={{ color: 'var(--gold-400)' }}>{w.group}</span>}{w.group ? ' · ' : ''}{w.sex === 'M' ? 'H' : 'F'}{w.age ? ` · ${w.age} ans` : ''}{w.phone ? ` · ${fmtPhone(w.phone)}` : ''}
                    </div>
                    {w.info && <p style={{ fontSize: 12.5, color: 'var(--ink-300)', marginTop: 7, lineHeight: 1.5 }}>{w.info}</p>}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10 }}>
                      {w.idCard && <div className="idcard-thumb" onClick={() => setLightbox(w.idCard!)} title="Voir la pièce d'identité">{/* eslint-disable-next-line @next/next/no-img-element */}<img src={w.idCard} alt="" /><span><Icons.idcard size={12} /> Pièce d&apos;identité</span></div>}
                      {w.patientId ? (
                        <button className="btn btn-ghost" style={{ padding: '6px 10px', fontSize: 12 }} onClick={() => onOpenPatient(w.patientId!)}><Icons.patient size={13} /> Dossier</button>
                      ) : (
                        <button className="btn btn-ghost" style={{ padding: '6px 10px', fontSize: 12 }} onClick={() => onCreatePatient(w)}><Icons.plus size={13} /> Créer le dossier</button>
                      )}
                      <div className="spacer" style={{ flex: 1 }}></div>
                      <div className="icon-btn" style={{ width: 32, height: 32 }} title="Retirer" onClick={() => delWounded(w.id)}><Icons.trash size={14} /></div>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        </div>
      </div>

      {addW && <WoundedModal patients={patients} onClose={() => setAddW(false)} onSave={addWounded} />}
      {lightbox && (
        <div className="modal-overlay" onClick={() => setLightbox(null)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={lightbox} alt="Pièce d'identité" style={{ maxWidth: '90vw', maxHeight: '88vh', borderRadius: 12, boxShadow: 'var(--shadow-pop)' }} onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </div>
  )
}

function NewFusilladeModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [f, setF] = useState<FusilladeInput>({ title: '', zone: '', x: null, y: null, severity: 'critique' })
  const [busy, setBusy] = useState(false)
  const set = (k: keyof FusilladeInput, v: unknown) => setF((prev) => ({ ...prev, [k]: v }))
  const save = async () => {
    if (!f.title.trim() || f.x == null) return
    setBusy(true)
    const res = await createFusillade(f)
    setBusy(false)
    if (res.ok) {
      if (res.id) recentOwnFusillades.add(res.id)
      onSaved()
    }
  }
  return (
    <Modal onClose={onClose} title="Nouvelle fusillade" icon={<Icons.target size={20} />} wide>
      <div className="editor-panel">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 22, alignItems: 'start' }}>
          <div>
            <label style={{ display: 'block', marginBottom: 8 }}>Cliquez sur la carte pour placer la zone d&apos;intervention</label>
            <GtaMap marker={{ x: f.x, y: f.y }} onPick={(p) => setF((prev) => ({ ...prev, x: p.x, y: p.y }))} max={9999} />
            {f.x == null && <p style={{ fontSize: 12, color: 'var(--crit)', marginTop: 8 }}>Aucun point sélectionné sur la carte.</p>}
          </div>
          <div>
            <div className="ep-field"><label>Intitulé de l&apos;intervention</label><input value={f.title} onChange={(e) => set('title', e.target.value)} placeholder="Ex : Fusillade — Vinewood Blvd" autoFocus /></div>
            <div className="ep-field"><label>Zone / quartier</label>
              <input value={f.zone} onChange={(e) => set('zone', e.target.value)} placeholder="Ex : Vinewood" list="gta-zones" />
              <datalist id="gta-zones">{GTA_ZONES.map((z) => <option key={z} value={z} />)}</datalist>
            </div>
            <div className="ep-field"><label>Gravité</label>
              <select value={f.severity} onChange={(e) => set('severity', e.target.value)}>
                <option value="légère">Légère</option><option value="modérée">Modérée</option><option value="critique">Critique</option>
              </select>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
              {GTA_ZONES.slice(0, 8).map((z) => <div key={z} className={`chip ${f.zone === z ? 'on' : ''}`} onClick={() => set('zone', z)}>{z}</div>)}
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 22 }}>
              <button className="btn btn-ghost" style={{ flex: 1, justifyContent: 'center' }} onClick={onClose} disabled={busy}>Annuler</button>
              <button className="btn btn-gold" style={{ flex: 1, justifyContent: 'center' }} onClick={save} disabled={busy}><Icons.target size={15} /> Déclencher</button>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  )
}

function WoundedModal({ patients, onClose, onSave }: { patients: Patient[]; onClose: () => void; onSave: (w: Wounded) => void }) {
  const [f, setF] = useState<Wounded>({ id: '', name: '', group: '', age: '', sex: 'M', phone: '', triage: 'urgent', photo: null, idCard: null, info: '', patientId: undefined })
  const [showSug, setShowSug] = useState(true)
  const set = (k: keyof Wounded, v: unknown) => setF((prev) => ({ ...prev, [k]: v }))
  const onImg = (k: 'photo' | 'idCard', file?: File) => {
    handleImageUpload(file, 'fusillades', (url) => set(k, url))
  }
  const matches = f.name.trim().length >= 2 && !f.patientId ? patients.filter((p) => `${p.first_name} ${p.last_name}`.toLowerCase().includes(f.name.toLowerCase())).slice(0, 6) : []
  const pick = (p: Patient) => { setF((prev) => ({ ...prev, name: `${p.first_name} ${p.last_name}`, sex: p.sex, phone: p.phone || '', photo: p.photo || prev.photo, patientId: p.id })); setShowSug(false) }
  const save = () => { if (!f.name.trim()) return; onSave({ ...f, id: 'w' + Date.now() }); onClose() }

  return (
    <Modal onClose={onClose} title="Ajouter un blessé" icon={<Icons.patient size={20} />} wide>
      <div className="editor-panel">
        <div style={{ display: 'flex', gap: 18, marginBottom: 18 }}>
          <div style={{ textAlign: 'center' }}>
            <div className="patient-photo lg" style={{ marginBottom: 8 }}>{f.photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={f.photo} alt="" />
            ) : <Icons.patient size={28} />}</div>
            <label className="btn btn-ghost" style={{ cursor: 'pointer', fontSize: 12, padding: '7px 10px' }}><Icons.camera size={13} /> Photo<input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => onImg('photo', e.target.files?.[0])} /></label>
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', marginBottom: 6 }}>Pièce d&apos;identité</label>
            <div className="idcard-slot">
              {f.idCard ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={f.idCard} alt="" />
              ) : <div className="idcard-empty"><Icons.idcard size={26} /><span>Aucune pièce</span></div>}
              <label className="idcard-up"><Icons.upload size={13} /> {f.idCard ? 'Remplacer' : "Importer la pièce d'identité"}<input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => onImg('idCard', e.target.files?.[0])} /></label>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 14 }}>
          <div className="ep-field" style={{ position: 'relative' }}>
            <label>Nom complet {f.patientId && <span style={{ color: 'var(--ok)', fontWeight: 600 }}>· dossier lié</span>}</label>
            <input value={f.name} onChange={(e) => { set('name', e.target.value); set('patientId', undefined); setShowSug(true) }} placeholder="Rechercher un patient connu…" autoFocus />
            {showSug && matches.length > 0 && (
              <div className="sug-list">
                {matches.map((p) => (
                  <div key={p.id} className="sug-item" onClick={() => pick(p)}>
                    <div className="av-sm">{p.photo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                    ) : initialsOf(`${p.first_name} ${p.last_name}`)}</div>
                    <div className="pn"><b>{p.first_name} {p.last_name}</b><span>{p.matricule}</span></div>
                    <Icons.chevR size={15} style={{ marginLeft: 'auto', color: 'var(--ink-500)' }} />
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="ep-field"><label>Groupe / gang</label><input value={f.group} onChange={(e) => set('group', e.target.value)} placeholder="Ex : Ballas, Families…" /></div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.4fr', gap: 14 }}>
          <div className="ep-field"><label>Âge</label><input value={f.age} onChange={(e) => set('age', e.target.value)} placeholder="29" /></div>
          <div className="ep-field"><label>Sexe</label><select value={f.sex} onChange={(e) => set('sex', e.target.value)}><option value="M">Masculin</option><option value="F">Féminin</option></select></div>
          <div className="ep-field"><label>Téléphone</label><input value={fmtPhone(f.phone)} onChange={(e) => set('phone', e.target.value.replace(/\D/g, '').slice(0, 10))} placeholder="(205) 489-6589" /></div>
        </div>
        <div className="ep-field"><label>Triage</label>
          <div className="chips">
            {Object.entries(TRIAGE).map(([k, t]) => (
              <div key={k} className={`chip ${f.triage === k ? 'on' : ''}`} onClick={() => set('triage', k)} style={f.triage === k ? { color: t.color, borderColor: t.color, background: 'transparent' } : undefined}>{t.label}</div>
            ))}
          </div>
        </div>
        <div className="ep-field"><label>Informations / bilan</label><textarea value={f.info} onChange={(e) => set('info', e.target.value)} style={{ minHeight: 70 }} placeholder="Lésions, soins prodigués, état…" /></div>

        <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
          <button className="btn btn-ghost" style={{ flex: 1, justifyContent: 'center' }} onClick={onClose}>Annuler</button>
          <button className="btn btn-gold" style={{ flex: 1, justifyContent: 'center' }} onClick={save}><Icons.check size={15} /> Ajouter le blessé</button>
        </div>
      </div>
    </Modal>
  )
}
