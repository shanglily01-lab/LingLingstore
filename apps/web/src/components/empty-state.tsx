import Link from 'next/link'
import type { ReactNode } from 'react'
import { card } from '@/components/ui/stitch'
import { clsx } from 'clsx'

type EmptyStateProps = {
  message: string
  action?: { href: string; label: string }
  children?: ReactNode
  className?: string
}

export function EmptyState({ message, action, children, className }: EmptyStateProps) {
  return (
    <div className={clsx(card, 'p-16 text-center', className)}>
      <p className="text-on-surface-variant">{message}</p>
      {action && (
        <Link href={action.href} className="mt-4 inline-block text-secondary hover:underline">
          {action.label}
        </Link>
      )}
      {children}
    </div>
  )
}
