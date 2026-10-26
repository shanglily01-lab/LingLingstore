'use client'

import {
  PRODUCT_IMAGE_COUNT,
  formSlotsToImages,
  imageUrlsToFormSlots,
  type ProductImageItem,
} from '@/lib/product-image'
import { input, label } from '@/components/ui/stitch'

type ProductImageFieldsProps = {
  urls: string[]
  onChange: (urls: string[]) => void
  nameCn?: string
  nameEn?: string
}

export function ProductImageFields({ urls, onChange }: ProductImageFieldsProps) {
  const slots = imageUrlsToFormSlots(urls)

  const setSlot = (index: number, value: string) => {
    const next = [...slots]
    next[index] = value
    onChange(next)
  }

  return (
    <div className="space-y-3 sm:col-span-2">
      <label className={label}>商品图片（{PRODUCT_IMAGE_COUNT} 张）</label>
      <p className="text-xs text-on-surface-variant">请填写 4 张图片 URL，前台详情页将展示图库。</p>
      <div className="grid gap-4 sm:grid-cols-2">
        {slots.map((url, i) => (
          <div key={i} className="space-y-2">
            <label className="text-xs font-medium text-on-surface-variant">图片 {i + 1}</label>
            <input
              type="url"
              value={url}
              onChange={(e) => setSlot(i, e.target.value)}
              placeholder="https://..."
              className={input + ' mt-0'}
            />
            {url ? (
              <div className="aspect-square overflow-hidden border border-outline-variant/20 bg-surface-container-low">
                <img src={url} alt="" className="h-full w-full object-cover" />
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  )
}

export function buildProductImagesPayload(
  urls: string[],
  nameCn?: string,
  nameEn?: string,
): ProductImageItem[] {
  return formSlotsToImages(urls, { cn: nameCn, en: nameEn })
}
