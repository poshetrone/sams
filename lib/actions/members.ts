'use server'
import { revalidatePath } from 'next/cache'
import { createServiceClient } from '@/lib/supabase/server'
import { requirePerm } from '@/lib/auth'
import { logAudit } from '@/lib/actions/audit'

export interface MemberInput {
  id?: string
  name: string
  grade: string
  discord?: string
  discord_id?: string
  matricule?: string
  status?: string
  phone?: string
  poles?: string[]
  formations?: string[]
  warnings?: number
  since?: string
}

type Result = { ok: boolean; error?: string }

function clean(input: MemberInput) {
  return {
    name: input.name.trim(),
    grade: input.grade,
    discord: input.discord?.trim() || null,
    discord_id: input.discord_id?.replace(/\D/g, '') || null,
    matricule: input.matricule?.trim() || null,
    status: input.status || 'service',
    phone: input.phone?.replace(/\D/g, '').slice(0, 10) || null,
    poles: input.poles || [],
    formations: input.formations || [],
    warnings: Math.max(0, Math.min(3, input.warnings ?? 0)),
    since: input.since || null,
  }
}

export async function createMember(input: MemberInput): Promise<Result> {
  let me
  try {
    me = await requirePerm('manageStaff')
  } catch (e) {
    return { ok: false, error: (e as Error).message }
  }
  if (!input.name?.trim()) return { ok: false, error: 'Le nom est requis' }

  const admin = createServiceClient()
  const { error } = await admin.from('members').insert(clean(input))
  if (error) return { ok: false, error: error.message }

  await logAudit(me, 'a ajouté un employé —', input.name.trim())
  revalidatePath('/effectifs')
  return { ok: true }
}

export async function updateMember(input: MemberInput): Promise<Result> {
  let me
  try {
    me = await requirePerm('manageStaff')
  } catch (e) {
    return { ok: false, error: (e as Error).message }
  }
  if (!input.id) return { ok: false, error: 'ID manquant' }
  if (!input.name?.trim()) return { ok: false, error: 'Le nom est requis' }

  const admin = createServiceClient()
  const { error } = await admin.from('members').update(clean(input)).eq('id', input.id)
  if (error) return { ok: false, error: error.message }

  await logAudit(me, "a modifié la fiche de l'employé —", input.name.trim())
  revalidatePath('/effectifs')
  return { ok: true }
}

export async function deleteMember(id: string, name: string): Promise<Result> {
  let me
  try {
    me = await requirePerm('manageStaff')
  } catch (e) {
    return { ok: false, error: (e as Error).message }
  }

  const admin = createServiceClient()
  const { error } = await admin.from('members').delete().eq('id', id)
  if (error) return { ok: false, error: error.message }

  await logAudit(me, 'a supprimé un employé —', name)
  revalidatePath('/effectifs')
  return { ok: true }
}

/* ---------- Primes ---------- */
export async function setPrime(id: string, prime: boolean): Promise<Result> {
  try {
    await requirePerm('manageStaff')
  } catch (e) {
    return { ok: false, error: (e as Error).message }
  }
  const admin = createServiceClient()
  const { error } = await admin.from('members').update({ prime }).eq('id', id)
  if (error) return { ok: false, error: error.message }
  revalidatePath('/primes')
  return { ok: true }
}

export async function setBonus(id: string, bonus: number): Promise<Result> {
  try {
    await requirePerm('manageStaff')
  } catch (e) {
    return { ok: false, error: (e as Error).message }
  }
  const admin = createServiceClient()
  const { error } = await admin.from('members').update({ bonus: Math.max(0, Math.floor(bonus) || 0) }).eq('id', id)
  if (error) return { ok: false, error: error.message }
  revalidatePath('/primes')
  return { ok: true }
}

export async function resetPrimes(): Promise<Result> {
  let me
  try {
    me = await requirePerm('resetPrime')
  } catch (e) {
    return { ok: false, error: (e as Error).message }
  }
  const admin = createServiceClient()
  const { error } = await admin.from('members').update({ prime: false, bonus: 0 }).neq('id', '00000000-0000-0000-0000-000000000000')
  if (error) return { ok: false, error: error.message }
  await logAudit(me, 'a réinitialisé toutes les primes', '')
  revalidatePath('/primes')
  return { ok: true }
}

/* ---------- Contrat : photo signée rattachée à l'employé ---------- */
export async function addContractPhoto(memberId: string, src: string): Promise<Result> {
  try {
    await requirePerm('manageStaff')
  } catch (e) {
    return { ok: false, error: (e as Error).message }
  }
  if (!src) return { ok: false, error: 'Image requise' }
  const admin = createServiceClient()
  const { data: m } = await admin.from('members').select('contract_photos').eq('id', memberId).maybeSingle()
  if (!m) return { ok: false, error: 'Employé introuvable' }
  const stamp = () => {
    const d = new Date()
    const p = (n: number) => String(n).padStart(2, '0')
    return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()}`
  }
  const photos = [...((m.contract_photos as { id: string; src: string; date: string }[]) || []), { id: 'cp' + Date.now(), src, date: stamp() }]
  const { error } = await admin.from('members').update({ contract_photos: photos }).eq('id', memberId)
  if (error) return { ok: false, error: error.message }
  revalidatePath('/effectifs')
  return { ok: true }
}

/** Supprime une photo de contrat d'un employé (Direction). */
export async function deleteContractPhoto(memberId: string, photoId: string): Promise<Result> {
  try {
    await requirePerm('manageStaff')
  } catch (e) {
    return { ok: false, error: (e as Error).message }
  }
  const admin = createServiceClient()
  const { data: m } = await admin.from('members').select('contract_photos').eq('id', memberId).maybeSingle()
  if (!m) return { ok: false, error: 'Employé introuvable' }
  const photos = ((m.contract_photos as { id: string; src: string; date: string }[]) || []).filter((p) => p.id !== photoId)
  const { error } = await admin.from('members').update({ contract_photos: photos }).eq('id', memberId)
  if (error) return { ok: false, error: error.message }
  revalidatePath('/effectifs')
  return { ok: true }
}

/* ---------- Formations (validation par membre) ---------- */
export async function updateMemberFormations(id: string, formations: string[]): Promise<Result> {
  try {
    await requirePerm('manageStaff')
  } catch (e) {
    return { ok: false, error: (e as Error).message }
  }
  const admin = createServiceClient()
  const { error } = await admin.from('members').update({ formations }).eq('id', id)
  if (error) return { ok: false, error: error.message }
  revalidatePath('/formations')
  return { ok: true }
}
