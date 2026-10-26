import type { ReactNode } from 'react'
import { clsx } from 'clsx'

type PageShellProps = {
  children: ReactNode
  narrow?: boolean
  className?: string
}

export function PageShell({ children, narrow, className }: PageShellProps) {
  return (
    <div
      className={clsx(
        'mx-auto px-margin-mobile pb-12 md:px-margin-desktop md:pb-section-gap',
        narrow ? 'max-w-md' : 'max-w-container-max',
        className,
      )}
    >
      {children}
    </div>
  )
}
