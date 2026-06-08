'use client'
import type { VitalsRecord } from '@/lib/types'

/** Mini graphique d'évolution FC + SpO₂ (porté du proto). */
export default function VitalsChart({ data }: { data: VitalsRecord[] }) {
  if (!data || data.length === 0) return <p style={{ color: 'var(--ink-500)', fontSize: 13 }}>Aucun relevé.</p>
  const W = 560, H = 170, pad = 34
  const n = data.length
  const xs = data.map((_, i) => pad + (n === 1 ? (W - 2 * pad) / 2 : (i * (W - 2 * pad)) / (n - 1)))
  const fcY = (v: number) => H - pad - ((Math.min(160, Math.max(40, v)) - 40) / 120) * (H - 2 * pad)
  const spY = (v: number) => H - pad - ((Math.min(100, Math.max(80, v)) - 80) / 20) * (H - 2 * pad)
  const poly = (yf: (v: number) => number, key: 'fc' | 'spo2') => data.map((d, i) => `${xs[i]},${yf(+d[key])}`).join(' ')
  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto' }}>
        {[0, 0.5, 1].map((t) => (
          <line key={t} x1={pad} x2={W - pad} y1={pad + t * (H - 2 * pad)} y2={pad + t * (H - 2 * pad)} stroke="rgba(173,196,222,0.1)" />
        ))}
        <polyline points={poly(fcY, 'fc')} fill="none" stroke="#e3a83f" strokeWidth="2.5" strokeLinejoin="round" />
        <polyline points={poly(spY, 'spo2')} fill="none" stroke="#5aa0d6" strokeWidth="2.5" strokeLinejoin="round" />
        {data.map((d, i) => (
          <g key={i}>
            <circle cx={xs[i]} cy={fcY(+d.fc)} r="3.5" fill="#e3a83f" />
            <circle cx={xs[i]} cy={spY(+d.spo2)} r="3.5" fill="#5aa0d6" />
            <text x={xs[i]} y={H - 10} fontSize="9.5" fill="var(--ink-500)" textAnchor="middle" fontFamily="Archivo">
              {d.date}
            </text>
          </g>
        ))}
      </svg>
      <div style={{ display: 'flex', gap: 18, justifyContent: 'center', marginTop: 4, fontSize: 12 }}>
        <span style={{ color: '#e3a83f' }}>● Fréq. cardiaque (bpm)</span>
        <span style={{ color: '#5aa0d6' }}>● SpO₂ (%)</span>
      </div>
    </div>
  )
}
