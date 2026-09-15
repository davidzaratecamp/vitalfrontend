import { Outlet, useLocation } from 'react-router-dom'
import { TopNav } from './TopNav'
import type { NavItem } from './Sidebar'
import { ErrorBoundary } from '@/components/common/ErrorBoundary'

export function Shell({ items, roleLabel }: { items: NavItem[]; roleLabel: string }) {
  const location = useLocation()

  return (
    <div className="flex min-h-screen flex-col">
      <TopNav items={items} roleLabel={roleLabel} />
      <main className="flex-1 p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-[1400px]">
          <ErrorBoundary key={location.pathname}>
            <Outlet />
          </ErrorBoundary>
        </div>
      </main>
    </div>
  )
}
