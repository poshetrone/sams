'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Icons } from '@/components/Icons'
import { Card } from '@/components/ui'
import Modal from '@/components/Modal'
import { MONTHS_FR, WEEKDAYS_FR } from '@/lib/constants'
import { addCalendarEvent, deleteCalendarEvent } from '@/lib/actions/calendar'
import { useRealtime } from '@/lib/useRealtime'
import type { CalendarEvent } from '@/lib/types'

const YEAR = 2026
const pad = (n: number) => String(n).padStart(2, '0')
const keyOf = (m: number, d: number) => `${YEAR}-${pad(m + 1)}-${pad(d)}`
const todayKey = () => {
  const d = new Date()
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export default function CalendrierView({ events }: { events: CalendarEvent[] }) {
  const router = useRouter()
  useRealtime('calendar_events')
  const [month, setMonth] = useState(5)
  const [open, setOpen] = useState<number | null>(null)

  const byDay = new Map<string, CalendarEvent[]>()
  for (const e of events) {
    const arr = byDay.get(e.day) || []
    arr.push(e)
    byDay.set(e.day, arr)
  }

  const first = new Date(YEAR, month, 1).getDay()
  const lead = (first + 6) % 7
  const nbDays = new Date(YEAR, month + 1, 0).getDate()
  const cells: (number | null)[] = []
  for (let i = 0; i < lead; i++) cells.push(null)
  for (let d = 1; d <= nbDays; d++) cells.push(d)

  const TODAY = todayKey()
  const monthPrefix = `${YEAR}-${pad(month + 1)}`
  const monthCount = events.filter((e) => e.day.startsWith(monthPrefix)).length

  return (
    <div className="view-anim">
      <div className="cal-toolbar">
        <div className="cal-nav">
          <div className="icon-btn" onClick={() => setMonth((m) => (m + 11) % 12)}><Icons.arrowL size={16} /></div>
          <h2>{MONTHS_FR[month]} <span>{YEAR}</span></h2>
          <div className="icon-btn" onClick={() => setMonth((m) => (m + 1) % 12)} style={{ transform: 'scaleX(-1)' }}><Icons.arrowL size={16} /></div>
          <button className="btn btn-ghost" style={{ marginLeft: 8 }} onClick={() => setMonth(5)}>Aujourd&apos;hui</button>
        </div>
        <div style={{ marginLeft: 'auto', fontSize: 13, color: 'var(--ink-400)' }}><b style={{ color: 'var(--gold-300)' }}>{monthCount}</b> note(s) ce mois · partagé avec tout le service</div>
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
            const mKey = keyOf(month, d)
            const evts = byDay.get(mKey) || []
            const isToday = mKey === TODAY
            return (
              <div key={mKey} className={`cal-cell ${isToday ? 'today' : ''}`} onClick={() => setOpen(d)}>
                <div className="cal-daynum">{d}{isToday && <span className="cal-today-dot"></span>}</div>
                <div className="cal-evts">
                  {evts.slice(0, 3).map((ev) => <div key={ev.id} className={`cal-evt ${ev.color}`}>{ev.text}</div>)}
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
          mKey={keyOf(month, open)}
          month={month}
          day={open}
          events={byDay.get(keyOf(month, open)) || []}
          onClose={() => setOpen(null)}
          onChanged={() => router.refresh()}
        />
      )}
    </div>
  )
}

function DayModal({ mKey, month, day, events, onClose, onChanged }: { mKey: string; month: number; day: number; events: CalendarEvent[]; onClose: () => void; onChanged: () => void }) {
  const [text, setText] = useState('')
  const [color, setColor] = useState<'gold' | 'blue'>('gold')
  const [busy, setBusy] = useState(false)

  const add = async () => {
    if (!text.trim()) return
    setBusy(true)
    const res = await addCalendarEvent(mKey, text, color)
    setBusy(false)
    if (res.ok) { setText(''); onChanged() }
  }
  const del = async (id: string) => {
    setBusy(true)
    await deleteCalendarEvent(id)
    setBusy(false)
    onChanged()
  }

  return (
    <Modal onClose={onClose} title={`${day} ${MONTHS_FR[month]} ${YEAR}`} icon={<Icons.calendar size={20} />}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 18 }}>
        {events.length === 0 && <p style={{ color: 'var(--ink-500)', fontSize: 13.5, padding: '6px 0' }}>Aucune note ce jour. Ajoutez-en une ci-dessous.</p>}
        {events.map((ev) => (
          <div key={ev.id} className={`cal-evt-row ${ev.color}`}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13.5, color: 'var(--ink-100)' }}>{ev.text}</div>
              <div style={{ fontSize: 11.5, color: 'var(--ink-500)', marginTop: 2 }}>par {ev.author}</div>
            </div>
            <div className="icon-btn" style={{ width: 30, height: 30 }} title="Supprimer" onClick={() => del(ev.id)}><Icons.trash size={14} /></div>
          </div>
        ))}
      </div>
      <div className="editor-panel">
        <div className="ep-field"><label>Nouvelle note (visible par tout le service)</label>
          <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Ex : Réunion, garde, formation…" autoFocus onKeyDown={(e) => { if (e.key === 'Enter') add() }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div className="chips">
            <div className={`chip ${color === 'gold' ? 'on' : ''}`} onClick={() => setColor('gold')} style={color === 'gold' ? { color: 'var(--gold-300)', borderColor: 'var(--gold-glow)' } : undefined}>Doré</div>
            <div className={`chip ${color === 'blue' ? 'on' : ''}`} onClick={() => setColor('blue')} style={color === 'blue' ? { color: '#7fb8e0', borderColor: 'rgba(90,160,214,0.5)' } : undefined}>Bleu</div>
          </div>
          <button className="btn btn-gold" style={{ marginLeft: 'auto' }} onClick={add} disabled={busy}><Icons.plus size={15} /> Ajouter</button>
        </div>
      </div>
    </Modal>
  )
}
