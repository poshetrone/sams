/**
 * Insère / met à jour un membre du SAMS dans Supabase (clé service-role).
 *
 * Usage :
 *   node scripts/seed-member.mjs <discord_id> <pseudo> [grade] [nom]
 * Exemple :
 *   node scripts/seed-member.mjs 466613706059415565 titanium_1817 directiongen "Titanium"
 */
import { readFileSync } from 'node:fs'
import { createClient } from '@supabase/supabase-js'

// ---- charge .env.local sans dépendance externe ----
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
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !serviceKey) {
  console.error('❌ NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY manquant dans .env.local')
  process.exit(1)
}

const [discordId, pseudo, grade = 'directiongen', name] = process.argv.slice(2)
if (!discordId || !pseudo) {
  console.error('Usage : node scripts/seed-member.mjs <discord_id> <pseudo> [grade] [nom]')
  process.exit(1)
}

const supabase = createClient(url, serviceKey, { auth: { persistSession: false } })

const row = {
  name: name || pseudo,
  grade,
  discord: pseudo,
  discord_id: discordId,
  status: 'service',
  matricule: 'SAMS-001',
}

// upsert sur discord_id (unique)
const { data, error } = await supabase
  .from('members')
  .upsert(row, { onConflict: 'discord_id' })
  .select()
  .single()

if (error) {
  console.error('❌ Erreur Supabase :', error.message)
  process.exit(1)
}

// Si une demande d'accès traînait, on la marque approuvée.
await supabase.from('accesses').update({ status: 'approved', grade }).eq('discord_id', discordId)

console.log('✅ Membre enregistré :', { id: data.id, name: data.name, grade: data.grade, discord_id: data.discord_id })
