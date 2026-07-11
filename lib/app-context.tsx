'use client'
import { createContext, useContext, useState, type ReactNode } from 'react'
import type { GradeKey } from './constants'
import { can, isAdminGrade, type PermAction } from './constants'
import { getAccess, type AccessLevel, type PermMap } from './permissions'
import type { PoleRow, MutuelleRow } from './types'

export interface CurrentMember {
  id: string
  name: string
  grade: GradeKey | string
  discord: string | null
  photo: string | null
  /** Clés des pôles auxquels le membre est rattaché. */
  poles: string[]
}

interface AppContextValue {
  member: CurrentMember
  /** Grade réel du membre connecté. */
  realGrade: string
  /** Grade « vu en tant que » (Direction peut prévisualiser d'autres grades). */
  grade: string
  setGrade: (g: string) => void
  /** True si le grade effectif est un grade d'administration. */
  isAdmin: boolean
  can: (action: PermAction) => boolean
  /** Niveau d'accès effectif sur une catégorie ('edit' | 'view' | 'none'). */
  access: (category: string) => AccessLevel
  /** Raccourci : true si le grade effectif peut écrire sur la catégorie. */
  canEdit: (category: string) => boolean
  search: string
  setSearch: (s: string) => void
  reqCount: number
  /** Catalogue complet des pôles (table `poles`). */
  poles: PoleRow[]
  /** Pôles auxquels le membre connecté est rattaché (résolus depuis le catalogue). */
  myPoles: PoleRow[]
  /** Catalogue des formules de mutuelle (table `mutuelles`), triées par ordre. */
  mutuelles: MutuelleRow[]
  /** Résout une formule par sa clé (celle stockée sur les contrats/factures). */
  mutuelleByKey: (key: string | null | undefined) => MutuelleRow | null
  /** Prix hebdomadaire d'une formule pour une tranche donnée (0 si introuvable). */
  mutuellePrice: (key: string | null | undefined, tier: string) => number
}

const AppContext = createContext<AppContextValue | null>(null)

export function AppProvider({
  member,
  reqCount,
  perms,
  poles,
  mutuelles,
  children,
}: {
  member: CurrentMember
  reqCount: number
  perms: PermMap
  poles: PoleRow[]
  mutuelles: MutuelleRow[]
  children: ReactNode
}) {
  const [grade, setGrade] = useState<string>(member.grade)
  const [search, setSearch] = useState('')

  const access = (category: string): AccessLevel => getAccess(perms, grade, category)
  const myPoles = poles.filter((p) => (member.poles || []).includes(p.key))
  const mutuelleByKey = (key: string | null | undefined) =>
    (key && mutuelles.find((m) => m.key === key)) || null
  const mutuellePrice = (key: string | null | undefined, tier: string) => {
    const m = mutuelleByKey(key)
    const t = m && m.tiers.find((x) => x.key === tier)
    return t ? t.price : 0
  }

  const value: AppContextValue = {
    member,
    realGrade: member.grade,
    grade,
    setGrade,
    isAdmin: isAdminGrade(grade),
    can: (action) => can(action, grade),
    access,
    canEdit: (category) => access(category) === 'edit',
    search,
    setSearch,
    reqCount,
    poles,
    myPoles,
    mutuelles,
    mutuelleByKey,
    mutuellePrice,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within <AppProvider>')
  return ctx
}
