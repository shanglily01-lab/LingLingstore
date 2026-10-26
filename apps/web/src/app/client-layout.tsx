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

  return (
    <AuthProvider>
      <Navbar />
      {!isAdmin && <RegionHintBanner />}
      <main className={isAdmin ? 'min-h-[calc(100vh-3.5rem)] pt-14 md:min-h-[calc(100vh-5rem)] md:pt-20' : 'min-h-screen pt-14 md:pt-20'}>
        {children}
      </main>
      {!isAdmin && <Footer />}
      <Toaster position="top-center" />
    </AuthProvider>
  )
}
