'use client'
import { createContext, useContext, useState, type ReactNode } from 'react'
import type { GradeKey } from './constants'
import { can, isAdminGrade, type PermAction } from './constants'

export interface CurrentMember {
  id: string
  name: string
  grade: GradeKey | string
  discord: string | null
  photo: string | null
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
  search: string
  setSearch: (s: string) => void
  reqCount: number
}

const AppContext = createContext<AppContextValue | null>(null)

export function AppProvider({
  member,
  reqCount,
  children,
}: {
  member: CurrentMember
  reqCount: number
  children: ReactNode
}) {
  const [grade, setGrade] = useState<string>(member.grade)
  const [search, setSearch] = useState('')

  const value: AppContextValue = {
    member,
    realGrade: member.grade,
    grade,
    setGrade,
    isAdmin: isAdminGrade(grade),
    can: (action) => can(action, grade),
    search,
    setSearch,
    reqCount,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within <AppProvider>')
  return ctx
}
