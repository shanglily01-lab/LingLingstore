import { Module } from '@nestjs/common'
import { UserController } from './user.controller'
import { AddressService } from './address.service'
import { AuthModule } from '../auth/auth.module'

@Module({
  imports: [AuthModule],
  controllers: [UserController],
  providers: [AddressService],
  exports: [AddressService],
})
export class UserModule {}
