'use server'
import { revalidatePath } from 'next/cache'
import { apiGet, apiPut } from '@/lib/api/client'
import { permKey, type AccessLevel, type PermMap } from '@/lib/permissions'

type Result = { ok: boolean; error?: string }

interface PermRow {
  grade: string
  category: string
  level: AccessLevel
}

/** Charge toute la matrice depuis l'API et la renvoie sous forme de PermMap. */
export async function loadPermissions(): Promise<PermMap> {
  const rows = (await apiGet<PermRow[]>('/permissions')) ?? []
  const map: PermMap = {}
  for (const r of rows) {
    map[permKey(r.grade, r.category)] = r.level
  }
  return map
}

/**
 * Enregistre la matrice (upsert). Réservé aux grades disposant de 'edit'
 * sur la catégorie `permissions` — vérification CÔTÉ API.
 */
export async function savePermissions(rows: PermRow[]): Promise<Result> {
  const res = await apiPut('/permissions', { rows })
  if (res.ok) revalidatePath('/', 'layout')
  return res
}

/** Met à jour un seul croisement (utilisé par la matrice éditable). */
export async function setPermission(
  grade: string,
  category: string,
  level: AccessLevel
): Promise<Result> {
  return savePermissions([{ grade, category, level }])
}
