import { Module } from '@nestjs/common'
import { ForeignTradeController } from './foreign-trade.controller'
import { ForeignTradeService } from './foreign-trade.service'
import { AdminGuard } from '../common/guards/admin.guard'

@Module({
  controllers: [ForeignTradeController],
  providers: [ForeignTradeService, AdminGuard],
})
export class ForeignTradeModule {}
