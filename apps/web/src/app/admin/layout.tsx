import type { ReactNode } from 'react'
import { AdminSidebar } from './sidebar'
import { AdminMobileNav } from '@/components/admin-mobile-nav'

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-[calc(100vh-5rem)] flex-col bg-surface-container-low lg:flex-row">
      <AdminSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <AdminMobileNav />
        <div className="flex-1 p-4 sm:p-6 lg:p-8">{children}</div>
      </div>
    </div>
  )
}
