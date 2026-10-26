import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../common/prisma/prisma.service'
import { nanoid } from 'nanoid'

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboard() {
    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

    const [totalProducts, totalOrders, totalUsers, ordersToday, ordersMonth, pendingOrders, lowStockItems] = await Promise.all([
      this.prisma.product.count({ where: { status: 'active' } }),
      this.prisma.order.count(),
      this.prisma.user.count(),
      this.prisma.order.aggregate({ where: { createdAt: { gte: todayStart }, status: { notIn: ['cancelled', 'expired'] } }, _sum: { totalAmount: true } }),
      this.prisma.order.aggregate({ where: { createdAt: { gte: monthStart }, status: { notIn: ['cancelled', 'expired'] } }, _sum: { totalAmount: true } }),
      this.prisma.order.count({ where: { status: 'paid' } }),
      this.prisma.productListing.count({ where: { stock: { lte: 10 }, isActive: true } }),
    ])

    return {
      totalProducts,
      totalOrders,
      totalUsers,
      revenueToday: Number(ordersToday._sum.totalAmount ?? 0),
      revenueMonth: Number(ordersMonth._sum.totalAmount ?? 0),
      pendingOrders,
      lowStockItems,
    }
  }

  async listProducts(page = 1, pageSize = 20, filters: { status?: string; categoryId?: string; keyword?: string }) {
    const where: any = {}
    if (filters.status) where.status = filters.status
    if (filters.categoryId) where.categoryId = BigInt(filters.categoryId)
    if (filters.keyword) {
      where.OR = [
        { nameCn: { contains: filters.keyword } },
        { nameEn: { contains: filters.keyword } },
        { spuNo: { contains: filters.keyword } },
      ]
    }

    const [items, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: { category: { select: { nameCn: true, nameEn: true } }, listings: true },
      }),
      this.prisma.product.count({ where }),
    ])

    return {
      items: items.map((p) => {
        const cnListing = p.listings.find((l) => l.region === 'CN')
        const usListing = p.listings.find((l) => l.region === 'OVERSEAS')
        return {
          id: String(p.id),
          spuNo: p.spuNo,
          nameCn: p.nameCn ?? undefined,
          nameEn: p.nameEn ?? undefined,
          categoryId: p.categoryId ? String(p.categoryId) : undefined,
          categoryName: p.category?.nameCn ?? p.category?.nameEn ?? undefined,
          status: p.status,
          createdAt: p.createdAt.toISOString(),
          image: Array.isArray(p.images) && p.images.length > 0 ? (p.images[0] as any).url : undefined,
          cnPrice: cnListing?.price != null ? Number(cnListing.price) : undefined,
          usPrice: usListing?.price != null ? Number(usListing.price) : undefined,
          cnStock: cnListing?.stock,
          usStock: usListing?.stock,
        }
      }),
      total, page, pageSize,
    }
  }

  async getProduct(id: bigint) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: { category: { select: { id: true, nameCn: true, nameEn: true } }, listings: true },
    })
    if (!product) throw new NotFoundException('商品不存在')
    return {
      id: String(product.id),
      spuNo: product.spuNo,
      nameCn: product.nameCn ?? undefined,
      nameEn: product.nameEn ?? undefined,
      descriptionCn: product.descriptionCn ?? undefined,
      descriptionEn: product.descriptionEn ?? undefined,
      categoryId: product.categoryId ? String(product.categoryId) : undefined,
      categoryName: product.category?.nameCn ?? product.category?.nameEn ?? undefined,
      images: product.images as any[] | undefined,
      status: product.status,
      createdAt: product.createdAt.toISOString(),
      updatedAt: product.updatedAt.toISOString(),
      listings: product.listings.map((l) => ({
        id: String(l.id),
        productId: String(l.productId),
        region: l.region,
        sku: l.sku,
        price: Number(l.price),
        currency: l.currency,
        stock: l.stock,
        isActive: l.isActive,
      })),
    }
  }

  private assertFourImages(images?: unknown[]) {
    const count = Array.isArray(images) ? images.filter((i) => i && (i as { url?: string }).url).length : 0
    if (count < 4) {
      throw new BadRequestException('每个商品需要 4 张图片')
    }
  }

  async createProduct(data: {
    nameCn: string; nameEn: string; descriptionCn?: string; descriptionEn?: string;
    categoryId?: string; images?: any[];
    listings: { region: string; sku: string; price: number; currency: string; stock: number }[]
  }) {
    this.assertFourImages(data.images)
    const timestamp = Date.now().toString(36).toUpperCase()
    const random = nanoid(6).toUpperCase()
    const spuNo = 'SPU' + timestamp + random

    const product = await this.prisma.product.create({
      data: {
        spuNo,
        nameCn: data.nameCn,
        nameEn: data.nameEn,
        descriptionCn: data.descriptionCn,
        descriptionEn: data.descriptionEn,
        categoryId: data.categoryId ? BigInt(data.categoryId) : null,
        images: data.images ?? [],
        listings: { create: data.listings.map((l) => ({ region: l.region, sku: l.sku, price: l.price, currency: l.currency, stock: l.stock })) },
      },
      include: { listings: true },
    })
    return { id: String(product.id), spuNo: product.spuNo, listings: product.listings.map((l) => ({ id: String(l.id), sku: l.sku, region: l.region })) }
  }

  async updateProduct(id: bigint, data: { nameCn?: string; nameEn?: string; descriptionCn?: string; descriptionEn?: string; categoryId?: string; images?: any[]; status?: string }) {
    if (data.images !== undefined) this.assertFourImages(data.images)
    const updateData: any = {}
    if (data.nameCn !== undefined) updateData.nameCn = data.nameCn
    if (data.nameEn !== undefined) updateData.nameEn = data.nameEn
    if (data.descriptionCn !== undefined) updateData.descriptionCn = data.descriptionCn
    if (data.descriptionEn !== undefined) updateData.descriptionEn = data.descriptionEn
    if (data.categoryId !== undefined) updateData.categoryId = data.categoryId ? BigInt(data.categoryId) : null
    if (data.images !== undefined) updateData.images = data.images
    if (data.status !== undefined) updateData.status = data.status
    return this.prisma.product.update({ where: { id }, data: updateData })
  }

  async deleteProduct(id: bigint) {
    await this.prisma.productListing.deleteMany({ where: { productId: id } })
    await this.prisma.product.delete({ where: { id } })
    return { ok: true }
  }

  async updateListing(id: bigint, data: { price?: number; stock?: number; isActive?: boolean }) {
    const updateData: any = {}
    if (data.price !== undefined) updateData.price = data.price
    if (data.stock !== undefined) updateData.stock = data.stock
    if (data.isActive !== undefined) updateData.isActive = data.isActive
    return this.prisma.productListing.update({ where: { id }, data: updateData })
  }

  async listCategories() {
    const categories = await this.prisma.productCategory.findMany({
      orderBy: { sortOrder: 'asc' },
      include: { _count: { select: { products: true } } },
    })
    return categories.map((c) => ({
      id: String(c.id),
      nameCn: c.nameCn ?? undefined,
      nameEn: c.nameEn ?? undefined,
      parentId: c.parentId ? String(c.parentId) : null,
      sortOrder: c.sortOrder,
      productCount: c._count.products,
    }))
  }

  async createCategory(data: { nameCn: string; nameEn?: string; parentId?: string; sortOrder?: number }) {
    return this.prisma.productCategory.create({
      data: { nameCn: data.nameCn, nameEn: data.nameEn, parentId: data.parentId ? BigInt(data.parentId) : null, sortOrder: data.sortOrder ?? 0 },
    })
  }

  async updateCategory(id: bigint, data: { nameCn?: string; nameEn?: string; sortOrder?: number }) {
    const updateData: any = {}
    if (data.nameCn !== undefined) updateData.nameCn = data.nameCn
    if (data.nameEn !== undefined) updateData.nameEn = data.nameEn
    if (data.sortOrder !== undefined) updateData.sortOrder = data.sortOrder
    return this.prisma.productCategory.update({ where: { id }, data: updateData })
  }

  async deleteCategory(id: bigint) {
    const productCount = await this.prisma.product.count({ where: { categoryId: id } })
    if (productCount > 0) {
      const msg = '该分类下有 ' + productCount + ' 个商品，请先移除商品再删除分类'
      throw new BadRequestException(msg)
    }
    await this.prisma.productCategory.delete({ where: { id } })
    return { ok: true }
  }

  async listOrders(page = 1, pageSize = 20, region?: string, status?: string) {
    const where: any = {}
    if (region) where.region = region
    if (status) where.status = status

    const [items, total] = await Promise.all([
      this.prisma.order.findMany({
        where, skip: (page - 1) * pageSize, take: pageSize, orderBy: { createdAt: 'desc' },
        include: { user: { select: { id: true, displayName: true, phone: true, email: true } } },
      }),
      this.prisma.order.count({ where }),
    ])

    return {
      items: items.map((o) => ({
        id: String(o.id), orderNo: o.orderNo,
        userName: o.user.displayName ?? o.user.phone ?? o.user.email,
        region: o.region, status: o.status,
        totalAmount: Number(o.totalAmount), currency: o.currency,
        paymentChannel: o.paymentChannel, trackingNo: o.trackingNo,
        createdAt: o.createdAt.toISOString(),
      })),
      total, page, pageSize,
    }
  }

  async getOrderDetail(id: bigint) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        items: true,
        user: { select: { id: true, displayName: true, phone: true, email: true, countryCode: true } },
      },
    })
    if (!order) throw new NotFoundException('订单不存在')
    return {
      id: String(order.id),
      orderNo: order.orderNo,
      userId: String(order.userId),
      region: order.region,
      status: order.status,
      subtotal: Number(order.subtotal),
      shippingFee: Number(order.shippingFee),
      totalAmount: Number(order.totalAmount),
      currency: order.currency,
      shippingAddressSnapshot: order.shippingAddressSnapshot,
      paymentChannel: order.paymentChannel,
      paymentProviderOrderId: order.paymentProviderOrderId,
      paidAt: order.paidAt?.toISOString(),
      shippingMethod: order.shippingMethod,
      trackingNo: order.trackingNo,
      shippedAt: order.shippedAt?.toISOString(),
      completedAt: order.completedAt?.toISOString(),
      expiresAt: order.expiresAt.toISOString(),
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
      user: {
        id: String(order.user.id),
        displayName: order.user.displayName,
        phone: order.user.phone,
        email: order.user.email,
        countryCode: order.user.countryCode,
      },
      items: order.items.map((item) => ({
        id: String(item.id),
        orderId: String(item.orderId),
        productId: item.productId ? String(item.productId) : undefined,
        listingId: item.listingId ? String(item.listingId) : undefined,
        productSnapshot: item.productSnapshot,
        quantity: item.quantity,
        unitPrice: Number(item.unitPrice),
        subtotal: Number(item.subtotal),
      })),
    }
  }

  async shipOrder(orderId: bigint, trackingNo: string, carrier: string) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } })
    if (!order) throw new BadRequestException('订单不存在')
    if (order.status !== 'paid') throw new BadRequestException('只能发货已支付订单')
    const now = new Date()
    const events = [
      { time: now.toISOString(), location: '发货仓', description: '商家已发货' },
      { time: new Date(now.getTime() + 3600000).toISOString(), description: '运输中' },
    ]
    return this.prisma.$transaction([
      this.prisma.order.update({
        where: { id: orderId },
        data: { status: 'shipped', trackingNo, shippingMethod: carrier, shippedAt: now },
      }),
      this.prisma.shipmentTracking.upsert({
        where: { orderId_trackingNo: { orderId, trackingNo } },
        create: {
          orderId,
          carrier,
          trackingNo,
          status: 'in_transit',
          events,
          lastSyncedAt: now,
        },
        update: { carrier, status: 'in_transit', events, lastSyncedAt: now },
      }),
    ])
  }

  async refundOrder(orderId: bigint) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } })
    if (!order) throw new BadRequestException('订单不存在')
    if (!['paid', 'shipped'].includes(order.status)) throw new BadRequestException('该订单状态不支持退款')
    return this.prisma.order.update({
      where: { id: orderId },
      data: { status: 'refund_pending' },
    })
  }
}