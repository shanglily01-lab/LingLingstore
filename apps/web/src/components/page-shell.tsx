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
        'mx-auto px-margin-mobile pb-section-gap md:px-margin-desktop',
        narrow ? 'max-w-md' : 'max-w-container-max',
        className,
      )}
    >
      {children}
    </div>
  )
}
