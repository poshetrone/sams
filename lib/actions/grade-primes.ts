'use server'
import { revalidatePath } from 'next/cache'
import { apiPost } from '@/lib/api/client'

type Result = { ok: boolean; error?: string }

/** Définit la prime d'un grade (Direction). */
export async function setGradePrime(key: string, prime: number): Promise<Result> {
  const res = await apiPost('/grade-primes', { key, prime })
  if (res.ok) revalidatePath('/primes')
  return res
}
