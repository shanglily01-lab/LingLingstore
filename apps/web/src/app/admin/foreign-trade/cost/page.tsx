'use client'

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { clsx } from 'clsx'
import {
  TRADE_COST_DEFAULT_TAX_RATES,
  TRADE_COST_ESTIMATE_STORAGE_KEY,
  TRADE_COST_PRESETS,
  estimateTradeCost,
  formatBrl,
  formatUsd,
  formatUsdPrecise,
  type TradeCostEstimateInput,
  type TradeCostEstimateResult,
} from '@web3-mall/shared'
import { api } from '@/lib/api'
import { AdminPageHeader } from '@/components/admin-page-header'
import { LoadingSpinner } from '@/components/loading-spinner'
import { btnSecondary, card, cardFlat, input, label, select } from '@/components/ui/stitch'

const DEFAULT_INPUT: TradeCostEstimateInput = {
  quantity: 10000,
  fobPerUnitUsd: 0.5,
  freightUsd: 300,
  cbm: 2,
  fxUsdToBrl: 5.7,
}

function loadSavedInput(): TradeCostEstimateInput {
  if (typeof window === 'undefined') return DEFAULT_INPUT
  try {
    const raw = localStorage.getItem(TRADE_COST_ESTIMATE_STORAGE_KEY)
    return raw ? { ...DEFAULT_INPUT, ...JSON.parse(raw) } : DEFAULT_INPUT
  } catch {
    return DEFAULT_INPUT
  }
}

function CostBar({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  const pct = total > 0 ? (value / total) * 100 : 0
  return (
    <div>
      <div className="flex justify-between text-sm">
        <span className="text-on-surface">{label}</span>
        <span className="text-on-surface-variant">{formatUsd(value)} ({pct.toFixed(0)}%)</span>
      </div>
      <div className="mt-1 h-2 rounded-full bg-surface-container-high">
        <div className={clsx('h-2 rounded-full transition-all', color)} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

function ResultPanel({ result, fx }: { result: TradeCostEstimateResult; fx: number }) {
  const breakdownTotal = result.fobTotalUsd + result.totalTaxUsd + result.logisticsTotalUsd

  return (
    <div className="space-y-5">
      <div className={card + ' p-5 bg-secondary/5 border-secondary/20'}>
        <p className="text-sm text-on-surface-variant">入仓可售总成本</p>
        <p className="text-3xl font-bold text-secondary">
          {formatUsdPrecise(result.warehouseReadyTotalUsd)}
          <span className="ml-2 text-lg font-medium text-on-surface">
            · {formatUsdPrecise(result.warehouseReadyPerUnitUsd)}/副
          </span>
        </p>
        <p className="mt-1 text-sm text-on-surface-variant">
          ≈ {formatBrl(result.warehouseReadyPerUnitBrl)}/副 · 相对 FOB {result.multiplierVsFob}× · 相对 CIF {result.multiplierVsCif}×
        </p>
      </div>

      <div className={card + ' p-5 space-y-3'}>
        <h3 className="font-semibold text-on-surface">成本结构</h3>
        <CostBar label="工厂 FOB" value={result.fobTotalUsd} total={breakdownTotal} color="bg-blue-500" />
        <CostBar label="巴西进口税" value={result.totalTaxUsd} total={breakdownTotal} color="bg-red-500" />
        <CostBar label="物流+仓配" value={result.logisticsTotalUsd} total={breakdownTotal} color="bg-amber-500" />
      </div>

      <div className={card + ' p-5'}>
        <h3 className="font-semibold text-on-surface">CIF 桑托斯</h3>
        <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
          <div><dt className="text-on-surface-variant">FOB 合计</dt><dd>{formatUsd(result.fobTotalUsd)}</dd></div>
          <div><dt className="text-on-surface-variant">保险</dt><dd>{formatUsdPrecise(result.insuranceUsd)}</dd></div>
          <div><dt className="text-on-surface-variant">CIF</dt><dd className="font-medium">{formatUsd(result.cifUsd)}</dd></div>
          <div><dt className="text-on-surface-variant">进口税占 CIF</dt><dd>{result.taxPctOfCif}%</dd></div>
        </dl>
      </div>

      <div className={card + ' p-5'}>
        <h3 className="font-semibold text-on-surface">进口税明细</h3>
        <table className="mt-3 w-full text-sm">
          <thead>
            <tr className="border-b border-outline-variant/20 text-left text-on-surface-variant">
              <th className="py-2">税种</th>
              <th className="py-2 text-right">金额 (USD)</th>
            </tr>
          </thead>
          <tbody>
            {result.taxes.map((t) => (
              <tr key={t.key} className="border-b border-outline-variant/10">
                <td className="py-2">{t.label}</td>
                <td className="py-2 text-right">{formatUsdPrecise(t.amountUsd)}</td>
              </tr>
            ))}
            <tr className="font-medium">
              <td className="py-2">进口税合计</td>
              <td className="py-2 text-right text-secondary">{formatUsdPrecise(result.totalTaxUsd)}</td>
            </tr>
          </tbody>
        </table>
        <p className="mt-2 text-xs text-on-surface-variant">清关落地 {formatUsdPrecise(result.landedAfterCustomsUsd)} ({formatUsdPrecise(result.landedAfterCustomsPerUnitUsd)}/副)</p>
      </div>

      <div className={card + ' p-5'}>
        <h3 className="font-semibold text-on-surface">物流 + 仓配</h3>
        <table className="mt-3 w-full text-sm">
          <tbody>
            {result.logistics.map((l) => (
              <tr key={l.key} className="border-b border-outline-variant/10">
                <td className="py-1.5 text-on-surface-variant">{l.label}</td>
                <td className="py-1.5 text-right">{formatUsdPrecise(l.amountUsd)}</td>
              </tr>
            ))}
            <tr className="font-medium">
              <td className="py-2">小计</td>
              <td className="py-2 text-right">{formatUsdPrecise(result.logisticsTotalUsd)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className={card + ' p-5'}>
        <h3 className="font-semibold text-on-surface">销售毛利 (FX 1 USD = {fx} BRL)</h3>
        <table className="mt-3 w-full text-sm">
          <thead>
            <tr className="border-b border-outline-variant/20 text-left text-on-surface-variant">
              <th className="py-2">售价</th>
              <th className="py-2 text-right">到仓成本</th>
              <th className="py-2 text-right">毛利/副</th>
              <th className="py-2 text-right">毛利率</th>
            </tr>
          </thead>
          <tbody>
            {result.salesMargins.map((m) => (
              <tr key={m.priceBrl} className="border-b border-outline-variant/10">
                <td className="py-2">{formatBrl(m.priceBrl)}</td>
                <td className="py-2 text-right">{formatBrl(m.costBrl)}</td>
                <td className={clsx('py-2 text-right font-medium', m.profitBrl >= 0 ? 'text-green-700' : 'text-red-600')}>
                  {formatBrl(m.profitBrl)}
                </td>
                <td className="py-2 text-right">{m.marginPct}%</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-2 text-xs text-on-surface-variant">已含平台佣金 16%、广告 8%、仓配 R$3.50/副</p>
      </div>

      <div className={card + ' p-5'}>
        <h3 className="font-semibold text-on-surface">首单流动资金建议</h3>
        <dl className="mt-3 space-y-2 text-sm">
          {[
            ['工厂定金 30%', result.workingCapital.depositUsd],
            ['工厂尾款 70%', result.workingCapital.balanceUsd],
            ['海运 + 中国端', result.workingCapital.freightAndCnUsd],
            ['进口税 (到港前备好)', result.workingCapital.importTaxUsd],
            ['拖柜 + 入仓 + 清关行', result.workingCapital.logisticsAtPortUsd],
            ['平台押金/广告预留', result.workingCapital.adReserveUsd],
          ].map(([k, v]) => (
            <div key={String(k)} className="flex justify-between">
              <dt className="text-on-surface-variant">{k}</dt>
              <dd>{formatUsd(Number(v))}</dd>
            </div>
          ))}
          <div className="flex justify-between border-t border-outline-variant/20 pt-2 font-semibold text-secondary">
            <dt>建议总准备</dt>
            <dd>{formatUsd(result.workingCapital.totalRecommendedUsd)}</dd>
          </div>
        </dl>
      </div>

      <p className="text-xs text-on-surface-variant">
        NCM 9504.40.00 · 税率仅供参考，正式下单请让清关行出具书面含税到岸价模拟。
      </p>
    </div>
  )
}

function ForeignTradeCostPage() {
  const searchParams = useSearchParams()
  const shipmentId = searchParams.get('shipmentId')

  const [form, setForm] = useState<TradeCostEstimateInput>(DEFAULT_INPUT)
  const [loaded, setLoaded] = useState(false)
  const [shipmentLabel, setShipmentLabel] = useState<string | null>(null)

  useEffect(() => {
    setForm(loadSavedInput())
    setLoaded(true)
  }, [])

  const loadFromShipment = useCallback(async (id: string) => {
    const data = await api.admin.foreignTrade.shipments.costEstimate(id)
    setForm((prev) => ({ ...prev, ...data.input }))
    setShipmentLabel(`${data.shipmentNo} · ${data.title}`)
  }, [])

  useEffect(() => {
    if (shipmentId && loaded) {
      loadFromShipment(shipmentId).catch(() => setShipmentLabel(null))
    }
  }, [shipmentId, loaded, loadFromShipment])

  useEffect(() => {
    if (!loaded) return
    localStorage.setItem(TRADE_COST_ESTIMATE_STORAGE_KEY, JSON.stringify(form))
  }, [form, loaded])

  const result = useMemo(() => estimateTradeCost(form), [form])

  const setNum = (key: keyof TradeCostEstimateInput, value: string) => {
    const n = parseFloat(value)
    if (!Number.isNaN(n)) setForm((f) => ({ ...f, [key]: n }))
  }

  const applyPreset = (id: string) => {
    const p = TRADE_COST_PRESETS.find((x) => x.id === id)
    if (p) {
      setForm((f) => ({
        ...f,
        quantity: p.quantity,
        fobPerUnitUsd: p.fobPerUnitUsd,
        freightUsd: p.freightUsd,
        cbm: p.cbm,
      }))
      setShipmentLabel(null)
    }
  }

  if (!loaded) return <LoadingSpinner className="py-12" />

  const rates = TRADE_COST_DEFAULT_TAX_RATES

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="成本估算"
        subtitle="海关 · 进口税 · 海运 · 拖柜 · 海外仓 · 销售毛利 · 流动资金"
        action={
          shipmentLabel ? (
            <span className="text-sm text-secondary">来自批次：{shipmentLabel}</span>
          ) : undefined
        }
      />

      <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
        <div className="space-y-4">
          <div className={card + ' p-4'}>
            <label className={label}>快速场景</label>
            <select
              className={select + ' mt-1 w-full'}
              defaultValue=""
              onChange={(e) => e.target.value && applyPreset(e.target.value)}
            >
              <option value="">选择预设…</option>
              {TRADE_COST_PRESETS.map((p) => (
                <option key={p.id} value={p.id}>{p.label}</option>
              ))}
            </select>
          </div>

          <div className={card + ' p-4 space-y-3'}>
            <h3 className="font-semibold text-on-surface">采购 & 运输</h3>
            <div>
              <label className={label}>数量（副）</label>
              <input className={input + ' mt-1 w-full'} type="number" min={1}
                value={form.quantity} onChange={(e) => setNum('quantity', e.target.value)} />
            </div>
            <div>
              <label className={label}>工厂 FOB (USD/副)</label>
              <input className={input + ' mt-1 w-full'} type="number" step="0.01" min={0}
                value={form.fobPerUnitUsd} onChange={(e) => setNum('fobPerUnitUsd', e.target.value)} />
            </div>
            <div>
              <label className={label}>海运 LCL (USD)</label>
              <input className={input + ' mt-1 w-full'} type="number" min={0}
                value={form.freightUsd} onChange={(e) => setNum('freightUsd', e.target.value)} />
            </div>
            <div>
              <label className={label}>体积 (CBM，参考)</label>
              <input className={input + ' mt-1 w-full'} type="number" step="0.1" min={0}
                value={form.cbm ?? ''} onChange={(e) => setNum('cbm', e.target.value)} />
            </div>
            <div>
              <label className={label}>汇率 USD → BRL</label>
              <input className={input + ' mt-1 w-full'} type="number" step="0.01" min={0}
                value={form.fxUsdToBrl ?? 5.7} onChange={(e) => setNum('fxUsdToBrl', e.target.value)} />
            </div>
          </div>

          <div className={cardFlat + ' p-4 text-xs text-on-surface-variant space-y-1'}>
            <p className="font-medium text-on-surface">当前税率 (NCM 9504.40.00)</p>
            <p>II {(rates.ii * 100).toFixed(0)}% · IPI {(rates.ipi * 100).toFixed(0)}% · PIS/COFINS {((rates.pis + rates.cofins) * 100).toFixed(2)}%</p>
            <p>ICMS-SP {(rates.icms * 100).toFixed(0)}% · AFRMM {(rates.afrmmOnFreight * 100).toFixed(0)}%×海运费</p>
          </div>

          <button
            type="button"
            className={btnSecondary + ' w-full'}
            onClick={() => { setForm(DEFAULT_INPUT); setShipmentLabel(null) }}
          >
            重置为默认
          </button>
        </div>

        <ResultPanel result={result} fx={form.fxUsdToBrl ?? 5.7} />
      </div>

      <div className={card + ' p-4'}>
        <h3 className="font-semibold text-on-surface">全部预设对比</h3>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-outline-variant/20 text-left text-on-surface-variant">
                <th className="py-2">场景</th>
                <th className="py-2 text-right">CIF</th>
                <th className="py-2 text-right">进口税</th>
                <th className="py-2 text-right">入仓总成本</th>
                <th className="py-2 text-right">USD/副</th>
                <th className="py-2 text-right">流动资金</th>
              </tr>
            </thead>
            <tbody>
              {TRADE_COST_PRESETS.map((p) => {
                const r = estimateTradeCost({
                  quantity: p.quantity,
                  fobPerUnitUsd: p.fobPerUnitUsd,
                  freightUsd: p.freightUsd,
                  cbm: p.cbm,
                })
                return (
                  <tr key={p.id} className="border-b border-outline-variant/10 hover:bg-surface-container-high">
                    <td className="py-2">
                      <button type="button" className="text-left text-secondary hover:underline" onClick={() => applyPreset(p.id)}>
                        {p.label}
                      </button>
                    </td>
                    <td className="py-2 text-right">{formatUsd(r.cifUsd)}</td>
                    <td className="py-2 text-right">{formatUsd(r.totalTaxUsd)}</td>
                    <td className="py-2 text-right font-medium">{formatUsd(r.warehouseReadyTotalUsd)}</td>
                    <td className="py-2 text-right">{formatUsdPrecise(r.warehouseReadyPerUnitUsd)}</td>
                    <td className="py-2 text-right">{formatUsd(r.workingCapital.totalRecommendedUsd)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default function ForeignTradeCostRoute() {
  return (
    <Suspense fallback={<LoadingSpinner className="py-12" />}>
      <ForeignTradeCostPage />
    </Suspense>
  )
}
