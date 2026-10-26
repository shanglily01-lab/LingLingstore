import { Body, Controller, Param, Post, UseGuards } from '@nestjs/common'
import { PaymentService } from './payment.service'
import { JwtAuthGuard, CurrentUser } from '../common/guards'
import type { PaymentSessionData } from '@web3-mall/shared'

@Controller('payments')
export class PaymentController {
  constructor(private readonly payment: PaymentService) {}

  @Post('orders/:orderId/session')
  @UseGuards(JwtAuthGuard)
  async createSession(
    @CurrentUser() user: { userId: string },
    @Param('orderId') orderId: string,
    @Body() body: { channel: string; returnUrl?: string },
  ): Promise<PaymentSessionData> {
    return this.payment.createPaymentSession(BigInt(user.userId), BigInt(orderId), body.channel, body.returnUrl)
  }

  @Post('orders/:orderId/mock-complete')
  @UseGuards(JwtAuthGuard)
  async mockComplete(
    @CurrentUser() user: { userId: string },
    @Param('orderId') orderId: string,
  ): Promise<{ ok: boolean }> {
    return this.payment.completeMockPayment(BigInt(user.userId), BigInt(orderId))
  }

  @Post('orders/:orderId/sync')
  @UseGuards(JwtAuthGuard)
  async sync(
    @CurrentUser() user: { userId: string },
    @Param('orderId') orderId: string,
  ): Promise<{ status: string }> {
    return this.payment.syncOrderPayment(BigInt(orderId), BigInt(user.userId))
  }

  @Post('webhook/:channel')
  async webhook(@Param('channel') channel: string, @Body() body: unknown) {
    return this.payment.handleWebhook(channel, body)
  }
}
