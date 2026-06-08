'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Icons } from '@/components/Icons'
import { Badge, Card, SecTitle } from '@/components/ui'
import Modal from '@/components/Modal'
import { STATUS_MAP, CARE_STATUS } from '@/lib/constants'
import { fmtPhone, initialsOf } from '@/lib/format'
import { useApp } from '@/lib/app-context'
import { updatePatient, deletePatient, declareDeath } from '@/lib/actions/patients'
import { addCalendarEvent } from '@/lib/actions/calendar'
import { handleImageInput } from '@/lib/image'
import VitalsChart from './VitalsChart'
import PatientBilling from './PatientBilling'
import PatientModal from './PatientModal'
import { AppointmentModal, VitalsModal, HistoryModal, ImagingModal } from './modals'
import { AppointmentCard, DossierSummary } from './cards'
import DocViewer from '@/components/documents/DocViewer'
import type { Patient, PatientPatch, Appointment, VitalsRecord, HistoryEntry, PatientImage, PatientDoc } from '@/lib/types'

const TABS = [
  { key: 'apercu', label: "Vue d'ensemble", icon: 'patient' },
  { key: 'suivi', label: 'Suivi', icon: 'pulse' },
  { key: 'antecedents', label: 'Antécédents', icon: 'shield' },
  { key: 'constantes', label: 'Constantes', icon: 'stats' },
  { key: 'rdv', label: 'Rendez-vous', icon: 'calendar' },
  { key: 'documents', label: 'Documents', icon: 'docs' },
  { key: 'imagerie', label: 'Imagerie', icon: 'eye' },
  { key: 'facturation', label: 'Facturation', icon: 'coin' },
]

const docIcon: Record<string, string> = {
  aptitude: 'shield', psy: 'brain', ordonnance: 'pill', arret: 'pause', accident: 'alert',
  rapport: 'body', deces: 'cross', import: 'file', facture: 'coin', bilan: 'pulse', imagerie: 'eye',
}

const todayFull = () => {
  const d = new Date()
  const p = (n: number) => String(n).padStart(2, '0')
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()}`
}

export default function PatientDetailView({ initialPatient }: { initialPatient: Patient }) {
  const router = useRouter()
  const { can, isAdmin } = useApp()
  const [patient, setPatient] = useState<Patient>(initialPatient)
  useEffect(() => setPatient(initialPatient), [initialPatient])

  const [tab, setTab] = useState('apercu')
  const [modal, setModal] = useState<'appt' | 'vitals' | 'history' | 'summary' | 'imaging' | null>(null)
  const [rdvCard, setRdvCard] = useState<Appointment | null>(null)
  const [ant, setAnt] = useState(initialPatient.antecedents || '')
  const [imgFilter, setImgFilter] = useState('tous')
  const [imgLightbox, setImgLightbox] = useState<string | null>(null)
  const [viewDoc, setViewDoc] = useState<PatientDoc | null>(null)
  const [editOpen, setEditOpen] = useState(false)
  const [confirmDel, setConfirmDel] = useState(false)
  const [confirmDeath, setConfirmDeath] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const flash = (m: string) => { setToast(m); setTimeout(() => setToast(null), 2600) }

  const canDel = isAdmin
  const st = STATUS_MAP[patient.status] || STATUS_MAP.stable
  const care = CARE_STATUS[patient.care] || CARE_STATUS.ambulatoire

  /** Met à jour localement + persiste en base. */
  const persist = (patch: PatientPatch) => {
    setPatient((prev) => ({ ...prev, ...patch }))
    updatePatient(patient.id, patch).then((res) => {
      if (!res.ok) flash(res.error || 'Erreur d’enregistrement')
    })
  }

  /* ---- handlers ---- */
  const saveAppt = async (appt: Appointment) => {
    persist({ appointments: [...(patient.appointments || []), appt] })
    if (appt.dateIso) {
      await addCalendarEvent(appt.dateIso, `Rendez-vous ${patient.first_name} ${patient.last_name} — ${appt.reason}`, 'blue')
    }
    setRdvCard(appt)
  }
  const saveVitals = (v: VitalsRecord) =>
    persist({ vitals: { tension: v.tension, fc: v.fc, spo2: v.spo2, temp: v.temp }, vitals_history: [...(patient.vitals_history || []), v] })
  const saveHistory = (h: HistoryEntry) => persist({ history: [h, ...(patient.history || [])] })
  const saveImage = (im: PatientImage) => persist({ images: [im, ...(patient.images || [])] })

  const onUploadDoc = (file?: File) => {
    if (!file) return
    const r = new FileReader()
    r.onload = () => {
      const doc: PatientDoc = { id: 'd' + Date.now(), type: 'import', title: file.name.replace(/\.[^.]+$/, ''), date: todayFull(), author: 'Import', state: 'importé', file: r.result as string, fileName: file.name }
      persist({ docs: [doc, ...(patient.docs || [])] })
    }
    r.readAsDataURL(file)
  }
  const onUploadImg = (file?: File) => {
    if (!file) return
    handleImageInput(file, (src) => saveImage({ id: 'im' + Date.now(), src, label: file.name.replace(/\.[^.]+$/, ''), type: 'Autre', date: todayFull() }))
  }

  const delHistory = (i: number) => persist({ history: (patient.history || []).filter((_, j) => j !== i) })
  const delVital = (i: number) => {
    const rev = patient.vitals_history || []
    const idx = rev.length - 1 - i
    persist({ vitals_history: rev.filter((_, j) => j !== idx) })
  }
  const delAppt = (id: string) => persist({ appointments: (patient.appointments || []).filter((a) => a.id !== id) })
  const delDoc = (id: string) => persist({ docs: (patient.docs || []).filter((d) => d.id !== id) })
  const delImage = (id: string) => persist({ images: (patient.images || []).filter((im) => im.id !== id) })

  const addTreatment = () => persist({ treatments: [...(patient.treatments || []), { name: 'Nouveau médicament', pos: 'Posologie' }] })
  const setTreatment = (i: number, k: 'name' | 'pos', val: string) => {
    const t = [...(patient.treatments || [])]
    t[i] = { ...t[i], [k]: val }
    persist({ treatments: t })
  }
  const delTreatment = (i: number) => persist({ treatments: (patient.treatments || []).filter((_, j) => j !== i) })

  const doDelete = async () => {
    const res = await deletePatient(patient.id, `${patient.first_name} ${patient.last_name}`)
    setConfirmDel(false)
    if (res.ok) router.push('/patients')
    else flash(res.error || 'Erreur')
  }
  const doDeath = async () => {
    const res = await declareDeath(patient.id, `${patient.first_name} ${patient.last_name}`)
    setConfirmDeath(false)
    if (res.ok) {
      setPatient((p) => ({ ...p, status: 'deces', care: 'sorti' }))
      flash("Patient déclaré décédé — générez l'acte de décès dans Documents.")
    } else flash(res.error || 'Erreur')
  }
  const goDocuments = () => router.push(`/documents?patient=${patient.id}`)

  const isoOf = (a: Appointment) => a.dateIso || (a.date ? a.date.split('/').reverse().join('-') : '')
  const sortedAppts = [...(patient.appointments || [])].sort((a, b) => isoOf(a).localeCompare(isoOf(b)))

  return (
    <div className="view-anim">
      <div className="doc-toolbar">
        <div className="dt-back" onClick={() => router.push('/patients')}><Icons.arrowL size={16} /> Retour aux patients</div>
        <div className="spacer"></div>
        <button className="btn btn-ghost" onClick={() => setModal('summary')}><Icons.download size={14} /> Exporter le dossier</button>
        {patient.status !== 'deces' && can('declareDeath') && (
          <button className="btn btn-ghost" style={{ color: 'var(--crit)' }} onClick={() => setConfirmDeath(true)}><Icons.cross size={14} /> Déclarer décédé</button>
        )}
        <button className="btn btn-ghost" onClick={() => setEditOpen(true)}><Icons.edit size={14} /> Modifier</button>
        {can('deletePatient') && (
          <button className="btn-revoke" onClick={() => setConfirmDel(true)}><Icons.trash size={13} style={{ verticalAlign: -2 }} /> Supprimer</button>
        )}
      </div>

      {patient.status === 'deces' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--crit-bg)', border: '1px solid rgba(232,92,82,0.3)', borderRadius: 10, padding: '12px 16px', marginBottom: 16, color: 'var(--crit)', fontSize: 13.5, fontWeight: 600 }}>
          <Icons.cross size={16} /> Patient déclaré décédé.
        </div>
      )}

      {/* En-tête patient */}
      <Card className="card-pad" style={{ marginBottom: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <div className="patient-photo lg">
            {patient.photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={patient.photo} alt="" />
            ) : (
              <span>{initialsOf(`${patient.first_name} ${patient.last_name}`)}</span>
            )}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <h2 style={{ fontSize: 23, color: 'var(--ink-100)', fontWeight: 600 }}>{patient.first_name} {patient.last_name}</h2>
              <Badge cls={st.cls}>{st.label}</Badge>
              <Badge cls={care.cls}>{care.label}{patient.room ? ` · ${patient.room}` : ''}</Badge>
            </div>
            <div style={{ display: 'flex', gap: 18, color: 'var(--ink-400)', fontSize: 13, marginTop: 6, flexWrap: 'wrap' }}>
              <span>{patient.matricule}</span>
              <span>{patient.sex === 'M' ? 'Masculin' : 'Féminin'} · {patient.dob}</span>
              <span className="badge gold" style={{ padding: '2px 8px' }}>{patient.blood}</span>
              {patient.allergies && !patient.allergies.includes('Aucune') && <span style={{ color: 'var(--crit)' }}>⚠ {patient.allergies}</span>}
            </div>
          </div>
          <button className="btn btn-gold" onClick={goDocuments}><Icons.plus size={15} /> Nouveau document</button>
        </div>
      </Card>

      {/* Onglets */}
      <div className="ptabs">
        {TABS.map((t) => {
          const I = Icons[t.icon]
          return (
            <div key={t.key} className={`ptab ${tab === t.key ? 'on' : ''}`} onClick={() => setTab(t.key)}>
              <I size={15} /> {t.label}{t.key === 'documents' && (patient.docs || []).length > 0 ? ` (${patient.docs.length})` : ''}
            </div>
          )
        })}
      </div>

      {/* ===== Vue d'ensemble ===== */}
      {tab === 'apercu' && (
        <div className="view-anim" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, alignItems: 'start' }}>
          <Card><div className="card-head"><h3>Identité</h3></div><div className="card-pad"><div className="dgrid">
            <div className="di"><label>Téléphone</label><p>{patient.phone ? fmtPhone(patient.phone) : '—'}</p></div>
            <div className="di"><label>Groupe sanguin</label><p>{patient.blood}</p></div>
            <div className="di"><label>Allergies</label><p style={{ color: patient.allergies.includes('Aucune') ? 'var(--ink-200)' : 'var(--crit)' }}>{patient.allergies}</p></div>
            <div className="di"><label>Statut de soin</label><p>{care.label}</p></div>
          </div></div></Card>
          <Card><div className="card-head"><h3>Personne à prévenir</h3></div><div className="card-pad">
            {patient.emergency && patient.emergency.name ? (
              <div className="person"><div className="av-sm" style={{ background: 'var(--crit-bg)', color: 'var(--crit)' }}><Icons.phone size={15} /></div><div className="pn"><b>{patient.emergency.name}</b><span>{patient.emergency.link}{patient.emergency.phone ? ` · ${fmtPhone(patient.emergency.phone)}` : ''}</span></div></div>
            ) : <p style={{ color: 'var(--ink-500)', fontSize: 13 }}>Non renseigné.</p>}
          </div></Card>
          <Card><div className="card-head"><h3>Pièce d&apos;identité</h3></div><div className="card-pad">
            {patient.id_card ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={patient.id_card} alt="" style={{ width: '100%', maxHeight: 180, objectFit: 'contain', borderRadius: 8, cursor: 'zoom-in', background: 'var(--navy-900)', border: '1px solid var(--navy-line-soft)' }} onClick={() => setImgLightbox(patient.id_card)} />
            ) : <p style={{ color: 'var(--ink-500)', fontSize: 13 }}>Aucune pièce d&apos;identité. Ajoutez-la via « Modifier ».</p>}
          </div></Card>
          <Card><div className="card-head"><h3>Dernières constantes</h3><span className="sub">{patient.last_visit}</span></div><div className="card-pad"><div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
            <div className="vital"><div className="vl">Tension</div><div className="vv">{patient.vitals.tension}</div></div>
            <div className="vital"><div className="vl">FC</div><div className="vv">{patient.vitals.fc}<small> bpm</small></div></div>
            <div className="vital"><div className="vl">SpO₂</div><div className="vv">{patient.vitals.spo2}<small> %</small></div></div>
            <div className="vital"><div className="vl">Temp.</div><div className="vv">{patient.vitals.temp}<small> °C</small></div></div>
          </div></div></Card>
          <Card style={{ gridColumn: '1 / -1' }}><div className="card-head"><h3>Rendez-vous ({sortedAppts.length})</h3><div className="spacer"></div><button className="btn btn-ghost" onClick={() => setModal('appt')}><Icons.plus size={13} /> Fixer un rendez-vous</button></div>
            <div>
              {sortedAppts.length === 0 && <div style={{ padding: 22, textAlign: 'center', color: 'var(--ink-500)', fontSize: 13 }}>Aucun rendez-vous planifié.</div>}
              {sortedAppts.map((a) => <div className="doc-row" key={a.id}><div className="dr-ico"><Icons.calendar size={18} /></div><div className="dr-i"><b>{a.reason}</b><span>{a.date} · {a.time} · {a.doctor}</span></div><button className="btn btn-ghost" onClick={() => setRdvCard(a)}><Icons.idcard size={14} /> Carte RDV</button></div>)}
            </div>
          </Card>
        </div>
      )}

      {/* ===== Suivi ===== */}
      {tab === 'suivi' && (
        <div className="view-anim">
          <SecTitle action={<button className="btn btn-gold" onClick={() => setModal('history')}><Icons.plus size={14} /> Ajouter au suivi</button>}>Historique médical</SecTitle>
          <Card className="card-pad">
            {(patient.history || []).length === 0 && <p style={{ color: 'var(--ink-500)', fontSize: 13.5, padding: 16, textAlign: 'center' }}>Aucun historique.</p>}
            <div className="timeline">
              {(patient.history || []).map((h, i) => (
                <div className="tl-item" key={i}><div className="tl-dot"><Icons.pulse size={13} /></div><div className="tl-body" style={{ display: 'flex', alignItems: 'flex-start' }}><div style={{ flex: 1 }}><p><b>{h.type}</b> — {h.text}</p><div className="t">{h.date} · {h.author}</div></div>{canDel && <div className="icon-btn" style={{ width: 28, height: 28, flex: '0 0 28px' }} title="Supprimer (Direction)" onClick={() => delHistory(i)}><Icons.trash size={13} /></div>}</div></div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* ===== Antécédents & traitements ===== */}
      {tab === 'antecedents' && (
        <div className="view-anim" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, alignItems: 'start' }}>
          <Card><div className="card-head"><h3>Antécédents</h3>{canDel && <><div className="spacer"></div><button className="btn-revoke" onClick={() => { setAnt(''); persist({ antecedents: '' }) }}><Icons.trash size={13} style={{ verticalAlign: -2 }} /> Effacer</button></>}</div><div className="card-pad">
            <textarea value={ant} onChange={(e) => setAnt(e.target.value)} onBlur={() => persist({ antecedents: ant })} className="ptextarea" placeholder="Pathologies, opérations passées, allergies, vaccins…" />
            <button className="btn btn-ghost" style={{ marginTop: 10 }} onClick={() => persist({ antecedents: ant })}><Icons.check size={13} /> Enregistrer</button>
          </div></Card>
          <Card><div className="card-head"><h3>Traitements en cours</h3><div className="spacer"></div><button className="btn btn-ghost" onClick={addTreatment}><Icons.plus size={13} /> Ajouter</button></div><div className="card-pad" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {(patient.treatments || []).length === 0 && <p style={{ color: 'var(--ink-500)', fontSize: 13 }}>Aucun traitement.</p>}
            {(patient.treatments || []).map((t, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center', background: 'var(--navy-800)', borderRadius: 9, padding: 8, border: '1px solid var(--navy-line-soft)' }}>
                <Icons.pill size={16} style={{ color: 'var(--gold-400)', flex: '0 0 auto' }} />
                <div style={{ flex: 1 }}>
                  <input value={t.name} onChange={(e) => setTreatment(i, 'name', e.target.value)} className="tinput b" />
                  <input value={t.pos} onChange={(e) => setTreatment(i, 'pos', e.target.value)} className="tinput" />
                </div>
                <div className="icon-btn" style={{ width: 30, height: 30 }} onClick={() => delTreatment(i)}><Icons.trash size={13} /></div>
              </div>
            ))}
          </div></Card>
        </div>
      )}

      {/* ===== Constantes ===== */}
      {tab === 'constantes' && (
        <div className="view-anim">
          <SecTitle action={<button className="btn btn-gold" onClick={() => setModal('vitals')}><Icons.plus size={14} /> Nouveau relevé</button>}>Évolution des constantes</SecTitle>
          <Card className="card-pad" style={{ marginBottom: 18 }}><VitalsChart data={patient.vitals_history || []} /></Card>
          <Card><table className="tbl"><thead><tr><th>Date</th><th>Tension</th><th>FC</th><th>SpO₂</th><th>Temp.</th>{canDel && <th></th>}</tr></thead><tbody>
            {[...(patient.vitals_history || [])].reverse().map((v, i) => <tr key={i}><td>{v.date}</td><td>{v.tension}</td><td>{v.fc} bpm</td><td>{v.spo2}%</td><td>{v.temp}°C</td>{canDel && <td style={{ textAlign: 'right' }}><div className="icon-btn" style={{ width: 30, height: 30, marginLeft: 'auto' }} title="Supprimer (Direction)" onClick={() => delVital(i)}><Icons.trash size={13} /></div></td>}</tr>)}
          </tbody></table></Card>
        </div>
      )}

      {/* ===== Rendez-vous ===== */}
      {tab === 'rdv' && (
        <div className="view-anim">
          <SecTitle action={<button className="btn btn-gold" onClick={() => setModal('appt')}><Icons.plus size={14} /> Fixer un rendez-vous</button>}>Rendez-vous</SecTitle>
          <Card>
            {(patient.appointments || []).length === 0 && <p style={{ color: 'var(--ink-500)', fontSize: 13.5, padding: 30, textAlign: 'center' }}>Aucun rendez-vous. « Fixer un rendez-vous » génère une carte à remettre au patient et l&apos;ajoute au calendrier.</p>}
            {sortedAppts.map((a) => (
              <div className="doc-row" key={a.id}>
                <div className="dr-ico"><Icons.calendar size={19} /></div>
                <div className="dr-i"><b>{a.reason}</b><span>{a.date} · {a.time} · {a.doctor} · {a.place}</span></div>
                <button className="btn btn-ghost" onClick={() => setRdvCard(a)}><Icons.idcard size={14} /> Carte RDV</button>
                {canDel && <div className="icon-btn" style={{ width: 34, height: 34 }} title="Supprimer (Direction)" onClick={() => delAppt(a.id)}><Icons.trash size={15} /></div>}
              </div>
            ))}
          </Card>
        </div>
      )}

      {/* ===== Documents ===== */}
      {tab === 'documents' && (
        <div className="view-anim">
          <SecTitle action={<div style={{ display: 'flex', gap: 8 }}><label className="btn btn-ghost" style={{ cursor: 'pointer' }}><Icons.upload size={14} /> Importer<input type="file" style={{ display: 'none' }} onChange={(e) => onUploadDoc(e.target.files?.[0])} /></label><button className="btn btn-gold" onClick={goDocuments}><Icons.plus size={14} /> Générer</button></div>}>Documents médicaux</SecTitle>
          <Card>
            {(patient.docs || []).length === 0 && <p style={{ color: 'var(--ink-500)', fontSize: 13.5, padding: 30, textAlign: 'center' }}>Aucun document. « Générer » une pièce ou « Importer » un fichier.</p>}
            {(patient.docs || []).map((d) => {
              const I = Icons[docIcon[d.type]] || Icons.doc
              return (
                <div className="doc-row" key={d.id}>
                  <div className="dr-ico"><I size={19} /></div>
                  <div className="dr-i"><b>{d.title}</b><span>{d.author} · {d.date}</span></div>
                  <span className={`badge ${d.state === 'importé' ? 'info' : 'ok'}`}>{d.state}</span>
                  {d.file ? (
                    <>
                      <a className="icon-btn" style={{ width: 34, height: 34 }} href={d.file} target="_blank" rel="noreferrer" title="Voir"><Icons.eye size={16} /></a>
                      <a className="icon-btn" style={{ width: 34, height: 34 }} href={d.file} download={d.fileName} title="Télécharger"><Icons.download size={16} /></a>
                    </>
                  ) : (
                    <button className="icon-btn" style={{ width: 34, height: 34 }} title="Aperçu" onClick={() => setViewDoc(d)}><Icons.eye size={16} /></button>
                  )}
                  {canDel && <div className="icon-btn" style={{ width: 34, height: 34 }} title="Supprimer (Direction)" onClick={() => delDoc(d.id)}><Icons.trash size={15} /></div>}
                </div>
              )
            })}
          </Card>
        </div>
      )}

      {/* ===== Imagerie ===== */}
      {tab === 'imagerie' && (() => {
        const imgs = patient.images || []
        const types = ['tous', ...Array.from(new Set(imgs.map((im) => im.type || 'Autre')))]
        const shown = imgFilter === 'tous' ? imgs : imgs.filter((im) => (im.type || 'Autre') === imgFilter)
        return (
          <div className="view-anim">
            <SecTitle action={<div style={{ display: 'flex', gap: 8 }}><label className="btn btn-ghost" style={{ cursor: 'pointer' }}><Icons.upload size={14} /> Importer<input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => onUploadImg(e.target.files?.[0])} /></label><button className="btn btn-gold" onClick={() => setModal('imaging')}><Icons.plus size={14} /> Ajouter un cliché</button></div>}>Imagerie &amp; photos de blessures</SecTitle>
            {imgs.length > 0 && <div className="chips" style={{ marginBottom: 16 }}>{types.map((t) => <div key={t} className={`chip ${imgFilter === t ? 'on' : ''}`} onClick={() => setImgFilter(t)}>{t === 'tous' ? 'Tous' : t}</div>)}</div>}
            {imgs.length === 0 ? (
              <Card className="card-pad"><p style={{ color: 'var(--ink-500)', fontSize: 13.5, textAlign: 'center', padding: 20 }}>Aucun cliché. Ajoutez des radios (poumons, thorax, bras, jambe…), scanners, photos de plaies…</p></Card>
            ) : (
              <div className="img-gallery">{shown.map((im) => (
                <div className="img-tile" key={im.id}>
                  <div style={{ position: 'relative', cursor: 'zoom-in' }} onClick={() => setImgLightbox(im.src)}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={im.src} alt={im.label} /><span className="img-type">{im.type || 'Cliché'}</span>
                  </div>
                  <div className="img-cap"><span style={{ color: 'var(--ink-200)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{im.label}</span><a className="icon-btn" style={{ width: 28, height: 28, flex: '0 0 28px' }} href={im.src} download={`${im.label || 'imagerie'}.png`} title="Télécharger"><Icons.download size={14} /></a>{canDel && <div className="icon-btn" style={{ width: 28, height: 28, flex: '0 0 28px' }} title="Supprimer (Direction)" onClick={() => delImage(im.id)}><Icons.trash size={13} /></div>}</div>
                </div>
              ))}</div>
            )}
          </div>
        )
      })()}

      {/* ===== Facturation ===== */}
      {tab === 'facturation' && <PatientBilling patient={patient} persist={persist} />}

      {modal === 'appt' && <AppointmentModal onClose={() => setModal(null)} onSave={saveAppt} />}
      {modal === 'vitals' && <VitalsModal onClose={() => setModal(null)} onSave={saveVitals} />}
      {modal === 'history' && <HistoryModal onClose={() => setModal(null)} onSave={saveHistory} />}
      {modal === 'summary' && <DossierSummary patient={patient} onClose={() => setModal(null)} />}
      {modal === 'imaging' && <ImagingModal onClose={() => setModal(null)} onSave={saveImage} />}
      {imgLightbox && <div className="modal-overlay" onClick={() => setImgLightbox(null)}>{/* eslint-disable-next-line @next/next/no-img-element */}<img src={imgLightbox} alt="" style={{ maxWidth: '92vw', maxHeight: '90vh', borderRadius: 10, boxShadow: 'var(--shadow-pop)' }} onClick={(e) => e.stopPropagation()} /></div>}
      {rdvCard && <AppointmentCard patient={patient} appt={rdvCard} onClose={() => setRdvCard(null)} />}
      {editOpen && <PatientModal patient={patient} onClose={() => setEditOpen(false)} onSaved={() => router.refresh()} />}
      {viewDoc && <DocViewer type={viewDoc.type} patient={patient} onClose={() => setViewDoc(null)} />}

      {confirmDel && (
        <Modal onClose={() => setConfirmDel(false)} title="Supprimer le dossier" icon={<Icons.trash size={20} />}>
          <p style={{ color: 'var(--ink-200)', fontSize: 14, lineHeight: 1.6 }}>Supprimer définitivement le dossier de <b style={{ color: 'var(--ink-100)' }}>{patient.first_name} {patient.last_name}</b> ? Cette action est irréversible.</p>
          <div style={{ display: 'flex', gap: 10, marginTop: 22 }}>
            <button className="btn btn-ghost" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setConfirmDel(false)}>Annuler</button>
            <button className="btn-refuse" style={{ flex: 1, justifyContent: 'center' }} onClick={doDelete}><Icons.trash size={15} /> Supprimer</button>
          </div>
        </Modal>
      )}
      {confirmDeath && (
        <Modal onClose={() => setConfirmDeath(false)} title="Déclarer le décès" icon={<Icons.cross size={20} />}>
          <p style={{ color: 'var(--ink-200)', fontSize: 14, lineHeight: 1.6 }}>Déclarer <b style={{ color: 'var(--ink-100)' }}>{patient.first_name} {patient.last_name}</b> décédé(e) ? Un acte de décès pourra être généré dans Documents.</p>
          <div style={{ display: 'flex', gap: 10, marginTop: 22 }}>
            <button className="btn btn-ghost" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setConfirmDeath(false)}>Annuler</button>
            <button className="btn btn-gold" style={{ flex: 1, justifyContent: 'center' }} onClick={doDeath}><Icons.cross size={15} /> Déclarer décédé</button>
          </div>
        </Modal>
      )}

      {toast && <div style={{ position: 'fixed', bottom: 28, left: '50%', transform: 'translateX(-50%)', background: 'var(--navy-600)', border: '1px solid var(--gold-glow)', color: 'var(--gold-300)', padding: '12px 22px', borderRadius: 12, fontSize: 13.5, fontWeight: 600, zIndex: 90, boxShadow: 'var(--shadow-pop)' }}>{toast}</div>}
    </div>
  )
}
