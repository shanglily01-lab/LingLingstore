import { Module } from '@nestjs/common'
import { OrderController } from './order.controller'
import { OrderService } from './order.service'
import { OrderExpiryService } from './order-expiry.service'
import { CartModule } from '../cart/cart.module'

@Module({
  imports: [CartModule],
  controllers: [OrderController],
  providers: [OrderService, OrderExpiryService],
  exports: [OrderService],
})
export class OrderModule {}
