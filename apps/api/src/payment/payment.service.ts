import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { PrismaService } from '../common/prisma/prisma.service'
import { PaymentRouterService } from './payment-router.service'
import { MockPaymentGateway } from './gateways/mock.gateway'
import { ChannelScaffoldGateway } from './gateways/channel-scaffold.gateway'
import type { Env } from '../common/config/env.schema'
import type { PaymentSessionData } from '@web3-mall/shared'
@Injectable()
export class PaymentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly router: PaymentRouterService,
    private readonly config: ConfigService<Env, true>,
    private readonly mockGateway: MockPaymentGateway,
  ) {
    this.registerGateways()
  }

  private registerGateways() {
    this.router.register(this.mockGateway)
    const cn = [
      new ChannelScaffoldGateway('alipay', 'CN', ['CNY'], 'ALIPAY_APP_ID'),
      new ChannelScaffoldGateway('wechat', 'CN', ['CNY'], 'WECHAT_MCH_ID'),
    ]
    const overseas = [
      new ChannelScaffoldGateway('overseas', 'OVERSEAS', ['USD']),
    ]
    for (const g of [...cn, ...overseas]) this.router.register(g)
  }

  async createPaymentSession(
    userId: bigint,
    orderId: bigint,
    channel: string,
    returnUrl?: string,
  ): Promise<PaymentSessionData> {
    const order = await this.prisma.order.findUnique({ where: { id: orderId }, include: { items: true } })
    if (!order || order.userId !== userId) throw new NotFoundException('订单不存在')
    if (order.status !== 'pending') throw new BadRequestException('订单状态不可支付')

    const useMock = this.config.get('PAYMENT_MOCK_MODE', { infer: true })
    if (!useMock) {
      this.router.validateChannel(order.region, channel)
    } else {
      const cn = ['alipay', 'wechat']
      const overseas = ['overseas']
      const allowed = order.region === 'CN' ? cn : overseas
      if (!allowed.includes(channel)) {
        throw new ForbiddenException('该区域不支持所选的支付方式')
      }
    }

    const gateway = useMock ? this.mockGateway : this.router.getGateway(channel)
    const webOrigin = this.config.get('WEB_ORIGIN', { infer: true })
    const expireSeconds = Math.max(60, Math.floor((order.expiresAt.getTime() - Date.now()) / 1000))

    const created = await gateway.createPayment({
      orderId: String(order.id),
      orderNo: order.orderNo,
      amount: Number(order.totalAmount),
      currency: order.currency as 'CNY' | 'USD',
      subject: `订单 ${order.orderNo}`,
      notifyUrl: `${webOrigin}/api/payments/webhook/${gateway.channel}`,
      returnUrl: returnUrl ?? `${webOrigin}/orders/${order.id}/pay`,
      expireSeconds,
    })

    const intent = await this.prisma.paymentIntent.create({
      data: {
        orderId: order.id,
        channel: useMock ? channel : gateway.channel,
        providerOrderId: created.providerOrderId,
        amount: order.totalAmount,
        currency: order.currency,
        status: 'pending',
        rawCreateResponse: created as object,
      },
    })

    if (order.paymentChannel !== channel) {
      await this.prisma.order.update({
        where: { id: order.id },
        data: { paymentChannel: channel },
      })
    }

    return {
      paymentIntentId: String(intent.id),
      orderId: String(order.id),
      channel: gateway.channel,
      amount: Number(order.totalAmount),
      currency: order.currency,
      expiresAt: order.expiresAt.toISOString(),
      payload: created.payload,
    }
  }

  async completeMockPayment(userId: bigint, orderId: bigint): Promise<{ ok: boolean }> {
    if (!this.config.get('PAYMENT_MOCK_MODE', { infer: true })) {
      throw new ForbiddenException('仅演示模式可用')
    }
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { paymentIntents: { orderBy: { createdAt: 'desc' }, take: 1 } },
    })
    if (!order || order.userId !== userId) throw new NotFoundException('订单不存在')
    const intent = order.paymentIntents[0]
    if (!intent?.providerOrderId) throw new BadRequestException('请先发起支付')

    const callback = await this.mockGateway.verifyCallback({
      providerOrderId: intent.providerOrderId,
      orderNo: order.orderNo,
      amount: Number(order.totalAmount),
      currency: order.currency,
    })
    await this.applyPaymentSuccess(order.id, intent.id, callback)
    return { ok: true }
  }

  async handleWebhook(channel: string, payload: unknown, signature = ''): Promise<{ ok: boolean }> {
    const gateway = this.router.getGateway(channel)
    const callback = await gateway.verifyCallback(payload, signature)
    if (callback.status !== 'success') return { ok: true }

    const order = await this.prisma.order.findUnique({ where: { orderNo: callback.orderNo } })
    if (!order) return { ok: false }

    await this.prisma.paymentCallback.create({
      data: {
        channel,
        providerOrderId: callback.providerOrderId,
        orderNo: callback.orderNo,
        amount: BigInt(callback.amount),
        currency: callback.currency,
        status: callback.status,
        rawPayload: callback.raw as object,
      },
    }).catch(() => {})

    const intent = await this.prisma.paymentIntent.findFirst({
      where: { orderId: order.id, providerOrderId: callback.providerOrderId },
    })
    await this.applyPaymentSuccess(order.id, intent?.id, callback)
    return { ok: true }
  }

  async applyPaymentSuccess(
    orderId: bigint,
    paymentIntentId: bigint | undefined,
    callback: { providerOrderId: string; paidAt?: Date },
  ) {
    await this.prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({ where: { id: orderId }, include: { items: true } })
      if (!order) return
      if (order.status === 'paid' || order.status === 'shipped' || order.status === 'completed') return

      if (order.status === 'expired' || order.status === 'cancelled') {
        // 用户已付款：恢复为 paid 并重新占用库存（简化：仅改状态）
      }

      for (const item of order.items) {
        if (item.listingId) {
          await tx.productListing.update({
            where: { id: item.listingId },
            data: {
              reservedStock: { decrement: item.quantity },
              stock: { decrement: item.quantity },
            },
          })
        }
      }

      await tx.order.update({
        where: { id: orderId },
        data: {
          status: 'paid',
          paidAt: callback.paidAt ?? new Date(),
          paymentProviderOrderId: callback.providerOrderId,
        },
      })

      if (paymentIntentId) {
        await tx.paymentIntent.update({
          where: { id: paymentIntentId },
          data: { status: 'success' },
        })
      }
    })
  }

  async syncOrderPayment(orderId: bigint, userId: bigint) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } })
    if (!order || order.userId !== userId) throw new NotFoundException('订单不存在')
    if (!order.paymentProviderOrderId || !order.paymentChannel) {
      return { status: order.status }
    }
    try {
      const gateway = this.router.getGateway(order.paymentChannel)
      const result = await gateway.queryStatus(order.paymentProviderOrderId)
      if (result.status === 'success' && order.status === 'pending') {
        await this.applyPaymentSuccess(order.id, undefined, result)
        return { status: 'paid' }
      }
    } catch {
      // ignore
    }
    return { status: order.status }
  }
}
