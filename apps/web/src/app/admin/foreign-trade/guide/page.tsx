'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { clsx } from 'clsx'
import {
  FOREIGN_TRADE_BEGINNER_GUIDE,
  GUIDE_PROGRESS_STORAGE_KEY,
  emptyGuideProgress,
  type GuideProgressSnapshot,
  type GuideStage,
  type GuideTip,
  type TradeDashboardData,
  TRADE_TASK_STAGE_LABELS,
} from '@web3-mall/shared'
import { api } from '@/lib/api'
import { AdminPageHeader } from '@/components/admin-page-header'
import { LoadingSpinner } from '@/components/loading-spinner'
import { card, cardFlat, link, btnSecondary } from '@/components/ui/stitch'

function loadProgress(): GuideProgressSnapshot {
  if (typeof window === 'undefined') return emptyGuideProgress()
  try {
    const raw = localStorage.getItem(GUIDE_PROGRESS_STORAGE_KEY)
    return raw ? (JSON.parse(raw) as GuideProgressSnapshot) : emptyGuideProgress()
  } catch {
    return emptyGuideProgress()
  }
}

function saveProgress(p: GuideProgressSnapshot) {
  localStorage.setItem(GUIDE_PROGRESS_STORAGE_KEY, JSON.stringify(p))
}

function tipStyle(level: GuideTip['level']) {
  if (level === 'danger') return 'border-error/30 bg-red-50 text-red-900'
  if (level === 'warning') return 'border-amber-400/40 bg-amber-50 text-amber-950'
  return 'border-secondary/20 bg-surface-container-high text-on-surface'
}

function tipIcon(level: GuideTip['level']) {
  if (level === 'danger') return '🚨'
  if (level === 'warning') return '⚠️'
  return '💡'
}

/** 根据系统真实数据推断哪些环节可能已完成 */
function inferAutoChecks(dashboard: TradeDashboardData | null): Record<string, boolean> {
  if (!dashboard) return {}
  const auto: Record<string, boolean> = {}
  if (dashboard.partnersCount >= 1) auto.freight = true
  if (dashboard.partnersCount >= 2) auto.customs_broker = true
  if (dashboard.partnersCount >= 3) auto.warehouse = true
  if (dashboard.activeShipments > 0 || dashboard.recentShipments.length > 0) {
    auto.create_shipment = true
  }
  if (dashboard.warehouseStock > 0) {
    auto.sync_inv = true
    auto.verify = true
    auto.stock_live = true
  }
  if (dashboard.pendingFulfillment > 0) {
    auto.test_amz = true
  }
  return auto
}

function stageProgress(stage: GuideStage, progress: GuideProgressSnapshot, auto: Record<string, boolean>) {
  const total = stage.actions.length
  const done = stage.actions.filter((a) => progress.checkedActions[a.id] || auto[a.id]).length
  return { done, total, pct: total ? Math.round((done / total) * 100) : 0 }
}

export default function ForeignTradeGuidePage() {
  const [dashboard, setDashboard] = useState<TradeDashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [progress, setProgress] = useState<GuideProgressSnapshot>(emptyGuideProgress)
  const [activeStageId, setActiveStageId] = useState<string>('prep')

  useEffect(() => {
    setProgress(loadProgress())
    api.admin.foreignTrade.dashboard()
      .then(setDashboard)
      .finally(() => setLoading(false))
  }, [])

  const autoChecks = useMemo(() => inferAutoChecks(dashboard), [dashboard])

  const persist = useCallback((next: GuideProgressSnapshot) => {
    setProgress(next)
    saveProgress(next)
  }, [])

  const toggleAction = (actionId: string) => {
    const next = {
      ...progress,
      checkedActions: {
        ...progress.checkedActions,
        [actionId]: !progress.checkedActions[actionId],
      },
    }
    persist(next)
  }

  const markStageDone = (stageId: string) => {
    persist({
      ...progress,
      completedStages: { ...progress.completedStages, [stageId]: true },
      lastStageId: stageId as GuideProgressSnapshot['lastStageId'],
    })
  }

  const resetProgress = () => {
    if (confirm('确定重置新手流程进度？（不影响系统里的批次和库存数据）')) {
      persist(emptyGuideProgress())
    }
  }

  const activeStage = FOREIGN_TRADE_BEGINNER_GUIDE.find((s) => s.id === activeStageId) ?? FOREIGN_TRADE_BEGINNER_GUIDE[0]!

  const overall = useMemo(() => {
    let done = 0
    let total = 0
    for (const stage of FOREIGN_TRADE_BEGINNER_GUIDE) {
      const p = stageProgress(stage, progress, autoChecks)
      done += p.done
      total += p.total
    }
    return { done, total, pct: total ? Math.round((done / total) * 100) : 0 }
  }, [progress, autoChecks])

  const activeIdx = FOREIGN_TRADE_BEGINNER_GUIDE.findIndex((s) => s.id === activeStageId)

  if (loading) return <LoadingSpinner className="py-12" />

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="新手流程向导"
        subtitle="中国 → 巴西海运 → 圣保罗海外仓 → 亚马逊/美客多 · 每步做什么、注意什么"
        action={
          <button type="button" className={btnSecondary} onClick={resetProgress}>
            重置进度
          </button>
        }
      />

      {/* 总进度 */}
      <div className={card + ' p-5'}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm text-on-surface-variant">整体完成度</p>
            <p className="text-2xl font-bold text-on-surface">
              {overall.done} / {overall.total} 项
              <span className="ml-2 text-secondary">{overall.pct}%</span>
            </p>
          </div>
          <div className="min-w-[200px] flex-1 max-w-md">
            <div className="h-3 rounded-full bg-surface-container-high">
              <div
                className="h-3 rounded-full bg-secondary transition-all"
                style={{ width: `${overall.pct}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-on-surface-variant">
              带「系统已检测」标记的项会根据你录入的服务商、批次、库存自动勾选
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
        {/* 阶段导航 */}
        <nav className={card + ' p-3 space-y-1 h-fit lg:sticky lg:top-4'}>
          {FOREIGN_TRADE_BEGINNER_GUIDE.map((stage, idx) => {
            const p = stageProgress(stage, progress, autoChecks)
            const isActive = stage.id === activeStageId
            const stageDone = progress.completedStages[stage.id]
            return (
              <button
                key={stage.id}
                type="button"
                onClick={() => setActiveStageId(stage.id)}
                className={clsx(
                  'w-full rounded-lg px-3 py-2.5 text-left text-sm transition-colors',
                  isActive ? 'bg-secondary text-white' : 'hover:bg-surface-container-high',
                )}
              >
                <div className="flex items-center gap-2">
                  <span className={clsx(
                    'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold',
                    isActive ? 'bg-white/20' : stageDone ? 'bg-green-100 text-green-800' : 'bg-surface-container-high',
                  )}>
                    {stageDone ? '✓' : idx + 1}
                  </span>
                  <span className="font-medium">{stage.title}</span>
                </div>
                <p className={clsx('mt-0.5 pl-8 text-xs', isActive ? 'text-white/80' : 'text-on-surface-variant')}>
                  {p.done}/{p.total} · {stage.duration}
                </p>
              </button>
            )
          })}
        </nav>

        {/* 当前阶段详情 */}
        <div className="space-y-5">
          <div className={card + ' p-6'}>
            <p className="text-xs font-semibold uppercase tracking-wide text-secondary">
              第 {activeIdx + 1} 步 · {TRADE_TASK_STAGE_LABELS[activeStage.id]}
            </p>
            <h2 className="mt-1 text-xl font-bold text-on-surface">{activeStage.title}</h2>
            <p className="text-sm text-on-surface-variant">{activeStage.subtitle} · 预计 {activeStage.duration}</p>
            <p className="mt-3 text-sm leading-relaxed text-on-surface">{activeStage.summary}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {activeIdx > 0 && FOREIGN_TRADE_BEGINNER_GUIDE[activeIdx - 1] && (
                <button
                  type="button"
                  className={btnSecondary}
                  onClick={() => setActiveStageId(FOREIGN_TRADE_BEGINNER_GUIDE[activeIdx - 1]!.id)}
                >
                  ← 上一步
                </button>
              )}
              {activeIdx < FOREIGN_TRADE_BEGINNER_GUIDE.length - 1 && FOREIGN_TRADE_BEGINNER_GUIDE[activeIdx + 1] && (
                <button
                  type="button"
                  className={btnSecondary}
                  onClick={() => setActiveStageId(FOREIGN_TRADE_BEGINNER_GUIDE[activeIdx + 1]!.id)}
                >
                  下一步 →
                </button>
              )}
              <button
                type="button"
                className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
                onClick={() => markStageDone(activeStage.id)}
              >
                标记本阶段已完成
              </button>
            </div>
          </div>

          {/* 你要做的事 */}
          <div className={card + ' p-6'}>
            <h3 className="font-semibold text-on-surface">这一环你要做的事</h3>
            <ul className="mt-4 space-y-3">
              {activeStage.actions.map((action) => {
                const checked = progress.checkedActions[action.id] || autoChecks[action.id]
                const auto = autoChecks[action.id] && !progress.checkedActions[action.id]
                return (
                  <li key={action.id} className={clsx(cardFlat, 'p-4', checked && 'opacity-80')}>
                    <label className="flex cursor-pointer items-start gap-3">
                      <input
                        type="checkbox"
                        checked={!!checked}
                        onChange={() => toggleAction(action.id)}
                        className="mt-1 h-4 w-4 shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className={clsx('font-medium text-on-surface', checked && 'line-through')}>
                          {action.label}
                          {auto && (
                            <span className="ml-2 inline-block rounded bg-secondary/15 px-1.5 py-0.5 text-xs text-secondary no-underline">
                              系统已检测
                            </span>
                          )}
                        </p>
                        <p className="mt-1 text-sm text-on-surface-variant">{action.description}</p>
                        {action.systemHint && (
                          <p className="mt-2 text-xs text-secondary">
                            📍 系统操作：{action.systemHint}
                          </p>
                        )}
                        {action.href && (
                          <Link href={action.href} className={link + ' mt-2 inline-block text-sm'}>
                            去操作 →
                          </Link>
                        )}
                      </div>
                    </label>
                  </li>
                )
              })}
            </ul>
          </div>

          {/* 重要提示 */}
          <div className={card + ' p-6'}>
            <h3 className="font-semibold text-on-surface">重要提示</h3>
            <div className="mt-4 space-y-3">
              {activeStage.tips.map((tip, i) => (
                <div key={i} className={clsx('rounded-lg border p-4', tipStyle(tip.level))}>
                  <p className="font-medium">
                    {tipIcon(tip.level)} {tip.title}
                  </p>
                  <p className="mt-1 text-sm leading-relaxed">{tip.body}</p>
                </div>
              ))}
            </div>
          </div>

          {/* 进入下一阶段前 */}
          <div className={card + ' p-6'}>
            <h3 className="font-semibold text-on-surface">进入下一阶段前，确认这些</h3>
            <ul className="mt-3 space-y-2">
              {activeStage.beforeNext.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-on-surface">
                  <span className="text-secondary">☐</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
