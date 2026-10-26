import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common'
import {
  estimateTradeCost,
  tradeCostInputFromShipment,
  type TradeCostEstimateInput,
  type TradeCostEstimateResult,
} from '@web3-mall/shared'
import { PrismaService } from '../common/prisma/prisma.service'
import { DEFAULT_TRADE_TASKS } from './default-tasks'
import { Decimal } from '@prisma/client/runtime/library'

function genNo(prefix: string) {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  const ts = `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}${pad(d.getHours())}${pad(d.getMinutes())}`
  return `${prefix}${ts}${Math.random().toString(36).slice(2, 6).toUpperCase()}`
}

function decimalToNumber(v: Decimal | null | undefined): number | undefined {
  if (v == null) return undefined
  return Number(v)
}

@Injectable()
export class ForeignTradeService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── Dashboard ───

  async getDashboard() {
    const [
      activeShipments,
      inTransit,
      customsPending,
      warehouseAgg,
      pendingFulfillment,
      partnersCount,
      statusGroups,
      recent,
      overdueTasks,
    ] = await Promise.all([
      this.prisma.tradeShipment.count({
        where: { status: { notIn: ['completed', 'cancelled'] } },
      }),
      this.prisma.tradeShipment.count({ where: { status: 'in_transit' } }),
      this.prisma.tradeShipment.count({
        where: { status: { in: ['at_port', 'customs_clearing'] } },
      }),
      this.prisma.tradeWarehouseSku.aggregate({ _sum: { quantityOnHand: true } }),
      this.prisma.tradeFulfillmentOrder.count({
        where: { status: { in: ['pending', 'pushed_to_warehouse'] } },
      }),
      this.prisma.tradePartner.count({ where: { isActive: true } }),
      this.prisma.tradeShipment.groupBy({ by: ['status'], _count: true }),
      this.prisma.tradeShipment.findMany({
        take: 5,
        orderBy: { updatedAt: 'desc' },
        include: { lines: true, tasks: true },
      }),
      this.prisma.tradeTask.findMany({
        where: {
          status: { in: ['pending', 'in_progress', 'blocked'] },
          dueDate: { lt: new Date() },
        },
        take: 10,
        include: { shipment: { select: { shipmentNo: true, title: true } } },
        orderBy: { dueDate: 'asc' },
      }),
    ])

    return {
      activeShipments,
      inTransit,
      customsPending,
      warehouseStock: warehouseAgg._sum.quantityOnHand ?? 0,
      pendingFulfillment,
      partnersCount,
      pipeline: statusGroups.map((g) => ({ status: g.status, count: g._count })),
      recentShipments: recent.map((s) => this.toShipmentListItem(s)),
      overdueTasks: overdueTasks.map((t) => ({
        id: t.id.toString(),
        stage: t.stage,
        title: t.title,
        description: t.description ?? undefined,
        status: t.status,
        sortOrder: t.sortOrder,
        dueDate: t.dueDate?.toISOString(),
        completedAt: t.completedAt?.toISOString(),
        notes: t.notes ?? undefined,
        shipmentNo: t.shipment.shipmentNo,
        shipmentTitle: t.shipment.title,
      })),
    }
  }

  // ─── Partners ───

  async listPartners(type?: string) {
    const items = await this.prisma.tradePartner.findMany({
      where: type ? { type } : undefined,
      orderBy: [{ isActive: 'desc' }, { name: 'asc' }],
    })
    return items.map((p) => this.toPartner(p))
  }

  async createPartner(body: {
    name: string
    type: string
    contactName?: string
    phone?: string
    email?: string
    wechat?: string
    address?: string
    notes?: string
  }) {
    const p = await this.prisma.tradePartner.create({ data: body })
    return this.toPartner(p)
  }

  async updatePartner(
    id: bigint,
    body: Partial<{
      name: string
      type: string
      contactName: string
      phone: string
      email: string
      wechat: string
      address: string
      notes: string
      isActive: boolean
    }>,
  ) {
    const p = await this.prisma.tradePartner.update({ where: { id }, data: body })
    return this.toPartner(p)
  }

  async deletePartner(id: bigint) {
    await this.prisma.tradePartner.delete({ where: { id } })
    return { ok: true }
  }

  // ─── Shipments ───

  async listShipments(page = 1, pageSize = 20, status?: string) {
    const where = status ? { status } : {}
    const [items, total] = await Promise.all([
      this.prisma.tradeShipment.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: { lines: true, tasks: true },
      }),
      this.prisma.tradeShipment.count({ where }),
    ])
    return {
      items: items.map((s) => this.toShipmentListItem(s)),
      total,
      page,
      pageSize,
    }
  }

  async getShipment(id: bigint) {
    const s = await this.prisma.tradeShipment.findUnique({
      where: { id },
      include: {
        lines: true,
        tasks: { orderBy: [{ stage: 'asc' }, { sortOrder: 'asc' }] },
        documents: { orderBy: { createdAt: 'desc' } },
        freightForwarder: true,
        customsBroker: true,
        warehouse3pl: true,
      },
    })
    if (!s) throw new NotFoundException('批次不存在')
    return this.toShipmentDetail(s)
  }

  async createShipment(body: {
    title: string
    destinationCity?: string
    portOfLoading?: string
    portOfDischarge?: string
    transportMode?: string
    ncmCode?: string
    cifValueUsd?: number
    freightForwarderId?: string
    customsBrokerId?: string
    warehouse3plId?: string
    notes?: string
    lines?: {
      sku: string
      productName: string
      ean?: string
      quantity: number
      cartons?: number
      unitsPerCarton?: number
      unitCostCny?: number
    }[]
    seedDefaultTasks?: boolean
  }) {
    const shipment = await this.prisma.tradeShipment.create({
      data: {
        shipmentNo: genNo('SH'),
        title: body.title,
        destinationCity: body.destinationCity ?? 'São Paulo',
        portOfLoading: body.portOfLoading ?? 'Shenzhen/Yantian',
        portOfDischarge: body.portOfDischarge ?? 'Santos',
        transportMode: body.transportMode ?? 'sea_lcl',
        ncmCode: body.ncmCode ?? '9504.40.00',
        cifValueUsd: body.cifValueUsd,
        freightForwarderId: body.freightForwarderId ? BigInt(body.freightForwarderId) : undefined,
        customsBrokerId: body.customsBrokerId ? BigInt(body.customsBrokerId) : undefined,
        warehouse3plId: body.warehouse3plId ? BigInt(body.warehouse3plId) : undefined,
        notes: body.notes,
        lines: body.lines?.length
          ? { create: body.lines }
          : undefined,
        tasks:
          body.seedDefaultTasks !== false
            ? { create: DEFAULT_TRADE_TASKS.map((t) => ({ ...t, status: 'pending' })) }
            : undefined,
      },
    })
    return this.getShipment(shipment.id)
  }

  async updateShipment(
    id: bigint,
    body: Partial<{
      title: string
      status: string
      destinationCity: string
      portOfLoading: string
      portOfDischarge: string
      transportMode: string
      containerNo: string
      blNo: string
      ncmCode: string
      cifValueUsd: number
      estimatedArrival: string
      actualArrival: string
      customsClearedAt: string
      warehouseReceivedAt: string
      freightForwarderId: string | null
      customsBrokerId: string | null
      warehouse3plId: string | null
      notes: string
    }>,
  ) {
    const data: Record<string, unknown> = { ...body }
    if (body.freightForwarderId !== undefined) {
      data.freightForwarderId = body.freightForwarderId ? BigInt(body.freightForwarderId) : null
    }
    if (body.customsBrokerId !== undefined) {
      data.customsBrokerId = body.customsBrokerId ? BigInt(body.customsBrokerId) : null
    }
    if (body.warehouse3plId !== undefined) {
      data.warehouse3plId = body.warehouse3plId ? BigInt(body.warehouse3plId) : null
    }
    for (const key of ['estimatedArrival', 'actualArrival', 'customsClearedAt', 'warehouseReceivedAt'] as const) {
      if (body[key] !== undefined) {
        data[key] = body[key] ? new Date(body[key]) : null
      }
    }
    await this.prisma.tradeShipment.update({ where: { id }, data })
    return this.getShipment(id)
  }

  async advanceShipmentStatus(id: bigint) {
    const s = await this.prisma.tradeShipment.findUnique({ where: { id } })
    if (!s) throw new NotFoundException('批次不存在')
    const order = [
      'planning', 'procuring', 'ready_export', 'in_transit', 'at_port',
      'customs_clearing', 'customs_cleared', 'to_warehouse', 'warehouse_received',
      'shelved', 'selling', 'completed',
    ]
    const idx = order.indexOf(s.status)
    if (idx < 0 || idx >= order.length - 1) {
      throw new BadRequestException('当前状态无法推进')
    }
    const next = order[idx + 1]
    const patch: Record<string, unknown> = { status: next }
    const now = new Date()
    if (next === 'at_port') patch.actualArrival = now
    if (next === 'customs_cleared') patch.customsClearedAt = now
    if (next === 'warehouse_received') patch.warehouseReceivedAt = now
    await this.prisma.tradeShipment.update({ where: { id }, data: patch })
    return this.getShipment(id)
  }

  async addShipmentLine(
    shipmentId: bigint,
    body: {
      sku: string
      productName: string
      ean?: string
      quantity: number
      cartons?: number
      unitsPerCarton?: number
      unitCostCny?: number
      notes?: string
    },
  ) {
    await this.prisma.tradeShipmentLine.create({ data: { shipmentId, ...body } })
    return this.getShipment(shipmentId)
  }

  async deleteShipmentLine(lineId: bigint) {
    const line = await this.prisma.tradeShipmentLine.findUnique({ where: { id: lineId } })
    if (!line) throw new NotFoundException('明细不存在')
    await this.prisma.tradeShipmentLine.delete({ where: { id: lineId } })
    return this.getShipment(line.shipmentId)
  }

  // ─── Tasks ───

  async updateTask(
    taskId: bigint,
    body: Partial<{ status: string; notes: string; dueDate: string }>,
  ) {
    const task = await this.prisma.tradeTask.findUnique({ where: { id: taskId } })
    if (!task) throw new NotFoundException('任务不存在')
    const data: Record<string, unknown> = { ...body }
    if (body.dueDate !== undefined) {
      data.dueDate = body.dueDate ? new Date(body.dueDate) : null
    }
    if (body.status === 'done') {
      data.completedAt = new Date()
    } else if (body.status && body.status !== 'done') {
      data.completedAt = null
    }
    await this.prisma.tradeTask.update({ where: { id: taskId }, data })
    return this.getShipment(task.shipmentId)
  }

  // ─── Documents ───

  async addDocument(
    shipmentId: bigint,
    body: { docType: string; title: string; fileUrl?: string; notes?: string },
  ) {
    await this.prisma.tradeDocument.create({ data: { shipmentId, ...body } })
    return this.getShipment(shipmentId)
  }

  async deleteDocument(docId: bigint) {
    const doc = await this.prisma.tradeDocument.findUnique({ where: { id: docId } })
    if (!doc) throw new NotFoundException('文档不存在')
    await this.prisma.tradeDocument.delete({ where: { id: docId } })
    return this.getShipment(doc.shipmentId)
  }

  // ─── Warehouse inventory ───

  async listWarehouseSkus() {
    const items = await this.prisma.tradeWarehouseSku.findMany({
      include: { platformListings: true },
      orderBy: { sku: 'asc' },
    })
    return items.map((s) => this.toWarehouseSku(s))
  }

  async upsertWarehouseSku(body: {
    sku: string
    productName: string
    ean?: string
    quantityOnHand?: number
    warehouseName?: string
    notes?: string
  }) {
    const sku = await this.prisma.tradeWarehouseSku.upsert({
      where: { sku: body.sku },
      create: {
        sku: body.sku,
        productName: body.productName,
        ean: body.ean,
        quantityOnHand: body.quantityOnHand ?? 0,
        warehouseName: body.warehouseName ?? 'São Paulo 3PL',
        notes: body.notes,
      },
      update: {
        productName: body.productName,
        ean: body.ean,
        quantityOnHand: body.quantityOnHand,
        warehouseName: body.warehouseName,
        notes: body.notes,
      },
      include: { platformListings: true },
    })
    return this.toWarehouseSku(sku)
  }

  async adjustWarehouseStock(sku: string, delta: number, reason?: string) {
    const row = await this.prisma.tradeWarehouseSku.findUnique({ where: { sku } })
    if (!row) throw new NotFoundException('SKU 不存在')
    const next = row.quantityOnHand + delta
    if (next < 0) throw new BadRequestException('库存不足')
    const updated = await this.prisma.tradeWarehouseSku.update({
      where: { sku },
      data: {
        quantityOnHand: next,
        notes: reason ? `${row.notes ?? ''}\n[${new Date().toISOString()}] ${reason} (${delta > 0 ? '+' : ''}${delta})`.trim() : row.notes,
      },
      include: { platformListings: true },
    })
    return this.toWarehouseSku(updated)
  }

  async syncInventoryFromShipment(shipmentId: bigint) {
    const s = await this.prisma.tradeShipment.findUnique({
      where: { id: shipmentId },
      include: { lines: true, warehouse3pl: true },
    })
    if (!s) throw new NotFoundException('批次不存在')
    if (!['warehouse_received', 'shelved', 'selling', 'completed'].includes(s.status)) {
      throw new BadRequestException('批次尚未入库，无法同步库存')
    }
    const whName = s.warehouse3pl?.name ?? 'São Paulo 3PL'
    for (const line of s.lines) {
      await this.prisma.tradeWarehouseSku.upsert({
        where: { sku: line.sku },
        create: {
          sku: line.sku,
          productName: line.productName,
          ean: line.ean,
          quantityOnHand: line.quantity,
          warehouseName: whName,
        },
        update: {
          productName: line.productName,
          ean: line.ean ?? undefined,
          quantityOnHand: { increment: line.quantity },
          warehouseName: whName,
        },
      })
    }
    return this.listWarehouseSkus()
  }

  async upsertPlatformListing(body: {
    warehouseSkuId: string
    platform: string
    platformSkuId?: string
    asin?: string
    listingUrl?: string
    priceBrl?: number
    isActive?: boolean
  }) {
    const listing = await this.prisma.tradePlatformListing.upsert({
      where: {
        warehouseSkuId_platform: {
          warehouseSkuId: BigInt(body.warehouseSkuId),
          platform: body.platform,
        },
      },
      create: {
        warehouseSkuId: BigInt(body.warehouseSkuId),
        platform: body.platform,
        platformSkuId: body.platformSkuId,
        asin: body.asin,
        listingUrl: body.listingUrl,
        priceBrl: body.priceBrl,
        isActive: body.isActive ?? true,
      },
      update: {
        platformSkuId: body.platformSkuId,
        asin: body.asin,
        listingUrl: body.listingUrl,
        priceBrl: body.priceBrl,
        isActive: body.isActive,
      },
    })
    return {
      id: listing.id.toString(),
      platform: listing.platform,
      platformSkuId: listing.platformSkuId ?? undefined,
      asin: listing.asin ?? undefined,
      priceBrl: decimalToNumber(listing.priceBrl),
      isActive: listing.isActive,
    }
  }

  // ─── Fulfillment ───

  async listFulfillmentOrders(page = 1, pageSize = 20, status?: string, platform?: string) {
    const where: Record<string, unknown> = {}
    if (status) where.status = status
    if (platform) where.platform = platform
    const [items, total] = await Promise.all([
      this.prisma.tradeFulfillmentOrder.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: { lines: { include: { warehouseSku: true } } },
      }),
      this.prisma.tradeFulfillmentOrder.count({ where }),
    ])
    return {
      items: items.map((o) => this.toFulfillmentOrder(o)),
      total,
      page,
      pageSize,
    }
  }

  async createFulfillmentOrder(body: {
    platform: string
    platformOrderId?: string
    recipientName?: string
    recipientPhone?: string
    shippingAddress?: string
    notes?: string
    lines: { sku: string; quantity: number }[]
  }) {
    const order = await this.prisma.$transaction(async (tx) => {
      const linesData = []
      for (const l of body.lines) {
        const wh = await tx.tradeWarehouseSku.findUnique({ where: { sku: l.sku } })
        if (!wh) throw new BadRequestException(`SKU ${l.sku} 不在海外仓`)
        const available = wh.quantityOnHand - wh.quantityReserved
        if (available < l.quantity) {
          throw new BadRequestException(`SKU ${l.sku} 可用库存不足（可用 ${available}）`)
        }
        linesData.push({ warehouseSkuId: wh.id, quantity: l.quantity })
      }
      const created = await tx.tradeFulfillmentOrder.create({
        data: {
          orderNo: genNo('FO'),
          platform: body.platform,
          platformOrderId: body.platformOrderId,
          recipientName: body.recipientName,
          recipientPhone: body.recipientPhone,
          shippingAddress: body.shippingAddress,
          notes: body.notes,
          lines: { create: linesData },
        },
        include: { lines: { include: { warehouseSku: true } } },
      })
      for (const l of body.lines) {
        await tx.tradeWarehouseSku.update({
          where: { sku: l.sku },
          data: { quantityReserved: { increment: l.quantity } },
        })
      }
      return created
    })
    return this.toFulfillmentOrder(order)
  }

  async updateFulfillmentStatus(
    id: bigint,
    body: { status: string; trackingNo?: string; carrier?: string },
  ) {
    const order = await this.prisma.tradeFulfillmentOrder.findUnique({
      where: { id },
      include: { lines: { include: { warehouseSku: true } } },
    })
    if (!order) throw new NotFoundException('履约单不存在')

    const patch: Record<string, unknown> = { status: body.status }
    if (body.trackingNo) patch.trackingNo = body.trackingNo
    if (body.carrier) patch.carrier = body.carrier

    await this.prisma.$transaction(async (tx) => {
      if (body.status === 'pushed_to_warehouse') patch.pushedAt = new Date()
      if (body.status === 'shipped') {
        patch.shippedAt = new Date()
        for (const line of order.lines) {
          await tx.tradeWarehouseSku.update({
            where: { id: line.warehouseSkuId },
            data: {
              quantityOnHand: { decrement: line.quantity },
              quantityReserved: { decrement: line.quantity },
            },
          })
        }
      }
      if (body.status === 'cancelled' && order.status === 'pending') {
        for (const line of order.lines) {
          await tx.tradeWarehouseSku.update({
            where: { id: line.warehouseSkuId },
            data: { quantityReserved: { decrement: line.quantity } },
          })
        }
      }
      await tx.tradeFulfillmentOrder.update({ where: { id }, data: patch })
    })

    const updated = await this.prisma.tradeFulfillmentOrder.findUnique({
      where: { id },
      include: { lines: { include: { warehouseSku: true } } },
    })
    return this.toFulfillmentOrder(updated!)
  }

  // ─── Serializers ───

  private toPartner(p: {
    id: bigint
    name: string
    type: string
    contactName: string | null
    phone: string | null
    email: string | null
    wechat: string | null
    address: string | null
    notes: string | null
    isActive: boolean
    createdAt: Date
  }) {
    return {
      id: p.id.toString(),
      name: p.name,
      type: p.type,
      contactName: p.contactName ?? undefined,
      phone: p.phone ?? undefined,
      email: p.email ?? undefined,
      wechat: p.wechat ?? undefined,
      address: p.address ?? undefined,
      notes: p.notes ?? undefined,
      isActive: p.isActive,
      createdAt: p.createdAt.toISOString(),
    }
  }

  private toShipmentListItem(s: {
    id: bigint
    shipmentNo: string
    title: string
    status: string
    destinationCity: string | null
    transportMode: string
    estimatedArrival: Date | null
    createdAt: Date
    lines: { quantity: number }[]
    tasks: { status: string }[]
  }) {
    const done = s.tasks.filter((t) => t.status === 'done' || t.status === 'skipped').length
    return {
      id: s.id.toString(),
      shipmentNo: s.shipmentNo,
      title: s.title,
      status: s.status,
      destinationCity: s.destinationCity ?? undefined,
      transportMode: s.transportMode,
      lineCount: s.lines.length,
      totalQuantity: s.lines.reduce((sum, l) => sum + l.quantity, 0),
      taskProgress: { done, total: s.tasks.length },
      estimatedArrival: s.estimatedArrival?.toISOString(),
      createdAt: s.createdAt.toISOString(),
    }
  }

  private toShipmentDetail(s: {
    id: bigint
    shipmentNo: string
    title: string
    status: string
    destinationCountry: string
    destinationCity: string | null
    portOfLoading: string | null
    portOfDischarge: string | null
    transportMode: string
    containerNo: string | null
    blNo: string | null
    ncmCode: string | null
    cifValueUsd: Decimal | null
    estimatedArrival: Date | null
    actualArrival: Date | null
    customsClearedAt: Date | null
    warehouseReceivedAt: Date | null
    notes: string | null
    createdAt: Date
    updatedAt: Date
    lines: {
      id: bigint
      sku: string
      productName: string
      ean: string | null
      quantity: number
      cartons: number | null
      unitsPerCarton: number | null
      unitCostCny: Decimal | null
      notes: string | null
    }[]
    tasks: {
      id: bigint
      stage: string
      title: string
      description: string | null
      status: string
      sortOrder: number
      dueDate: Date | null
      completedAt: Date | null
      notes: string | null
    }[]
    documents: {
      id: bigint
      docType: string
      title: string
      fileUrl: string | null
      notes: string | null
      createdAt: Date
    }[]
    freightForwarder: Parameters<ForeignTradeService['toPartner']>[0] | null
    customsBroker: Parameters<ForeignTradeService['toPartner']>[0] | null
    warehouse3pl: Parameters<ForeignTradeService['toPartner']>[0] | null
  }) {
    return {
      id: s.id.toString(),
      shipmentNo: s.shipmentNo,
      title: s.title,
      status: s.status,
      destinationCountry: s.destinationCountry,
      destinationCity: s.destinationCity ?? undefined,
      portOfLoading: s.portOfLoading ?? undefined,
      portOfDischarge: s.portOfDischarge ?? undefined,
      transportMode: s.transportMode,
      containerNo: s.containerNo ?? undefined,
      blNo: s.blNo ?? undefined,
      ncmCode: s.ncmCode ?? undefined,
      cifValueUsd: decimalToNumber(s.cifValueUsd),
      estimatedArrival: s.estimatedArrival?.toISOString(),
      actualArrival: s.actualArrival?.toISOString(),
      customsClearedAt: s.customsClearedAt?.toISOString(),
      warehouseReceivedAt: s.warehouseReceivedAt?.toISOString(),
      freightForwarder: s.freightForwarder ? this.toPartner(s.freightForwarder) : undefined,
      customsBroker: s.customsBroker ? this.toPartner(s.customsBroker) : undefined,
      warehouse3pl: s.warehouse3pl ? this.toPartner(s.warehouse3pl) : undefined,
      notes: s.notes ?? undefined,
      lines: s.lines.map((l) => ({
        id: l.id.toString(),
        sku: l.sku,
        productName: l.productName,
        ean: l.ean ?? undefined,
        quantity: l.quantity,
        cartons: l.cartons ?? undefined,
        unitsPerCarton: l.unitsPerCarton ?? undefined,
        unitCostCny: decimalToNumber(l.unitCostCny),
        notes: l.notes ?? undefined,
      })),
      tasks: s.tasks.map((t) => ({
        id: t.id.toString(),
        stage: t.stage,
        title: t.title,
        description: t.description ?? undefined,
        status: t.status,
        sortOrder: t.sortOrder,
        dueDate: t.dueDate?.toISOString(),
        completedAt: t.completedAt?.toISOString(),
        notes: t.notes ?? undefined,
      })),
      documents: s.documents.map((d) => ({
        id: d.id.toString(),
        docType: d.docType,
        title: d.title,
        fileUrl: d.fileUrl ?? undefined,
        notes: d.notes ?? undefined,
        createdAt: d.createdAt.toISOString(),
      })),
      createdAt: s.createdAt.toISOString(),
      updatedAt: s.updatedAt.toISOString(),
    }
  }

  private toWarehouseSku(s: {
    id: bigint
    sku: string
    productName: string
    ean: string | null
    quantityOnHand: number
    quantityReserved: number
    warehouseName: string | null
    platformListings: {
      id: bigint
      platform: string
      platformSkuId: string | null
      asin: string | null
      priceBrl: Decimal | null
      isActive: boolean
    }[]
  }) {
    return {
      id: s.id.toString(),
      sku: s.sku,
      productName: s.productName,
      ean: s.ean ?? undefined,
      quantityOnHand: s.quantityOnHand,
      quantityReserved: s.quantityReserved,
      quantityAvailable: s.quantityOnHand - s.quantityReserved,
      warehouseName: s.warehouseName ?? undefined,
      platformListings: s.platformListings.map((l) => ({
        id: l.id.toString(),
        platform: l.platform,
        platformSkuId: l.platformSkuId ?? undefined,
        asin: l.asin ?? undefined,
        priceBrl: decimalToNumber(l.priceBrl),
        isActive: l.isActive,
      })),
    }
  }

  private toFulfillmentOrder(o: {
    id: bigint
    orderNo: string
    platform: string
    platformOrderId: string | null
    status: string
    recipientName: string | null
    recipientPhone: string | null
    shippingAddress: string | null
    trackingNo: string | null
    carrier: string | null
    pushedAt: Date | null
    shippedAt: Date | null
    createdAt: Date
    lines: { quantity: number; warehouseSku: { sku: string; productName: string } }[]
  }) {
    return {
      id: o.id.toString(),
      orderNo: o.orderNo,
      platform: o.platform,
      platformOrderId: o.platformOrderId ?? undefined,
      status: o.status,
      recipientName: o.recipientName ?? undefined,
      recipientPhone: o.recipientPhone ?? undefined,
      shippingAddress: o.shippingAddress ?? undefined,
      trackingNo: o.trackingNo ?? undefined,
      carrier: o.carrier ?? undefined,
      lines: o.lines.map((l) => ({
        sku: l.warehouseSku.sku,
        productName: l.warehouseSku.productName,
        quantity: l.quantity,
      })),
      pushedAt: o.pushedAt?.toISOString(),
      shippedAt: o.shippedAt?.toISOString(),
      createdAt: o.createdAt.toISOString(),
    }
  }

  // ─── Cost estimate ───

  estimateCost(input: TradeCostEstimateInput): TradeCostEstimateResult {
    return estimateTradeCost(input)
  }

  async getShipmentCostEstimate(id: bigint) {
    const s = await this.prisma.tradeShipment.findUnique({
      where: { id },
      include: { lines: true },
    })
    if (!s) throw new NotFoundException('Shipment not found')

    const input = tradeCostInputFromShipment({
      lines: s.lines.map((l) => ({
        quantity: l.quantity,
        unitCostCny: decimalToNumber(l.unitCostCny),
      })),
      cifValueUsd: decimalToNumber(s.cifValueUsd),
    })

    return {
      shipmentId: String(s.id),
      shipmentNo: s.shipmentNo,
      title: s.title,
      ncmCode: s.ncmCode ?? '9504.40.00',
      input,
      result: estimateTradeCost(input),
    }
  }
}
