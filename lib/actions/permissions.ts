'use server'
import { revalidatePath } from 'next/cache'
import { createServiceClient } from '@/lib/supabase/server'
import { getCurrentMember } from '@/lib/auth'
import { logAudit } from '@/lib/actions/audit'
import {
  getAccess,
  permKey,
  CATEGORY_KEYS,
  type AccessLevel,
  type PermMap,
} from '@/lib/permissions'
import { GRADES } from '@/lib/constants'

type Result = { ok: boolean; error?: string }

interface PermRow {
  grade: string
  category: string
  level: AccessLevel
}

/** Charge toute la matrice depuis la base et la renvoie sous forme de PermMap. */
export async function loadPermissions(): Promise<PermMap> {
  const admin = createServiceClient()
  const { data } = await admin.from('permissions').select('grade, category, level')
  const map: PermMap = {}
  for (const r of (data as PermRow[]) || []) {
    map[permKey(r.grade, r.category)] = r.level
  }
  return map
}

const LEVELS: AccessLevel[] = ['edit', 'view', 'none']
const VALID_GRADES = Object.keys(GRADES)

/**
 * Enregistre la matrice complète (upsert ligne par ligne).
 * Réservé aux grades disposant de 'edit' sur la catégorie `permissions`
 * (la Direction par défaut). Vérification CÔTÉ SERVEUR.
 */
export async function savePermissions(rows: PermRow[]): Promise<Result> {
  const me = await getCurrentMember()
  if (!me) return { ok: false, error: 'Non authentifié' }

  // Sécurité serveur : seul un grade 'edit' sur `permissions` peut écrire.
  const map = await loadPermissions()
  if (getAccess(map, me.grade, 'permissions') !== 'edit') {
    return { ok: false, error: 'Action réservée à la Direction' }
  }

  // Validation + filtrage des lignes.
  const clean = (rows || []).filter(
    (r) =>
      VALID_GRADES.includes(r.grade) &&
      CATEGORY_KEYS.includes(r.category) &&
      LEVELS.includes(r.level)
  )
  if (clean.length === 0) return { ok: false, error: 'Aucune permission valide à enregistrer' }

  const admin = createServiceClient()
  const { error } = await admin
    .from('permissions')
    .upsert(clean, { onConflict: 'grade,category' })
  if (error) return { ok: false, error: error.message }

  await logAudit(me, 'a mis à jour la matrice des permissions', '')
  revalidatePath('/', 'layout')
  return { ok: true }
}

/** Met à jour un seul croisement (utilisé par la matrice éditable). */
export async function setPermission(
  grade: string,
  category: string,
  level: AccessLevel
): Promise<Result> {
  return savePermissions([{ grade, category, level }])
}
