'use client'

import type { ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import { AuthProvider } from '@/lib/auth-context'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { RegionHintBanner } from '@/components/region-hint-banner'
import { Toaster } from 'react-hot-toast'

export function ClientLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const isAdmin = pathname.startsWith('/admin')
  const compactHeader = pathname === '/login' || pathname === '/register'

  return (
    <AuthProvider>
      <Navbar />
      {!isAdmin && <RegionHintBanner />}
      <main
        className={
          compactHeader
            ? 'min-h-screen pt-14'
            : 'min-h-screen pt-[104px] md:pt-[100px]'
        }
      >
        {children}
      </main>
      {!isAdmin && <Footer />}
      <Toaster position="top-center" />
    </AuthProvider>
  )
}
