'use client'

import Link from 'next/link'
import { BRAND_NAME } from '@/lib/brand'

const COLUMNS = [
  {
    title: '选购',
    links: [
      { href: '/products', label: '全部商品' },
      { href: '/search', label: '搜索' },
      { href: '/cart', label: '购物车' },
    ],
  },
  {
    title: '账户',
    links: [
      { href: '/login', label: '登录' },
      { href: '/register', label: '注册' },
      { href: '/account', label: '我的账户' },
      { href: '/orders', label: '我的订单' },
    ],
  },
  {
    title: '关于',
    links: [
      { href: '/products', label: '正品保障' },
      { href: '/products', label: '跨境配送' },
      { href: '/products', label: '售后说明' },
    ],
  },
]

export function Footer() {
  return (
    <footer className="mt-6 text-white">
      <button
        type="button"
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className="w-full bg-[#37475a] py-3 text-sm hover:bg-[#485769]"
      >
        回到顶部
      </button>
      <div className="bg-[#232f3e]">
        <div className="mx-auto grid max-w-container-max grid-cols-2 gap-6 px-4 py-8 md:grid-cols-4">
          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h3 className="text-sm font-bold">{col.title}</h3>
              <ul className="mt-3 space-y-2">
                {col.links.map((item) => (
                  <li key={item.label}>
                    <Link href={item.href} className="text-sm text-[#ddd] hover:underline">
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <div>
            <h3 className="text-sm font-bold">{BRAND_NAME}</h3>
            <p className="mt-3 text-sm leading-relaxed text-[#ddd]">全球直采，正品保障，支持法币支付与跨境配送。</p>
          </div>
        </div>
      </div>
      <div className="bg-[#131921] py-6 text-center text-xs text-[#ddd]">
        © 2026 {BRAND_NAME}. 全球直采，品质保证。
      </div>
    </footer>
  )
}
