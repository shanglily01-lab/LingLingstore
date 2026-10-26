/** Brazil playing cards import cost model — NCM 9504.40.00 */

export interface TradeCostTaxRates {
  /** Imposto de Importação */
  ii: number
  ipi: number
  pis: number
  cofins: number
  /** State VAT e.g. São Paulo 0.18 */
  icms: number
  /** AFRMM as fraction of ocean freight */
  afrmmOnFreight: number
}

/** Default rates for NCM 9504.40.00 (playing cards) — verify with customs broker */
export const TRADE_COST_DEFAULT_TAX_RATES: TradeCostTaxRates = {
  ii: 0.18,
  ipi: 0.10,
  pis: 0.021,
  cofins: 0.0965,
  icms: 0.18,
  afrmmOnFreight: 0.08,
}

export interface TradeCostLogisticsFees {
  cnExportCustoms: number
  cnTrucking: number
  cnCertificates: number
  brPortHandling: number
  brTruckToWarehouse: number
  whReceiving: number
  whLabeling: number
  whStorageFirstMonth: number
  customsBrokerFee: number
}

/** Base logistics USD for ~10,000 decks; scaled by quantity in calculator */
export const TRADE_COST_DEFAULT_LOGISTICS: TradeCostLogisticsFees = {
  cnExportCustoms: 200,
  cnTrucking: 120,
  cnCertificates: 80,
  brPortHandling: 250,
  brTruckToWarehouse: 1200,
  whReceiving: 350,
  whLabeling: 500,
  whStorageFirstMonth: 200,
  customsBrokerFee: 400,
}

export const TRADE_COST_LOGISTICS_LABELS: Record<keyof TradeCostLogisticsFees, string> = {
  cnExportCustoms: '中国出口报关+港杂',
  cnTrucking: '中国内陆拖车',
  cnCertificates: '产地证/检验(如需要)',
  brPortHandling: '巴西港 THC/拆箱',
  brTruckToWarehouse: '桑托斯→圣保罗拖柜',
  whReceiving: '海外仓卸货+入库',
  whLabeling: '贴标 EAN/FNSKU',
  whStorageFirstMonth: '首月仓储',
  customsBrokerFee: '清关行服务费',
}

export interface TradeCostEstimateInput {
  quantity: number
  /** Factory FOB USD per deck */
  fobPerUnitUsd: number
  /** International ocean freight USD (LCL/FCL leg to Santos) */
  freightUsd: number
  /** CBM for reference display */
  cbm?: number
  /** Insurance as fraction of FOB, default 0.005 */
  insuranceRate?: number
  /** Fixed port/customs misc USD */
  customsMiscUsd?: number
  /** USD → BRL for retail margin section */
  fxUsdToBrl?: number
  taxRates?: Partial<TradeCostTaxRates>
  logistics?: Partial<TradeCostLogisticsFees>
  /** Scale logistics from 10k base; default true */
  scaleLogisticsByQuantity?: boolean
  /** Sales assumptions */
  platformCommissionRate?: number
  adRate?: number
  fulfillmentCostBrl?: number
  retailPricesBrl?: number[]
  /** Working capital */
  depositRate?: number
  adReserveUsd?: number
}

export interface TradeCostTaxLine {
  key: string
  label: string
  amountUsd: number
  rate?: number
}

export interface TradeCostEstimateResult {
  quantity: number
  fobTotalUsd: number
  insuranceUsd: number
  cifUsd: number
  taxes: TradeCostTaxLine[]
  totalTaxUsd: number
  taxPctOfCif: number
  customsMiscUsd: number
  afrmmUsd: number
  landedAfterCustomsUsd: number
  landedAfterCustomsPerUnitUsd: number
  logistics: { key: keyof TradeCostLogisticsFees; label: string; amountUsd: number }[]
  logisticsTotalUsd: number
  warehouseReadyTotalUsd: number
  warehouseReadyPerUnitUsd: number
  multiplierVsFob: number
  multiplierVsCif: number
  warehouseReadyPerUnitBrl: number
  salesMargins: {
    priceBrl: number
    costBrl: number
    commissionBrl: number
    adBrl: number
    fulfillmentBrl: number
    profitBrl: number
    marginPct: number
  }[]
  workingCapital: {
    depositUsd: number
    balanceUsd: number
    freightAndCnUsd: number
    importTaxUsd: number
    logisticsAtPortUsd: number
    adReserveUsd: number
    totalRecommendedUsd: number
  }
}

export interface TradeCostPreset {
  id: string
  label: string
  quantity: number
  fobPerUnitUsd: number
  cbm: number
  freightUsd: number
}

export const TRADE_COST_PRESETS: TradeCostPreset[] = [
  { id: 'trial-5k', label: '首单试跑 5,000副 · 经济款', quantity: 5000, fobPerUnitUsd: 0.35, cbm: 1.2, freightUsd: 150 },
  { id: 'seed-8k', label: '首单试跑 8,000副 · 系统示例', quantity: 8000, fobPerUnitUsd: 0.625, cbm: 1.6, freightUsd: 240 },
  { id: 'std-10k', label: '标准 10,000副 · 中档', quantity: 10000, fobPerUnitUsd: 0.5, cbm: 2.0, freightUsd: 300 },
  { id: 'premium-10k', label: '标准 10,000副 · 较好款', quantity: 10000, fobPerUnitUsd: 0.8, cbm: 2.0, freightUsd: 300 },
  { id: 'scale-20k', label: '扩量 20,000副 · LCL/小FCL', quantity: 20000, fobPerUnitUsd: 0.45, cbm: 4.0, freightUsd: 500 },
]

export const TRADE_COST_ESTIMATE_STORAGE_KEY = 'foreign-trade-cost-input-v1'

function round2(n: number) {
  return Math.round(n * 100) / 100
}

function mergeLogistics(
  partial: Partial<TradeCostLogisticsFees> | undefined,
  quantity: number,
  scale: boolean,
): TradeCostLogisticsFees {
  const base = { ...TRADE_COST_DEFAULT_LOGISTICS, ...partial }
  if (!scale) return base
  const factor = quantity / 10000
  return {
    cnExportCustoms: round2(base.cnExportCustoms * factor),
    cnTrucking: round2(base.cnTrucking * factor),
    cnCertificates: round2(base.cnCertificates * factor),
    brPortHandling: round2(base.brPortHandling * factor),
    brTruckToWarehouse: round2(base.brTruckToWarehouse * Math.min(1, 0.7 + factor * 0.3)),
    whReceiving: round2(base.whReceiving * factor),
    whLabeling: round2(base.whLabeling * factor),
    whStorageFirstMonth: round2(base.whStorageFirstMonth * factor),
    customsBrokerFee: base.customsBrokerFee,
  }
}

/** Full landed-cost estimate for Brazil import (playing cards / general NCM with given rates) */
export function estimateTradeCost(input: TradeCostEstimateInput): TradeCostEstimateResult {
  const qty = Math.max(1, input.quantity)
  const rates = { ...TRADE_COST_DEFAULT_TAX_RATES, ...input.taxRates }
  const insuranceRate = input.insuranceRate ?? 0.005
  const customsMisc = input.customsMiscUsd ?? 180
  const fx = input.fxUsdToBrl ?? 5.7
  const commissionRate = input.platformCommissionRate ?? 0.16
  const adRate = input.adRate ?? 0.08
  const fulfillmentBrl = input.fulfillmentCostBrl ?? 3.5
  const retailPrices = input.retailPricesBrl ?? [22, 26, 30, 32]
  const depositRate = input.depositRate ?? 0.3
  const adReserve = input.adReserveUsd ?? 1500

  const fobTotal = round2(qty * input.fobPerUnitUsd)
  const insurance = round2(fobTotal * insuranceRate)
  const cif = round2(fobTotal + input.freightUsd + insurance)
  const afrmm = round2(input.freightUsd * rates.afrmmOnFreight)

  const ii = round2(cif * rates.ii)
  const ipi = round2((cif + ii) * rates.ipi)
  const pis = round2(cif * rates.pis)
  const cofins = round2(cif * rates.cofins)
  const baseBeforeIcms = cif + ii + ipi + pis + cofins + afrmm + customsMisc
  const icmsBase = baseBeforeIcms / (1 - rates.icms)
  const icms = round2(icmsBase * rates.icms)

  const taxes: TradeCostTaxLine[] = [
    { key: 'ii', label: 'II 进口关税', amountUsd: ii, rate: rates.ii },
    { key: 'ipi', label: 'IPI 工业产品税', amountUsd: ipi, rate: rates.ipi },
    { key: 'pis', label: 'PIS-Import', amountUsd: pis, rate: rates.pis },
    { key: 'cofins', label: 'COFINS-Import', amountUsd: cofins, rate: rates.cofins },
    { key: 'icms', label: 'ICMS 州税 (por dentro)', amountUsd: icms, rate: rates.icms },
    { key: 'afrmm', label: 'AFRMM 海运附加', amountUsd: afrmm, rate: rates.afrmmOnFreight },
    { key: 'misc', label: '港口/报关杂费', amountUsd: customsMisc },
  ]

  const totalTax = round2(ii + ipi + pis + cofins + icms)
  const landedCustoms = round2(cif + afrmm + customsMisc + totalTax)

  const logisticsFees = mergeLogistics(
    input.logistics,
    qty,
    input.scaleLogisticsByQuantity !== false,
  )

  const logistics = (Object.keys(logisticsFees) as (keyof TradeCostLogisticsFees)[]).map((key) => ({
    key,
    label: TRADE_COST_LOGISTICS_LABELS[key],
    amountUsd: logisticsFees[key],
  }))
  const logisticsTotal = round2(logistics.reduce((s, l) => s + l.amountUsd, 0))
  const warehouseReady = round2(landedCustoms + logisticsTotal)
  const perUnit = round2(warehouseReady / qty)
  const perUnitBrl = round2(perUnit * fx)

  const salesMargins = retailPrices.map((priceBrl) => {
    const commissionBrl = round2(priceBrl * commissionRate)
    const adBrl = round2(priceBrl * adRate)
    const profitBrl = round2(priceBrl - perUnitBrl - commissionBrl - adBrl - fulfillmentBrl)
    return {
      priceBrl,
      costBrl: perUnitBrl,
      commissionBrl,
      adBrl,
      fulfillmentBrl,
      profitBrl,
      marginPct: priceBrl > 0 ? round2((profitBrl / priceBrl) * 100) : 0,
    }
  })

  const freightAndCn = round2(
    input.freightUsd +
      logisticsFees.cnExportCustoms +
      logisticsFees.cnTrucking +
      logisticsFees.cnCertificates,
  )
  const logisticsAtPort = round2(
    logisticsFees.brPortHandling +
      logisticsFees.brTruckToWarehouse +
      logisticsFees.whReceiving +
      logisticsFees.customsBrokerFee,
  )

  return {
    quantity: qty,
    fobTotalUsd: fobTotal,
    insuranceUsd: insurance,
    cifUsd: cif,
    taxes,
    totalTaxUsd: totalTax,
    taxPctOfCif: cif > 0 ? round2((totalTax / cif) * 100) : 0,
    customsMiscUsd: customsMisc,
    afrmmUsd: afrmm,
    landedAfterCustomsUsd: landedCustoms,
    landedAfterCustomsPerUnitUsd: round2(landedCustoms / qty),
    logistics,
    logisticsTotalUsd: logisticsTotal,
    warehouseReadyTotalUsd: warehouseReady,
    warehouseReadyPerUnitUsd: perUnit,
    multiplierVsFob: fobTotal > 0 ? round2(warehouseReady / fobTotal) : 0,
    multiplierVsCif: cif > 0 ? round2(warehouseReady / cif) : 0,
    warehouseReadyPerUnitBrl: perUnitBrl,
    salesMargins,
    workingCapital: {
      depositUsd: round2(fobTotal * depositRate),
      balanceUsd: round2(fobTotal * (1 - depositRate)),
      freightAndCnUsd: freightAndCn,
      importTaxUsd: totalTax,
      logisticsAtPortUsd: logisticsAtPort,
      adReserveUsd: adReserve,
      totalRecommendedUsd: round2(
        fobTotal + totalTax + freightAndCn + logisticsAtPort + adReserve,
      ),
    },
  }
}

/** Build estimate input from shipment-like data */
export function tradeCostInputFromShipment(data: {
  lines: { quantity: number; unitCostCny?: number }[]
  cifValueUsd?: number
  freightUsd?: number
}): TradeCostEstimateInput {
  const quantity = data.lines.reduce((s, l) => s + l.quantity, 0) || 1
  let fobPerUnitUsd = 0.5
  if (data.cifValueUsd && quantity > 0) {
    fobPerUnitUsd = round2(data.cifValueUsd / quantity)
  }
  const freightUsd = data.freightUsd ?? Math.max(150, Math.round(quantity / 5000) * 150)
  const cbm = round2((quantity / 10000) * 2)
  return { quantity, fobPerUnitUsd, freightUsd, cbm }
}

export function formatUsd(n: number) {
  return `$${n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

export function formatUsdPrecise(n: number) {
  return `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function formatBrl(n: number) {
  return `R$ ${n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}
