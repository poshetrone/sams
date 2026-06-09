'use client'
import { useEffect, useRef, useState } from 'react'
import { Icons } from '@/components/Icons'
import Modal from '@/components/Modal'
import { setTombolaSize, assignTicket, freeTicket, setWinner, clearTombola } from '@/lib/actions/tombola'
import { useRealtime } from '@/lib/useRealtime'
import { useApp } from '@/lib/app-context'
import type { Tombola } from '@/lib/types'

const TICKET_SIZES = [50, 70, 100, 200, 500]
type Win = { num: number; who: string } | null
type Confirm = { type: 'clear' | 'redraw' | 'size'; n?: number; lost?: number } | null

export default function TombolaView({ tombola }: { tombola: Tombola }) {
  useRealtime('tombola')
  const { canEdit } = useApp()
  const editable = canEdit('tombola')
  const [size, setSizeLocal] = useState(tombola.size)
  const [tickets, setTickets] = useState<Record<string, string>>(tombola.tickets || {})
  const [winner, setWinnerLocal] = useState<Win>(tombola.winner)
  useEffect(() => {
    setSizeLocal(tombola.size)
    setTickets(tombola.tickets || {})
    setWinnerLocal(tombola.winner)
  }, [tombola])

  const [name, setName] = useState('')
  const [drawing, setDrawing] = useState(false)
  const [rolling, setRolling] = useState<Win>(null)
  const [confirm, setConfirm] = useState<Confirm>(null)
  const [toast, setToast] = useState<string | null>(null)
  const ivRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const flash = (m: string) => { setToast(m); setTimeout(() => setToast(null), 2400) }

  const taken = Object.keys(tickets).length

  const changeSize = (n: number) => {
    const kept: Record<string, string> = {}
    for (const [num, who] of Object.entries(tickets)) if (Number(num) <= n) kept[num] = who
    setSizeLocal(n)
    setTickets(kept)
    setWinnerLocal((w) => (w && w.num <= n ? w : null))
    setTombolaSize(n)
  }
  // Demande confirmation uniquement si des noms hors de la nouvelle plage seraient perdus.
  const requestSize = (n: number) => {
    const lost = Object.keys(tickets).filter((num) => Number(num) > n).length
    if (lost > 0) setConfirm({ type: 'size', n, lost })
    else changeSize(n)
  }
  const assign = (num: number) => {
    if (!name.trim()) { flash("Saisissez un nom d'abord"); return }
    setTickets((t) => ({ ...t, [num]: name.trim() }))
    assignTicket(num, name.trim())
  }
  const free = (num: number) => {
    setTickets((t) => { const c = { ...t }; delete c[num]; return c })
    setWinnerLocal((w) => (w && w.num === num ? null : w))
    freeTicket(num)
  }

  const draw = () => {
    const entries = Object.entries(tickets)
    if (entries.length === 0) { flash('Aucun ticket attribué'); return }
    setDrawing(true); setWinnerLocal(null)
    let count = 0
    const max = 22 + Math.floor(Math.random() * 10)
    ivRef.current = setInterval(() => {
      const [num, who] = entries[Math.floor(Math.random() * entries.length)]
      setRolling({ num: +num, who })
      count++
      if (count >= max) {
        if (ivRef.current) clearInterval(ivRef.current)
        const [wnum, wwho] = entries[Math.floor(Math.random() * entries.length)]
        setRolling(null); setDrawing(false)
        const w = { num: +wnum, who: wwho }
        setWinnerLocal(w)
        setWinner(w.num, w.who)
      }
    }, 80)
  }
  useEffect(() => () => { if (ivRef.current) clearInterval(ivRef.current) }, [])

  const doClear = () => { setTickets({}); setWinnerLocal(null); setConfirm(null); clearTombola(); flash('Grille vidée') }

  return (
    <div className="view-anim tombola">
      <div className="tom-top">
        <div>
          <div style={{ fontSize: 13.5, color: 'var(--ink-400)' }}>
            Grille de <b style={{ color: 'var(--gold-300)' }}>{size}</b> tickets · <b style={{ color: 'var(--ink-100)' }}>{taken}</b> attribué{taken > 1 ? 's' : ''} · partagé avec tout le service
          </div>
          {editable && (
            <div className="tom-sizes">
              {TICKET_SIZES.map((n) => (
                <div key={n} className={`tom-size ${size === n ? 'on' : ''}`} onClick={() => requestSize(n)}>{n}</div>
              ))}
            </div>
          )}
        </div>
        {editable && (
          <div className="tom-actions">
            <div className="tom-name">
              <Icons.user size={15} />
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nom à attribuer…" />
            </div>
            <button className="btn-neon-gold" onClick={draw} disabled={drawing}><Icons.medal size={16} /> Tirage au sort</button>
          </div>
        )}
      </div>

      {(winner || rolling) && (
        <div className={`tom-winner ${winner ? 'final' : 'rolling'}`}>
          <div className="tw-glow"></div>
          <div className="tw-label">{rolling ? 'Tirage en cours…' : '🎉 Gagnant'}</div>
          <div className="tw-num">#{(rolling || winner)!.num}</div>
          <div className="tw-who">{(rolling || winner)!.who}</div>
          {winner && editable && (
            <div className="tom-winactions">
              <button className="btn-neon-blue" onClick={() => setConfirm({ type: 'redraw' })}><Icons.reset size={14} /> Retirer au sort</button>
              <button className="btn-neon-gold" onClick={() => setConfirm({ type: 'clear' })}><Icons.trash size={14} /> Vider la grille</button>
            </div>
          )}
        </div>
      )}

      <div className="tom-grid-wrap">
        <div className="tom-grid">
          {Array.from({ length: size }, (_, i) => i + 1).map((num) => {
            const who = tickets[num]
            const isWin = winner && +winner.num === num
            return (
              <div
                key={num}
                className={`tom-ticket ${who ? 'taken' : ''} ${isWin ? 'win' : ''}`}
                onClick={editable ? () => { if (who) free(num); else assign(num) } : undefined}
                style={editable ? undefined : { cursor: 'default' }}
                title={editable ? (who ? `${who} — cliquer pour libérer` : 'Cliquer pour attribuer') : who || undefined}
              >
                <span className="tt-num">{num}</span>
                {who && <span className="tt-who">{who}</span>}
              </div>
            )
          })}
        </div>
      </div>

      {confirm && (
        <Modal onClose={() => setConfirm(null)} title={confirm.type === 'clear' ? 'Vider la grille' : confirm.type === 'redraw' ? 'Retirer au sort' : 'Changer la grille'} icon={<Icons.medal size={20} />}>
          <p style={{ color: 'var(--ink-200)', fontSize: 14, lineHeight: 1.6 }}>
            {confirm.type === 'clear' && 'Libérer tous les tickets et effacer le gagnant ?'}
            {confirm.type === 'redraw' && 'Relancer un tirage au sort parmi les tickets attribués ?'}
            {confirm.type === 'size' && `Réduire à une grille de ${confirm.n} tickets ? ${confirm.lost} attribution(s) au-delà du n°${confirm.n} seront perdues ; les autres sont conservées.`}
          </p>
          <div style={{ display: 'flex', gap: 10, marginTop: 22 }}>
            <button className="btn btn-ghost" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setConfirm(null)}>Annuler</button>
            <button className="btn btn-gold" style={{ flex: 1, justifyContent: 'center' }} onClick={() => {
              if (confirm.type === 'clear') doClear()
              else if (confirm.type === 'redraw') { setConfirm(null); draw() }
              else { changeSize(confirm.n!); setConfirm(null) }
            }}>Confirmer</button>
          </div>
        </Modal>
      )}

      {toast && <div className="tom-toast">{toast}</div>}
    </div>
  )
}
