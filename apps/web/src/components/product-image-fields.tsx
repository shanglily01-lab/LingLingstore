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
import {
  PRODUCT_VIDEO_COUNT,
  PRODUCT_VIDEO_MAX_SECONDS,
  formSlotsToVideos,
  videoUrlsToFormSlots,
} from '@/lib/product-video'

export function ProductVideoFields({ urls, onChange }: { urls: string[]; onChange: (urls: string[]) => void }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const slots = videoUrlsToFormSlots(urls)
  const filled = slots.filter((url) => url.trim()).length

  const readDuration = (file: File) =>
    new Promise<number>((resolve, reject) => {
      const video = document.createElement('video')
      const objectUrl = URL.createObjectURL(file)
      video.preload = 'metadata'
      video.onloadedmetadata = () => {
        const duration = video.duration
        URL.revokeObjectURL(objectUrl)
        resolve(duration)
      }
      video.onerror = () => {
        URL.revokeObjectURL(objectUrl)
        reject(new Error('无法读取视频'))
      }
      video.src = objectUrl
    })

  const uploadFiles = async (list: FileList | null) => {
    if (!list?.length) return
    const next = [...slots]
    setUploading(true)
    try {
      for (const file of Array.from(list)) {
        const index = next.findIndex((url) => !url.trim())
        if (index === -1) {
          toast.error(`最多上传 ${PRODUCT_VIDEO_COUNT} 个短视频`)
          break
        }
        if (!file.type.startsWith('video/')) {
          toast.error(`${file.name} 不是视频`)
          continue
        }
        if (file.size > 30 * 1024 * 1024) {
          toast.error(`${file.name} 超过 30MB`)
          continue
        }
        try {
          const duration = await readDuration(file)
          if (Number.isFinite(duration) && duration > PRODUCT_VIDEO_MAX_SECONDS) {
            toast.error(`${file.name} 超过 ${PRODUCT_VIDEO_MAX_SECONDS} 秒`)
            continue
          }
        } catch {
          toast.error(`${file.name} 无法读取，请换一个 MP4`)
          continue
        }
        const { url } = await api.admin.products.uploadVideo(file)
        next[index] = url
        onChange([...next])
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : '视频上传失败')
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  const removeAt = (index: number) => {
    onChange(slots.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-3 sm:col-span-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label className={label}>商品短视频</label>
        <span className="text-xs text-on-surface-variant">
          已上传 {filled} / {PRODUCT_VIDEO_COUNT}
        </span>
      </div>
      <p className="text-xs text-on-surface-variant">
        可选。最多 2 个，每个不超过 60 秒、30MB。支持 MP4、WEBM、MOV。
      </p>
      <input
        ref={inputRef}
        type="file"
        accept="video/mp4,video/webm,video/quicktime"
        multiple
        className="hidden"
        onChange={(e) => uploadFiles(e.target.files)}
      />
      <button
        type="button"
        disabled={uploading || filled >= PRODUCT_VIDEO_COUNT}
        onClick={() => inputRef.current?.click()}
        className="rounded-full border border-[#fcd200] bg-cart px-4 py-2 text-sm font-medium text-on-surface hover:bg-[#f7ca00] disabled:opacity-50"
      >
        {uploading ? '上传中...' : '上传短视频'}
      </button>
      <div className="grid gap-3 sm:grid-cols-2">
        {slots.map((url, i) => (
          <div key={i} className="space-y-1">
            <div className="flex aspect-video items-center justify-center overflow-hidden border border-dashed border-outline-variant bg-white">
              {url ? (
                <video src={url} controls className="h-full w-full bg-black object-contain" />
              ) : (
                <span className="text-xs text-on-surface-variant">视频 {i + 1}</span>
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

export function buildProductVideosPayload(urls: string[]) {
  return formSlotsToVideos(urls)
}

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
