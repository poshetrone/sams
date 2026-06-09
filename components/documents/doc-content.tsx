'use client'
import { createContext, useContext, useEffect, useState } from 'react'

/**
 * Contexte de capture du contenu d'un document.
 *
 * - `initial` : contenu déjà sauvegardé (pour ré-hydrater un document rattaché).
 * - `set(key, value)` : enregistre la valeur d'un champ dans le store partagé
 *   (un objet mutable que le parent lit au moment du « Rattacher / Enregistrer »).
 *
 * Chaque champ éditable (Editable) et chaque contrôle (verdict, sexe du schéma,
 * zones cochées, descriptions, cases à cocher…) écrit sa valeur sous une clé
 * stable. À la réouverture, les valeurs sauvegardées priment sur les valeurs
 * par défaut, ce qui ré-affiche exactement ce qui avait été saisi.
 */
export type DocStore = Record<string, unknown>

export interface DocContentCtx {
  initial: DocStore
  set: (key: string, value: unknown) => void
}

export const DocContentContext = createContext<DocContentCtx>({ initial: {}, set: () => {} })
export const useDocContent = () => useContext(DocContentContext)

/**
 * Champ d'état (toggle, sélection, cases…) persisté dans le store du document.
 * Initialise depuis le contenu sauvegardé s'il existe, sinon depuis `def`,
 * et « sème » la valeur de départ pour qu'un défaut non modifié soit aussi
 * sauvegardé.
 */
export function useDocField<T>(key: string, def: T): [T, (v: T) => void] {
  const { initial, set } = useDocContent()
  const [val, setVal] = useState<T>(() => (initial[key] !== undefined ? (initial[key] as T) : def))
  // Sème la valeur de départ une seule fois (au montage).
  useEffect(() => {
    set(key, initial[key] !== undefined ? (initial[key] as T) : def)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  const update = (v: T) => {
    setVal(v)
    set(key, v)
  }
  return [val, update]
}
