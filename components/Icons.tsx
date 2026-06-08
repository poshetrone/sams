/* ============ SAMS — Icônes (SVG line), porté depuis icons.jsx ============ */
import * as React from 'react'

export interface IconProps {
  size?: number
  style?: React.CSSProperties
  className?: string
}

interface IcProps extends IconProps {
  d?: string
  fill?: string
  sw?: number
  vb?: number
  children?: React.ReactNode
}

const Ic = ({ d, size = 18, fill = 'none', sw = 1.7, children, vb = 24, style, className }: IcProps) => (
  <svg
    width={size}
    height={size}
    viewBox={`0 0 ${vb} ${vb}`}
    fill={fill}
    stroke="currentColor"
    strokeWidth={sw}
    strokeLinecap="round"
    strokeLinejoin="round"
    style={style}
    className={className}
  >
    {d ? <path d={d} /> : children}
  </svg>
)

type IconComp = (p: IconProps) => React.JSX.Element

export const Icons: Record<string, IconComp> = {
  dashboard: (p) => <Ic {...p}><rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/></Ic>,
  patient: (p) => <Ic {...p}><circle cx="12" cy="8" r="3.5"/><path d="M5 20c0-3.5 3-6 7-6s7 2.5 7 6"/></Ic>,
  patients: (p) => <Ic {...p}><circle cx="9" cy="8" r="3"/><path d="M3 19c0-3 2.5-5 6-5s6 2 6 5"/><path d="M16 6a3 3 0 0 1 0 6"/><path d="M18 19c0-2.2-1-4-3-4.6"/></Ic>,
  doc: (p) => <Ic {...p}><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/><path d="M9 13h6M9 16h4"/></Ic>,
  docs: (p) => <Ic {...p}><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/><path d="M9 13h6M9 16h4"/></Ic>,
  access: (p) => <Ic {...p}><rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/><circle cx="12" cy="15.5" r="1.3"/></Ic>,
  effectifs: (p) => <Ic {...p}><circle cx="12" cy="7" r="3.2"/><path d="M5.5 20c0-3.4 2.9-6 6.5-6s6.5 2.6 6.5 6"/></Ic>,
  stats: (p) => <Ic {...p}><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></Ic>,
  search: (p) => <Ic {...p}><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></Ic>,
  bell: (p) => <Ic {...p}><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/></Ic>,
  plus: (p) => <Ic {...p}><path d="M12 5v14M5 12h14"/></Ic>,
  chevR: (p) => <Ic {...p}><path d="m9 6 6 6-6 6"/></Ic>,
  arrowL: (p) => <Ic {...p}><path d="M19 12H5M12 19l-7-7 7-7"/></Ic>,
  arrowUp: (p) => <Ic {...p}><path d="M12 19V5M5 12l7-7 7 7"/></Ic>,
  arrowDown: (p) => <Ic {...p}><path d="M12 5v14M5 12l7 7 7-7"/></Ic>,
  check: (p) => <Ic {...p}><path d="M20 6 9 17l-5-5"/></Ic>,
  x: (p) => <Ic {...p}><path d="M18 6 6 18M6 6l12 12"/></Ic>,
  user: (p) => <Ic {...p}><circle cx="12" cy="8" r="3.5"/><path d="M5 20c0-3.5 3-6 7-6s7 2.5 7 6"/></Ic>,
  download: (p) => <Ic {...p}><path d="M12 3v12M7 11l5 4 5-4"/><path d="M5 21h14"/></Ic>,
  upload: (p) => <Ic {...p}><path d="M12 16V4M7 9l5-5 5 5"/><path d="M5 21h14"/></Ic>,
  print: (p) => <Ic {...p}><path d="M6 9V3h12v6"/><rect x="4" y="9" width="16" height="8" rx="2"/><path d="M8 17h8v4H8z"/></Ic>,
  edit: (p) => <Ic {...p}><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4z"/></Ic>,
  shield: (p) => <Ic {...p}><path d="M12 3 5 6v5c0 4.5 3 8 7 10 4-2 7-5.5 7-10V6z"/><path d="m9 12 2 2 4-4"/></Ic>,
  brain: (p) => <Ic {...p}><path d="M9.5 5a2.5 2.5 0 0 0-2.5 2.5c-1.4.3-2.5 1.5-2.5 3a3 3 0 0 0 .8 2 3 3 0 0 0 1.7 4.2A2.5 2.5 0 0 0 12 19V5.5A2.5 2.5 0 0 0 9.5 5z"/><path d="M14.5 5a2.5 2.5 0 0 1 2.5 2.5c1.4.3 2.5 1.5 2.5 3a3 3 0 0 1-.8 2 3 3 0 0 1-1.7 4.2A2.5 2.5 0 0 1 12 19"/></Ic>,
  pill: (p) => <Ic {...p}><rect x="3" y="8.5" width="18" height="7" rx="3.5" transform="rotate(45 12 12)"/><path d="m8.5 8.5 7 7"/></Ic>,
  pause: (p) => <Ic {...p}><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></Ic>,
  alert: (p) => <Ic {...p}><path d="M10.3 3.8 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.8a2 2 0 0 0-3.4 0z"/><path d="M12 9v4M12 17h.01"/></Ic>,
  discord: (p) => <Ic {...p} vb={24} fill="currentColor" sw={0}><path d="M19.5 5.3A16 16 0 0 0 15.5 4l-.2.4a12 12 0 0 1 3.5 1.8 13.5 13.5 0 0 0-11.6 0A12 12 0 0 1 10.7 4.4L10.5 4A16 16 0 0 0 6.5 5.3 17 17 0 0 0 3.5 17a16 16 0 0 0 5 2.5l.6-1a10.5 10.5 0 0 1-1.7-.8l.4-.3a11.5 11.5 0 0 0 9.8 0l.4.3a10.5 10.5 0 0 1-1.7.8l.6 1a16 16 0 0 0 5-2.5 17 17 0 0 0-3-11.7zM9.5 14.3c-1 0-1.8-.9-1.8-2s.8-2 1.8-2 1.8.9 1.8 2-.8 2-1.8 2zm5 0c-1 0-1.8-.9-1.8-2s.8-2 1.8-2 1.8.9 1.8 2-.8 2-1.8 2z"/></Ic>,
  lock: (p) => <Ic {...p}><rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></Ic>,
  mail: (p) => <Ic {...p}><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></Ic>,
  clock: (p) => <Ic {...p}><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></Ic>,
  pulse: (p) => <Ic {...p}><path d="M3 12h4l2-6 4 12 2-6h6"/></Ic>,
  file: (p) => <Ic {...p}><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/></Ic>,
  trash: (p) => <Ic {...p}><path d="M4 7h16M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M6 7l1 13a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-13"/></Ic>,
  eye: (p) => <Ic {...p}><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/></Ic>,
  logout: (p) => <Ic {...p}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="M16 17l5-5-5-5M21 12H9"/></Ic>,
  filter: (p) => <Ic {...p}><path d="M3 5h18l-7 8v6l-4-2v-4z"/></Ic>,
  calendar: (p) => <Ic {...p}><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 9h18M8 3v4M16 3v4"/></Ic>,
  cash: (p) => <Ic {...p}><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2.6"/><path d="M6 9.5v5M18 9.5v5"/></Ic>,
  reset: (p) => <Ic {...p}><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 4v4h4"/></Ic>,
  coin: (p) => <Ic {...p}><circle cx="12" cy="12" r="9"/><path d="M12 7v10M14.5 9.2c-.6-.7-1.5-1-2.5-1-1.4 0-2.5.8-2.5 2s1.1 2 2.5 2 2.5.8 2.5 2-1.1 2-2.5 2c-1 0-1.9-.4-2.5-1"/></Ic>,
  medal: (p) => <Ic {...p}><circle cx="12" cy="9" r="5.5"/><path d="m8.5 13.5-1.5 7 5-2.5 5 2.5-1.5-7"/><path d="m12 7 .9 1.8 2 .3-1.45 1.4.35 2-1.8-1-1.8 1 .35-2L9.1 9.1l2-.3z"/></Ic>,
  body: (p) => <Ic {...p}><circle cx="12" cy="4.5" r="2.2"/><path d="M12 7v8M12 9.5 6.5 8M12 9.5 17.5 8M12 15l-3 5.5M12 15l3 5.5"/></Ic>,
  scalpel: (p) => <Ic {...p}><path d="M4 20 14 10l4-4a2.8 2.8 0 0 0-4-4l-4 4z"/><path d="M11 7 4 14v6h6"/></Ic>,
  camera: (p) => <Ic {...p}><path d="M4 7h3l1.5-2h7L17 7h3a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1z"/><circle cx="12" cy="13" r="3.5"/></Ic>,
  heart: (p) => <Ic {...p}><path d="M12 21c-1-.9-8-5-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 10c0 6-7 10.1-8 11z"/></Ic>,
  phone: (p) => <Ic {...p}><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a1 1 0 0 1-1 1A16 16 0 0 1 4 5a1 1 0 0 1 1-1z"/></Ic>,
  cross: (p) => <Ic {...p}><path d="M12 3v18M6 9h12"/></Ic>,
  briefcase: (p) => <Ic {...p}><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M3 12h18"/></Ic>,
  building: (p) => <Ic {...p}><rect x="4" y="3" width="16" height="18" rx="1.5"/><path d="M9 7h2M13 7h2M9 11h2M13 11h2M9 15h2M13 15h2"/></Ic>,
  target: (p) => <Ic {...p}><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3.2"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/></Ic>,
  mapPin: (p) => <Ic {...p}><path d="M12 21s7-6.3 7-11a7 7 0 0 0-14 0c0 4.7 7 11 7 11z"/><circle cx="12" cy="10" r="2.6"/></Ic>,
  idcard: (p) => <Ic {...p}><rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="8.5" cy="11" r="2"/><path d="M5.5 16c.4-1.6 1.6-2.4 3-2.4s2.6.8 3 2.4M14 9h4M14 12h4M14 15h2.5"/></Ic>,
}

export interface LaurelProps {
  size?: number
  side?: 'left' | 'right'
  className?: string
  style?: React.CSSProperties
}

/** Branche de laurier dorée (décoration). */
export const Laurel = ({ size = 70, side = 'left', className = '', style }: LaurelProps) => (
  <svg
    className={`laurel ${className}`}
    width={size}
    height={size * 1.7}
    viewBox="0 0 60 102"
    fill="none"
    style={{ transform: side === 'right' ? 'scaleX(-1)' : 'none', ...style }}
    aria-hidden="true"
  >
    <path d="M44 4 C30 20 22 40 22 64 C22 78 26 90 33 98" stroke="url(#lg)" strokeWidth="2.4" strokeLinecap="round" fill="none" />
    {[10, 22, 34, 46, 58, 70, 82].map((y, i) => {
      const t = i / 6
      const x = 41 - t * 19
      const spread = 9 + t * 5
      return (
        <g key={y} stroke="url(#lg)" strokeWidth="1.5" fill="url(#lg)" fillOpacity="0.5">
          <path d={`M${x} ${y} C${x + spread} ${y - spread * 0.7} ${x + spread + 3} ${y - 2} ${x + spread} ${y + 3} C${x + spread - 4} ${y + 4} ${x + 2} ${y + 2} ${x} ${y} Z`} />
          <path d={`M${x} ${y} C${x - spread} ${y - spread * 0.7} ${x - spread - 3} ${y - 2} ${x - spread} ${y + 3} C${x - spread + 4} ${y + 4} ${x - 2} ${y + 2} ${x} ${y} Z`} />
        </g>
      )
    })}
    <defs>
      <linearGradient id="lg" x1="0" y1="0" x2="0" y2="102" gradientUnits="userSpaceOnUse">
        <stop stopColor="#ecd49a" />
        <stop offset="0.5" stopColor="#c9a35a" />
        <stop offset="1" stopColor="#8c6a35" />
      </linearGradient>
    </defs>
  </svg>
)
