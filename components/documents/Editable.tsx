'use client'
import { useEffect, useRef } from 'react'

/** Champ éditable non-contrôlé (contentEditable) — évite les sauts de curseur. */
export default function Editable({
  initial = '',
  placeholder = '…',
  className = '',
  tag = 'div',
  style,
}: {
  initial?: string
  placeholder?: string
  className?: string
  tag?: 'div' | 'span'
  style?: React.CSSProperties
}) {
  const ref = useRef<HTMLElement>(null)
  useEffect(() => {
    if (ref.current && initial) ref.current.textContent = initial
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  const Tag = tag as keyof React.JSX.IntrinsicElements
  return (
    // @ts-expect-error ref typing for dynamic tag
    <Tag ref={ref} className={className} contentEditable suppressContentEditableWarning data-empty={placeholder} spellCheck={false} style={style} />
  )
}
