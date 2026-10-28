import { Injectable } from '@nestjs/common'
import { PrismaService } from '../common/prisma/prisma.service'

@Injectable()
export class ProductService {
  constructor(private readonly prisma: PrismaService) {}

  async listProducts(region: string, page = 1, pageSize = 20, categoryId?: string, keyword?: string) {
    const skip = (page - 1) * pageSize
    const where: any = { status: 'active', listings: { some: { region, isActive: true } } }
    if (categoryId) {
      where.categoryId = BigInt(categoryId)
    }
    if (keyword?.trim()) {
      const q = keyword.trim()
      where.OR = [
        { nameCn: { contains: q, mode: 'insensitive' } },
        { nameEn: { contains: q, mode: 'insensitive' } },
        { spuNo: { contains: q, mode: 'insensitive' } },
        { descriptionCn: { contains: q, mode: 'insensitive' } },
        { descriptionEn: { contains: q, mode: 'insensitive' } },
      ]
    }

    const [items, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          category: { select: { id: true, nameCn: true, nameEn: true } },
          listings: {
            where: { region, isActive: true },
            select: { id: true, region: true, sku: true, price: true, currency: true, stock: true, isActive: true },
          },
        },
      }),
      this.prisma.product.count({ where }),
    ])

    return {
      items: items.map((p) => ({
        id: String(p.id),
        spuNo: p.spuNo,
        nameCn: p.nameCn ?? undefined,
        nameEn: p.nameEn ?? undefined,
        descriptionCn: p.descriptionCn ?? undefined,
        descriptionEn: p.descriptionEn ?? undefined,
        categoryId: p.category ? String(p.category.id) : undefined,
        images: p.images as any[] | undefined,
        videos: p.videos as any[] | undefined,
        status: p.status,
        createdAt: p.createdAt.toISOString(),
        listings: p.listings.map((l) => ({
          id: String(l.id),
          productId: String(p.id),
          region: l.region,
          sku: l.sku,
          price: Number(l.price),
          currency: l.currency,
          stock: l.stock,
          isActive: l.isActive,
        })),
      })),
      total,
      page,
      pageSize,
    }
  }

  async getProduct(id: bigint, region: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        category: { select: { id: true, nameCn: true, nameEn: true } },
        listings: {
          where: { region, isActive: true },
        },
      },
    })
    if (!product) return null

    return {
      id: String(product.id),
      spuNo: product.spuNo,
      nameCn: product.nameCn ?? undefined,
      nameEn: product.nameEn ?? undefined,
      descriptionCn: product.descriptionCn ?? undefined,
      descriptionEn: product.descriptionEn ?? undefined,
      categoryId: product.category ? String(product.category.id) : undefined,
      images: product.images as any[] | undefined,
      videos: product.videos as any[] | undefined,
      status: product.status,
      createdAt: product.createdAt.toISOString(),
      listings: product.listings.map((l) => ({
        id: String(l.id),
        productId: String(product.id),
        region: l.region,
        sku: l.sku,
        price: Number(l.price),
        currency: l.currency,
        stock: l.stock,
        isActive: l.isActive,
      })),
    }
  }

  async listCategories() {
    const categories = await this.prisma.productCategory.findMany({
      where: { parentId: null },
      orderBy: { sortOrder: 'asc' },
      include: {
        children: { orderBy: { sortOrder: 'asc' } },
      },
    })
    return categories.map((c) => ({
      id: String(c.id),
      nameCn: c.nameCn ?? undefined,
      nameEn: c.nameEn ?? undefined,
      parentId: c.parentId ? String(c.parentId) : undefined,
      sortOrder: c.sortOrder,
      children: c.children.map((child) => ({
        id: String(child.id),
        nameCn: child.nameCn ?? undefined,
        nameEn: child.nameEn ?? undefined,
        parentId: child.parentId ? String(child.parentId) : undefined,
        sortOrder: child.sortOrder,
      })),
    }))
  }
}
