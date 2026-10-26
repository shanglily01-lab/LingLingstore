export const PRODUCT_IMAGE_COUNT = 4

export type ProductImageItem = {
  url: string
  sort: number
  alt_cn?: string
  alt_en?: string
}

export function parseProductImages(images: unknown): ProductImageItem[] {
  if (!images || !Array.isArray(images)) return []
  const parsed: ProductImageItem[] = []
  for (const raw of images) {
    if (typeof raw === 'string' && raw) {
      parsed.push({ url: raw, sort: parsed.length + 1 })
      continue
    }
    if (typeof raw === 'object' && raw !== null && 'url' in raw) {
      const item = raw as { url?: string; sort?: number; alt_cn?: string; alt_en?: string }
      if (item.url) {
        parsed.push({
          url: item.url,
          sort: item.sort ?? parsed.length + 1,
          alt_cn: item.alt_cn,
          alt_en: item.alt_en,
        })
      }
    }
  }
  return parsed
    .sort((a, b) => a.sort - b.sort)
    .slice(0, PRODUCT_IMAGE_COUNT)
}

export function getProductImageUrls(images: unknown): string[] {
  return parseProductImages(images).map((i) => i.url)
}

/** 列表/卡片用首图 */
export function getProductImageUrl(images: unknown): string | null {
  return getProductImageUrls(images)[0] ?? null
}

/** 后台表单：固定 4 个 URL 槽位 */
export function imageUrlsToFormSlots(urls: string[]): string[] {
  const slots = urls.slice(0, PRODUCT_IMAGE_COUNT)
  while (slots.length < PRODUCT_IMAGE_COUNT) slots.push('')
  return slots
}

export function formSlotsToImages(urls: string[], alt?: { cn?: string; en?: string }): ProductImageItem[] {
  return urls
    .map((url) => url.trim())
    .filter(Boolean)
    .slice(0, PRODUCT_IMAGE_COUNT)
    .map((url, i) => ({
      url,
      sort: i + 1,
      ...(alt?.cn ? { alt_cn: alt.cn } : {}),
      ...(alt?.en ? { alt_en: alt.en } : {}),
    }))
}
