'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Menu, Search, ShoppingCart, UserCircle, X } from 'lucide-react'
import { clsx } from 'clsx'
import { useAuth } from '@/lib/auth-context'
import { BRAND_NAME } from '@/lib/brand'
import { btnPrimary } from '@/components/ui/stitch'

const NAV = [
  { href: '/products', label: '商品' },
  { href: '/cart', label: '购物车' },
  { href: '/orders', label: '订单' },
]

export function Navbar() {
  const { user, loading, logout } = useAuth()
  const pathname = usePathname()
  const router = useRouter()
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [searchQ, setSearchQ] = useState('')
  const isAuth = pathname === '/login' || pathname === '/register'

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    onScroll()
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  return (
    <header
      className={clsx(
        'fixed top-0 z-50 w-full border-b border-outline-variant/10 glass-header transition-shadow',
        scrolled && 'editorial-shadow',
      )}
    >
      <div
        className={clsx(
          'mx-auto flex h-14 max-w-container-max items-center px-margin-mobile md:h-20 md:px-margin-desktop',
          isAuth ? 'justify-center' : 'justify-between',
        )}
      >
        {isAuth ? (
          <Link href="/" className="text-xl font-bold tracking-tight text-on-surface">
            {BRAND_NAME}
          </Link>
        ) : (
          <>
            <div className="flex items-center gap-4 md:gap-12">
              <Link href="/" className="max-w-[9.5rem] truncate text-base font-bold tracking-tight text-on-surface sm:max-w-none sm:text-xl">
                {BRAND_NAME}
              </Link>
              <nav className="hidden items-center gap-6 md:flex md:gap-8">
                {NAV.map((item) => {
                  const active = pathname.startsWith(item.href)
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={clsx(
                        'text-sm transition-colors md:text-base',
                        active
                          ? 'border-b-2 border-on-surface pb-0.5 font-bold text-on-surface'
                          : 'text-on-surface-variant hover:text-on-surface',
                      )}
                    >
                      {item.label}
                    </Link>
                  )
                })}
                {user?.role === 'admin' && (
                  <Link
                    href="/admin"
                    className={clsx(
                      'text-sm transition-colors md:text-base',
                      pathname.startsWith('/admin')
                        ? 'font-bold text-secondary'
                        : 'text-on-surface-variant hover:text-on-surface',
                    )}
                  >
                    管理
                  </Link>
                )}
              </nav>
            </div>

            <div className="flex items-center gap-3 md:gap-6">
              <div className="relative hidden lg:block">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant" />
                <input
                  type="search"
                  placeholder="搜索全球好物..."
                  value={searchQ}
                  onChange={(e) => setSearchQ(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && searchQ.trim()) {
                      router.push(`/search?q=${encodeURIComponent(searchQ.trim())}`)
                    }
                  }}
                  className="w-64 rounded-lg border border-outline-variant/20 bg-surface-container-low py-2 pl-10 pr-4 text-sm outline-none focus:border-secondary focus:ring-0"
                />
              </div>

              <Link
                href="/cart"
                className="rounded-full p-2 transition-colors hover:bg-surface-container-low/80"
                aria-label="购物车"
              >
                <ShoppingCart className="h-5 w-5" />
              </Link>

              {loading ? (
                <span className="hidden text-sm text-on-surface-variant sm:inline">…</span>
              ) : user ? (
                <div className="hidden items-center gap-2 sm:flex">
                  <Link
                    href="/account"
                    className="max-w-[120px] truncate text-sm text-on-surface-variant hover:text-secondary"
                  >
                    {user.displayName || user.phone}
                  </Link>
                  <button
                    type="button"
                    onClick={logout}
                    className="rounded-lg border border-outline-variant/30 px-3 py-1.5 text-sm text-on-surface-variant transition-colors hover:bg-surface-container-low"
                  >
                    退出
                  </button>
                </div>
              ) : (
                <Link href="/login" className={clsx(btnPrimary, 'hidden px-4 py-2 sm:inline-flex')}>
                  <UserCircle className="h-4 w-4" />
                  登录
                </Link>
              )}

              <button
                type="button"
                className="rounded-lg p-2 md:hidden"
                aria-label={mobileOpen ? '关闭菜单' : '打开菜单'}
                onClick={() => setMobileOpen((o) => !o)}
              >
                {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </>
        )}
      </div>

      {mobileOpen && !isAuth && (
        <div className="border-t border-outline-variant/10 bg-white px-margin-mobile py-4 md:hidden">
          <form
            className="mb-3"
            onSubmit={(e) => {
              e.preventDefault()
              if (!searchQ.trim()) return
              router.push(`/search?q=${encodeURIComponent(searchQ.trim())}`)
            }}
          >
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant" />
              <input
                type="search"
                placeholder="搜索全球好物..."
                value={searchQ}
                onChange={(e) => setSearchQ(e.target.value)}
                className="w-full rounded-lg border border-outline-variant/20 bg-surface-container-low py-2.5 pl-10 pr-4 text-sm outline-none focus:border-secondary"
              />
            </div>
          </form>
          <nav className="flex flex-col gap-1">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  'rounded-lg px-3 py-2.5 text-sm font-medium',
                  pathname.startsWith(item.href)
                    ? 'bg-surface-container-low text-on-surface'
                    : 'text-on-surface-variant',
                )}
              >
                {item.label}
              </Link>
            ))}
            <Link href="/account" className="rounded-lg px-3 py-2.5 text-sm font-medium text-on-surface-variant">
              个人中心
            </Link>
            {user?.role === 'admin' && (
              <Link
                href="/admin"
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-on-surface-variant"
              >
                管理后台
              </Link>
            )}
            {!loading && !user && (
              <Link href="/login" className={clsx(btnPrimary, 'mt-2 justify-center py-3')}>
                登录
              </Link>
            )}
            {user && (
              <button
                type="button"
                onClick={logout}
                className="mt-2 rounded-lg border border-outline-variant/30 px-3 py-2.5 text-left text-sm text-on-surface-variant"
              >
                退出登录
              </button>
            )}
          </nav>
        </div>
      )}
    </header>
  )
}
