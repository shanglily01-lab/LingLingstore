import { Module } from '@nestjs/common'
import { PaymentRouterService } from './payment-router.service'
import { PaymentService } from './payment.service'
import { PaymentController } from './payment.controller'
import { MockPaymentGateway } from './gateways/mock.gateway'

@Module({
  controllers: [PaymentController],
  providers: [PaymentRouterService, PaymentService, MockPaymentGateway],
  exports: [PaymentRouterService, PaymentService],
})
export class PaymentModule {}
