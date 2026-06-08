'use client'
import { useEffect, type ReactNode } from 'react'
import { Icons } from './Icons'

export default function Modal({
  children,
  onClose,
  title,
  icon,
  wide,
}: {
  children: ReactNode
  onClose: () => void
  title: string
  icon?: ReactNode
  wide?: boolean
}) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [onClose])

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={wide ? { maxWidth: 720 } : undefined} onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          {icon && (
            <div className="kpi-ico" style={{ position: 'static' }}>
              {icon}
            </div>
          )}
          <div>
            <h3 style={{ fontSize: 17, color: 'var(--ink-100)', fontWeight: 600 }}>{title}</h3>
          </div>
          <div className="modal-x" onClick={onClose}>
            <Icons.x size={18} />
          </div>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  )
}
