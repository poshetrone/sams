/* ============ SAMS — Primitives UI partagées (porté de components.jsx) ============ */
import * as React from 'react'
import { GRADES, type GradeKey } from '@/lib/constants'
import { initialsOf } from '@/lib/format'
import { Icons } from './Icons'

export const Badge = ({ cls, children }: { cls: string; children: React.ReactNode }) => (
  <span className={`badge ${cls}`}>
    <span className="b-dot"></span>
    {children}
  </span>
)

export const GradePill = ({ grade }: { grade: string }) => {
  const g = GRADES[grade as GradeKey] || GRADES.ambulancier
  return (
    <span className="grade" style={{ color: g.color, background: g.bg }}>
      {g.label}
    </span>
  )
}

export const Avatar = ({ name, sm }: { name: string; sm?: boolean }) => (
  <div className={sm ? 'av-sm' : 'av'}>{initialsOf(name)}</div>
)

export const Card = ({
  children,
  className = '',
  ...rest
}: { children: React.ReactNode; className?: string } & React.HTMLAttributes<HTMLDivElement>) => (
  <div className={`card ${className}`} {...rest}>
    {children}
  </div>
)

export const SecTitle = ({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) => (
  <div className="sec-title">
    <h3>{children}</h3>
    <span className="line"></span>
    {action}
  </div>
)

export const KPI = ({
  label,
  val,
  unit,
  trend,
  dir,
  icon,
}: {
  label: string
  val: React.ReactNode
  unit?: string
  trend?: string
  dir?: 'up' | 'down'
  icon: string
}) => {
  const I = Icons[icon] || Icons.pulse
  return (
    <Card className="kpi">
      <div className="kpi-ico"><I size={20} /></div>
      <div className="label">{label}</div>
      <div className="val">{val}{unit && <small> {unit}</small>}</div>
      {trend && (
        <div className={`trend ${dir}`}>
          {dir === 'up' ? <Icons.arrowUp size={13} /> : <Icons.arrowDown size={13} />}
          {trend}
        </div>
      )}
    </Card>
  )
}
