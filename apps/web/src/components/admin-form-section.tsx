import type { ReactNode } from 'react'

type AdminFormSectionProps = {
  title: string
  children: ReactNode
}

export function AdminFormSection({ title, children }: AdminFormSectionProps) {
  return (
    <div className="border-t border-outline-variant/20 pt-4">
      <h3 className="mb-3 text-sm font-semibold text-on-surface">{title}</h3>
      {children}
    </div>
  )
}
