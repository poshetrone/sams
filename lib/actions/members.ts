'use server'
import { revalidatePath } from 'next/cache'
import { apiPost, apiPut, apiPatch, apiDelete } from '@/lib/api/client'

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

export async function createMember(input: MemberInput): Promise<Result> {
  const res = await apiPost('/members', input)
  if (res.ok) revalidatePath('/effectifs')
  return res
}

export async function updateMember(input: MemberInput): Promise<Result> {
  const res = await apiPut(`/members/${input.id}`, input)
  if (res.ok) revalidatePath('/effectifs')
  return res
}

export async function deleteMember(id: string, name: string): Promise<Result> {
  const res = await apiDelete(`/members/${id}`, { name })
  if (res.ok) revalidatePath('/effectifs')
  return res
}

/* ---------- Primes ---------- */
export async function setPrime(id: string, prime: boolean): Promise<Result> {
  const res = await apiPatch(`/members/${id}/prime`, { prime })
  if (res.ok) revalidatePath('/primes')
  return res
}

export async function setBonus(id: string, bonus: number): Promise<Result> {
  const res = await apiPatch(`/members/${id}/bonus`, { bonus })
  if (res.ok) revalidatePath('/primes')
  return res
}

export async function resetPrimes(): Promise<Result> {
  const res = await apiPost('/members/primes/reset')
  if (res.ok) revalidatePath('/primes')
  return res
}

/* ---------- Contrat : photo signée rattachée à l'employé ---------- */
export async function addContractPhoto(memberId: string, src: string): Promise<Result> {
  const res = await apiPost(`/members/${memberId}/contract-photos`, { src })
  if (res.ok) revalidatePath('/effectifs')
  return res
}

/** Supprime une photo de contrat d'un employé (Direction). */
export async function deleteContractPhoto(memberId: string, photoId: string): Promise<Result> {
  const res = await apiDelete(`/members/${memberId}/contract-photos/${photoId}`)
  if (res.ok) revalidatePath('/effectifs')
  return res
}

/* ---------- Formations (validation par membre) ---------- */
export async function updateMemberFormations(id: string, formations: string[]): Promise<Result> {
  const res = await apiPatch(`/members/${id}/formations`, { formations })
  if (res.ok) revalidatePath('/formations')
  return res
}
