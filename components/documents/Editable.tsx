'use client'
import { useEffect, useRef } from 'react'
import { useDocContent } from './doc-content'

/**
 * Champ éditable non-contrôlé (contentEditable) — évite les sauts de curseur.
 *
 * Si `field` est fourni, la saisie est enregistrée dans le store du document
 * (via le contexte DocContent) et le champ se ré-hydrate depuis le contenu
 * sauvegardé lorsqu'on rouvre un document rattaché.
 */
export default function Editable({
  field,
  initial = '',
  placeholder = '…',
  className = '',
  tag = 'div',
  style,
}: {
  field?: string
  initial?: string
  placeholder?: string
  className?: string
  tag?: 'div' | 'span'
  style?: React.CSSProperties
}) {
  const { initial: saved, set } = useDocContent()
  const ref = useRef<HTMLElement>(null)
  const savedVal = field ? saved[field] : undefined
  const startVal = savedVal != null ? String(savedVal) : initial

  useEffect(() => {
    if (ref.current && startVal) ref.current.textContent = startVal
    // Sème la valeur de départ (saisie sauvegardée ou défaut) dans le store.
    if (field && startVal) set(field, startVal)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const onInput = (e: React.FormEvent<HTMLElement>) => {
    if (field) set(field, e.currentTarget.textContent || '')
  }

  const props = {
    className,
    contentEditable: true,
    suppressContentEditableWarning: true,
    'data-empty': placeholder,
    spellCheck: false,
    style,
    onInput,
  }
  if (tag === 'span') return <span ref={ref as React.RefObject<HTMLSpanElement>} {...props} />
  return <div ref={ref as React.RefObject<HTMLDivElement>} {...props} />
}
