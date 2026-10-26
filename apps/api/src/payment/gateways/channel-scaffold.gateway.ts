import { Injectable, Logger } from '@nestjs/common'
import { nanoid } from 'nanoid'
import type {
  PaymentCallback,
  PaymentCreateRequest,
  PaymentCreateResponse,
  PaymentGateway,
  Currency,
} from '../payment-gateway.interface'

/** 无商户密钥时返回可演示的二维码/跳转占位；配置密钥后应替换为真实 SDK 调用 */
@Injectable()
export class ChannelScaffoldGateway implements PaymentGateway {
  private readonly logger = new Logger(ChannelScaffoldGateway.name)

  constructor(
    readonly channel: string,
    readonly region: string,
    readonly supportedCurrencies: Currency[],
    private readonly envKey?: string,
  ) {}

  private configured(): boolean {
    if (!this.envKey) return false
    return Boolean(process.env[this.envKey])
  }

  async createPayment(req: PaymentCreateRequest): Promise<PaymentCreateResponse> {
    const providerOrderId = `${this.channel.toUpperCase()}_${nanoid(14)}`
    if (!this.configured()) {
      this.logger.warn(`${this.channel} 未配置 ${this.envKey}，使用演示模式`)
      return {
        providerOrderId,
        payload: {
          type: 'qr_code',
          data: {
            demo: true,
            channel: this.channel,
            hint: `配置 ${this.envKey} 后接入真实 ${this.channel}`,
            payUrl: `${req.returnUrl ?? ''}?demo_pay=1&orderNo=${req.orderNo}`,
          },
        },
      }
    }
    // 真实 SDK 接入点
    return {
      providerOrderId,
      payload: { type: 'redirect', data: { url: req.returnUrl, orderNo: req.orderNo } },
    }
  }

  async verifyCallback(payload: unknown, _signature?: string): Promise<PaymentCallback> {
    const body = payload as Record<string, unknown>
    return {
      providerOrderId: String(body.providerOrderId ?? body.id ?? ''),
      orderNo: String(body.orderNo ?? body.out_trade_no ?? ''),
      amount: Number(body.amount ?? body.total_amount ?? 0),
      currency: (body.currency as Currency) ?? 'CNY',
      status: body.status === 'success' || body.trade_status === 'TRADE_SUCCESS' ? 'success' : 'pending',
      paidAt: new Date(),
      raw: payload,
    }
  }

  async queryStatus(providerOrderId: string): Promise<PaymentCallback> {
    return {
      providerOrderId,
      orderNo: '',
      amount: 0,
      currency: this.supportedCurrencies[0] ?? 'CNY',
      status: 'pending',
      raw: {},
    }
  }

  async refund(providerOrderId: string, amount: number, reason: string) {
    return { refundId: `REF_${providerOrderId}`, status: this.configured() ? 'sent' : 'refunded' }
  }
}
