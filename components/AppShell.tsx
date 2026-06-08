'use client'
import { AppProvider, type CurrentMember } from '@/lib/app-context'
import Sidebar from './Sidebar'
import TopBar from './TopBar'

export default function AppShell({
  member,
  reqCount,
  children,
}: {
  member: CurrentMember
  reqCount: number
  children: React.ReactNode
}) {
  return (
    <AppProvider member={member} reqCount={reqCount}>
      <div className="app">
        <Sidebar />
        <div className="main">
          <TopBar />
          <div className="content">
            <div className="content-inner">{children}</div>
          </div>
        </div>
      </div>
    </AppProvider>
  )
}
