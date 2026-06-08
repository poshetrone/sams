/**
 * Diagnostic Realtime : s'abonne (clé anon, comme le navigateur) aux INSERT sur
 * `fusillades`, insère une ligne de test (clé service-role), et indique si
 * l'événement Realtime arrive. Nettoie la ligne de test ensuite.
 *   node scripts/test-realtime.mjs
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
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const service = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !anon || !service) { console.error('❌ clés manquantes'); process.exit(1) }

const useService = process.argv[2] === 'service'
const subKey = useService ? service : anon
console.log(`• abonnement avec la clé : ${useService ? 'SERVICE-ROLE (bypass RLS)' : 'ANON'}`)
const sub = createClient(url, subKey, { realtime: { params: { eventsPerSecond: 10 } } })
const admin = createClient(url, service, { auth: { persistSession: false } })

let received = false
let insertedId = null

console.log(`• projet : ${url}`)
const channel = sub
  .channel('diag-fusillades')
  // écoute TOUT le schéma public (sans filtre de table) pour isoler le problème
  .on('postgres_changes', { event: '*', schema: 'public' }, (payload) => {
    received = true
    console.log(`✅ ÉVÉNEMENT REÇU : ${payload.eventType} sur ${payload.table} —`, payload.new?.id ?? payload.old?.id ?? '')
  })
  .subscribe(async (status, err) => {
    console.log('• statut abonnement :', status, err ? `(err: ${err.message || err})` : '')
    if (status === 'SUBSCRIBED') {
      const { data, error } = await admin.from('fusillades').insert({
        title: 'TEST-REALTIME', zone: 'TEST', x: 0, y: 0, severity: 'modérée',
        status: 'en cours', time: 'diag', author: 'TEST', wounded: [],
      }).select('id').single()
      if (error) { console.error('❌ insert échoué :', error.message); finish(); return }
      insertedId = data.id
      console.log('• ligne de test insérée :', insertedId, '— attente de l\'événement (6 s)…')
      setTimeout(finish, 6000)
    }
  })

async function finish() {
  if (insertedId) await admin.from('fusillades').delete().eq('id', insertedId)
  console.log('• ligne de test supprimée.')
  if (received) {
    console.log('\n🎉 Realtime FONCTIONNE : la table est dans la publication. Le souci est ailleurs (client).')
  } else {
    console.log('\n⛔ AUCUN événement reçu → la table `fusillades` n\'est PAS dans la publication realtime.')
    console.log('   Exécute dans Supabase → SQL Editor :')
    console.log('   alter publication supabase_realtime add table fusillades;')
  }
  await sub.removeChannel(channel)
  process.exit(0)
}

setTimeout(() => { console.log('⏱️ timeout global'); finish() }, 15000)
