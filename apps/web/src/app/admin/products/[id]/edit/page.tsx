'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { api } from '@/lib/api'
import type { AdminCategoryData } from '@web3-mall/shared'
import toast from 'react-hot-toast'
import { AdminFormSection } from '@/components/admin-form-section'
import { AdminPageHeader } from '@/components/admin-page-header'
import { LoadingSpinner } from '@/components/loading-spinner'
import { ProductImageFields, ProductVideoFields, buildProductImagesPayload, buildProductVideosPayload } from '@/components/product-image-fields'
import { getProductImageUrls, imageUrlsToFormSlots, PRODUCT_IMAGE_COUNT } from '@/lib/product-image'
import { getProductVideoUrls, videoUrlsToFormSlots } from '@/lib/product-video'
import { btnGhost, btnPrimary, card, input, label, link, select, textarea } from '@/components/ui/stitch'

export default function EditProductPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  const [categories, setCategories] = useState<AdminCategoryData[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [notFound, setNotFound] = useState(false)
  const [form, setForm] = useState({
    nameCn: '',
    nameEn: '',
    descriptionCn: '',
    descriptionEn: '',
    categoryId: '',
    status: 'active',
    imageUrls: ['', '', '', '', '', ''],
    videoUrls: ['', ''],
    cnListingId: '',
    cnPrice: '',
    cnStock: '',
    cnActive: true,
    usListingId: '',
    usPrice: '',
    usStock: '',
    usActive: true,
  })

  useEffect(() => {
    api.admin.categories.list().then(setCategories).catch(() => {})
  }, [])

  useEffect(() => {
    api.admin.products
      .get(id)
      .then((p) => {
        setForm((f) => ({
          ...f,
          nameCn: p.nameCn || '',
          nameEn: p.nameEn || '',
          descriptionCn: p.descriptionCn || '',
          descriptionEn: p.descriptionEn || '',
          categoryId: p.categoryId || '',
          status: p.status || 'active',
          imageUrls: imageUrlsToFormSlots(getProductImageUrls(p.images)),
          videoUrls: videoUrlsToFormSlots(getProductVideoUrls(p.videos)),
        }))
        if (p.listings) {
          p.listings.forEach((l: { id: string; region: string; price: number; stock: number; isActive: boolean }) => {
            if (l.region === 'CN') {
              setForm((f) => ({
                ...f,
                cnListingId: l.id,
                cnPrice: String(l.price / 100),
                cnStock: String(l.stock),
                cnActive: l.isActive,
              }))
            } else {
              setForm((f) => ({
                ...f,
                usListingId: l.id,
                usPrice: String(l.price / 100),
                usStock: String(l.stock),
                usActive: l.isActive,
              }))
            }
          })
        }
        setLoading(false)
      })
      .catch(() => {
        setNotFound(true)
        setLoading(false)
      })
  }, [id])

  const update =
    (k: string) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
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
      await api.admin.products.update(id, {
        nameCn: form.nameCn || undefined,
        nameEn: form.nameEn || undefined,
        descriptionCn: form.descriptionCn || undefined,
        descriptionEn: form.descriptionEn || undefined,
        categoryId: form.categoryId || undefined,
        status: form.status || undefined,
        images: buildProductImagesPayload(form.imageUrls, form.nameCn, form.nameEn),
        videos: buildProductVideosPayload(form.videoUrls),
      })
      if (form.cnListingId) {
        await api.admin.products.updateListing(form.cnListingId, {
          price: Math.round(parseFloat(form.cnPrice || '0') * 100),
          stock: parseInt(form.cnStock || '0', 10),
          isActive: form.cnActive,
        })
      }
      if (form.usListingId) {
        await api.admin.products.updateListing(form.usListingId, {
          price: Math.round(parseFloat(form.usPrice || '0') * 100),
          stock: parseInt(form.usStock || '0', 10),
          isActive: form.usActive,
        })
      }
      toast.success('保存成功')
      router.push('/admin/products')
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : '保存失败')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <LoadingSpinner className="py-12" />

  if (notFound) {
    return (
      <div className="p-12 text-center text-on-surface-variant">
        商品不存在{' '}
        <Link href="/admin/products" className={link}>
          返回列表
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <AdminPageHeader
        title="编辑商品"
        subtitle={`ID: ${id}`}
        action={
          <Link href="/admin/products" className={link + ' text-sm'}>
            返回列表
          </Link>
        }
      />

      <form onSubmit={handleSubmit} className={card + ' space-y-6 p-6'}>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={label}>中文名称</label>
            <input type="text" value={form.nameCn} onChange={update('nameCn')} className={input} />
          </div>
          <div>
            <label className={label}>英文名称</label>
            <input type="text" value={form.nameEn} onChange={update('nameEn')} className={input} />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={label}>中文描述</label>
            <textarea rows={3} value={form.descriptionCn} onChange={update('descriptionCn')} className={textarea} />
          </div>
          <div>
            <label className={label}>英文描述</label>
            <textarea rows={3} value={form.descriptionEn} onChange={update('descriptionEn')} className={textarea} />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className={label}>分类</label>
            <select value={form.categoryId} onChange={update('categoryId')} className={select + ' mt-1 block w-full'}>
              <option value="">无分类</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nameCn}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={label}>状态</label>
            <select value={form.status} onChange={update('status')} className={select + ' mt-1 block w-full'}>
              <option value="active">上架</option>
              <option value="archived">下架</option>
            </select>
          </div>
        </div>

        <ProductImageFields
          urls={form.imageUrls}
          onChange={(imageUrls) => setForm((f) => ({ ...f, imageUrls }))}
          nameCn={form.nameCn}
          nameEn={form.nameEn}
        />

        <ProductVideoFields
          urls={form.videoUrls}
          onChange={(videoUrls) => setForm((f) => ({ ...f, videoUrls }))}
        />

        <AdminFormSection title="大陆销售（人民币，微信 / 支付宝）">
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className={label}>价格 (元)</label>
              <input type="number" step="0.01" value={form.cnPrice} onChange={update('cnPrice')} className={input} />
            </div>
            <div>
              <label className={label}>库存</label>
              <input type="number" value={form.cnStock} onChange={update('cnStock')} className={input} />
            </div>
            <div>
              <label className={label}>活跃</label>
              <select
                value={String(form.cnActive)}
                onChange={(e) => setForm((f) => ({ ...f, cnActive: e.target.value === 'true' }))}
                className={select + ' mt-1 block w-full'}
              >
                <option value="true">是</option>
                <option value="false">否</option>
              </select>
            </div>
          </div>
        </AdminFormSection>

        <AdminFormSection title="海外销售（美元，海外账户）">
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className={label}>价格 (美元)</label>
              <input type="number" step="0.01" value={form.usPrice} onChange={update('usPrice')} className={input} />
            </div>
            <div>
              <label className={label}>库存</label>
              <input type="number" value={form.usStock} onChange={update('usStock')} className={input} />
            </div>
            <div>
              <label className={label}>活跃</label>
              <select
                value={String(form.usActive)}
                onChange={(e) => setForm((f) => ({ ...f, usActive: e.target.value === 'true' }))}
                className={select + ' mt-1 block w-full'}
              >
                <option value="true">是</option>
                <option value="false">否</option>
              </select>
            </div>
          </div>
        </AdminFormSection>

        <div className="flex items-center justify-end gap-3 border-t border-outline-variant/20 pt-4">
          <Link href="/admin/products" className={btnGhost}>
            取消
          </Link>
          <button type="submit" disabled={submitting} className={btnPrimary}>
            {submitting ? '保存中...' : '保存修改'}
          </button>
        </div>
      </form>
    </div>
  )
}
