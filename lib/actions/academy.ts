'use server'
import { apiPost, apiDelete } from '@/lib/api/client'
import { revalidatePath } from 'next/cache'
import type { AcademyChapter } from '@/lib/types'

export interface AcademyFormationInput {
  id?: string
  eyebrow?: string | null
  title: string
  subtitle?: string | null
  question?: string | null
  chapters: AcademyChapter[]
}

type Result = { ok: boolean; error?: string }

export async function saveFormation(input: AcademyFormationInput): Promise<Result> {
  const res = await apiPost('/academy/formations', input)
  if (res.ok) revalidatePath('/academy')
  return res
}

export async function deleteFormation(id: string): Promise<Result> {
  const res = await apiDelete(`/academy/formations/${id}`)
  if (res.ok) revalidatePath('/academy')
  return res
}

/** Réordonne le parcours — `ids` dans l'ordre voulu. */
export async function reorderFormations(ids: string[]): Promise<Result> {
  const res = await apiPost('/academy/formations/reorder', { ids })
  if (res.ok) revalidatePath('/academy')
  return res
}

/** Validation d'une formation par le membre connecté, avec sa réponse éventuelle. */
export async function answerFormation(
  id: string,
  answer: string | null,
  completed = true
): Promise<Result> {
  const res = await apiPost(`/academy/formations/${id}/answer`, { answer, completed })
  if (res.ok) revalidatePath('/academy')
  return res
}

export async function deleteAnswer(answerId: string): Promise<Result> {
  const res = await apiDelete(`/academy/answers/${answerId}`)
  if (res.ok) revalidatePath('/academy')
  return res
}
