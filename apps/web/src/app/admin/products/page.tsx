'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { Plus, Search } from 'lucide-react'
import { api } from '@/lib/api'
import type { AdminProductListItem, AdminCategoryData } from '@web3-mall/shared'
import toast from 'react-hot-toast'

export default function AdminProductsPage() {
  const [products, setProducts] = useState<AdminProductListItem[]>([])
  const [categories, setCategories] = useState<AdminCategoryData[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [keyword, setKeyword] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')

  useEffect(() => {
    api.admin.categories.list().then(setCategories).catch(() => {})
  }, [])

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.admin.products.list(page, {
        status: statusFilter || undefined,
        categoryId: categoryFilter || undefined,
        keyword: keyword || undefined,
      })
      setProducts(res.items)
      setTotal(res.total)
    } catch {
      toast.error('加载商品列表失败')
    } finally {
      setLoading(false)
    }
  }, [page, statusFilter, categoryFilter, keyword])

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`确定要删除商品 "${name}" 吗？此操作不可恢复。`)) return
    try {
      await api.admin.products.delete(id)
      toast.success('已删除')
      fetchProducts()
    } catch {
      toast.error('删除失败')
    }
  }

  const totalPages = Math.ceil(total / 20)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-on-surface">商品管理</h1>
          <p className="mt-1 text-sm text-on-surface-variant">管理 SPU、双区定价与库存</p>
        </div>
        <Link
          href="/admin/products/new"
          className="inline-flex items-center gap-2 bg-on-surface px-4 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
        >
          <Plus className="h-4 w-4" />
          新增商品
        </Link>
      </div>

      <div className="flex flex-wrap gap-3 border border-outline-variant/20 bg-white p-4">
        <div className="relative min-w-[220px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant" />
          <input
            type="text"
            placeholder="搜索商品名称 / SPU..."
            value={keyword}
            onChange={(e) => {
              setKeyword(e.target.value)
              setPage(1)
            }}
            className="w-full rounded-lg border border-outline-variant/30 py-2 pl-10 pr-4 text-sm outline-none focus:border-secondary focus:ring-1 focus:ring-secondary"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value)
            setPage(1)
          }}
          className="rounded-lg border border-outline-variant/30 px-3 py-2 text-sm"
        >
          <option value="">全部状态</option>
          <option value="active">上架</option>
          <option value="archived">下架</option>
        </select>
        <select
          value={categoryFilter}
          onChange={(e) => {
            setCategoryFilter(e.target.value)
            setPage(1)
          }}
          className="rounded-lg border border-outline-variant/30 px-3 py-2 text-sm"
        >
          <option value="">全部分类</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nameCn}
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-hidden border border-outline-variant/20 bg-white editorial-shadow">
        {loading ? (
          <div className="p-16 text-center text-on-surface-variant">加载中...</div>
        ) : products.length === 0 ? (
          <div className="p-16 text-center text-on-surface-variant">
            暂无商品
            <br />
            <Link href="/admin/products/new" className="mt-3 inline-block text-secondary hover:underline">
              + 新增第一个商品
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead>
                <tr className="border-b border-outline-variant/20 bg-surface-container-low text-left text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                  <th className="px-5 py-4">商品</th>
                  <th className="px-5 py-4">分类</th>
                  <th className="px-5 py-4">国内价</th>
                  <th className="px-5 py-4">海外价</th>
                  <th className="px-5 py-4">库存 (CN/US)</th>
                  <th className="px-5 py-4">状态</th>
                  <th className="px-5 py-4 text-right">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/10">
                {products.map((p) => (
                  <tr key={p.id} className="transition-colors hover:bg-surface-container-low/50">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-11 w-11 shrink-0 overflow-hidden bg-surface-container-low">
                          {p.image ? (
                            <img src={p.image} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-lg">📦</div>
                          )}
                        </div>
                        <div>
                          <p className="line-clamp-1 text-sm font-medium text-on-surface">
                            {p.nameCn || p.nameEn}
                          </p>
                          <p className="text-xs text-on-surface-variant">{p.spuNo}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm text-on-surface-variant">{p.categoryName || '—'}</td>
                    <td className="px-5 py-4 text-sm font-medium">
                      {p.cnPrice != null ? `¥${(p.cnPrice / 100).toFixed(2)}` : '—'}
                    </td>
                    <td className="px-5 py-4 text-sm font-medium">
                      {p.usPrice != null ? `$${(p.usPrice / 100).toFixed(2)}` : '—'}
                    </td>
                    <td className="px-5 py-4 text-sm text-on-surface-variant">
                      {p.cnStock ?? '—'} / {p.usStock ?? '—'}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={
                          'inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ' +
                          (p.status === 'active'
                            ? 'bg-green-50 text-green-800'
                            : 'bg-surface-container text-on-surface-variant')
                        }
                      >
                        {p.status === 'active' ? '上架' : '下架'}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/admin/products/${p.id}/edit`}
                          className="rounded px-2.5 py-1 text-xs font-medium text-secondary hover:bg-surface-container-low"
                        >
                          编辑
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleDelete(p.id, p.nameCn || '')}
                          className="rounded px-2.5 py-1 text-xs font-medium text-error hover:bg-red-50"
                        >
                          删除
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="rounded-lg border border-outline-variant/30 px-4 py-2 text-sm disabled:opacity-40"
          >
            上一页
          </button>
          <span className="text-sm text-on-surface-variant">
            第 {page} / {totalPages} 页（共 {total} 件）
          </span>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="rounded-lg border border-outline-variant/30 px-4 py-2 text-sm disabled:opacity-40"
          >
            下一页
          </button>
        </div>
      )}
    </div>
  )
}
