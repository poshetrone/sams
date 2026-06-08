'use client'
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Icons } from '@/components/Icons'

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
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // Prépare l'audio + déverrouille la lecture au 1er geste utilisateur
  // (les navigateurs bloquent l'autoplay tant qu'aucune interaction n'a eu lieu).
  useEffect(() => {
    const a = new Audio('/sounds/alert.wav')
    a.volume = 0.5
    audioRef.current = a
    const unlock = () => {
      a.play().then(() => { a.pause(); a.currentTime = 0 }).catch(() => {})
      window.removeEventListener('pointerdown', unlock)
      window.removeEventListener('keydown', unlock)
    }
    window.addEventListener('pointerdown', unlock)
    window.addEventListener('keydown', unlock)
    return () => {
      window.removeEventListener('pointerdown', unlock)
      window.removeEventListener('keydown', unlock)
    }
  }, [])

  // Abonnement Realtime : nouvelle fusillade => notification (global, dans le shell)
  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel('notif-fusillades')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'fusillades' }, (payload) => {
        const f = payload.new as { id: string; title: string; zone: string | null; time: string | null; author: string | null }
        console.log('[notif] INSERT fusillade reçu via Realtime :', f)
        // Ne pas se notifier soi-même dans l'onglet qui vient de créer la fusillade
        if (recentOwnFusillades.has(f.id)) {
          recentOwnFusillades.delete(f.id)
          console.log('[notif] ignorée (créée depuis cet onglet)')
          return
        }
        const n: Notif = { id: f.id, title: f.title, zone: f.zone, time: f.time, read: false }
        setNotifications((prev) => (prev.some((x) => x.id === n.id) ? prev : [n, ...prev].slice(0, 50)))
        setToast(n)
        window.setTimeout(() => setToast((t) => (t && t.id === n.id ? null : t)), 6000)
        const a = audioRef.current
        if (a) { a.currentTime = 0; a.play().catch((e) => console.log('[notif] son bloqué (autoplay) :', e?.message)) }
      })
      .subscribe((status) => {
        console.log('[notif] statut abonnement Realtime fusillades :', status)
      })
    return () => { supabase.removeChannel(channel) }
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
