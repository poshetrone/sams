'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Icons } from '@/components/Icons'
import { Card, GradePill, SecTitle } from '@/components/ui'
import Modal from '@/components/Modal'
import { initialsOf, parisDate, parisHM } from '@/lib/format'
import { useApp } from '@/lib/app-context'
import { startShift, endShift, updateTime, deleteTime } from '@/lib/actions/timeclock'
import type { Timeclock } from '@/lib/types'

const pad2 = (n: number) => String(n).padStart(2, '0')
const fmtDur = (min: number) => {
  const h = Math.floor(min / 60)
  const m = min % 60
  return h > 0 ? `${h}h${pad2(m)}` : `${m} min`
}
const diffMin = (start: string, end: string) => {
  const [sh, sm] = start.split(':').map(Number)
  const [eh, em] = end.split(':').map(Number)
  let d = eh * 60 + em - (sh * 60 + sm)
  if (d < 0) d += 1440
  return d
}

/* Affichage TOUJOURS en heure de Paris, depuis l'instant UTC (start_at/end_at),
   avec repli sur les champs texte des lignes antérieures à la migration. */
const isOpen = (t: Timeclock) => !(t.end_at || t.end)
const startHM = (t: Timeclock) => (t.start_at ? parisHM(t.start_at) : t.start || '—')
const endHM = (t: Timeclock) => (t.end_at ? parisHM(t.end_at) : t.end)
const dayOf = (t: Timeclock) => (t.start_at ? parisDate(t.start_at) : t.date || '')

export default function PointeuseView({ timeclock }: { timeclock: Timeclock[] }) {
  const router = useRouter()
  const { member, isAdmin: isAdminGrade, canEdit } = useApp()
  const editable = canEdit('pointeuse')
  const isAdmin = isAdminGrade && editable
  const [, setTick] = useState(0)
  const [editRow, setEditRow] = useState<Timeclock | null>(null)
  const [busy, setBusy] = useState(false)
  useEffect(() => {
    const iv = setInterval(() => setTick((t) => t + 1), 30000)
    return () => clearInterval(iv)
  }, [])

  const myOpen = timeclock.find((t) => t.member_id === member.id && isOpen(t))
  const liveMin = myOpen
    ? (myOpen.start_at
        ? Math.max(0, Math.round((Date.now() - new Date(myOpen.start_at).getTime()) / 60000))
        : diffMin(myOpen.start || '00:00', parisHM(Date.now())))
    : 0

  const sorted = [...timeclock].sort((a, b) => (isOpen(b) ? 1 : 0) - (isOpen(a) ? 1 : 0))
  const onDuty = timeclock.filter((t) => isOpen(t))
  const today = parisDate(Date.now())
  const totalToday = timeclock.filter((t) => dayOf(t) === today && !isOpen(t)).reduce((s, t) => s + t.minutes, 0)

  const start = async () => { setBusy(true); await startShift(); setBusy(false); router.refresh() }
  const end = async () => { if (!myOpen) return; setBusy(true); await endShift(myOpen.id); setBusy(false); router.refresh() }
  const del = async (id: string) => { setBusy(true); await deleteTime(id); setBusy(false); router.refresh() }

  return (
    <div className="view-anim">
      <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(3,1fr)', marginBottom: 24 }}>
        <div className={`pt-clockcard ${myOpen ? 'on' : ''}`}>
          <div className="ptc-left">
            <div className="ptc-av">{initialsOf(member.name)}</div>
            <div>
              <div className="ptc-name">{member.name}</div>
              <div className="ptc-state">
                {myOpen ? <span className="ptc-live"><span className="ptc-dot"></span> En service depuis {startHM(myOpen)} · {fmtDur(liveMin)}</span> : 'Hors service'}
              </div>
            </div>
          </div>
          {editable && (myOpen ? (
            <button className="btn-refuse pt-btn" onClick={end} disabled={busy}><Icons.pause size={16} /> Arrêter le service</button>
          ) : (
            <button className="btn-neon-gold pt-btn" onClick={start} disabled={busy}><Icons.pulse size={16} /> Prendre le service</button>
          ))}
        </div>
        <Card className="kpi"><div className="kpi-ico"><Icons.pulse size={20} /></div><div className="label">En service maintenant</div><div className="val">{onDuty.length}</div></Card>
        <Card className="kpi"><div className="kpi-ico"><Icons.clock size={20} /></div><div className="label">Heures cumulées aujourd&apos;hui</div><div className="val" style={{ fontSize: 32 }}>{fmtDur(totalToday)}</div></Card>
      </div>

      <SecTitle>Historique des services</SecTitle>
      <Card style={{ overflowX: 'auto' }}>
        <table className="tbl" style={{ minWidth: 760 }}>
          <thead>
            <tr><th>Employé</th><th>Grade</th><th>Jour</th><th>Début</th><th>Fin</th><th>Durée</th>{isAdmin && <th style={{ textAlign: 'right' }}>Actions</th>}</tr>
          </thead>
          <tbody>
            {sorted.map((t) => (
              <tr key={t.id}>
                <td><div className="person"><div className="av-sm">{initialsOf(t.name || '')}</div><div className="pn"><b>{t.name}</b></div></div></td>
                <td><GradePill grade={t.grade || 'ambulancier'} /></td>
                <td style={{ color: 'var(--ink-300)' }}>{dayOf(t)}</td>
                <td>{startHM(t)}</td>
                <td>{endHM(t) || <span className="badge ok" style={{ padding: '2px 8px' }}><span className="b-dot"></span> en cours</span>}</td>
                <td style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 600, color: isOpen(t) ? 'var(--ink-500)' : 'var(--gold-300)' }}>{isOpen(t) ? '—' : fmtDur(t.minutes)}</td>
                {isAdmin && (
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: 6 }}>
                      <div className="icon-btn" style={{ width: 32, height: 32 }} title="Modifier les horaires" onClick={() => setEditRow(t)}><Icons.edit size={14} /></div>
                      <div className="icon-btn" style={{ width: 32, height: 32 }} title="Supprimer la ligne" onClick={() => del(t.id)}><Icons.trash size={14} /></div>
                    </div>
                  </td>
                )}
              </tr>
            ))}
            {sorted.length === 0 && <tr><td colSpan={isAdmin ? 7 : 6} style={{ textAlign: 'center', color: 'var(--ink-500)', padding: 40 }}>Aucun service enregistré.</td></tr>}
          </tbody>
        </table>
      </Card>

      {editRow && <EditTimeModal row={editRow} onClose={() => setEditRow(null)} onSaved={() => { setEditRow(null); router.refresh() }} />}
    </div>
  )
}

function EditTimeModal({ row, onClose, onSaved }: { row: Timeclock; onClose: () => void; onSaved: () => void }) {
  const [start, setStart] = useState(row.start_at ? parisHM(row.start_at) : row.start || '')
  const [end, setEnd] = useState(row.end_at ? parisHM(row.end_at) : row.end || '')
  const [busy, setBusy] = useState(false)
  const preview = start && end ? fmtDur(diffMin(start, end)) : '—'
  const save = async () => {
    if (!start) return
    setBusy(true)
    await updateTime(row.id, start, end || null)
    setBusy(false)
    onSaved()
  }
  return (
    <Modal onClose={onClose} title="Modifier les horaires" icon={<Icons.clock size={20} />}>
      <div className="editor-panel">
        <div style={{ fontSize: 13, color: 'var(--ink-300)', marginBottom: 14 }}>{row.name} · {dayOf(row)} · heure de Paris</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <div className="ep-field"><label>Début</label><input type="time" value={start} onChange={(e) => setStart(e.target.value)} /></div>
          <div className="ep-field"><label>Fin <span style={{ color: 'var(--ink-500)', fontWeight: 400 }}>(vide = en cours)</span></label><input type="time" value={end} onChange={(e) => setEnd(e.target.value)} /></div>
        </div>
        <div style={{ fontSize: 13, color: 'var(--ink-400)', margin: '4px 0 16px' }}>Durée calculée : <b style={{ color: 'var(--gold-300)' }}>{preview}</b></div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-ghost" style={{ flex: 1, justifyContent: 'center' }} onClick={onClose} disabled={busy}>Annuler</button>
          <button className="btn btn-gold" style={{ flex: 1, justifyContent: 'center' }} onClick={save} disabled={busy}><Icons.check size={15} /> Enregistrer</button>
        </div>
      </div>
    </Modal>
  )
}
