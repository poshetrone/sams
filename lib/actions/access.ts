'use server'
import { revalidatePath } from 'next/cache'
import { createServiceClient } from '@/lib/supabase/server'
import { requireEdit } from '@/lib/auth'
import { logAudit } from '@/lib/actions/audit'

type Result = { ok: boolean; error?: string }

/** Valide une demande d'accès : crée le membre (grade aspirant = ambulancier) et retire la demande. */
export async function approveAccess(accessId: string): Promise<Result> {
  let me
  try {
    me = await requireEdit('access')
  } catch (e) {
    return { ok: false, error: (e as Error).message }
  }
  const admin = createServiceClient()
  const { data: acc } = await admin.from('accesses').select('*').eq('id', accessId).maybeSingle()
  if (!acc) return { ok: false, error: 'Demande introuvable' }

  const stamp = () => {
    const d = new Date()
    const p = (n: number) => String(n).padStart(2, '0')
    return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()}`
  }

  const { error: insErr } = await admin.from('members').insert({
    name: acc.name || acc.discord || 'Nouveau membre',
    grade: acc.grade && acc.grade !== 'ambulancier' ? acc.grade : 'ambulancier',
    discord: (acc.discord || '').split('#')[0] || null,
    discord_id: acc.discord_id || null,
    status: 'formation',
    since: stamp(),
  })
  if (insErr) return { ok: false, error: insErr.message }

  await admin.from('accesses').delete().eq('id', accessId)
  await logAudit(me, "a validé l'accès Discord de", acc.name || acc.discord || '')
  revalidatePath('/acces')
  revalidatePath('/effectifs')
  return { ok: true }
}

/**
 * Pré-ajoute / rattache un accès Discord à un employé existant :
 * met à jour le discord_id + le grade du membre, et crée/relie l'entrée
 * approuvée dans la table accesses.
 */
export async function linkAccess(memberId: string, discordId: string, grade: string): Promise<Result> {
  let me
  try {
    me = await requireEdit('access')
  } catch (e) {
    return { ok: false, error: (e as Error).message }
  }
  const did = (discordId || '').replace(/\D/g, '')
  if (!memberId) return { ok: false, error: 'Sélectionnez un employé' }
  if (!did) return { ok: false, error: 'ID Discord requis' }

  const admin = createServiceClient()
  const { data: member } = await admin.from('members').select('id, name, discord').eq('id', memberId).maybeSingle()
  if (!member) return { ok: false, error: 'Employé introuvable' }

  // Cet ID Discord est-il déjà rattaché à un autre employé ?
  const { data: clash } = await admin.from('members').select('id, name').eq('discord_id', did).maybeSingle()
  if (clash && clash.id !== memberId) {
    return { ok: false, error: `Cet ID Discord est déjà rattaché à ${clash.name}` }
  }

  const { error: updErr } = await admin.from('members').update({ discord_id: did, grade }).eq('id', memberId)
  if (updErr) return { ok: false, error: updErr.message }

  // Nettoie une éventuelle demande/accès existant pour cet ID, puis crée l'accès approuvé.
  await admin.from('accesses').delete().eq('discord_id', did)
  const { error: insErr } = await admin.from('accesses').insert({
    name: member.name, discord: member.discord, discord_id: did, grade, status: 'approved',
  })
  if (insErr) return { ok: false, error: insErr.message }

  await logAudit(me, 'a rattaché un accès Discord à', member.name)
  revalidatePath('/acces')
  revalidatePath('/effectifs')
  return { ok: true }
}

/** Refuse (supprime) une demande d'accès. */
export async function refuseAccess(accessId: string, label: string): Promise<Result> {
  let me
  try {
    me = await requireEdit('access')
  } catch (e) {
    return { ok: false, error: (e as Error).message }
  }
  const admin = createServiceClient()
  const { error } = await admin.from('accesses').delete().eq('id', accessId)
  if (error) return { ok: false, error: error.message }
  await logAudit(me, "a refusé la demande d'accès de", label)
  revalidatePath('/acces')
  return { ok: true }
}
