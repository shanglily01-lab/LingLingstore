/**
 * 用户区域类型. 决定了支付通道、商品 listing、物流方式的可见范围.
 * - CN: 中国大陆用户
 * - OVERSEAS: 中国大陆以外的所有区域
 */
export type Region = 'CN' | 'OVERSEAS'

export const REGIONS = ['CN', 'OVERSEAS'] as const satisfies readonly Region[]

export function isRegion(value: unknown): value is Region {
  return value === 'CN' || value === 'OVERSEAS'
}
