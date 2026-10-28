'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Menu, Search, ShoppingCart, X } from 'lucide-react'
import { clsx } from 'clsx'
import { useAuth } from '@/lib/auth-context'
import { BRAND_NAME } from '@/lib/brand'
import { useSalesMarket, type SalesMarket } from '@/lib/sales-market'

const NAV = [
  { href: '/products', label: '全部商品' },
  { href: '/orders', label: '我的订单' },
  { href: '/cart', label: '购物车' },
]

export function Navbar() {
  const { user, loading, logout } = useAuth()
  const { market, setMarket } = useSalesMarket()
  const pathname = usePathname()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [searchQ, setSearchQ] = useState('')
  const isAuth = pathname === '/login' || pathname === '/register'

  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  const goSearch = () => {
    if (!searchQ.trim()) return
    router.push(`/search?q=${encodeURIComponent(searchQ.trim())}`)
  }

  const accountLabel = user?.displayName || user?.phone || '请登录'

  return (
    <header className="fixed top-0 z-50 w-full bg-[#131921] text-white">
      <div
        className={clsx(
          'mx-auto flex h-14 max-w-container-max items-center gap-3 px-3 md:h-[60px] md:gap-4 md:px-4',
          isAuth && 'justify-center',
        )}
      >
        <Link href="/" className="shrink-0 text-lg font-bold tracking-tight text-white md:text-xl">
          {BRAND_NAME}
        </Link>

        {!isAuth && (
          <>
            <form
              className="hidden min-w-0 flex-1 md:flex"
              onSubmit={(e) => {
                e.preventDefault()
                goSearch()
              }}
            >
              <input
                type="search"
                placeholder="搜索 LingLing store"
                value={searchQ}
                onChange={(e) => setSearchQ(e.target.value)}
                className="h-10 min-w-0 flex-1 rounded-l-md border-0 px-3 text-sm text-on-surface outline-none"
              />
              <button
                type="submit"
                aria-label="搜索"
                className="flex h-10 w-12 items-center justify-center rounded-r-md bg-[#febd69] text-on-surface hover:bg-[#f3a847]"
              >
                <Search className="h-5 w-5" />
              </button>
            </form>

            <Link href={user ? '/account' : '/login'} className="hidden max-w-[140px] leading-tight hover:outline hover:outline-1 hover:outline-white sm:block">
              <span className="block truncate text-[11px] text-white/80">你好，{loading ? '…' : accountLabel}</span>
              <span className="block text-sm font-bold">账户</span>
            </Link>
            <Link href="/orders" className="hidden leading-tight hover:outline hover:outline-1 hover:outline-white md:block">
              <span className="block text-[11px] text-white/80">退货</span>
              <span className="block text-sm font-bold">与订单</span>
            </Link>
            <Link href="/cart" className="flex items-end gap-1 hover:outline hover:outline-1 hover:outline-white" aria-label="购物车">
              <ShoppingCart className="h-7 w-7" />
              <span className="hidden pb-0.5 text-sm font-bold sm:inline">购物车</span>
            </Link>
            <button
              type="button"
              className="rounded p-1 md:hidden"
              aria-label={mobileOpen ? '关闭菜单' : '打开菜单'}
              onClick={() => setMobileOpen((o) => !o)}
            >
              {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </>
        )}
      </div>

      {!isAuth && (
        <form
          className="flex px-3 pb-2 md:hidden"
          onSubmit={(e) => {
            e.preventDefault()
            goSearch()
          }}
        >
          <input
            type="search"
            placeholder="搜索 LingLing store"
            value={searchQ}
            onChange={(e) => setSearchQ(e.target.value)}
            className="h-10 min-w-0 flex-1 rounded-l-md border-0 px-3 text-sm text-on-surface outline-none"
          />
          <button
            type="submit"
            aria-label="搜索"
            className="flex h-10 w-12 items-center justify-center rounded-r-md bg-[#febd69] text-on-surface"
          >
            <Search className="h-5 w-5" />
          </button>
        </form>
      )}

      {!isAuth && (
        <div className="flex gap-2 px-3 pb-2 md:hidden">
          <MarketSwitch market={market} onChange={setMarket} />
        </div>
      )}

      {!isAuth && (
        <nav className="hidden h-10 items-center gap-1 bg-[#232f3e] px-4 text-sm md:flex">
          <div className="mx-auto flex h-full w-full max-w-container-max items-center gap-1">
            <MarketSwitch market={market} onChange={setMarket} />
            <span className="mx-2 h-4 w-px bg-white/20" />
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  'rounded-sm px-2 py-1 hover:outline hover:outline-1 hover:outline-white',
                  pathname.startsWith(item.href) && 'font-bold',
                )}
              >
                {item.label}
              </Link>
            ))}
            {user?.role === 'admin' && (
              <Link href="/admin" className="rounded-sm px-2 py-1 hover:outline hover:outline-1 hover:outline-white">
                管理后台
              </Link>
            )}
            {user && (
              <button type="button" onClick={logout} className="ml-auto rounded-sm px-2 py-1 text-white/80 hover:text-white">
                退出
              </button>
            )}
          </div>
        </nav>
      )}

      {mobileOpen && !isAuth && (
        <div className="border-t border-white/10 bg-[#232f3e] px-3 py-2 md:hidden">
          <nav className="flex flex-col">
            {NAV.map((item) => (
              <Link key={item.href} href={item.href} className="rounded px-2 py-2.5 text-sm hover:bg-white/10">
                {item.label}
              </Link>
            ))}
            <Link href="/account" className="rounded px-2 py-2.5 text-sm hover:bg-white/10">
              账户
            </Link>
            {user?.role === 'admin' && (
              <Link href="/admin" className="rounded px-2 py-2.5 text-sm hover:bg-white/10">
                管理后台
              </Link>
            )}
            {!loading && !user && (
              <Link href="/login" className="rounded px-2 py-2.5 text-sm font-bold text-[#febd69]">
                你好，请登录
              </Link>
            )}
            {user && (
              <button type="button" onClick={logout} className="rounded px-2 py-2.5 text-left text-sm text-white/80">
                退出登录
              </button>
            )}
          </nav>
        </div>
      )}
    </header>
  )
}

function MarketSwitch({
  market,
  onChange,
}: {
  market: SalesMarket
  onChange: (market: SalesMarket) => void
}) {
  const options: { id: SalesMarket; label: string }[] = [
    { id: 'CN', label: '大陆销售' },
    { id: 'OVERSEAS', label: '海外销售' },
  ]
  return (
    <div className="flex gap-1">
      {options.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => onChange(item.id)}
          className={clsx(
            'rounded-sm px-2 py-1 text-xs md:text-sm',
            market === item.id ? 'bg-[#febd69] font-bold text-on-surface' : 'text-white hover:bg-white/10',
          )}
        >
          {item.label}
        </button>
      ))}
    </div>
  )
}
