'use client'

import { useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { api } from '@/lib/api'
import {
  PRODUCT_IMAGE_COUNT,
  formSlotsToImages,
  imageUrlsToFormSlots,
  type ProductImageItem,
} from '@/lib/product-image'
import { label } from '@/components/ui/stitch'

type ProductImageFieldsProps = {
  urls: string[]
  onChange: (urls: string[]) => void
  nameCn?: string
  nameEn?: string
}

const MAX_BYTES = 5 * 1024 * 1024

export function ProductImageFields({ urls, onChange }: ProductImageFieldsProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const slots = imageUrlsToFormSlots(urls)
  const filled = slots.filter((url) => url.trim()).length

  const uploadFiles = async (list: FileList | null) => {
    if (!list?.length) return
    const next = [...slots]
    setUploading(true)
    try {
      for (const file of Array.from(list)) {
        const index = next.findIndex((url) => !url.trim())
        if (index === -1) {
          toast.error(`最多上传 ${PRODUCT_IMAGE_COUNT} 张图片`)
          break
        }
        if (!file.type.startsWith('image/')) {
          toast.error(`${file.name} 不是图片`)
          continue
        }
        if (file.size > MAX_BYTES) {
          toast.error(`${file.name} 超过 5MB`)
          continue
        }
        const { url } = await api.admin.products.uploadImage(file)
        next[index] = url
        onChange([...next])
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : '图片上传失败')
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  const removeAt = (index: number) => {
    const next = slots.filter((_, i) => i !== index)
    onChange(next)
  }

  return (
    <div className="space-y-3 sm:col-span-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label className={label}>商品图片</label>
        <span className="text-xs text-on-surface-variant">
          已上传 {filled} / {PRODUCT_IMAGE_COUNT}
        </span>
      </div>
      <p className="text-xs text-on-surface-variant">直接上传图片，至少 1 张，最多 6 张。支持 JPG、PNG、WEBP、GIF，单张不超过 5MB。</p>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        multiple
        className="hidden"
        onChange={(e) => uploadFiles(e.target.files)}
      />
      <button
        type="button"
        disabled={uploading || filled >= PRODUCT_IMAGE_COUNT}
        onClick={() => inputRef.current?.click()}
        className="rounded-full border border-[#fcd200] bg-cart px-4 py-2 text-sm font-medium text-on-surface hover:bg-[#f7ca00] disabled:opacity-50"
      >
        {uploading ? '上传中...' : '上传图片'}
      </button>
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
        {slots.map((url, i) => (
          <div key={i} className="space-y-1">
            <div className="flex aspect-square items-center justify-center overflow-hidden border border-dashed border-outline-variant bg-white">
              {url ? (
                <img src={url} alt="" className="h-full w-full object-contain" />
              ) : (
                <span className="text-xs text-on-surface-variant">{i + 1}</span>
              )}
            </div>
            {url ? (
              <button type="button" onClick={() => removeAt(i)} className="text-xs text-error hover:underline">
                移除
              </button>
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
