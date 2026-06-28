'use client'
import { useEffect, useMemo, useState } from 'react'
import { Icons } from '@/components/Icons'
import { Card, GradePill, KPI, SecTitle } from '@/components/ui'
import { initialsOf, parisDate } from '@/lib/format'
import { useRealtime } from '@/lib/useRealtime'
import type { Member, Timeclock } from '@/lib/types'

const DAY = 86400000

/** Filtres rapides : en service / inactifs (jours) / jamais pointé. */
const FILTERS = [
  { key: 'all', label: 'Tous' },
  { key: 'onduty', label: 'En service' },
  { key: 'inactive', label: "Jours d'inactivité" },
  { key: 'never', label: 'Jamais' },
] as const

const isOpen = (t: Timeclock) => !(t.end_at || t.end)

/** Instant (ms) de début d'un pointage : `start_at` (UTC) sinon date+heure texte. */
function tStart(t: Timeclock): number | null {
  if (t.start_at) return new Date(t.start_at).getTime()
  if (t.date && t.start) {
    const [d, mo, y] = t.date.split('/').map(Number)
    const [h, mi] = t.start.split(':').map(Number)
    if (y && mo && d) return new Date(y, mo - 1, d, h || 0, mi || 0).getTime()
  }
  return null
}

/** Niveau de sévérité visuel selon les jours d'inactivité. */
function sev(days: number, open: boolean): { cls: string; label: string } {
  if (open) return { cls: 'ok', label: 'En service' }
  if (!isFinite(days)) return { cls: 'crit', label: 'Jamais' }
  if (days <= 0) return { cls: 'ok', label: "Aujourd'hui" }
  if (days === 1) return { cls: 'info', label: 'Hier' }
  if (days < 4) return { cls: 'info', label: `${days} jours` }
  if (days < 7) return { cls: 'warn', label: `${days} jours` }
  if (days < 30) {
    const w = Math.floor(days / 7)
    return { cls: 'warn', label: `${w} semaine${w > 1 ? 's' : ''}` }
  }
  const m = Math.floor(days / 30)
  return { cls: 'crit', label: `${m} mois` }
}

export default function InactiviteView({
  members,
  timeclock,
}: {
  members: Member[]
  timeclock: Timeclock[]
}) {
  useRealtime(['timeclock', 'members'])
  const [now, setNow] = useState(() => Date.now())
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<(typeof FILTERS)[number]['key']>('all')

  // Rafraîchit la durée d'inactivité chaque minute.
  useEffect(() => {
    const iv = setInterval(() => setNow(Date.now()), 60000)
    return () => clearInterval(iv)
  }, [])

  // Inactivité par membre (dernier service connu).
  const rows = useMemo(() => {
    return members
      .map((m) => {
        const mine = timeclock.filter((t) =>
          t.member_id
            ? t.member_id === m.id
            : (t.name || '').toLowerCase() === m.name.toLowerCase()
        )
        const open = mine.some(isOpen)
        const lastMs = mine.reduce<number | null>((acc, t) => {
          const s = tStart(t)
          return s != null && (acc == null || s > acc) ? s : acc
        }, null)
        const days = open ? 0 : lastMs == null ? Infinity : Math.floor((now - lastMs) / DAY)
        return { m, lastMs, open, days }
      })
      // Ordre de la liste : 1) en service, 2) jours d'inactivité (du plus long
      // au plus court), 3) jamais pointé.
      .sort((a, b) => {
        const rank = (r: { open: boolean; days: number }) =>
          r.open ? 0 : !isFinite(r.days) ? 2 : 1
        const rd = rank(a) - rank(b)
        if (rd) return rd
        if (rank(a) === 1 && a.days !== b.days) return b.days - a.days
        return a.m.name.localeCompare(b.m.name)
      })
  }, [members, timeclock, now])

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    return rows.filter((r) => {
      if (q && !r.m.name.toLowerCase().includes(q)) return false
      if (filter === 'onduty') return r.open
      if (filter === 'never') return !isFinite(r.days)
      if (filter === 'inactive') return !r.open && isFinite(r.days)
      return true
    })
  }, [rows, filter, query])

  // KPIs alignés sur les 3 groupes.
  const onDutyCount = rows.filter((r) => r.open).length
  const inactiveCount = rows.filter((r) => !r.open && isFinite(r.days)).length
  const neverCount = rows.filter((r) => !isFinite(r.days)).length

  return (
    <div className="view-anim">
      <div className="kpi-grid" style={{ marginBottom: 24 }}>
        <KPI label="Effectif total" val={members.length} icon="patients" />
        <KPI label="En service" val={onDutyCount} icon="pulse" />
        <KPI label="Jours d'inactivité" val={inactiveCount} icon="clock" />
        <KPI label="Jamais pointé" val={neverCount} icon="pause" />
      </div>

      <SecTitle>Suivi des prises de service</SecTitle>

      <div
        style={{
          display: 'flex',
          gap: 14,
          alignItems: 'center',
          flexWrap: 'wrap',
          margin: '4px 0 16px',
        }}
      >
        <div className="search" style={{ maxWidth: 320, flex: '1 1 240px' }}>
          <Icons.search size={17} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher un employé…"
          />
          {query && (
            <button
              type="button"
              className="search-clear"
              title="Effacer"
              onClick={() => setQuery('')}
            >
              <Icons.x size={15} />
            </button>
          )}
        </div>

        <div className="chips">
          {FILTERS.map((t) => (
            <button
              key={t.key}
              className={`chip ${filter === t.key ? 'on' : ''}`}
              onClick={() => setFilter(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <Card style={{ overflowX: 'auto' }}>
        <table className="tbl" style={{ minWidth: 720 }}>
          <thead>
            <tr>
              <th>Employé</th>
              <th>Grade</th>
              <th>Dernier service</th>
              <th style={{ textAlign: 'right' }}>Inactivité</th>
            </tr>
          </thead>
          <tbody>
            {visible.map(({ m, lastMs, open, days }) => {
              const s = sev(days, open)
              return (
                <tr key={m.id}>
                  <td>
                    <div className="person">
                      <div className="av-sm">{initialsOf(m.name)}</div>
                      <div className="pn">
                        <b>{m.name}</b>
                      </div>
                    </div>
                  </td>
                  <td>
                    <GradePill grade={m.grade || 'ambulancier'} />
                  </td>
                  <td style={{ color: 'var(--ink-300)' }}>
                    {open ? 'En service' : lastMs != null ? parisDate(lastMs) : '—'}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <span className={`badge ${s.cls}`}>
                      <span className="b-dot"></span>
                      {s.label}
                    </span>
                  </td>
                </tr>
              )
            })}
            {visible.length === 0 && (
              <tr>
                <td colSpan={4} style={{ textAlign: 'center', color: 'var(--ink-500)', padding: 40 }}>
                  Aucun employé ne correspond à ce filtre.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  )
}
