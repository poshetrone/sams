'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Icons } from '@/components/Icons'
import { Card } from '@/components/ui'
import Modal from '@/components/Modal'
import { hexToRgba } from '@/lib/format'
import { MONTHS_FR, WEEKDAYS_FR } from '@/lib/constants'
import { useApp } from '@/lib/app-context'
import { savePoleAppointment, deletePoleAppointment } from '@/lib/actions/pole-planning'
import type { PoleRow, PoleAppointment } from '@/lib/types'

const pad = (n: number) => String(n).padStart(2, '0')
const keyOf = (y: number, m: number, d: number) => `${y}-${pad(m + 1)}-${pad(d)}`
const todayKey = () => {
  const d = new Date()
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export default function PolePlanningView({ pole, appointments }: { pole: PoleRow; appointments: PoleAppointment[] }) {
  const router = useRouter()
  const { member, isAdmin, search } = useApp()
  const I = Icons[pole.icon] || Icons.medal

  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())
  const [open, setOpen] = useState<string | null>(null)

  const canDelete = (a: PoleAppointment) =>
    a.member_id === member.id || pole.lead === member.id || isAdmin

  // Filtre (recherche globale) + tri par heure, puis regroupement par jour.
  const filtered = appointments
    .filter((a) => !search || `${a.title} ${a.author ?? ''}`.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => (a.time || '').localeCompare(b.time || ''))
  const byDay = new Map<string, PoleAppointment[]>()
  for (const a of filtered) {
    const arr = byDay.get(a.day) || []
    arr.push(a)
    byDay.set(a.day, arr)
  }

  // Construction de la grille du mois.
  const first = new Date(year, month, 1).getDay()
  const lead = (first + 6) % 7 // lundi = 0
  const nbDays = new Date(year, month + 1, 0).getDate()
  const cells: (number | null)[] = []
  for (let i = 0; i < lead; i++) cells.push(null)
  for (let d = 1; d <= nbDays; d++) cells.push(d)

  const TODAY = todayKey()
  const monthPrefix = `${year}-${pad(month + 1)}`
  const monthCount = filtered.filter((a) => a.day.startsWith(monthPrefix)).length

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear((y) => y - 1) } else setMonth((m) => m - 1)
  }
  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear((y) => y + 1) } else setMonth((m) => m + 1)
  }
  const goToday = () => { setYear(now.getFullYear()); setMonth(now.getMonth()) }

  return (
    <div className="view-anim">
      {/* En-tête */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 52, height: 52, borderRadius: 14, color: pole.color, background: hexToRgba(pole.color), flex: '0 0 auto' }}>
          <I size={26} />
        </span>
        <div style={{ minWidth: 0 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--ink-100)', margin: 0 }}>{pole.label} · Planning</h2>
          <div style={{ fontSize: 13, color: 'var(--ink-400)', marginTop: 2 }}>
            Rendez-vous de l’équipe · <b style={{ color: 'var(--ink-100)' }}>{appointments.length}</b>
          </div>
        </div>
      </div>

      {/* Barre de navigation mois */}
      <div className="cal-toolbar">
        <div className="cal-nav">
          <div className="icon-btn" onClick={prevMonth}><Icons.arrowL size={16} /></div>
          <h2>{MONTHS_FR[month]} <span>{year}</span></h2>
          <div className="icon-btn" onClick={nextMonth} style={{ transform: 'scaleX(-1)' }}><Icons.arrowL size={16} /></div>
          <button className="btn btn-ghost" style={{ marginLeft: 8 }} onClick={goToday}>Aujourd&apos;hui</button>
        </div>
        <div style={{ marginLeft: 'auto', fontSize: 13, color: 'var(--ink-400)' }}>
          <b style={{ color: pole.color }}>{monthCount}</b> rendez-vous ce mois
        </div>
      </div>

      <div className="cal-months">
        {MONTHS_FR.map((m, i) => <div key={m} className={`cal-month-pill ${i === month ? 'on' : ''}`} onClick={() => setMonth(i)}>{m.slice(0, 3)}</div>)}
      </div>

      <Card style={{ overflow: 'hidden' }}>
        <div className="cal-grid cal-head">
          {WEEKDAYS_FR.map((w) => <div key={w} className="cal-wd">{w}</div>)}
        </div>
        <div className="cal-grid">
          {cells.map((d, i) => {
            if (d == null) return <div key={'b' + i} className="cal-cell empty"></div>
            const mKey = keyOf(year, month, d)
            const evts = byDay.get(mKey) || []
            const isToday = mKey === TODAY
            return (
              <div key={mKey} className={`cal-cell ${isToday ? 'today' : ''}`} onClick={() => setOpen(mKey)}>
                <div className="cal-daynum">{d}{isToday && <span className="cal-today-dot"></span>}</div>
                <div className="cal-evts">
                  {evts.slice(0, 3).map((a) => (
                    <div key={a.id} className="cal-evt" style={{ background: hexToRgba(pole.color), color: pole.color, borderColor: hexToRgba(pole.color, 0.35) }}>
                      {a.time ? `${a.time} · ` : ''}{a.title}
                    </div>
                  ))}
                  {evts.length > 3 && <div className="cal-more">+{evts.length - 3}</div>}
                </div>
                <div className="cal-add"><Icons.plus size={13} /></div>
              </div>
            )
          })}
        </div>
      </Card>

      {open != null && (
        <DayModal
          pole={pole}
          day={open}
          events={byDay.get(open) || []}
          canDelete={canDelete}
          onClose={() => setOpen(null)}
          onChanged={() => router.refresh()}
        />
      )}
    </div>
  )
}

function DayModal({
  pole,
  day,
  events,
  canDelete,
  onClose,
  onChanged,
}: {
  pole: PoleRow
  day: string
  events: PoleAppointment[]
  canDelete: (a: PoleAppointment) => boolean
  onClose: () => void
  onChanged: () => void
}) {
  const [title, setTitle] = useState('')
  const [time, setTime] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [y, m, d] = day.split('-').map(Number)
  const label = `${d} ${MONTHS_FR[m - 1]} ${y}`

  const add = async () => {
    if (!title.trim()) { setError('Titre requis'); return }
    setBusy(true)
    setError(null)
    const res = await savePoleAppointment(pole.key, { title: title.trim(), day, time: time || null })
    setBusy(false)
    if (!res.ok) { setError(res.error || 'Erreur'); return }
    setTitle('')
    setTime('')
    onChanged()
  }
  const remove = async (id: string) => {
    setBusy(true)
    await deletePoleAppointment(pole.key, id)
    setBusy(false)
    onChanged()
  }

  return (
    <Modal onClose={onClose} title={label} icon={<Icons.calendar size={20} />}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 18 }}>
        {events.length === 0 && <p style={{ color: 'var(--ink-500)', fontSize: 13.5, padding: '6px 0' }}>Aucun rendez-vous ce jour. Ajoutez-en un ci-dessous.</p>}
        {events.map((a) => (
          <div key={a.id} className="cal-evt-row" style={{ borderLeftColor: pole.color }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minWidth: 58, padding: '4px 8px', borderRadius: 8, fontSize: 12.5, fontWeight: 700, color: pole.color, background: hexToRgba(pole.color) }}>
              {a.time || '—'}
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13.5, color: 'var(--ink-100)' }}>{a.title}</div>
              <div style={{ fontSize: 11.5, color: 'var(--ink-500)', marginTop: 2 }}>par {a.author || '—'}</div>
            </div>
            {canDelete(a) && <div className="icon-btn" style={{ width: 30, height: 30 }} title="Supprimer" onClick={() => remove(a.id)}><Icons.trash size={14} /></div>}
          </div>
        ))}
      </div>
      <div className="editor-panel">
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div className="ep-field" style={{ flex: '2 1 220px', margin: 0 }}>
            <label>Rendez-vous</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex : Consultation Mr Dupont" autoFocus onKeyDown={(e) => { if (e.key === 'Enter') add() }} />
          </div>
          <div className="ep-field" style={{ flex: '0 1 120px', margin: 0 }}>
            <label>Heure <span style={{ color: 'var(--ink-500)', fontWeight: 400 }}>(option.)</span></label>
            <input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
          </div>
          <button className="btn btn-gold" style={{ flex: '0 0 auto' }} onClick={add} disabled={busy}><Icons.plus size={15} /> {busy ? 'Ajout…' : 'Ajouter'}</button>
        </div>
        {error && <div style={{ color: 'var(--crit)', fontSize: 13, marginTop: 10 }}>{error}</div>}
      </div>
    </Modal>
  )
}
