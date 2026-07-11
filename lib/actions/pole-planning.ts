'use server'
import { revalidatePath } from 'next/cache'
import { apiPost, apiDelete } from '@/lib/api/client'

export interface PoleAppointmentInput {
  title: string
  day: string
  time: string | null
}

type Result = { ok: boolean; error?: string }

export async function savePoleAppointment(poleKey: string, input: PoleAppointmentInput): Promise<Result> {
  const res = await apiPost(`/poles/${poleKey}/appointments`, input)
  if (res.ok) revalidatePath(`/poles/${poleKey}/planning`)
  return res
}

export async function deletePoleAppointment(poleKey: string, id: string): Promise<Result> {
  const res = await apiDelete(`/poles/${poleKey}/appointments/${id}`)
  if (res.ok) revalidatePath(`/poles/${poleKey}/planning`)
  return res
}
