'use client'
import { AppProvider, type CurrentMember } from '@/lib/app-context'
import { NotificationsProvider } from '@/lib/notifications-context'
import type { PermMap } from '@/lib/permissions'
import type { PoleRow, MutuelleRow } from '@/lib/types'
import Sidebar from './Sidebar'
import TopBar from './TopBar'

export default function AppShell({
  member,
  reqCount,
  perms,
  poles,
  mutuelles,
  children,
}: {
  member: CurrentMember
  reqCount: number
  perms: PermMap
  poles: PoleRow[]
  mutuelles: MutuelleRow[]
  children: React.ReactNode
}) {
  return (
    <AppProvider member={member} reqCount={reqCount} perms={perms} poles={poles} mutuelles={mutuelles}>
      <NotificationsProvider>
        <div className="app">
          <Sidebar />
          <div className="main">
            <TopBar />
            <div className="content">
              <div className="content-inner">{children}</div>
            </div>
          </div>
        </div>
      </NotificationsProvider>
    </AppProvider>
  )
}
