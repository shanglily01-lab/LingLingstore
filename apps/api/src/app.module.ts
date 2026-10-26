import { Module } from '@nestjs/common'
import { AppConfigModule } from './common/config/config.module'
import { PrismaModule } from './common/prisma/prisma.module'
import { HealthModule } from './health/health.module'
import { RedisModule } from './redis/redis.module'
import { AuthModule } from './auth/auth.module'
import { UserModule } from './user/user.module'
import { ProductModule } from './product/product.module'
import { CartModule } from './cart/cart.module'
import { OrderModule } from './order/order.module'
import { PaymentModule } from './payment/payment.module'
import { AdminModule } from './admin/admin.module'
import { RegionModule } from './region/region.module'
import { ForeignTradeModule } from './foreign-trade/foreign-trade.module'

@Module({
  imports: [
    AppConfigModule,
    PrismaModule,
    RedisModule,
    HealthModule,
    AuthModule,
    UserModule,
    ProductModule,
    CartModule,
    OrderModule,
    PaymentModule,
    AdminModule,
    RegionModule,
    ForeignTradeModule,
  ],
})
export class AppModule {}
