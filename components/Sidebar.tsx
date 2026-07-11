'use client'
import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Icons } from './Icons'
import { NAV, GRADES, isAdminGrade, POLE_SUBPAGES } from '@/lib/constants'
import { useApp } from '@/lib/app-context'
import { logout as logoutAction } from '@/lib/actions/auth'
import { updateMyPhoto } from '@/lib/actions/profile'
import { initialsOf } from '@/lib/format'
import { compressImage } from '@/lib/image'

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { member, grade, setGrade, realGrade, access, reqCount, myPoles } = useApp()
  const [photo, setPhoto] = useState<string | null>(member.photo)

  const isActive = (route: string) =>
    pathname === route || pathname.startsWith(route + '/')

  const onPhoto = async (file?: File) => {
    if (!file) return
    const dataUrl = await compressImage(file)
    setPhoto(dataUrl) // aperçu optimiste
    const res = await updateMyPhoto(dataUrl)
    if (res.ok && res.url) {
      setPhoto(res.url)
      router.refresh()
    }
  }

  const logout = async () => {
    await logoutAction()
    router.push('/login')
    router.refresh()
  }

  return (
    <aside className="sidebar">
      <div className="brand">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/assets/sams-logo.png" alt="SAMS" />
        <div className="wm">
          <h1>S.A.M.S</h1>
          <span>Emergency Medical Service</span>
        </div>
      </div>

      <nav className="nav">
        {NAV.map((grp) => {
          const items = grp.items.filter((it) => access(it.key) !== 'none')
          if (items.length === 0) return null
          return (
          <div key={grp.group}>
            <div className="nav-group-label">{grp.group}</div>
            {items
              .map((it) => {
                const I = Icons[it.icon]
                const count = it.badge === 'reqCount' ? reqCount : 0
                return (
                  <Link
                    key={it.key}
                    href={it.route}
                    className={`nav-item ${isActive(it.route) ? 'active' : ''}`}
                  >
                    <span className="ico">{I ? <I size={18} /> : null}</span>
                    {it.label}
                    {count > 0 && <span className="badge-count">{count}</span>}
                  </Link>
                )
              })}
          </div>
          )
        })}

        {/* Une section par pôle du membre (masquée s'il n'en a aucun).
            Chaque section = un en-tête (nom du pôle) + ses sous-pages. */}
        {myPoles.map((p) => {
          const PIcon = Icons[p.icon] || Icons.medal
          return (
            <div key={p.key}>
              <div className="nav-group-label" style={{ display: 'flex', alignItems: 'center', gap: 6, color: p.color }} title={p.label}>
                <PIcon size={13} /> {p.label}
              </div>
              {POLE_SUBPAGES.map((sub) => {
                const route = `/poles/${p.key}${sub.key ? `/${sub.key}` : ''}`
                const I = Icons[sub.icon] || Icons.doc
                return (
                  <Link key={sub.key || 'equipe'} href={route} className={`nav-item ${pathname === route ? 'active' : ''}`}>
                    <span className="ico">{I ? <I size={18} /> : null}</span>
                    {sub.label}
                  </Link>
                )
              })}
            </div>
          )
        })}
      </nav>

      <div className="sidebar-foot">
        <label className="sf-avatar" title="Changer ma photo de profil">
          {photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photo} alt="" />
          ) : (
            <span>{initialsOf(member.name)}</span>
          )}
          <span className="sf-avatar-edit">
            <Icons.camera size={12} />
          </span>
          <input
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={(e) => onPhoto(e.target.files?.[0])}
          />
        </label>
        <div className="who">
          <b>{member.name}</b>
          {isAdminGrade(realGrade) ? (
            <select
              className="role-select"
              value={grade}
              onChange={(e) => setGrade(e.target.value)}
              title="Vu en tant que (permissions)"
            >
              {Object.entries(GRADES)
                .sort((a, b) => b[1].rank - a[1].rank)
                .map(([k, g]) => (
                  <option key={k} value={k}>
                    {g.label}
                  </option>
                ))}
            </select>
          ) : (
            <span style={{ color: GRADES[realGrade as keyof typeof GRADES]?.color, fontSize: 11, fontWeight: 600 }}>
              {GRADES[realGrade as keyof typeof GRADES]?.label || realGrade}
            </span>
          )}
        </div>
        <div className="icon-btn" style={{ width: 34, height: 34 }} title="Déconnexion" onClick={logout}>
          <Icons.logout size={16} />
        </div>
      </div>
    </aside>
  )
}
