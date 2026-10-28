import { BadRequestException, Injectable } from '@nestjs/common'
import { RedisService } from '../redis/redis.service'
import { PrismaService } from '../common/prisma/prisma.service'
import type { CartItemData, CartResponse } from '@web3-mall/shared'

const CART_TTL = 60 * 60 * 24 * 7 // 7 天

@Injectable()
export class CartService {
  constructor(
    private readonly redis: RedisService,
    private readonly prisma: PrismaService,
  ) {}

  private cartKey(userId: string): string {
    return `cart:${userId}`
  }

  async getCart(userId: string): Promise<CartResponse> {
    const raw = await this.redis.getClient().get(this.cartKey(userId))
    const items: { listingId: string; quantity: number }[] = raw ? JSON.parse(raw) : []

    const enriched = await this.enrichItems(items)
    const totalAmount = enriched.reduce((sum, item) => sum + item.price * item.quantity, 0)
    const currency = enriched[0]?.currency ?? 'CNY'
    const region = enriched[0]?.region ?? 'CN'

    return { items: enriched, totalAmount, currency, region }
  }

  async addItem(userId: string, listingId: string, quantity: number): Promise<CartResponse> {
    const raw = await this.redis.getClient().get(this.cartKey(userId))
    const items: { listingId: string; quantity: number }[] = raw ? JSON.parse(raw) : []

    const listing = await this.prisma.productListing.findUnique({ where: { id: BigInt(listingId) } })
    if (!listing || !listing.isActive) {
      throw new BadRequestException('商品不存在或未上架')
    }

    if (items.length > 0) {
      const existing = await this.enrichItems(items)
      const currentRegion = existing[0]?.region
      if (currentRegion && currentRegion !== listing.region) {
        throw new BadRequestException('大陆商品和海外商品要分开下单，请先清空购物车')
      }
    }

    const existingItem = items.find((i) => i.listingId === listingId)
    if (existingItem) {
      existingItem.quantity += quantity
    } else {
      items.push({ listingId, quantity })
    }

    await this.redis.getClient().setex(this.cartKey(userId), CART_TTL, JSON.stringify(items))
    return this.getCart(userId)
  }

  async updateQuantity(userId: string, listingId: string, quantity: number): Promise<CartResponse> {
    const raw = await this.redis.getClient().get(this.cartKey(userId))
    const items: { listingId: string; quantity: number }[] = raw ? JSON.parse(raw) : []

    const item = items.find((i) => i.listingId === listingId)
    if (item) {
      item.quantity = quantity
    }

    await this.redis.getClient().setex(this.cartKey(userId), CART_TTL, JSON.stringify(items))
    return this.getCart(userId)
  }

  async removeItem(userId: string, listingId: string): Promise<CartResponse> {
    const raw = await this.redis.getClient().get(this.cartKey(userId))
    const items: { listingId: string; quantity: number }[] = raw ? JSON.parse(raw) : []

    const filtered = items.filter((i) => i.listingId !== listingId)
    await this.redis.getClient().setex(this.cartKey(userId), CART_TTL, JSON.stringify(filtered))
    return this.getCart(userId)
  }

  async clearCart(userId: string): Promise<void> {
    await this.redis.getClient().del(this.cartKey(userId))
  }

  async getCartItems(userId: string): Promise<{ listingId: string; quantity: number }[]> {
    const raw = await this.redis.getClient().get(this.cartKey(userId))
    return raw ? JSON.parse(raw) : []
  }

  private async enrichItems(
    items: { listingId: string; quantity: number }[],
  ): Promise<CartItemData[]> {
    if (items.length === 0) return []

    const listingIds = items.map((i) => BigInt(i.listingId))
    const listings = await this.prisma.productListing.findMany({
      where: { id: { in: listingIds } },
      include: {
        product: { select: { id: true, nameCn: true, nameEn: true, images: true } },
      },
    })

    const listingMap = new Map(listings.map((l) => [String(l.id), l]))

    return items
      .map((item) => {
        const listing = listingMap.get(item.listingId)
        if (!listing) return null
        const product = listing.product
        const images = (product.images as any[]) ?? []
        return {
          listingId: item.listingId,
          productId: String(product.id),
          nameCn: product.nameCn ?? undefined,
          nameEn: product.nameEn ?? undefined,
          image: images[0]?.url,
          sku: listing.sku,
          price: Number(listing.price),
          currency: listing.currency,
          quantity: item.quantity,
          stock: listing.stock,
          region: listing.region,
        }
      })
      .filter(Boolean) as CartItemData[]
  }
}
