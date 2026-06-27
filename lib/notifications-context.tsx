'use client'
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { Transmit } from '@adonisjs/transmit-client'
import { Icons } from '@/components/Icons'

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333').replace(/\/$/, '')

export interface Notif {
  id: string // = id de la fusillade
  title: string
  zone: string | null
  time: string | null
  read: boolean
}

interface NotifContext {
  notifications: Notif[]
  unread: number
  markRead: (id: string) => void
  markAllRead: () => void
}

const Ctx = createContext<NotifContext | null>(null)

export function useNotifications(): NotifContext {
  const c = useContext(Ctx)
  if (!c) throw new Error('useNotifications must be used within <NotificationsProvider>')
  return c
}

/**
 * Fusillades créées depuis CET onglet — pour ne pas se notifier soi-même
 * uniquement dans l'onglet créateur (les autres onglets, même compte, sont notifiés).
 */
export const recentOwnFusillades = new Set<string>()

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notif[]>([])
  const [toast, setToast] = useState<Notif | null>(null)
  const ctxRef = useRef<AudioContext | null>(null)

  // Son via Web Audio API (oscillateur) — pas de fichier à servir, plus fiable.
  // Le contexte audio est « débloqué » (resume) à chaque interaction utilisateur
  // (les navigateurs bloquent l'audio tant qu'aucun geste n'a eu lieu).
  useEffect(() => {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (AC) ctxRef.current = new AC()
    const unlock = () => { ctxRef.current?.resume?.().catch(() => {}) }
    window.addEventListener('pointerdown', unlock)
    window.addEventListener('keydown', unlock)
    return () => {
      window.removeEventListener('pointerdown', unlock)
      window.removeEventListener('keydown', unlock)
      ctxRef.current?.close?.().catch(() => {})
    }
  }, [])

  const playBeep = () => {
    const ctx = ctxRef.current
    if (!ctx) return
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {})
      console.log('[notif] contexte audio suspendu — clique une fois dans la page pour activer le son')
    }
    try {
      const now = ctx.currentTime
      const o = ctx.createOscillator()
      const g = ctx.createGain()
      o.connect(g)
      g.connect(ctx.destination)
      o.type = 'sine'
      o.frequency.setValueAtTime(784, now)        // bip 1
      o.frequency.setValueAtTime(1047, now + 0.12) // bip 2
      g.gain.setValueAtTime(0.0001, now)
      g.gain.exponentialRampToValueAtTime(0.45, now + 0.02)
      g.gain.exponentialRampToValueAtTime(0.0001, now + 0.24)
      o.start(now)
      o.stop(now + 0.26)
    } catch (e) {
      console.log('[notif] beep impossible :', (e as Error)?.message)
    }
  }

  // Abonnement temps réel (SSE) : nouvelle fusillade => notification (global)
  useEffect(() => {
    const transmit = new Transmit({ baseUrl: API_BASE })
    const sub = transmit.subscription('rt:fusillades')
    sub
      .create()
      .then(() => {
        sub.onMessage((data: { action?: string; fusillade?: { id: string; title: string; zone: string | null; time: string | null } }) => {
          // L'API diffuse `{ action:'insert', fusillade:{…} }` à la création.
          if (data?.action !== 'insert' || !data.fusillade) return
          const f = data.fusillade
          // Ne pas se notifier soi-même dans l'onglet créateur
          if (recentOwnFusillades.has(f.id)) {
            recentOwnFusillades.delete(f.id)
            return
          }
          const n: Notif = { id: f.id, title: f.title, zone: f.zone, time: f.time, read: false }
          setNotifications((prev) => (prev.some((x) => x.id === n.id) ? prev : [n, ...prev].slice(0, 50)))
          setToast(n)
          window.setTimeout(() => setToast((t) => (t && t.id === n.id ? null : t)), 6000)
          playBeep()
        })
      })
      .catch(() => {})
    return () => {
      sub.delete().catch(() => {})
      transmit.close()
    }
  }, [])

  const markRead = useCallback((id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
  }, [])
  const markAllRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }, [])
  const unread = notifications.filter((n) => !n.read).length

  const openToast = (n: Notif) => {
    markRead(n.id)
    setToast(null)
    router.push(`/fusillades?open=${n.id}`)
  }

  return (
    <Ctx.Provider value={{ notifications, unread, markRead, markAllRead }}>
      {children}
      {toast && (
        <div className="notif-toast" onClick={() => openToast(toast)} role="button">
          <div className="notif-toast-ico"><Icons.target size={18} /></div>
          <div className="notif-toast-body">
            <b>Nouvelle fusillade</b>
            <span>{toast.title}{toast.zone ? ` — ${toast.zone}` : ''}</span>
          </div>
          <Icons.chevR size={16} style={{ color: 'var(--gold-300)', flex: '0 0 auto' }} />
        </div>
      )}
    </Ctx.Provider>
  )
}
