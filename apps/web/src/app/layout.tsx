import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { Inter } from 'next/font/google'
import './globals.css'
import { ClientLayout } from './client-layout'
import { BRAND_NAME } from '@/lib/brand'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: `${BRAND_NAME} - 跨境精选商城`,
  description: `${BRAND_NAME}，链接全球精品的跨境商城`,
}

export default function RootLayout({ children }: { children: ReactNode }): JSX.Element {
  return (
    <html lang="zh-CN" className={inter.variable}>
      <body className="min-h-screen font-sans">
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  )
}
