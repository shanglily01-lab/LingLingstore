import type { ReactNode } from 'react'
import { card } from '@/components/ui/stitch'

type AuthShellProps = {
  title: string
  subtitle: string
  children: ReactNode
  footer?: ReactNode
}

/** 对齐 design-stitch/login.html：居中卡片 + 背景光晕 */
export function AuthShell({ title, subtitle, children, footer }: AuthShellProps) {
  return (
    <div className="relative flex min-h-[calc(100vh-5rem)] items-center justify-center px-margin-mobile py-12">
      <div
        className="pointer-events-none fixed right-0 top-0 -z-10 h-full w-1/2 overflow-hidden opacity-25"
        aria-hidden
      >
        <div className="absolute right-[-10%] top-1/4 h-[800px] w-[800px] rounded-full bg-gradient-to-br from-secondary-container/30 to-transparent blur-[120px]" />
      </div>

      <div className={`${card} w-full max-w-[440px] rounded-lg bg-surface-container-lowest p-8 md:p-12`}>
        <div className="space-y-2">
          <h1 className="text-display-lg-mobile font-bold tracking-tight text-on-surface md:text-display-lg">
            {title}
          </h1>
          <p className="text-body-md text-on-surface-variant">{subtitle}</p>
        </div>
        <div className="mt-8">{children}</div>
        {footer && <div className="mt-8 border-t border-outline-variant/20 pt-6">{footer}</div>}
      </div>
    </div>
  )
}
