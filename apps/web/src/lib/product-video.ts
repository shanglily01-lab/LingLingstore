export const PRODUCT_VIDEO_COUNT = 2
export const PRODUCT_VIDEO_MAX_SECONDS = 60

export type ProductVideoItem = {
  url: string
  sort: number
}

export function parseProductVideos(videos: unknown): ProductVideoItem[] {
  if (!Array.isArray(videos)) return []
  const parsed: ProductVideoItem[] = []
  for (const raw of videos) {
    if (typeof raw === 'string' && raw) {
      parsed.push({ url: raw, sort: parsed.length + 1 })
      continue
    }
    if (typeof raw === 'object' && raw !== null && 'url' in raw) {
      const item = raw as { url?: string; sort?: number }
      if (item.url) parsed.push({ url: item.url, sort: item.sort ?? parsed.length + 1 })
    }
  }
  return parsed.sort((a, b) => a.sort - b.sort).slice(0, PRODUCT_VIDEO_COUNT)
}

export function getProductVideoUrls(videos: unknown): string[] {
  return parseProductVideos(videos).map((item) => item.url)
}

export function videoUrlsToFormSlots(urls: string[]): string[] {
  const slots = urls.slice(0, PRODUCT_VIDEO_COUNT)
  while (slots.length < PRODUCT_VIDEO_COUNT) slots.push('')
  return slots
}

export function formSlotsToVideos(urls: string[]): ProductVideoItem[] {
  return urls
    .map((url) => url.trim())
    .filter(Boolean)
    .slice(0, PRODUCT_VIDEO_COUNT)
    .map((url, index) => ({ url, sort: index + 1 }))
}
