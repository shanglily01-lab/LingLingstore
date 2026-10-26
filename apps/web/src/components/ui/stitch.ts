/** Stitch 设计 token — 与 design-stitch/home.html 一致 */
export const label = 'block text-sm font-medium text-on-surface'
export const input =
  'mt-1 block w-full rounded-lg border border-outline-variant/30 bg-surface-container-low px-4 py-2.5 text-body-md text-on-surface outline-none transition-colors placeholder:text-on-surface-variant/40 focus:border-secondary focus:ring-0'
export const inputLg =
  'mt-1 block h-14 w-full rounded-lg border border-outline-variant/30 bg-surface-container-low pl-4 pr-4 text-body-md text-on-surface outline-none transition-colors placeholder:text-on-surface-variant/40 focus:border-secondary focus:ring-0'
export const select =
  'rounded-lg border border-outline-variant/30 bg-white px-3 py-2.5 text-sm text-on-surface outline-none focus:border-secondary focus:ring-1 focus:ring-secondary'
export const textarea =
  'mt-1 block w-full rounded-lg border border-outline-variant/30 bg-white px-4 py-2.5 text-sm text-on-surface outline-none focus:border-secondary focus:ring-1 focus:ring-secondary'

export const btnPrimary =
  'inline-flex items-center justify-center gap-2 rounded-full border border-[#fcd200] bg-cart px-6 py-2.5 text-label-sm font-medium text-on-surface shadow-sm transition-colors hover:bg-[#f7ca00] active:bg-[#f0c14b] disabled:opacity-50'
export const btnPrimaryLg =
  'inline-flex h-12 w-full items-center justify-center gap-2 rounded-full border border-[#fcd200] bg-cart text-label-sm font-medium text-on-surface shadow-sm transition-colors hover:bg-[#f7ca00] active:bg-[#f0c14b] disabled:opacity-50'
export const btnSecondary =
  'inline-flex items-center justify-center gap-2 rounded-full border border-[#d5d9d9] bg-white px-6 py-2.5 text-sm font-medium text-on-surface shadow-sm transition-colors hover:bg-surface-container-low disabled:opacity-50'
export const btnGhost =
  'inline-flex items-center justify-center gap-2 rounded-lg border border-outline-variant/30 px-4 py-2 text-sm font-medium text-on-surface-variant transition-colors hover:bg-surface-container-low disabled:opacity-50'
export const btnDanger =
  'inline-flex items-center justify-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium text-error transition-colors hover:bg-red-50'

export const card = 'border border-outline-variant/20 bg-white editorial-shadow'
export const cardFlat = 'border border-outline-variant/20 bg-white'
export const panel = 'border border-outline-variant/20 bg-surface-container-low p-4'

export const link = 'text-secondary hover:text-secondary-container hover:underline'
export const price = 'font-bold text-error'

export const tableHead =
  'border-b border-outline-variant/20 bg-surface-container-low text-left text-xs font-semibold uppercase tracking-wider text-on-surface-variant'
export const tableRow = 'transition-colors hover:bg-surface-container-low/50'

export const badge = (active: boolean) =>
  active
    ? 'inline-flex rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-800'
    : 'inline-flex rounded-full bg-surface-container px-2.5 py-0.5 text-xs font-medium text-on-surface-variant'

export const ORDER_STATUS_BADGE: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-800',
  paid: 'bg-surface-container-high text-secondary',
  shipped: 'bg-indigo-50 text-indigo-800',
  completed: 'bg-green-50 text-green-800',
  cancelled: 'bg-surface-container text-on-surface-variant',
  expired: 'bg-red-50 text-error',
  refund_pending: 'bg-orange-50 text-orange-800',
  refunded: 'bg-purple-50 text-purple-800',
}
