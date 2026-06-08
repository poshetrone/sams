'use client'
import { useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Icons } from './Icons'
import { NAV, PAGE_META } from '@/lib/constants'
import { useApp } from '@/lib/app-context'
import { useNotifications } from '@/lib/notifications-context'

/** Retrouve la clé NAV active à partir du pathname (gère /patients/[id]). */
function activeKey(pathname: string): string {
  let best = 'dashboard'
  let bestLen = -1
  for (const grp of NAV) {
    for (const it of grp.items) {
      if ((pathname === it.route || pathname.startsWith(it.route + '/')) && it.route.length > bestLen) {
        best = it.key
        bestLen = it.route.length
      }
    }
  }
  return best
}

export default function TopBar() {
  const pathname = usePathname()
  const router = useRouter()
  const { search, setSearch } = useApp()
  const { notifications, unread, markRead, markAllRead } = useNotifications()
  const [open, setOpen] = useState(false)
  const key = activeKey(pathname)
  const meta = PAGE_META[key] || PAGE_META.dashboard

  const openNotif = (id: string) => {
    markRead(id)
    setOpen(false)
    router.push(`/fusillades?open=${id}`)
  }

  return (
    <header className="topbar">
      <div className="pagetitle">
        <h2>{meta.title}</h2>
        <p>{meta.sub}</p>
      </div>
      {key === 'patients' && (
        <div className="search">
          <Icons.search size={17} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un patient…"
          />
        </div>
      )}

      <div className="notif-wrap" style={{ marginLeft: key === 'patients' ? 0 : 'auto' }}>
        <div className="icon-btn" title="Notifications" onClick={() => setOpen((o) => !o)} style={{ position: 'relative' }}>
          <Icons.bell size={18} />
          {unread > 0 && <span className="notif-badge">{unread > 9 ? '9+' : unread}</span>}
        </div>

        {open && (
          <>
            {/* fermeture au clic en dehors */}
            <div style={{ position: 'fixed', inset: 0, zIndex: 55 }} onClick={() => setOpen(false)} />
            <div className="notif-panel">
              <div className="notif-panel-head">
                <Icons.bell size={15} style={{ color: 'var(--gold-400)' }} /> Notifications
                {notifications.length > 0 && <span className="notif-clear" onClick={() => markAllRead()}>Tout marquer lu</span>}
              </div>
              {notifications.length === 0 ? (
                <div className="notif-empty">Aucune notification.</div>
              ) : (
                notifications.map((n) => (
                  <div key={n.id} className={`notif-item ${n.read ? '' : 'unread'}`} onClick={() => openNotif(n.id)}>
                    <div className="ni-ico"><Icons.target size={16} /></div>
                    <div className="ni-b">
                      <b>{n.title}</b>
                      <span>Fusillade{n.zone ? ` — ${n.zone}` : ''}{n.time ? ` · ${n.time}` : ''}</span>
                    </div>
                    {!n.read && <span className="ni-dot" />}
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>
    </header>
  )
}
