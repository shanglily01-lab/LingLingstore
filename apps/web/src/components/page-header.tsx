import Link from 'next/link'
import type { ReactNode } from 'react'

type Crumb = { label: string; href?: string }

type PageHeaderProps = {
  title: string
  subtitle?: string
  crumbs?: Crumb[]
  action?: ReactNode
}

export function PageHeader({ title, subtitle, crumbs, action }: PageHeaderProps) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        {crumbs && crumbs.length > 0 && (
          <nav className="mb-3 flex flex-wrap items-center gap-2 text-sm text-on-surface-variant">
            {crumbs.map((c, i) => (
              <span key={i} className="flex items-center gap-2">
                {i > 0 && <span>/</span>}
                {c.href ? (
                  <Link href={c.href} className="hover:text-secondary">
                    {c.label}
                  </Link>
                ) : (
                  <span className="text-on-surface">{c.label}</span>
                )}
              </span>
            ))}
          </nav>
        )}
        <h1 className="text-display-lg-mobile font-bold tracking-tight text-on-surface md:text-display-lg">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-2 text-body-md text-on-surface-variant">{subtitle}</p>
        )}
      </div>
      {action}
    </div>
  )
}
