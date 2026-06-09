/* ============================================================
 * SAMS — Système de permissions configurable
 * ------------------------------------------------------------
 * Remplace les règles d'accès en dur par une matrice
 * (grade × catégorie) → niveau ('edit' | 'view' | 'none'),
 * stockée dans la table Supabase `permissions` et configurable
 * depuis la page "Permissions" (réservée à la Direction).
 *
 * Ce module est ISOMORPHE (client + serveur) : aucune dépendance
 * `server-only`. Le helper central est `getAccess()`.
 * ============================================================ */
import { NAV, ADMIN_GRADES } from './constants'

export type AccessLevel = 'edit' | 'view' | 'none'

export interface PermCategory {
  key: string
  label: string
  group: string
}

/**
 * Toutes les catégories = entrées de la sidebar (clé NAV).
 * Dérivé de NAV pour rester automatiquement synchronisé.
 * `permissions` y figure déjà (ajouté à NAV).
 */
export const CATEGORIES: PermCategory[] = NAV.flatMap((g) =>
  g.items.map((it) => ({ key: it.key, label: it.label, group: g.group }))
)

export const CATEGORY_KEYS: string[] = CATEGORIES.map((c) => c.key)

/** Catégories sensibles : 'none' par défaut sauf pour la Direction. */
export const SENSITIVE_CATEGORIES = ['access', 'audit', 'permissions'] as const

const ADMIN = ADMIN_GRADES as readonly string[]

export const isDirection = (grade: string | null | undefined): boolean =>
  !!grade && ADMIN.includes(grade)

/** Clé canonique d'une ligne de la matrice. */
export const permKey = (grade: string, category: string) => `${grade}::${category}`

/** Carte des niveaux explicitement définis en base : `${grade}::${category}` -> level. */
export type PermMap = Record<string, AccessLevel>

/**
 * Niveau PAR DÉFAUT (aucune ligne en base) :
 *   • Direction (ADMIN_GRADES) → 'edit' partout ;
 *   • catégories sensibles (access, audit, permissions) → 'none' ;
 *   • tout le monde sinon → 'view'.
 */
export function defaultAccess(grade: string | null | undefined, category: string): AccessLevel {
  if (isDirection(grade)) return 'edit'
  if ((SENSITIVE_CATEGORIES as readonly string[]).includes(category)) return 'none'
  return 'view'
}

/**
 * Helper CENTRAL — niveau effectif d'un grade sur une catégorie.
 * Utilise la ligne en base si présente, sinon le défaut.
 *
 * Garde-fou : la Direction garde TOUJOURS 'edit' sur la page Permissions
 * (impossible de se verrouiller soi-même hors de la configuration).
 */
export function getAccess(
  map: PermMap | null | undefined,
  grade: string | null | undefined,
  category: string
): AccessLevel {
  // La Direction ne peut jamais perdre l'accès à la page Permissions.
  if (category === 'permissions' && isDirection(grade)) return 'edit'

  const explicit = grade ? map?.[permKey(grade, category)] : undefined
  return explicit ?? defaultAccess(grade, category)
}

export const canEditCategory = (
  map: PermMap | null | undefined,
  grade: string | null | undefined,
  category: string
): boolean => getAccess(map, grade, category) === 'edit'

export const canViewCategory = (
  map: PermMap | null | undefined,
  grade: string | null | undefined,
  category: string
): boolean => getAccess(map, grade, category) !== 'none'
