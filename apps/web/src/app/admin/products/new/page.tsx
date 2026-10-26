'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import type { AdminCategoryData } from '@web3-mall/shared'
import toast from 'react-hot-toast'
import { AdminFormSection } from '@/components/admin-form-section'
import { AdminPageHeader } from '@/components/admin-page-header'
import { ProductImageFields, buildProductImagesPayload } from '@/components/product-image-fields'
import { PRODUCT_IMAGE_COUNT } from '@/lib/product-image'
import { btnGhost, btnPrimary, card, input, label, select, textarea } from '@/components/ui/stitch'

export default function NewProductPage() {
  const router = useRouter()
  const [categories, setCategories] = useState<AdminCategoryData[]>([])
  const [submitting, setSubmitting] = useState(false)

  const [form, setForm] = useState({
    nameCn: '',
    nameEn: '',
    descriptionCn: '',
    descriptionEn: '',
    categoryId: '',
    imageUrls: ['', '', '', '', '', ''],
    cnSku: '',
    cnPrice: '',
    cnStock: '',
    usSku: '',
    usPrice: '',
    usStock: '',
  })

  useEffect(() => {
    api.admin.categories.list().then(setCategories).catch(() => {})
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.nameCn || !form.nameEn) {
      toast.error('请填写商品名称')
      return
    }
    if (!form.cnSku || !form.usSku) {
      toast.error('请填写 SKU')
      return
    }
    const filledImages = form.imageUrls.map((u) => u.trim()).filter(Boolean)
    if (filledImages.length < 1) {
      toast.error('请至少上传 1 张商品图片')
      return
    }
    if (filledImages.length > PRODUCT_IMAGE_COUNT) {
      toast.error(`最多上传 ${PRODUCT_IMAGE_COUNT} 张商品图片`)
      return
    }

    setSubmitting(true)
    try {
      const payload = {
        nameCn: form.nameCn,
        nameEn: form.nameEn,
        descriptionCn: form.descriptionCn || undefined,
        descriptionEn: form.descriptionEn || undefined,
        categoryId: form.categoryId || undefined,
        images: buildProductImagesPayload(form.imageUrls, form.nameCn, form.nameEn),
        listings: [
          {
            region: 'CN',
            sku: form.cnSku,
            price: Math.round(parseFloat(form.cnPrice || '0') * 100),
            currency: 'CNY',
            stock: parseInt(form.cnStock || '0', 10),
          },
          {
            region: 'OVERSEAS',
            sku: form.usSku,
            price: Math.round(parseFloat(form.usPrice || '0') * 100),
            currency: 'USD',
            stock: parseInt(form.usStock || '0', 10),
          },
        ],
      }
      await api.admin.products.create(payload)
      toast.success('商品创建成功')
      router.push('/admin/products')
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : '创建失败')
    } finally {
      setSubmitting(false)
    }
  }

  const update =
    (k: string) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }))

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <AdminPageHeader title="新增商品" subtitle="添加一个新的商品到商城" />

      <form onSubmit={handleSubmit} className={card + ' space-y-6 p-6'}>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={label}>中文名称 *</label>
            <input type="text" value={form.nameCn} onChange={update('nameCn')} className={input} />
          </div>
          <div>
            <label className={label}>英文名称 *</label>
            <input type="text" value={form.nameEn} onChange={update('nameEn')} className={input} />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={label}>中文描述</label>
            <textarea
              rows={3}
              value={form.descriptionCn}
              onChange={update('descriptionCn')}
              className={textarea}
            />
          </div>
          <div>
            <label className={label}>英文描述</label>
            <textarea
              rows={3}
              value={form.descriptionEn}
              onChange={update('descriptionEn')}
              className={textarea}
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={label}>分类</label>
            <select value={form.categoryId} onChange={update('categoryId')} className={select + ' mt-1 block w-full'}>
              <option value="">无分类</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nameCn} ({c.nameEn})
                </option>
              ))}
            </select>
          </div>
        </div>

        <ProductImageFields
          urls={form.imageUrls}
          onChange={(imageUrls) => setForm((f) => ({ ...f, imageUrls }))}
          nameCn={form.nameCn}
          nameEn={form.nameEn}
        />

        <AdminFormSection title="国内站 (CN)">
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className={label}>SKU *</label>
              <input
                type="text"
                value={form.cnSku}
                onChange={update('cnSku')}
                placeholder="CN-SPU..."
                className={input}
              />
            </div>
            <div>
              <label className={label}>价格 (元)</label>
              <input type="number" step="0.01" value={form.cnPrice} onChange={update('cnPrice')} className={input} />
            </div>
            <div>
              <label className={label}>库存</label>
              <input type="number" value={form.cnStock} onChange={update('cnStock')} className={input} />
            </div>
          </div>
        </AdminFormSection>

        <AdminFormSection title="海外站 (OVERSEAS)">
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className={label}>SKU *</label>
              <input
                type="text"
                value={form.usSku}
                onChange={update('usSku')}
                placeholder="OV-SPU..."
                className={input}
              />
            </div>
            <div>
              <label className={label}>价格 (美元)</label>
              <input type="number" step="0.01" value={form.usPrice} onChange={update('usPrice')} className={input} />
            </div>
            <div>
              <label className={label}>库存</label>
              <input type="number" value={form.usStock} onChange={update('usStock')} className={input} />
            </div>
          </div>
        </AdminFormSection>

        <div className="flex items-center justify-end gap-3 border-t border-outline-variant/20 pt-4">
          <button type="button" onClick={() => router.back()} className={btnGhost}>
            取消
          </button>
          <button type="submit" disabled={submitting} className={btnPrimary}>
            {submitting ? '提交中...' : '创建商品'}
          </button>
        </div>
      </form>
    </div>
  )
}
