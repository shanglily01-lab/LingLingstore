import type { ReactNode } from 'react'

type AdminPageHeaderProps = {
  title: string
  subtitle?: string
  action?: ReactNode
  badge?: ReactNode
}

export function AdminPageHeader({ title, subtitle, action, badge }: AdminPageHeaderProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold text-on-surface">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-on-surface-variant">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-3">
        {badge}
        {action}
      </div>
    </div>
  )
}
