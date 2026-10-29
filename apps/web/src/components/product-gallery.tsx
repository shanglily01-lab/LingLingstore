'use client'

import { useState } from 'react'
import Link from 'next/link'
import { clsx } from 'clsx'
import { getProductImageUrls } from '@/lib/product-image'
import { getProductVideoUrls } from '@/lib/product-video'

type MediaItem = { kind: 'image' | 'video'; url: string }

type ProductGalleryProps = {
  images: unknown
  videos?: unknown
  alt: string
  /** 大图可点进商品详情。缩略图只切换大图。 */
  href?: string
  /** below：大图在上、小图在下。side：桌面端小图在左侧，和亚马逊商品页一致。 */
  thumbs?: 'below' | 'side'
}

export function ProductGallery({ images, videos, alt, href, thumbs = 'side' }: ProductGalleryProps) {
  const media: MediaItem[] = [
    ...getProductImageUrls(images).map((url) => ({ kind: 'image' as const, url })),
    ...getProductVideoUrls(videos).map((url) => ({ kind: 'video' as const, url })),
  ]
  const [active, setActive] = useState(0)
  const [playVideo, setPlayVideo] = useState(false)
  const current = active < media.length ? active : 0
  const main = media[current]
  const rest = media.map((item, index) => ({ item, index })).filter(({ index }) => index !== current)

  if (!main) {
    const empty = (
      <div className="flex aspect-square items-center justify-center bg-white">
        <span className="text-6xl">📦</span>
      </div>
    )
    return href ? <Link href={href}>{empty}</Link> : empty
  }

  const stage = (
    <div className="flex aspect-square items-center justify-center overflow-hidden bg-white">
      {main.kind === 'image' ? (
        <img src={main.url} alt={alt} className="h-full w-full object-contain" />
      ) : (
        <video
          key={main.url}
          src={main.url}
          controls
          playsInline
          autoPlay={playVideo}
          className="h-full w-full bg-black object-contain"
        />
      )}
    </div>
  )

  return (
    <div className={clsx('flex gap-2', thumbs === 'side' ? 'flex-col md:flex-row' : 'flex-col')}>
      <div className={clsx('min-w-0 flex-1', thumbs === 'side' && 'md:order-2')}>
        {href && main.kind === 'image' ? <Link href={href}>{stage}</Link> : stage}
      </div>
      {rest.length > 0 ? (
        <div
          className={clsx(
            'flex gap-1.5',
            thumbs === 'side' ? 'overflow-x-auto md:order-1 md:w-16 md:flex-col md:overflow-visible' : 'overflow-x-auto',
          )}
        >
          {rest.map(({ item, index }) => (
            <button
              key={`${item.kind}-${item.url}-${index}`}
              type="button"
              aria-label={item.kind === 'image' ? `查看图片 ${index + 1}` : `播放视频`}
              onClick={() => {
                setActive(index)
                setPlayVideo(item.kind === 'video')
              }}
              className="relative h-14 w-14 shrink-0 overflow-hidden border border-[#d5d9d9] bg-white hover:border-[#e77600] md:h-16 md:w-16"
            >
              {item.kind === 'image' ? (
                <img src={item.url} alt="" className="h-full w-full object-cover" />
              ) : (
                <>
                  <video src={item.url} muted preload="metadata" className="h-full w-full object-cover" />
                  <span className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/40 text-sm text-white">
                    ▶
                  </span>
                </>
              )}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}
