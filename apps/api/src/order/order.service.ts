import { Injectable, BadRequestException, ForbiddenException } from '@nestjs/common'
import { PrismaService } from '../common/prisma/prisma.service'
import { CartService } from '../cart/cart.service'
import { nanoid } from 'nanoid'

@Injectable()
export class OrderService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cart: CartService,
  ) {}

  async createOrder(
    userId: bigint,
    params: {
      shippingAddressId: string
      paymentChannel: string
      items: { listingId: string; quantity: number }[]
      note?: string
    },
  ) {
    const address = await this.prisma.shippingAddress.findUnique({
      where: { id: BigInt(params.shippingAddressId) },
    })
    if (!address || address.userId !== userId) {
      throw new BadRequestException('收货地址无效')
    }

    const listingIds = params.items.map((i) => BigInt(i.listingId))
    const listings = await this.prisma.productListing.findMany({
      where: { id: { in: listingIds }, isActive: true },
      include: { product: { select: { id: true, spuNo: true, nameCn: true, nameEn: true, images: true } } },
    })

    if (listings.length !== params.items.length) {
      throw new BadRequestException('部分商品不存在或未上架')
    }

    const region = listings[0]?.region
    if (!region || listings.some((listing) => listing.region !== region)) {
      throw new BadRequestException('大陆商品和海外商品要分开下单')
    }

    const allowedChannels = region === 'CN' ? ['alipay', 'wechat'] : ['overseas']
    if (!allowedChannels.includes(params.paymentChannel)) {
      throw new ForbiddenException(region === 'CN' ? '大陆销售只支持微信和支付宝' : '海外销售通过海外账户收款')
    }

    const listingMap = new Map(listings.map((l) => [String(l.id), l]))

    // 检查库存 & 计算
    let subtotal = BigInt(0)
    const orderItemsData: {
      listingId: bigint
      productId: bigint
      quantity: number
      unitPrice: bigint
      subtotal: bigint
      productSnapshot: any
    }[] = []

    for (const item of params.items) {
      const listing = listingMap.get(item.listingId)
      if (!listing) throw new BadRequestException(`商品 ${item.listingId} 不存在`)

      const availableStock = listing.stock - listing.reservedStock
      if (availableStock < item.quantity) {
        throw new BadRequestException(`商品 ${listing.sku} 库存不足 (剩余 ${availableStock})`)
      }

      const price = listing.price
      const itemSubtotal = price * BigInt(item.quantity)
      subtotal += itemSubtotal

      orderItemsData.push({
        listingId: listing.id,
        productId: listing.product.id,
        quantity: item.quantity,
        unitPrice: price,
        subtotal: itemSubtotal,
        productSnapshot: {
          spuNo: listing.product.spuNo,
          nameCn: listing.product.nameCn,
          nameEn: listing.product.nameEn,
          image: ((listing.product.images as any[]) ?? [])[0]?.url,
          sku: listing.sku,
        },
      })
    }

    // 运费 (MVP 固定值)
    const shippingFee = region === 'CN' ? BigInt(800) : BigInt(2500) // ¥8 / $25
    const totalAmount = subtotal + shippingFee
    const currency = region === 'CN' ? 'CNY' : 'USD'

    const orderNo = `ORD${Date.now()}${nanoid(8).toUpperCase()}`
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000) // 30分钟

    // 创建订单（事务）
    const order = await this.prisma.$transaction(async (tx) => {
      // 扣减库存
      for (const item of params.items) {
        const listing = listingMap.get(item.listingId)!
        await tx.productListing.update({
          where: { id: listing.id },
          data: { reservedStock: { increment: item.quantity } },
        })
      }

      return tx.order.create({
        data: {
          orderNo,
          userId,
          region,
          status: 'pending',
          subtotal: Number(subtotal),
          shippingFee: Number(shippingFee),
          totalAmount: Number(totalAmount),
          currency,
          shippingAddressSnapshot: {
            recipientName: address.recipientName,
            phone: address.phone,
            countryCode: address.countryCode,
            stateProvince: address.stateProvince,
            city: address.city,
            district: address.district,
            streetAddress: address.streetAddress,
            postalCode: address.postalCode,
          } as any,
          paymentChannel: params.paymentChannel,
          expiresAt,
          items: {
            create: orderItemsData.map((item) => ({
              productId: item.productId,
              listingId: item.listingId,
              productSnapshot: item.productSnapshot,
              quantity: item.quantity,
              unitPrice: Number(item.unitPrice),
              subtotal: Number(item.subtotal),
            })),
          },
        },
        include: {
          items: true,
        },
      })
    })

    // 清空购物车相关商品
    await this.cart.clearCart(String(userId))

    return {
      id: String(order.id),
      orderNo: order.orderNo,
      status: order.status,
      subtotal: Number(order.subtotal),
      shippingFee: Number(order.shippingFee),
      totalAmount: Number(order.totalAmount),
      currency: order.currency,
      paymentChannel: order.paymentChannel ?? undefined,
      createdAt: order.createdAt.toISOString(),
      expiresAt: order.expiresAt.toISOString(),
      items: order.items.map((item) => ({
        id: String(item.id),
        productName: (item.productSnapshot as any)?.nameCn ?? '',
        image: (item.productSnapshot as any)?.image,
        sku: (item.productSnapshot as any)?.sku ?? '',
        price: Number(item.unitPrice),
        quantity: item.quantity,
        subtotal: Number(item.subtotal),
      })),
    }
  }

  async getOrder(orderId: bigint, userId: bigint) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: true,
        shipmentTrackings: { orderBy: { id: 'desc' }, take: 1 },
      },
    })
    if (!order || order.userId !== userId) return null

    return this.mapOrder(order)
  }

  async confirmReceipt(orderId: bigint, userId: bigint) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } })
    if (!order || order.userId !== userId) throw new BadRequestException('订单不存在')
    if (order.status !== 'shipped') throw new BadRequestException('只能确认已发货订单')
    await this.prisma.order.update({
      where: { id: orderId },
      data: { status: 'completed', completedAt: new Date() },
    })
    return { ok: true }
  }

  async requestRefund(orderId: bigint, userId: bigint, reason?: string) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } })
    if (!order || order.userId !== userId) throw new BadRequestException('订单不存在')
    if (!['paid', 'shipped', 'completed'].includes(order.status)) {
      throw new BadRequestException('当前订单状态不可申请退款')
    }
    const refundNo = `REF${Date.now()}${nanoid(6).toUpperCase()}`
    await this.prisma.$transaction([
      this.prisma.refund.create({
        data: {
          refundNo,
          orderId,
          amount: order.totalAmount,
          currency: order.currency,
          reason: reason ?? '用户申请退款',
          status: 'pending',
          channel: order.paymentChannel ?? undefined,
        },
      }),
      this.prisma.order.update({
        where: { id: orderId },
        data: { status: 'refund_pending' },
      }),
    ])
    return { ok: true, refundNo }
  }

  async getUserOrders(userId: bigint, page = 1, pageSize = 10, status?: string) {
    const skip = (page - 1) * pageSize
    const where: { userId: bigint; status?: string } = { userId }
    if (status) where.status = status

    const [items, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: { items: true },
      }),
      this.prisma.order.count({ where }),
    ])

    return {
      items: items.map((o) => this.mapOrder(o)),
      total,
      page,
      pageSize,
    }
  }

  async cancelOrder(orderId: bigint, userId: bigint) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    })
    if (!order || order.userId !== userId) {
      throw new BadRequestException('订单不存在')
    }
    if (order.status !== 'pending') {
      throw new BadRequestException('只能取消待支付订单')
    }

    await this.prisma.$transaction(async (tx) => {
      // 释放库存
      for (const item of order.items) {
        if (item.listingId) {
          await tx.productListing.update({
            where: { id: item.listingId },
            data: { reservedStock: { decrement: item.quantity } },
          })
        }
      }
      await tx.order.update({
        where: { id: orderId },
        data: { status: 'cancelled' },
      })
    })

    return { ok: true }
  }

  private mapOrder(order: any) {
    const tracking = order.shipmentTrackings?.[0]
    return {
      id: String(order.id),
      orderNo: order.orderNo,
      status: order.status,
      subtotal: Number(order.subtotal),
      shippingFee: Number(order.shippingFee),
      totalAmount: Number(order.totalAmount),
      currency: order.currency,
      paymentChannel: order.paymentChannel ?? undefined,
      trackingNo: order.trackingNo ?? undefined,
      shippingAddressSnapshot: order.shippingAddressSnapshot ?? undefined,
      paidAt: order.paidAt?.toISOString(),
      shippedAt: order.shippedAt?.toISOString(),
      completedAt: order.completedAt?.toISOString(),
      createdAt: order.createdAt.toISOString(),
      expiresAt: order.expiresAt.toISOString(),
      shipment: tracking
        ? {
            carrier: tracking.carrier ?? undefined,
            trackingNo: tracking.trackingNo,
            status: tracking.status ?? undefined,
            events: (tracking.events as any[]) ?? undefined,
          }
        : undefined,
      items: order.items.map((item: any) => ({
        id: String(item.id),
        productName: item.productSnapshot?.nameCn ?? '',
        image: item.productSnapshot?.image,
        sku: item.productSnapshot?.sku ?? '',
        price: Number(item.unitPrice),
        quantity: item.quantity,
        subtotal: Number(item.subtotal),
      })),
    }
  }
}
