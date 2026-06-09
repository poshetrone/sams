'use client'
import { useMemo, useRef } from 'react'
import { Icons } from '@/components/Icons'
import Editable from './Editable'
import { DocContentContext, useDocField, type DocStore, type DocContentCtx } from './doc-content'
import { PRESET_RADIOS } from '@/components/patients/modals'
import type { Patient } from '@/lib/types'
import type { CurrentMember } from '@/lib/app-context'

const todayFR = () => {
  const d = new Date()
  const p = (n: number) => String(n).padStart(2, '0')
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()}`
}
const refNum = (prefix: string) => `${prefix}-${Math.floor(1000 + Math.random() * 8999)}/26`

/** Slug stable d'un libellé → clé de champ (sans accents, alphanum). */
const slug = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '')

export const DOC_META: Record<string, { name: string; prefix: string; legal: string }> = {
  aptitude:   { name: "Certificat d'aptitude médicale", prefix: 'APT', legal: "Document établi conformément au protocole médical du San Andreas Medical Services. Toute falsification expose à des poursuites disciplinaires et pénales." },
  psy:        { name: 'Compte-rendu de visite psychologique', prefix: 'PSY', legal: "Compte-rendu couvert par le secret médical. Diffusion restreinte au service médical SAMS et au patient concerné." },
  ordonnance: { name: 'Ordonnance médicale', prefix: 'ORD', legal: "Ordonnance valable 3 mois sauf mention contraire. Médicaments à délivrer dans le strict respect de la posologie indiquée." },
  arret:      { name: "Avis d'arrêt de travail", prefix: 'ART', legal: "Avis d'interruption temporaire de service. À transmettre à la hiérarchie SAMS et à l'employeur du patient." },
  accident:   { name: "Déclaration d'accident de travail", prefix: 'AT', legal: "Déclaration officielle à conserver au dossier médical. Copie transmise à la direction SAMS sous 48h." },
  rapport:    { name: "Rapport d'opération", prefix: 'OP', legal: "Rapport opératoire confidentiel. Le schéma corporel et les observations engagent la responsabilité du praticien signataire." },
  deces:      { name: 'Acte de constatation de décès', prefix: 'DC', legal: "Acte officiel établi par un praticien habilité du SAMS. Toute fausse déclaration constitue une infraction passible de poursuites." },
  bilan:      { name: 'Fiche bilan secours', prefix: 'FBS', legal: "Fiche de bilan d'intervention — secret médical applicable. Document à conserver au dossier du service médical SAMS." },
  imagerie:   { name: "Compte-rendu d'imagerie médicale", prefix: 'IMG', legal: "Compte-rendu radiologique couvert par le secret médical. Le cliché illustre l'examen pratiqué au sein du service SAMS." },
  gyneco:     { name: "Compte-rendu d'examen gynécologique", prefix: 'GYN', legal: "Compte-rendu couvert par le secret médical. Diffusion strictement restreinte à la patiente et au service médical SAMS." },
}

function PRow({ label, initial, placeholder, field }: { label: string; initial?: string; placeholder?: string; field?: string }) {
  return (
    <div className="prow">
      <div className="pl">{label}</div>
      <Editable className="pv" tag="div" field={field || slug(label)} initial={initial} placeholder={placeholder || '…'} />
    </div>
  )
}

function PaperHead({ refId }: { refId: string }) {
  return (
    <div className="paper-head">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/assets/sams-logo.png" alt="" />
      <div className="ph-txt"><h1>S.A.M.S</h1><p>San Andreas Medical Services</p></div>
      <div className="ph-ref">Réf. <b>{refId}</b><br />Date d&apos;émission : <b>{todayFR()}</b><br />Service médical · Los Santos</div>
    </div>
  )
}

function SignFoot({ user }: { user?: CurrentMember }) {
  return (
    <div className="paper-foot">
      <div className="sign-box"><div className="sl">Fait à Los Santos, le {todayFR()}</div></div>
      <div className="sign-box">
        <div className="sl">Le praticien · Signature &amp; cachet</div>
        <div className="sline"></div>
        <Editable className="pv" field="praticien" initial={user?.name || ''} placeholder="Nom du praticien" style={{ fontWeight: 600, border: 'none' }} />
      </div>
      <div className="scachet">SAMS<br />MÉDICAL<br />★ OFFICIEL ★</div>
    </div>
  )
}

function PaperShell({ type, patient, user, children }: { type: string; patient: Patient | null; user?: CurrentMember; children: React.ReactNode }) {
  const meta = DOC_META[type]
  const refId = useRef(refNum(meta.prefix)).current
  return (
    <div className={`paper ${['imagerie', 'bilan'].includes(type) ? 'paper-wide' : ''}`} id="sams-paper">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="paper-wm" src="/assets/sams-logo.png" alt="" />
      <PaperHead refId={refId} />
      <div className="paper-doctitle"><h2>{meta.name}</h2><div className="rule"></div></div>
      <div className="paper-section">
        <div className="ps-label">Identification du patient</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 32px' }}>
          <PRow field="pat_name" label="Nom & prénom" initial={patient ? `${patient.last_name.toUpperCase()} ${patient.first_name}` : ''} placeholder="Nom Prénom" />
          <PRow field="pat_dob" label="Date de naissance" initial={patient?.dob || ''} placeholder="JJ/MM/AAAA" />
          <PRow field="pat_cit" label="N° de citoyen" initial={patient?.matricule || ''} placeholder="CIT-00000" />
          <PRow field="pat_blood" label="Groupe sanguin" initial={patient?.blood} placeholder="—" />
        </div>
      </div>
      {children}
      <SignFoot user={user} />
      <div className="paper-legal">{meta.legal}</div>
    </div>
  )
}

/* ---- Corps spécifiques ---- */
function BodyAptitude() {
  const [verdict, setVerdict] = useDocField('verdict', 'ok')
  return (
    <>
      <div className="paper-section">
        <div className="ps-label">Examen médical</div>
        <PRow label="Type d'aptitude" initial="Aptitude à l'emploi / port d'arme" />
        <PRow label="Médecin examinateur" placeholder="Dr. …" />
        <div className="prow"><div className="pl">Tension artérielle</div><Editable className="pv" field="tension_arterielle" placeholder="… mmHg" /></div>
        <div className="prow"><div className="pl">Acuité visuelle</div><Editable className="pv" field="acuite_visuelle" placeholder="… /10" /></div>
        <div className="prow"><div className="pl">Bilan général</div><Editable className="pv" field="bilan_general" placeholder="RAS" /></div>
      </div>
      <div className="paper-section">
        <div className="ps-label">Conclusion</div>
        <div className="verdict-box">
          <div className={`verdict-opt ${verdict === 'ok' ? 'sel-ok' : ''}`} onClick={() => setVerdict('ok')}>APTE</div>
          <div className={`verdict-opt ${verdict === 'warn' ? 'sel-warn' : ''}`} onClick={() => setVerdict('warn')}>APTE AVEC RÉSERVES</div>
          <div className={`verdict-opt ${verdict === 'crit' ? 'sel-crit' : ''}`} onClick={() => setVerdict('crit')}>INAPTE</div>
        </div>
        <div style={{ marginTop: 14 }}><Editable className="paper-textblock" field="observations" placeholder="Observations et réserves éventuelles…" /></div>
        <PRow label="Validité du certificat" initial="6 mois" />
      </div>
    </>
  )
}

function BodyPsy() {
  return (
    <>
      <div className="paper-section">
        <div className="ps-label">Cadre de l&apos;entretien</div>
        <PRow label="Psychologue" placeholder="Dr. …" />
        <PRow label="Motif de la visite" placeholder="Visite annuelle / signalement…" />
        <PRow label="Date de l'entretien" initial={todayFR()} placeholder="JJ/MM/AAAA" />
      </div>
      <div className="paper-section">
        <div className="ps-label">Observations cliniques</div>
        <Editable className="paper-textblock" field="observations_cliniques" placeholder="État psychique, comportement, éléments relevés durant l'entretien…" />
      </div>
      <div className="paper-section">
        <div className="ps-label">Conclusion &amp; recommandations</div>
        <Editable className="paper-textblock" field="conclusion" placeholder="Conclusion du suivi et recommandations…" />
        <PRow label="Suivi recommandé" initial="Aucun suivi particulier" />
      </div>
    </>
  )
}

function BodyOrdonnance() {
  const [lines, setLines] = useDocField<number[]>('rx_lines', [0, 1, 2])
  return (
    <>
      <div className="paper-section"><div className="ps-label">Prescripteur</div><PRow label="Médecin prescripteur" placeholder="Dr. …" /></div>
      <div className="paper-section">
        <div className="ps-label">Prescription</div>
        <div className="rx-lines">
          {lines.map((id, i) => (
            <div className="rx-line" key={id}>
              <div className="rx-num">{i + 1}</div>
              <div className="rx-body">
                <Editable className="rx-med" field={`rx_med_${id}`} placeholder="Médicament, dosage" />
                <Editable className="rx-pos" field={`rx_pos_${id}`} placeholder="Posologie — ex : 1 comprimé matin et soir, 7 jours" />
              </div>
            </div>
          ))}
        </div>
        <button className="btn btn-ghost no-print" style={{ marginTop: 14 }} onClick={() => setLines([...lines, (lines[lines.length - 1] ?? -1) + 1])}><Icons.plus size={15} /> Ajouter une ligne</button>
      </div>
      <div className="paper-section"><PRow label="Renouvellement" initial="Non renouvelable" /></div>
    </>
  )
}

function BodyArret() {
  return (
    <>
      <div className="paper-section"><div className="ps-label">Prescripteur</div><PRow label="Médecin" placeholder="Dr. …" /></div>
      <div className="paper-section">
        <div className="ps-label">Durée de l&apos;arrêt</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 32px' }}>
          <PRow label="À compter du" initial={todayFR()} placeholder="JJ/MM/AAAA" />
          <PRow label="Jusqu'au inclus" placeholder="JJ/MM/AAAA" />
          <PRow label="Durée totale" placeholder="… jours" />
          <PRow label="Sorties autorisées" initial="Non" placeholder="Oui / Non" />
        </div>
      </div>
      <div className="paper-section"><div className="ps-label">Motif médical</div><Editable className="paper-textblock" field="motif_medical" placeholder="Motif justifiant l'interruption temporaire de service…" /></div>
    </>
  )
}

function BodyAccident() {
  return (
    <>
      <div className="paper-section">
        <div className="ps-label">Circonstances de l&apos;accident</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 32px' }}>
          <PRow label="Date de l'accident" initial={todayFR()} placeholder="JJ/MM/AAAA" />
          <PRow label="Heure" placeholder="HH:MM" />
          <PRow label="Lieu" placeholder="Adresse / zone" />
          <PRow label="Témoin(s)" placeholder="Nom du témoin" />
        </div>
        <div style={{ marginTop: 10 }}><Editable className="paper-textblock" field="circonstances" placeholder="Description détaillée des circonstances de l'accident…" /></div>
      </div>
      <div className="paper-section">
        <div className="ps-label">Constatations médicales</div>
        <PRow label="Médecin constatant" placeholder="Dr. …" />
        <Editable className="paper-textblock" field="constatations" placeholder="Lésions constatées, soins prodigués, gravité…" />
        <PRow label="Incapacité prévisible" placeholder="… jours" />
      </div>
    </>
  )
}

function BodyDeces() {
  const [obstacle, setObstacle] = useDocField('obstacle', 'non')
  return (
    <>
      <div className="paper-section">
        <div className="ps-label">Constatation du décès</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 32px' }}>
          <PRow label="Médecin constatant" placeholder="Dr. …" />
          <PRow label="Date du décès" initial={todayFR()} placeholder="JJ/MM/AAAA" />
          <PRow label="Heure du décès" placeholder="HH:MM" />
          <PRow label="Lieu du décès" placeholder="Adresse / zone" />
        </div>
      </div>
      <div className="paper-section"><div className="ps-label">Cause présumée du décès</div><Editable className="paper-textblock" field="cause_deces" placeholder="Cause médicale présumée du décès…" /></div>
      <div className="paper-section">
        <div className="ps-label">Obstacle médico-légal à l&apos;inhumation</div>
        <div className="verdict-box">
          <div className={`verdict-opt ${obstacle === 'non' ? 'sel-ok' : ''}`} onClick={() => setObstacle('non')}>NON</div>
          <div className={`verdict-opt ${obstacle === 'oui' ? 'sel-crit' : ''}`} onClick={() => setObstacle('oui')}>OUI</div>
        </div>
      </div>
      <div className="paper-section" style={{ marginTop: 6 }}>
        <p style={{ fontSize: 13, color: '#3a4350', fontStyle: 'italic', lineHeight: 1.6 }}>Je soussigné(e), praticien du San Andreas Medical Services, certifie avoir constaté le décès de la personne identifiée ci-dessus.</p>
      </div>
    </>
  )
}

/* ---- Rapport d'opération (schéma corporel) ---- */
const BODY_ZONES = [
  { key: 'tete', label: 'Tête', x: 50, y: 12, r: 9 },
  { key: 'cou', label: 'Cou', x: 50, y: 19, r: 5 },
  { key: 'epauleD', label: 'Épaule droite', x: 38, y: 24, r: 6 },
  { key: 'epauleG', label: 'Épaule gauche', x: 62, y: 24, r: 6 },
  { key: 'thorax', label: 'Thorax', x: 50, y: 30, r: 11 },
  { key: 'abdomen', label: 'Abdomen / Bassin', x: 50, y: 42, r: 11 },
  { key: 'brasD', label: 'Bras droit', x: 32.5, y: 33, r: 7 },
  { key: 'avbrasD', label: 'Avant-bras droit', x: 25, y: 45, r: 7 },
  { key: 'mainD', label: 'Main droite', x: 20, y: 55, r: 7 },
  { key: 'brasG', label: 'Bras gauche', x: 67.5, y: 33, r: 7 },
  { key: 'avbrasG', label: 'Avant-bras gauche', x: 75, y: 45, r: 7 },
  { key: 'mainG', label: 'Main gauche', x: 80, y: 55, r: 7 },
  { key: 'cuisseD', label: 'Cuisse droite', x: 43, y: 62, r: 8 },
  { key: 'cuisseG', label: 'Cuisse gauche', x: 57, y: 62, r: 8 },
  { key: 'jambeD', label: 'Jambe droite', x: 43, y: 80, r: 7 },
  { key: 'jambeG', label: 'Jambe gauche', x: 57, y: 80, r: 7 },
  { key: 'piedD', label: 'Pied droit', x: 44, y: 94, r: 6 },
  { key: 'piedG', label: 'Pied gauche', x: 56, y: 94, r: 6 },
]

function BodyRapport() {
  const [sex, setSex] = useDocField<'homme' | 'femme'>('sex', 'homme')
  const [selected, setSelected] = useDocField<string[]>('zones', ['thorax'])
  const toggle = (k: string) => setSelected(selected.includes(k) ? selected.filter((x) => x !== k) : [...selected, k])
  const src = sex === 'femme' ? '/assets/body-female.png' : '/assets/body-male.png'
  return (
    <>
      <div className="paper-section">
        <div className="ps-label">Détails de l&apos;intervention</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 32px' }}>
          <PRow label="Chirurgien" placeholder="Dr. …" />
          <PRow label="Type d'opération" placeholder="ex : suture, extraction…" />
          <PRow label="Date / heure" initial={todayFR()} placeholder="JJ/MM/AAAA" />
          <PRow label="Anesthésie" placeholder="Locale / générale" />
          <PRow label="Durée" placeholder="… min" />
          <PRow label="État à la sortie" placeholder="Stable" />
        </div>
      </div>
      <div className="paper-section">
        <div className="ps-label">Cartographie des zones opérées</div>
        <div className="sex-toggle no-print">
          <button className={sex === 'homme' ? 'on' : ''} onClick={() => setSex('homme')}>Homme</button>
          <button className={sex === 'femme' ? 'on' : ''} onClick={() => setSex('femme')}>Femme</button>
        </div>
        <div style={{ fontSize: 12, color: '#8a93a1', marginBottom: 10 }} className="no-print">Cliquez sur une zone du corps pour la marquer, puis détaillez-la à droite.</div>
        <div className="body-chart-wrap">
          <div className="body-svg">
            <div className="body-photo">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="Schéma corporel" crossOrigin="anonymous" />
              {BODY_ZONES.map((z) => (
                <div key={z.key} className={`bp-spot ${selected.includes(z.key) ? 'sel' : ''}`} style={{ left: `${z.x}%`, top: `${z.y}%`, width: `${z.r * 2}%` }} title={z.label} onClick={() => toggle(z.key)} />
              ))}
              {selected.map((k, i) => {
                const z = BODY_ZONES.find((b) => b.key === k)
                if (!z) return null
                return <div key={'pin' + k} className="bp-pin" style={{ left: `${z.x}%`, top: `${z.y}%` }}>{i + 1}</div>
              })}
            </div>
          </div>
          <div className="body-detail">
            {selected.length === 0 && <div className="zone-empty">Aucune zone sélectionnée. Cliquez sur le schéma.</div>}
            {selected.map((k, i) => {
              const z = BODY_ZONES.find((b) => b.key === k)
              if (!z) return null
              return (
                <div className="zone-row" key={k}>
                  <div className="zone-num">{i + 1}</div>
                  <div className="zr-body">
                    <div className="zr-label">{z.label}</div>
                    <Editable className="zr-detail" field={`zone_${k}`} placeholder="Décrire la lésion / le geste opératoire…" />
                  </div>
                  <div className="zone-rm no-print" onClick={() => toggle(k)} title="Retirer"><Icons.x size={14} /></div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
      <div className="paper-section">
        <div className="ps-label">Suites &amp; recommandations post-opératoires</div>
        <Editable className="paper-textblock" field="postop" placeholder="Soins de suite, traitement prescrit, surveillance, prochain contrôle…" />
      </div>
    </>
  )
}

/* ---- Fiche bilan secours ---- */
function BR({ label, initial, ph }: { label: string; initial?: string; ph?: string }) {
  return <div className="brow"><div className="bl">{label}</div><Editable className="bv" field={slug(label)} initial={initial} placeholder={ph || '…'} /></div>
}
function BodyBilan() {
  const [g, setG] = useDocField<Record<string, boolean>>('gestes', {})
  const Chk = ({ k, label }: { k: string; label: string }) => (
    <div className="bchk-row" onClick={() => setG({ ...g, [k]: !g[k] })}>
      <span className={`bchk ${g[k] ? 'on' : ''}`}>{g[k] ? '✓' : ''}</span>{label}
    </div>
  )
  return (
    <div className="bilan-grid">
      <div className="bilan-sec"><div className="bsec-h c-red">Fiche bilan secours (RP)</div>
        <BR label="Intervention n°" ph="N°" /><BR label="Date / Heure" initial={todayFR()} /><BR label="Équipe" /><BR label="Lieu" /><BR label="Type d'intervention" />
      </div>
      <div className="bilan-sec"><div className="bsec-h c-blue">Victime</div>
        <BR label="Nom / Prénom" /><BR label="Âge" /><BR label="Sexe" /><BR label="Position à l'arrivée" />
      </div>
      <div className="bilan-sec"><div className="bsec-h c-green">Constantes</div>
        <BR label="FC" ph="… bpm" /><BR label="FR" ph="… /min" /><BR label="SpO₂" ph="… %" /><BR label="TA" ph="… mmHg" /><BR label="Glycémie" ph="… g/L" /><BR label="TRC" ph="… s" />
      </div>
      <div className="bilan-sec"><div className="bsec-h c-orange">Bilan circonstanciel</div>
        <BR label="Circonstances" /><BR label="Depuis combien de temps" /><BR label="Risques particuliers" />
      </div>
      <div className="bilan-sec"><div className="bsec-h c-yellow">Bilan primaire</div>
        <BR label="Conscience" /><BR label="Détresse vitale" /><BR label="Motif principal" /><BR label="Douleur" /><BR label="Localisation" /><BR label="Intensité (/10)" /><BR label="Depuis" />
      </div>
      <div className="bilan-sec"><div className="bsec-h c-purple">Bilan complémentaire</div>
        <BR label="Lésions visibles" /><BR label="Saignement" ph="Oui / Non" /><BR label="Observations" />
      </div>
      <div className="bilan-sec"><div className="bsec-h c-brown">Gestes effectués</div>
        <Chk k="o2" label="Oxygène" /><Chk k="pans" label="Pansement" /><Chk k="immo" label="Immobilisation" /><Chk k="dsa" label="DSA / Massage" /><Chk k="surv" label="Surveillance" />
        <BR label="Autres" />
      </div>
      <div className="bilan-sec"><div className="bsec-h c-rose">Décision</div>
        <BR label="Renfort demandé" /><BR label="Transport" ph="Oui / Non" /><BR label="Destination" /><BR label="Victime laissée sur place" ph="Oui / Non" /><BR label="Heure de fin d'intervention" />
      </div>
      <div className="bilan-sec"><div className="bsec-h c-teal">Antécédents (MHTA)</div>
        <BR label="Maladies" /><BR label="Hospitalisations" /><BR label="Traitements" /><BR label="Allergies" />
      </div>
      <div className="bilan-sec span2"><div className="bsec-h c-indigo">Rapport d&apos;intervention</div>
        <Editable className="paper-textblock" field="rapport_intervention" placeholder="Déroulé de l'intervention, transmissions, suites…" />
      </div>
    </div>
  )
}

/* ---- Rapport d'imagerie ---- */
function BodyImagerie() {
  const [sel, setSel] = useDocField<{ type: string; src: string } | null>('exam', null)
  return (
    <>
      <div className="paper-section">
        <div className="ps-label">Examen réalisé</div>
        <div className="no-print" style={{ marginBottom: 12, maxWidth: 340 }}>
          <select value={sel ? sel.src : ''} onChange={(e) => { const r = PRESET_RADIOS.find((p) => p.src === e.target.value); setSel(r ? { type: r.type, src: r.src } : null) }}
            style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #cfd4dc', background: '#fff', color: '#1a2330', fontFamily: 'Archivo, sans-serif', fontSize: 13, outline: 'none' }}>
            <option value="">— Sélectionner un examen —</option>
            {PRESET_RADIOS.map((r) => <option key={r.type} value={r.src}>{r.type}</option>)}
          </select>
        </div>
        <div className="prow"><div className="pl">Type d&apos;examen</div><div className="pv" style={{ borderBottom: 'none' }}>{sel ? sel.type : '—'}</div></div>
        <PRow label="Région examinée" />
        <PRow label="Indication" placeholder="Motif de l'examen" />
        <PRow label="Technique" placeholder="Incidence, produit de contraste…" />
      </div>
      <div className="paper-section">
        <div className="ps-label">Cliché</div>
        {sel ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img className="imagerie-shot" src={sel.src} alt="" crossOrigin="anonymous" />
        ) : (
          <div className="imagerie-empty no-print">Aucun cliché sélectionné — choisissez un examen ci-dessus.</div>
        )}
      </div>
      <div className="paper-section"><div className="ps-label">Interprétation</div><Editable className="paper-textblock" field="interpretation" placeholder="Description des structures, anomalies constatées…" /></div>
      <div className="paper-section"><div className="ps-label">Conclusion</div><Editable className="paper-textblock" field="conclusion" placeholder="Conclusion radiologique…" /><PRow label="Radiologue" placeholder="Dr. …" /></div>
    </>
  )
}

/* ---- Examen gynécologique ---- */
const ECHOS = [
  { v: '6sa', label: 'Semaine 6' },
  { v: '7sa', label: 'Semaine 7' },
  { v: '8sa', label: 'Semaine 8' },
  { v: '9sa', label: 'Semaine 9' },
  { v: '10sa', label: 'Semaine 10' },
  { v: '11sa', label: 'Semaine 11' },
  { v: '12sa', label: 'Semaine 12' },
  { v: '13sa', label: 'Semaine 13' },
  { v: '14sa', label: 'Semaine 14' },
  { v: '6mois', label: 'Semaine 26' },
  { v: '8mois', label: 'Semaine 35' },
]

function BodyGyneco() {
  const [grossesse, setGrossesse] = useDocField('grossesse', 'non')
  const [echo, setEcho] = useDocField('echo', '')
  const sel = ECHOS.find((e) => e.v === echo)
  return (
    <>
      <div className="paper-section">
        <div className="ps-label">Cadre de la consultation</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 32px' }}>
          <PRow label="Gynécologue" placeholder="Dr. …" />
          <PRow label="Date de l'examen" initial={todayFR()} placeholder="JJ/MM/AAAA" />
          <PRow label="Motif" placeholder="Suivi annuel, douleurs, grossesse…" />
          <PRow label="Dernières règles" placeholder="JJ/MM/AAAA" />
        </div>
      </div>
      <div className="paper-section">
        <div className="ps-label">Antécédents gynécologiques</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 32px' }}>
          <PRow label="Grossesses (gestité)" placeholder="…" />
          <PRow label="Accouchements (parité)" placeholder="…" />
          <PRow label="Contraception" placeholder="Aucune / pilule / …" />
          <PRow label="Allergies / traitements" placeholder="—" />
        </div>
      </div>
      <div className="paper-section">
        <div className="ps-label">Examen clinique</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 32px' }}>
          <PRow label="Tension artérielle" placeholder="… mmHg" />
          <PRow label="Poids" placeholder="… kg" />
        </div>
        <Editable className="paper-textblock" field="examen_clinique" placeholder="Observations cliniques (examen abdominal, échographie, prélèvements…)…" />
      </div>
      <div className="paper-section">
        <div className="ps-label">Grossesse</div>
        <div className="verdict-box">
          <div className={`verdict-opt ${grossesse === 'non' ? 'sel-ok' : ''}`} onClick={() => setGrossesse('non')}>NON</div>
          <div className={`verdict-opt ${grossesse === 'oui' ? 'sel-warn' : ''}`} onClick={() => setGrossesse('oui')}>OUI</div>
        </div>
        {grossesse === 'oui' && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 32px', marginTop: 10 }}>
              <PRow label="Terme estimé" placeholder="… SA / JJ/MM/AAAA" />
              <PRow label="Rythme cardiaque fœtal" placeholder="… bpm" />
              <PRow label="Suivi recommandé" placeholder="Échographie de contrôle à …" />
              <PRow label="Précautions" placeholder="Repos, arrêt de service…" />
            </div>
            <div style={{ marginTop: 16 }}>
              <div className="ps-label">Échographie</div>
              <div className="no-print" style={{ margin: '10px 0 12px', maxWidth: 320 }}>
                <select value={echo} onChange={(e) => setEcho(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #cfd4dc', background: '#fff', color: '#1a2330', fontFamily: 'Archivo, sans-serif', fontSize: 13, outline: 'none' }}>
                  <option value="">— Sélectionner le stade de la grossesse —</option>
                  {ECHOS.map((e) => <option key={e.v} value={e.v}>{e.label}</option>)}
                </select>
              </div>
              {sel ? (
                <div style={{ textAlign: 'center' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={`/assets/echo/${sel.v}.png`} alt="" crossOrigin="anonymous" style={{ width: 260, maxWidth: '100%', borderRadius: 8, border: '1px solid #1c2330', background: '#08090b' }} />
                  <div style={{ fontSize: 12, color: '#5a6678', marginTop: 6 }}>Échographie — {sel.label}</div>
                </div>
              ) : <div className="imagerie-empty no-print">Aucune échographie sélectionnée — choisissez le stade ci-dessus.</div>}
            </div>
          </>
        )}
      </div>
      <div className="paper-section">
        <div className="ps-label">Conclusion &amp; recommandations</div>
        <Editable className="paper-textblock" field="conclusion" placeholder="Conclusion de l'examen, traitement prescrit, prochaine consultation…" />
        <PRow label="Prochain contrôle" placeholder="JJ/MM/AAAA" />
      </div>
    </>
  )
}

const DOC_BODIES: Record<string, () => React.JSX.Element> = {
  aptitude: BodyAptitude, psy: BodyPsy, ordonnance: BodyOrdonnance, arret: BodyArret,
  accident: BodyAccident, deces: BodyDeces, rapport: BodyRapport, bilan: BodyBilan, imagerie: BodyImagerie,
  gyneco: BodyGyneco,
}

export default function DocPaper({
  type,
  patient,
  user,
  content,
  contentRef,
}: {
  type: string
  patient: Patient | null
  user?: CurrentMember
  /** Contenu déjà sauvegardé pour ré-hydrater un document rattaché. */
  content?: DocStore
  /** Reçoit le store de contenu vivant — le parent le lit à l'enregistrement. */
  contentRef?: React.MutableRefObject<DocStore>
}) {
  const storeRef = useRef<DocStore>(content ? { ...content } : {})
  // Expose le store vivant au parent (même référence d'objet, idempotent).
  if (contentRef) contentRef.current = storeRef.current

  const ctx = useMemo<DocContentCtx>(
    () => ({
      initial: content || {},
      set: (k, v) => { storeRef.current[k] = v },
    }),
    [content]
  )

  const Body = DOC_BODIES[type] || (() => null)
  return (
    <DocContentContext.Provider value={ctx}>
      <PaperShell type={type} patient={patient} user={user}>
        <Body />
      </PaperShell>
    </DocContentContext.Provider>
  )
}
