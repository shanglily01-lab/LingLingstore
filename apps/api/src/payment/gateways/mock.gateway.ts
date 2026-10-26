import { Injectable } from '@nestjs/common'
import { nanoid } from 'nanoid'
import type {
  PaymentCallback,
  PaymentCreateRequest,
  PaymentCreateResponse,
  PaymentGateway,
} from '../payment-gateway.interface'

@Injectable()
export class MockPaymentGateway implements PaymentGateway {
  channel = 'mock'
  region = 'CN'
  supportedCurrencies: ('CNY' | 'USD')[] = ['CNY', 'USD']

  async createPayment(req: PaymentCreateRequest): Promise<PaymentCreateResponse> {
    const providerOrderId = `MOCK_${nanoid(12)}`
    return {
      providerOrderId,
      payload: {
        type: 'mock',
        data: { orderNo: req.orderNo, message: '开发环境：调用 POST /payments/mock/complete 完成支付' },
      },
    }
  }

  async verifyCallback(payload: unknown): Promise<PaymentCallback> {
    const body = payload as { providerOrderId: string; orderNo: string; amount: number; currency: string }
    return {
      providerOrderId: body.providerOrderId,
      orderNo: body.orderNo,
      amount: body.amount,
      currency: body.currency as PaymentCallback['currency'],
      status: 'success',
      paidAt: new Date(),
      raw: payload,
    }
  }

  async queryStatus(providerOrderId: string): Promise<PaymentCallback> {
    return {
      providerOrderId,
      orderNo: '',
      amount: 0,
      currency: 'CNY',
      status: 'pending',
      raw: {},
    }
  }

  async refund(providerOrderId: string, amount: number, reason: string) {
    return { refundId: `REF_${providerOrderId}`, status: 'refunded' }
  }
}
