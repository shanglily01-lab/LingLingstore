import Link from 'next/link'
import { Globe, Mail } from 'lucide-react'
import { BRAND_NAME } from '@/lib/brand'

export function Footer() {
  return (
    <footer className="w-full border-t border-outline-variant/20 bg-surface py-12">
      <div className="mx-auto flex max-w-container-max flex-col items-center justify-between gap-8 px-margin-mobile md:flex-row md:px-margin-desktop">
        <div className="flex flex-col items-center gap-2 md:items-start">
          <span className="text-xl font-bold text-on-surface">{BRAND_NAME}</span>
          <p className="text-sm text-on-surface-variant">© 2026 {BRAND_NAME}. 全球直采，品质保证。</p>
        </div>
        <div className="flex flex-wrap justify-center gap-6 text-sm text-on-surface-variant">
          <Link href="/products" className="transition-colors hover:text-secondary">
            商品
          </Link>
          <Link href="/orders" className="transition-colors hover:text-secondary">
            订单
          </Link>
          <Link href="/cart" className="transition-colors hover:text-secondary">
            购物车
          </Link>
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            aria-label="语言"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-outline-variant/30 transition-colors hover:bg-surface-container-low"
          >
            <Globe className="h-5 w-5 text-on-surface-variant" />
          </button>
          <button
            type="button"
            aria-label="联系"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-outline-variant/30 transition-colors hover:bg-surface-container-low"
          >
            <Mail className="h-5 w-5 text-on-surface-variant" />
          </button>
        </div>
      </div>
    </footer>
  )
}
