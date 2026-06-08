'use client'
import { usePathname } from 'next/navigation'
import { Icons } from './Icons'
import { NAV, PAGE_META } from '@/lib/constants'
import { useApp } from '@/lib/app-context'

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
  const { search, setSearch, reqCount } = useApp()
  const key = activeKey(pathname)
  const meta = PAGE_META[key] || PAGE_META.dashboard

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
      <div className="icon-btn" title="Notifications" style={{ marginLeft: key === 'patients' ? 0 : 'auto' }}>
        <Icons.bell size={18} />
        {reqCount > 0 && <span className="dot"></span>}
      </div>
    </header>
  )
}
