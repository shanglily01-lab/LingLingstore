'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import type { AdminCategoryData } from '@web3-mall/shared'
import toast from 'react-hot-toast'
import { AdminPageHeader } from '@/components/admin-page-header'
import { LoadingSpinner } from '@/components/loading-spinner'
import {
  btnDanger,
  btnGhost,
  btnPrimary,
  cardFlat,
  input,
  label,
  link,
  panel,
  tableHead,
  tableRow,
} from '@/components/ui/stitch'

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<AdminCategoryData[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({ nameCn: '', nameEn: '', sortOrder: 0 })
  const [showNew, setShowNew] = useState(false)
  const [newForm, setNewForm] = useState({ nameCn: '', nameEn: '', sortOrder: 0 })

  const fetchCategories = () => {
    setLoading(true)
    api.admin.categories.list().then(setCategories).finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchCategories()
  }, [])

  const handleCreate = async () => {
    if (!newForm.nameCn) {
      toast.error('请填写分类名称')
      return
    }
    try {
      await api.admin.categories.create(newForm)
      toast.success('分类创建成功')
      setShowNew(false)
      setNewForm({ nameCn: '', nameEn: '', sortOrder: 0 })
      fetchCategories()
    } catch {
      toast.error('创建失败')
    }
  }

  const handleUpdate = async (id: string) => {
    try {
      await api.admin.categories.update(id, editForm)
      toast.success('已更新')
      setEditingId(null)
      fetchCategories()
    } catch {
      toast.error('更新失败')
    }
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`确定要删除分类 "${name}" 吗？`)) return
    try {
      await api.admin.categories.delete(id)
      toast.success('已删除')
      fetchCategories()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : '删除失败')
    }
  }

  const startEdit = (c: AdminCategoryData) => {
    setEditingId(c.id)
    setEditForm({ nameCn: c.nameCn || '', nameEn: c.nameEn || '', sortOrder: c.sortOrder })
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="分类管理"
        action={
          <button type="button" onClick={() => setShowNew(true)} className={btnPrimary}>
            + 新增分类
          </button>
        }
      />

      {showNew && (
        <div className={panel + ' border-secondary/20 bg-surface-container-low'}>
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label className={label + ' text-xs'}>名称 *</label>
              <input
                type="text"
                value={newForm.nameCn}
                onChange={(e) => setNewForm((f) => ({ ...f, nameCn: e.target.value }))}
                className={input + ' mt-0'}
              />
            </div>
            <div>
              <label className={label + ' text-xs'}>英文名</label>
              <input
                type="text"
                value={newForm.nameEn}
                onChange={(e) => setNewForm((f) => ({ ...f, nameEn: e.target.value }))}
                className={input + ' mt-0'}
              />
            </div>
            <div>
              <label className={label + ' text-xs'}>排序</label>
              <input
                type="number"
                value={newForm.sortOrder}
                onChange={(e) =>
                  setNewForm((f) => ({ ...f, sortOrder: parseInt(e.target.value, 10) || 0 }))
                }
                className={input + ' mt-0 w-20'}
              />
            </div>
            <button type="button" onClick={handleCreate} className={btnPrimary}>
              创建
            </button>
            <button type="button" onClick={() => setShowNew(false)} className={btnGhost}>
              取消
            </button>
          </div>
        </div>
      )}

      <div className={`${cardFlat} overflow-hidden`}>
        {loading ? (
          <LoadingSpinner className="py-12" />
        ) : categories.length === 0 ? (
          <div className="p-12 text-center text-on-surface-variant">暂无分类</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className={tableHead}>
                <th className="px-4 py-3">分类名称</th>
                <th className="px-4 py-3">英文名</th>
                <th className="px-4 py-3">排序</th>
                <th className="px-4 py-3">商品数</th>
                <th className="px-4 py-3 text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/10">
              {categories.map((c) => (
                <tr key={c.id} className={tableRow}>
                  {editingId === c.id ? (
                    <>
                      <td className="px-4 py-2">
                        <input
                          type="text"
                          value={editForm.nameCn}
                          onChange={(e) => setEditForm((f) => ({ ...f, nameCn: e.target.value }))}
                          className={input + ' mt-0 py-1'}
                        />
                      </td>
                      <td className="px-4 py-2">
                        <input
                          type="text"
                          value={editForm.nameEn}
                          onChange={(e) => setEditForm((f) => ({ ...f, nameEn: e.target.value }))}
                          className={input + ' mt-0 py-1'}
                        />
                      </td>
                      <td className="px-4 py-2">
                        <input
                          type="number"
                          value={editForm.sortOrder}
                          onChange={(e) =>
                            setEditForm((f) => ({
                              ...f,
                              sortOrder: parseInt(e.target.value, 10) || 0,
                            }))
                          }
                          className={input + ' mt-0 w-16 py-1'}
                        />
                      </td>
                      <td className="px-4 py-3 text-sm text-on-surface-variant">{c.productCount}</td>
                      <td className="px-4 py-2 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleUpdate(c.id)}
                            className={link + ' text-xs font-medium'}
                          >
                            保存
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingId(null)}
                            className="text-xs text-on-surface-variant hover:text-on-surface"
                          >
                            取消
                          </button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-4 py-3 text-sm font-medium text-on-surface">{c.nameCn}</td>
                      <td className="px-4 py-3 text-sm text-on-surface-variant">{c.nameEn || '-'}</td>
                      <td className="px-4 py-3 text-sm text-on-surface-variant">{c.sortOrder}</td>
                      <td className="px-4 py-3 text-sm text-on-surface-variant">{c.productCount}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => startEdit(c)}
                            className={link + ' text-xs font-medium'}
                          >
                            编辑
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(c.id, c.nameCn || '')}
                            className={btnDanger}
                          >
                            删除
                          </button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
