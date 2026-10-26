import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common'
import { PrismaService } from '../common/prisma/prisma.service'

@Injectable()
export class OrderExpiryService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(OrderExpiryService.name)
  private timer?: ReturnType<typeof setInterval>

  constructor(private readonly prisma: PrismaService) {}

  onModuleInit() {
    this.timer = setInterval(() => void this.expirePendingOrders(), 60_000)
    void this.expirePendingOrders()
  }

  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer)
  }

  async expirePendingOrders() {
    const now = new Date()
    const expired = await this.prisma.order.findMany({
      where: { status: 'pending', expiresAt: { lt: now } },
      include: { items: true },
      take: 50,
    })
    for (const order of expired) {
      try {
        await this.prisma.$transaction(async (tx) => {
          for (const item of order.items) {
            if (item.listingId) {
              await tx.productListing.update({
                where: { id: item.listingId },
                data: { reservedStock: { decrement: item.quantity } },
              })
            }
          }
          await tx.order.update({
            where: { id: order.id },
            data: { status: 'expired' },
          })
          await tx.paymentIntent.updateMany({
            where: { orderId: order.id, status: { in: ['created', 'pending'] } },
            data: { status: 'expired' },
          })
        })
      } catch (e) {
        this.logger.warn(`过期订单 ${order.orderNo} 处理失败: ${e}`)
      }
    }
    if (expired.length) this.logger.log(`已过期 ${expired.length} 笔待支付订单`)
  }
}
