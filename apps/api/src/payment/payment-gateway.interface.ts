export type Currency = 'CNY' | 'USD' | 'HKD'

export interface PaymentCreateRequest {
  orderId: string
  orderNo: string
  amount: number
  currency: Currency
  subject: string
  notifyUrl: string
  returnUrl?: string
  expireSeconds: number
}

export interface PaymentCreateResponse {
  providerOrderId: string
  payload: {
    type: 'qr_code' | 'redirect' | 'sdk_params' | 'mock'
    data: any
  }
}

export interface PaymentCallback {
  providerOrderId: string
  orderNo: string
  amount: number
  currency: Currency
  status: 'success' | 'failed' | 'refunded' | 'pending'
  paidAt?: Date
  raw: unknown
}

export interface PaymentGateway {
  channel: string
  region: string
  supportedCurrencies: Currency[]
  createPayment(req: PaymentCreateRequest): Promise<PaymentCreateResponse>
  verifyCallback(payload: unknown, signature: string): Promise<PaymentCallback>
  queryStatus(providerOrderId: string): Promise<PaymentCallback>
  refund(providerOrderId: string, amount: number, reason: string): Promise<{ refundId: string; status: string }>
}
