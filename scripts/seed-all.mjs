/**
 * Seed complet des données de démo du SAMS (porté de reference_design/data.js).
 *   node scripts/seed-all.mjs
 *
 * - members      : upsert sur discord_id (préserve les membres existants, dont le tien)
 * - formations   : upsert sur key (catalogue)
 * - tombola      : upsert id=1
 * - autres tables: remplacement (delete-all + insert) pour rester ré-exécutable
 * - crée le bucket Storage public `media`
 */
import { readFileSync } from 'node:fs'
import { createClient } from '@supabase/supabase-js'

function loadEnv(path) {
  try {
    for (const line of readFileSync(path, 'utf8').split('\n')) {
      const m = line.match(/^\s*([\w.-]+)\s*=\s*(.*)\s*$/)
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
    }
  } catch {}
}
loadEnv(new URL('../.env.local', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'))

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !key) {
  console.error('❌ Clés Supabase manquantes dans .env.local')
  process.exit(1)
}
const db = createClient(url, key, { auth: { persistSession: false } })

const NIL = '00000000-0000-0000-0000-000000000000'
async function wipe(table) {
  const { error } = await db.from(table).delete().neq('id', NIL)
  if (error) console.warn(`  ⚠️  wipe ${table}: ${error.message}`)
}
function ok(label, error) {
  if (error) console.error(`❌ ${label}: ${error.message}`)
  else console.log(`✅ ${label}`)
}

/* ---------------- MEMBERS ---------------- */
const membersSeed = [
  { ref: 'm1', name: 'Léon Carter',    grade: 'directiongen', discord: 'leon.carter', discord_id: '184920113377091584', matricule: 'SAMS-001', status: 'service',      since: '12/01/2025', phone: '2054896589', prime: false, formations: ['imagerie','balle','visite','taser','quine','chirurgie','psychologie','henry','fusillade'], poles: ['chirurgie','psy'] },
  { ref: 'm2', name: 'Maya Delacroix', grade: 'directeur',    discord: 'maya.dlx',    discord_id: '203847562910847221', matricule: 'SAMS-002', status: 'service',      since: '12/01/2025', phone: '3107742019', prime: false, formations: ['imagerie','balle','visite','taser','chirurgie','psychologie','henry'], poles: [] },
  { ref: 'm3', name: 'Hugo Trémaux',   grade: 'codirecteur',  discord: 'hugotrm',     discord_id: '339201847562109884', matricule: 'SAMS-004', status: 'service',      since: '03/02/2025', phone: '2138840476', prime: false, formations: ['imagerie','visite','taser','chirurgie','psychologie','fusillade'], poles: ['chirurgie'] },
  { ref: 'm4', name: 'Inès Bouvier',   grade: 'medchef',      discord: 'ines.b',      discord_id: '418273645091827340', matricule: 'SAMS-011', status: 'repos',        since: '21/02/2025', phone: '4159930112', prime: false, formations: ['imagerie','visite','chirurgie','psychologie'], poles: ['psy'] },
  { ref: 'm5', name: 'Noah Vidal',     grade: 'medsenior',    discord: 'noahvdl',     discord_id: '502938471029384712', matricule: 'SAMS-017', status: 'service',      since: '14/03/2025', phone: '6195520338', prime: true,  formations: ['imagerie','balle','visite','taser','quine'], poles: ['kine'] },
  { ref: 'm6', name: 'Clara Fontaine', grade: 'medecin2',     discord: 'clara.fnt',   discord_id: '610293847102938475', matricule: 'SAMS-019', status: 'intervention', since: '14/03/2025', phone: '7148810294', prime: false, formations: ['visite','taser','quine'], poles: ['kine'] },
  { ref: 'm7', name: 'Sami Oualid',    grade: 'medecin',      discord: 'sami.o',      discord_id: '718293746510293847', matricule: 'SAMS-023', status: 'service',      since: '02/04/2025', phone: '5598470231', prime: true,  formations: ['balle','taser'], poles: [] },
  { ref: 'm8', name: 'Léa Marchetti',  grade: 'interne',      discord: 'lea.mch',     discord_id: '829374651029384756', matricule: 'SAMS-031', status: 'formation',    since: '19/05/2025', phone: '3239061847', prime: false, formations: ['visite'], poles: ['psy'] },
  { ref: 'm9', name: 'Karim Benali',   grade: 'ambulancier',  discord: 'karim.bnl',   discord_id: '930485762019384756', matricule: 'SAMS-034', status: 'service',      since: '02/06/2025', phone: '4084762019', prime: false, formations: [], poles: [] },
]
const refToId = {}
for (const m of membersSeed) {
  const { ref, ...row } = m
  const { data, error } = await db.from('members').upsert(row, { onConflict: 'discord_id' }).select('id').single()
  if (error) { console.error(`❌ member ${m.name}: ${error.message}`); continue }
  refToId[ref] = data.id
}
console.log(`✅ members (${membersSeed.length} upsert)`)

/* ---------------- ACCESSES (demandes en attente) ---------------- */
await wipe('accesses')
{
  const { error } = await db.from('accesses').insert([
    { name: 'Théo Lambert',  discord: 'theolmb#4417',  status: 'pending', note: 'Recruté en jeu — escouade Alpha' },
    { name: 'Jade Rousseau', discord: 'jade.rss#9920', status: 'pending', note: 'Transfert depuis LSFD' },
    { name: 'Marco Pereira', discord: 'marco.p#0031',  status: 'pending', note: 'Candidature aspirant' },
  ])
  ok('accesses (3 pending)', error)
}

/* ---------------- PATIENTS ---------------- */
const dv = { tension: '12/8', fc: '75', spo2: '98', temp: '37.0' }
const patientsSeed = [
  {
    first_name: 'Antoine', last_name: 'Mercier', dob: '04/09/1992', sex: 'M', phone: '2055540148', blood: 'O+', matricule: 'CIT-22841',
    status: 'stable', care: 'soins', room: 'Box 3', last_visit: '06/06/2026', allergies: 'Pénicilline',
    notes: 'Suivi post-opératoire — fracture tibia.', antecedents: 'Fracture du tibia droit (2025). Asthme léger.',
    emergency: { name: 'Julie Mercier', link: 'Épouse', phone: '2055550149' },
    vitals: { tension: '12/8', fc: '74', spo2: '98', temp: '37.0' },
    treatments: [{ name: 'Paracétamol 1g', pos: '1 cp x3/jour, 5 jours' }, { name: 'Amoxicilline 500mg', pos: '1 gél. matin et soir, 7 jours' }],
    history: [
      { date: '06/06/2026 14:20', type: 'Consultation', author: 'Dr. H. Trémaux', text: 'Contrôle post-opératoire fracture tibia. Cicatrisation correcte.' },
      { date: '02/06/2026 09:10', type: 'Intervention', author: 'Dr. L. Carter', text: "Réduction de fracture, pose d'attelle." },
      { date: '28/05/2026 18:45', type: 'Admission', author: 'N. Vidal', text: 'Admis aux urgences suite à chute. Douleur jambe droite.' },
    ],
    vitals_history: [
      { date: '28/05', tension: '13/8', fc: '96', spo2: '96', temp: '37.4' },
      { date: '02/06', tension: '12/8', fc: '82', spo2: '98', temp: '37.1' },
      { date: '06/06', tension: '12/8', fc: '74', spo2: '98', temp: '37.0' },
    ],
    appointments: [{ id: 'a1', date: '15/06/2026', dateIso: '2026-06-15', reason: 'Retrait attelle + contrôle', done: false }],
    images: [],
    invoices: [{ id: 'inv1', date: '02/06/2026', label: 'Intervention + immobilisation', amount: 12000, mutuelle: 'standard', status: 'payée' }],
    docs: [
      { id: 'd1', type: 'aptitude', title: "Certificat d'aptitude médicale", date: '06/06/2026', author: 'Dr. H. Trémaux', state: 'signé' },
      { id: 'd2', type: 'ordonnance', title: 'Ordonnance — antalgiques', date: '06/06/2026', author: 'Dr. H. Trémaux', state: 'signé' },
    ],
  },
  {
    first_name: 'Sofia', last_name: 'Nakamura', dob: '17/02/1988', sex: 'F', phone: '3105550931', blood: 'A-', matricule: 'CIT-19077',
    status: 'suivi', care: 'ambulatoire', room: '', last_visit: '05/06/2026', allergies: 'Aucune connue',
    notes: 'Visite psychologique annuelle à programmer.', antecedents: '',
    emergency: { name: 'Kenji Nakamura', link: 'Frère', phone: '3105550932' },
    vitals: { tension: '11/7', fc: '68', spo2: '99', temp: '36.8' },
    treatments: [], history: [], vitals_history: [{ date: '05/06', tension: '11/7', fc: '68', spo2: '99', temp: '36.8' }],
    appointments: [], images: [], invoices: [],
    docs: [{ id: 'd3', type: 'psy', title: 'Compte-rendu visite psychologique', date: '02/05/2026', author: 'Dr. I. Bouvier', state: 'signé' }],
  },
  {
    first_name: 'Gabriel', last_name: 'Okonkwo', dob: '29/11/1995', sex: 'M', phone: '2135550467', blood: 'B+', matricule: 'CIT-30512',
    status: 'critique', care: 'hospit', room: 'Réa 1', last_visit: '07/06/2026', allergies: 'Iode, fruits de mer',
    notes: 'Accident de travail déclaré — chute échafaudage.', antecedents: 'Aucun antécédent notable.',
    emergency: { name: 'Awa Okonkwo', link: 'Mère', phone: '2135550468' },
    vitals: { tension: '9/6', fc: '112', spo2: '91', temp: '38.4' },
    treatments: [{ name: 'Morphine', pos: 'titration IV selon douleur' }],
    history: [{ date: '07/06/2026 16:05', type: 'Intervention', author: 'Dr. L. Carter', text: 'Accident de travail — chute échafaudage. Polytraumatisme, mise en réa.' }],
    vitals_history: [
      { date: '07/06 16h', tension: '9/6', fc: '120', spo2: '89', temp: '38.1' },
      { date: '07/06 18h', tension: '9/6', fc: '112', spo2: '91', temp: '38.4' },
    ],
    appointments: [{ id: 'a2', date: '09/06/2026', dateIso: '2026-06-09', reason: 'Bloc opératoire — fixation', done: false }],
    images: [], invoices: [],
    docs: [
      { id: 'd4', type: 'accident', title: 'Déclaration accident de travail', date: '07/06/2026', author: 'Dr. L. Carter', state: 'signé' },
      { id: 'd5', type: 'arret', title: 'Arrêt de travail — 14 jours', date: '07/06/2026', author: 'Dr. L. Carter', state: 'signé' },
    ],
  },
  {
    first_name: 'Elena', last_name: 'Vasquez', dob: '08/07/2000', sex: 'F', phone: '4155550205', blood: 'AB+', matricule: 'CIT-41200',
    status: 'stable', care: 'ambulatoire', room: '', last_visit: '01/06/2026', allergies: 'Aucune connue',
    notes: "Aptitude au port d'arme — renouvellement.", antecedents: '',
    emergency: { name: 'Mateo Vasquez', link: 'Père', phone: '4155550206' },
    vitals: { tension: '12/8', fc: '70', spo2: '99', temp: '36.9' },
    treatments: [], history: [], vitals_history: [{ date: '01/06', tension: '12/8', fc: '70', spo2: '99', temp: '36.9' }],
    appointments: [], images: [], invoices: [], docs: [],
  },
  {
    first_name: 'Driss', last_name: 'El Amrani', dob: '23/03/1979', sex: 'M', phone: '6195550772', blood: 'O-', matricule: 'CIT-08344',
    status: 'suivi', care: 'ambulatoire', room: '', last_visit: '28/05/2026', allergies: 'Aspirine',
    notes: 'Hypertension — contrôle mensuel.', antecedents: '',
    emergency: { name: 'Fatima El Amrani', link: 'Épouse', phone: '6195550773' },
    vitals: { tension: '14/9', fc: '82', spo2: '97', temp: '37.1' },
    treatments: [], history: [], vitals_history: [{ date: '28/05', tension: '14/9', fc: '82', spo2: '97', temp: '37.1' }],
    appointments: [], images: [], invoices: [],
    docs: [{ id: 'd6', type: 'ordonnance', title: 'Ordonnance — antihypertenseur', date: '28/05/2026', author: 'Dr. I. Bouvier', state: 'signé' }],
  },
]
await wipe('patients')
ok(`patients (${patientsSeed.length})`, (await db.from('patients').insert(patientsSeed)).error)

/* ---------------- FUSILLADES ---------------- */
await wipe('fusillades')
{
  const rows = [
    { title: 'Fusillade — Vinewood Boulevard', zone: 'Vinewood', x: 47, y: 67, severity: 'critique', status: 'en cours', time: '08/06/2026 21:14', author: 'Léon Carter',
      wounded: [
        { id: 'w1', name: 'Marcus Reed', group: 'Ballas', age: '29', sex: 'M', phone: '2135550192', triage: 'urgent', photo: null, idCard: null, info: 'Plaie par balle au thorax, hémorragie active. Pose de garrot.' },
        { id: 'w2', name: 'Tyrone Banks', group: 'Ballas', age: '24', sex: 'M', phone: '', triage: 'grave', photo: null, idCard: null, info: "Balle dans l'épaule gauche, patient conscient." },
      ] },
    { title: 'Règlement de comptes — Grove Street', zone: 'South Los Santos', x: 45, y: 80, severity: 'modérée', status: 'clôturée', time: '07/06/2026 03:40', author: 'Maya Delacroix',
      wounded: [
        { id: 'w3', name: 'Carl Johnson', group: 'Families', age: '34', sex: 'M', phone: '', triage: 'leger', photo: null, idCard: null, info: 'Éraflure superficielle, refus de transport.' },
      ] },
  ]
  ok('fusillades (2)', (await db.from('fusillades').insert(rows)).error)
}

/* ---------------- CALENDRIER ---------------- */
await wipe('calendar_events')
{
  const rows = [
    { day: '2026-06-08', text: 'Réunion de service — 21h00', author: 'Léon Carter', color: 'gold' },
    { day: '2026-06-10', text: 'Formation Chirurgie — Box 2', author: 'Hugo Trémaux', color: 'blue' },
    { day: '2026-06-15', text: 'Visite médicale annuelle — équipe Alpha', author: 'Maya Delacroix', color: 'gold' },
    { day: '2026-06-21', text: 'Garde renforcée — Fête de la musique', author: 'Léon Carter', color: 'blue' },
    { day: '2026-06-27', text: 'Bilan mensuel des primes', author: 'Inès Bouvier', color: 'gold' },
  ]
  ok('calendar_events (5)', (await db.from('calendar_events').insert(rows)).error)
}

/* ---------------- TARIFS ---------------- */
await wipe('tarifs')
{
  const t = [
    { icon: 'soin', label: 'Soin', price: 600 },
    { icon: 'pulse', label: 'Réanimation', price: 700 },
    { icon: 'ambu', label: 'Réanimation + Déplacement', price: 1200 },
    { icon: 'visite', label: 'Visite médicale', price: 1000 },
    { icon: 'brain', label: 'Visite psy', price: 1500 },
    { icon: 'spine', label: 'Consultation spé', sub: '(kiné, chir, psy)', price: 1500 },
    { icon: 'scalpel', label: 'Opération simple', price: 1400 },
    { icon: 'complex', label: 'Opération complexe', price: 1800 },
    { icon: 'fusil', label: 'Fusillade', price: 6000 },
  ].map((r, i) => ({ ...r, sub: r.sub ?? null, ord: i }))
  ok('tarifs (9)', (await db.from('tarifs').insert(t)).error)
}

/* ---------------- CONTRACTS ---------------- */
await wipe('contracts')
{
  const rows = [
    { company: 'Bennys Motorworks', logo: null, type: 'premium', tier: 't2', employees: 18, status: 'actif', start: '01/05/2026', end: '01/05/2027', details: "Couverture médicale complète des employés du garage. Prise en charge des accidents de travail sur site. Interventions prioritaires aux heures d'ouverture. Bilan trimestriel de la flotte de personnel." },
    { company: 'Los Santos Customs', logo: null, type: 'standard', tier: 't1', employees: 12, status: 'actif', start: '12/03/2026', end: '12/03/2027', details: 'Réanimation et déplacement gratuits pour les employés en service. Hors imagerie et soins lourds. Renouvellement tacite annuel.' },
    { company: 'Vanilla Unicorn', logo: null, type: 'standard', tier: 't3', employees: 26, status: 'actif', start: '20/02/2026', end: '20/02/2027', details: "Couverture de l'ensemble du personnel de l'établissement. Astreinte médicale les soirs d'affluence." },
    { company: 'Premium Deluxe Motorsport', logo: null, type: 'premium', tier: 't1', employees: 14, status: 'expiré', start: '05/01/2025', end: '05/01/2026', details: 'Contrat premium arrivé à échéance — en attente de renouvellement.' },
  ]
  ok('contracts (4)', (await db.from('contracts').insert(rows)).error)
}

/* ---------------- POINTEUSE ---------------- */
await wipe('timeclock')
{
  const rows = [
    { member_id: refToId.m5, name: 'Noah Vidal',     grade: 'medsenior',   date: '08/06/2026', start: '14:02', end: '18:34', minutes: 272 },
    { member_id: refToId.m7, name: 'Sami Oualid',    grade: 'medecin',     date: '08/06/2026', start: '09:15', end: '13:05', minutes: 230 },
    { member_id: refToId.m6, name: 'Clara Fontaine', grade: 'medecin2',    date: '07/06/2026', start: '20:10', end: '23:48', minutes: 218 },
    { member_id: refToId.m3, name: 'Hugo Trémaux',   grade: 'codirecteur', date: '07/06/2026', start: '10:00', end: '16:30', minutes: 390 },
  ].filter((r) => r.member_id)
  ok(`timeclock (${rows.length})`, (await db.from('timeclock').insert(rows)).error)
}

/* ---------------- TROMBINOSCOPE ---------------- */
await wipe('trombi_posts')
{
  const rows = [
    { author: 'Maya Delacroix', grade: 'directeur',  photo: null, text: 'Bienvenue sur le trombinoscope du SAMS ! Présentez-vous ici 👋', likers: [], time: '08/06/2026 18:02' },
    { author: 'Noah Vidal',     grade: 'medsenior',  photo: null, text: "Présent et en service ce soir, n'hésitez pas si besoin de renfort.", likers: [], time: '08/06/2026 18:15' },
    { author: 'Léa Marchetti',  grade: 'interne',    photo: null, text: 'Hâte de valider mes prochaines formations 💪', likers: [], time: '08/06/2026 19:40' },
  ]
  ok('trombi_posts (3)', (await db.from('trombi_posts').insert(rows)).error)
}

/* ---------------- FORMATIONS (catalogue) ---------------- */
{
  const cat = [
    { key: 'imagerie', label: 'Formation Imagerie', short: 'Imagerie', icon: 'eye' },
    { key: 'balle', label: 'Formation Opération par balle', short: 'Op. balle', icon: 'alert' },
    { key: 'visite', label: 'Formation Visite médicale', short: 'Visite méd.', icon: 'shield' },
    { key: 'taser', label: 'Formation Taser', short: 'Taser', icon: 'pulse' },
    { key: 'quine', label: 'Formation Kiné', short: 'Kiné', icon: 'pill' },
    { key: 'chirurgie', label: 'Formation Chirurgie', short: 'Chirurgie', icon: 'patient' },
    { key: 'psychologie', label: 'Formation Psychologie', short: 'Psycho.', icon: 'brain' },
    { key: 'henry', label: 'Formation Henry', short: 'Henry', icon: 'doc' },
    { key: 'fusillade', label: 'Formation Fusillade', short: 'Fusillade', icon: 'alert' },
  ].map((r, i) => ({ ...r, ord: i }))
  ok('formations (9, upsert)', (await db.from('formations').upsert(cat, { onConflict: 'key' })).error)
}

/* ---------------- AUDIT ---------------- */
await wipe('audit_log')
{
  const rows = [
    { time: '08/06/2026 21:14', who: 'Léon Carter',    grade: 'directiongen', action: 'a déclenché une fusillade', target: 'Vinewood Boulevard' },
    { time: '08/06/2026 20:48', who: 'Maya Delacroix',  grade: 'directeur',    action: "a validé l'accès Discord de", target: 'Noah Vidal' },
    { time: '08/06/2026 19:30', who: 'Hugo Trémaux',    grade: 'codirecteur',  action: "a signé un certificat d'aptitude —", target: 'A. Mercier' },
    { time: '07/06/2026 16:05', who: 'Léon Carter',    grade: 'directiongen', action: "a créé une déclaration d'accident —", target: 'G. Okonkwo' },
  ]
  ok('audit_log (4)', (await db.from('audit_log').insert(rows)).error)
}

/* ---------------- TOMBOLA ---------------- */
ok('tombola (id=1)', (await db.from('tombola').upsert({ id: 1, size: 100, tickets: {}, winner: null }, { onConflict: 'id' })).error)

/* ---------------- STORAGE bucket `media` ---------------- */
{
  const { error } = await db.storage.createBucket('media', { public: true })
  if (error && !/already exists/i.test(error.message)) console.warn(`  ⚠️  bucket media: ${error.message}`)
  else console.log('✅ bucket media (public)')
}

console.log('\n🎉 Seed terminé.')
