'use client'
import { useState } from 'react'
import Modal from '@/components/Modal'
import { Icons } from '@/components/Icons'
import { fmtPhone, initialsOf } from '@/lib/format'
import { createPatient, updatePatient } from '@/lib/actions/patients'
import { handleImageUpload } from '@/lib/image'
import type { Patient, Emergency, Vitals } from '@/lib/types'

interface PForm {
  id?: string
  first_name: string
  last_name: string
  dob: string
  sex: string
  blood: string
  phone: string
  matricule: string
  allergies: string
  status: string
  care: string
  room: string
  photo: string | null
  id_card: string | null
  emergency: Emergency
  vitals: Vitals
}

const todayFr = () => {
  const d = new Date()
  const p = (n: number) => String(n).padStart(2, '0')
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()}`
}

export default function PatientModal({
  patient,
  onClose,
  onSaved,
}: {
  patient: Patient | null
  onClose: () => void
  onSaved: (id?: string) => void
}) {
  const isNew = !patient
  const [f, setF] = useState<PForm>(
    patient
      ? {
          id: patient.id,
          first_name: patient.first_name,
          last_name: patient.last_name,
          dob: patient.dob || '',
          sex: patient.sex,
          blood: patient.blood,
          phone: patient.phone || '',
          matricule: patient.matricule || '',
          allergies: patient.allergies,
          status: patient.status,
          care: patient.care,
          room: patient.room || '',
          photo: patient.photo,
          id_card: patient.id_card,
          emergency: { ...(patient.emergency || { name: '', link: '', phone: '' }) },
          vitals: { ...(patient.vitals || { tension: '12/8', fc: '75', spo2: '98', temp: '37.0' }) },
        }
      : {
          first_name: '', last_name: '', dob: '', sex: 'M', blood: 'O+', phone: '', matricule: '',
          allergies: 'Aucune connue', status: 'stable', care: 'ambulatoire', room: '', photo: null, id_card: null,
          emergency: { name: '', link: '', phone: '' }, vitals: { tension: '12/8', fc: '75', spo2: '98', temp: '37.0' },
        }
  )
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const set = (k: keyof PForm, v: unknown) => setF((p) => ({ ...p, [k]: v }))
  const setE = (k: keyof Emergency, v: string) => setF((p) => ({ ...p, emergency: { ...p.emergency, [k]: v } }))
  const setV = (k: keyof Vitals, v: string) => setF((p) => ({ ...p, vitals: { ...p.vitals, [k]: v } }))

  const onFile = (file: File | undefined, key: 'photo' | 'id_card') => {
    handleImageUpload(file, key === 'photo' ? 'patients/photos' : 'patients/idcards', (url) => set(key, url))
  }

  const save = async () => {
    if (!f.first_name.trim() || !f.last_name.trim()) {
      setError('Prénom et nom requis')
      return
    }
    setBusy(true)
    setError(null)
    let res
    if (isNew) {
      res = await createPatient({
        first_name: f.first_name.trim(),
        last_name: f.last_name.trim(),
        dob: f.dob, sex: f.sex, blood: f.blood, phone: f.phone, matricule: f.matricule || 'CIT-' + Math.floor(10000 + Math.random() * 89999),
        allergies: f.allergies, status: f.status, care: f.care, room: f.room, photo: f.photo, id_card: f.id_card,
        emergency: f.emergency, vitals: f.vitals,
        vitals_history: [{ date: todayFr().slice(0, 5), ...f.vitals }],
        last_visit: todayFr(), notes: 'Nouveau dossier créé.',
      })
    } else {
      res = await updatePatient(f.id!, {
        first_name: f.first_name.trim(), last_name: f.last_name.trim(), dob: f.dob, sex: f.sex, blood: f.blood,
        phone: f.phone, matricule: f.matricule, allergies: f.allergies, status: f.status, care: f.care, room: f.room,
        photo: f.photo, id_card: f.id_card, emergency: f.emergency, vitals: f.vitals,
      })
    }
    setBusy(false)
    if (!res.ok) {
      setError(res.error || 'Erreur')
      return
    }
    onSaved(res.id)
    onClose()
  }

  return (
    <Modal onClose={onClose} title={isNew ? 'Nouveau dossier patient' : 'Modifier le dossier'} icon={<Icons.patient size={20} />} wide>
      <div className="editor-panel">
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
          <div className="patient-photo lg">
            {f.photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={f.photo} alt="" />
            ) : (
              <span>{f.first_name || f.last_name ? initialsOf(`${f.first_name} ${f.last_name}`.trim()) : <Icons.patient size={28} />}</span>
            )}
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: 6 }}>Photo du patient</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <label className="btn btn-ghost" style={{ cursor: 'pointer' }}>
                <Icons.upload size={14} /> Choisir une photo
                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => onFile(e.target.files?.[0], 'photo')} />
              </label>
              {f.photo && (
                <button className="btn btn-ghost" onClick={() => set('photo', null)}>
                  <Icons.trash size={14} />
                </button>
              )}
            </div>
          </div>
          <div style={{ marginLeft: 'auto', textAlign: 'center' }}>
            <div className="idcard-slot" style={{ width: 150 }}>
              {f.id_card ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={f.id_card} alt="" style={{ maxHeight: 90 }} />
              ) : (
                <div className="idcard-empty" style={{ padding: 12 }}>
                  <Icons.idcard size={22} />
                  <span>Pièce d&apos;identité</span>
                </div>
              )}
              <label className="idcard-up">
                <Icons.upload size={13} /> {f.id_card ? 'Remplacer' : "Carte d'identité"}
                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => onFile(e.target.files?.[0], 'id_card')} />
              </label>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <div className="ep-field"><label>Prénom</label><input value={f.first_name} onChange={(e) => set('first_name', e.target.value)} autoFocus /></div>
          <div className="ep-field"><label>Nom</label><input value={f.last_name} onChange={(e) => set('last_name', e.target.value)} /></div>
          <div className="ep-field"><label>Date de naissance</label><input value={f.dob} onChange={(e) => set('dob', e.target.value)} placeholder="JJ/MM/AAAA" /></div>
          <div className="ep-field"><label>N° Citoyen</label><input value={f.matricule} onChange={(e) => set('matricule', e.target.value)} placeholder="CIT-00000" /></div>
          <div className="ep-field"><label>Sexe</label>
            <select value={f.sex} onChange={(e) => set('sex', e.target.value)}><option value="M">Masculin</option><option value="F">Féminin</option></select>
          </div>
          <div className="ep-field"><label>Groupe sanguin</label>
            <select value={f.blood} onChange={(e) => set('blood', e.target.value)}>{['O+','O-','A+','A-','B+','B-','AB+','AB-'].map((b) => <option key={b}>{b}</option>)}</select>
          </div>
          <div className="ep-field"><label>Téléphone</label><input value={fmtPhone(f.phone)} onChange={(e) => set('phone', e.target.value.replace(/\D/g, '').slice(0, 10))} placeholder="(205) 489-6589" /></div>
          <div className="ep-field"><label>Allergies</label><input value={f.allergies} onChange={(e) => set('allergies', e.target.value)} /></div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
          <div className="ep-field"><label>État clinique</label>
            <select value={f.status} onChange={(e) => set('status', e.target.value)}>
              <option value="stable">Stable</option><option value="suivi">En suivi</option><option value="critique">Critique</option><option value="deces">Décédé</option>
            </select>
          </div>
          <div className="ep-field"><label>Prise en charge</label>
            <select value={f.care} onChange={(e) => set('care', e.target.value)}>
              <option value="ambulatoire">Ambulatoire</option><option value="admis">Admis</option><option value="soins">En soins</option><option value="hospit">Hospitalisé</option><option value="sorti">Sorti</option>
            </select>
          </div>
          <div className="ep-field"><label>Chambre / box</label><input value={f.room} onChange={(e) => set('room', e.target.value)} placeholder="Box 3, Réa 1…" /></div>
        </div>

        <div style={{ margin: '20px 0 12px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <Icons.pulse size={15} style={{ color: 'var(--gold-400)' }} />
          <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--ink-200)', textTransform: 'uppercase', letterSpacing: '.5px' }}>Constantes</span>
          <span style={{ flex: 1, height: 1, background: 'var(--navy-line-soft)' }}></span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
          <div className="ep-field"><label>Tension</label><input value={f.vitals.tension} onChange={(e) => setV('tension', e.target.value)} placeholder="12/8" /></div>
          <div className="ep-field"><label>Fréq. card. (bpm)</label><input value={f.vitals.fc} onChange={(e) => setV('fc', e.target.value)} placeholder="75" /></div>
          <div className="ep-field"><label>SpO₂ (%)</label><input value={f.vitals.spo2} onChange={(e) => setV('spo2', e.target.value)} placeholder="98" /></div>
          <div className="ep-field"><label>Temp. (°C)</label><input value={f.vitals.temp} onChange={(e) => setV('temp', e.target.value)} placeholder="37.0" /></div>
        </div>

        <div style={{ margin: '20px 0 12px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <Icons.alert size={15} style={{ color: 'var(--crit)' }} />
          <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--ink-200)', textTransform: 'uppercase', letterSpacing: '.5px' }}>Personne à prévenir en cas d&apos;urgence</span>
          <span style={{ flex: 1, height: 1, background: 'var(--navy-line-soft)' }}></span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr', gap: 14 }}>
          <div className="ep-field"><label>Nom complet</label><input value={f.emergency.name} onChange={(e) => setE('name', e.target.value)} placeholder="Nom du proche" /></div>
          <div className="ep-field"><label>Lien</label><input value={f.emergency.link} onChange={(e) => setE('link', e.target.value)} placeholder="Épouse, frère…" /></div>
          <div className="ep-field"><label>Téléphone</label><input value={fmtPhone(f.emergency.phone)} onChange={(e) => setE('phone', e.target.value.replace(/\D/g, '').slice(0, 10))} placeholder="(205) 489-6589" /></div>
        </div>

        {error && <div style={{ color: 'var(--crit)', fontSize: 13, marginTop: 12 }}>{error}</div>}
        <div style={{ display: 'flex', gap: 10, marginTop: 22 }}>
          <button className="btn btn-ghost" style={{ flex: 1, justifyContent: 'center' }} onClick={onClose} disabled={busy}>Annuler</button>
          <button className="btn btn-gold" style={{ flex: 1, justifyContent: 'center' }} onClick={save} disabled={busy}>
            <Icons.check size={15} /> {busy ? 'Enregistrement…' : isNew ? 'Créer le dossier' : 'Enregistrer'}
          </button>
        </div>
      </div>
    </Modal>
  )
}
