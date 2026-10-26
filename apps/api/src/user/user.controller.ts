import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from '@nestjs/common'
import { AuthService } from '../auth/auth.service'
import { AddressService } from './address.service'
import { JwtAuthGuard, CurrentUser } from '../common/guards'
import type { UserProfile, ShippingAddressData, ShippingAddressInput } from '@web3-mall/shared'

@Controller('user')
@UseGuards(JwtAuthGuard)
export class UserController {
  constructor(
    private readonly auth: AuthService,
    private readonly addresses: AddressService,
  ) {}

  @Get('profile')
  async getProfile(@CurrentUser() user: { userId: string }): Promise<UserProfile> {
    return this.auth.getUserProfile(BigInt(user.userId))
  }

  @Get('addresses')
  async listAddresses(@CurrentUser() user: { userId: string; region: string }): Promise<ShippingAddressData[]> {
    return this.addresses.list(BigInt(user.userId))
  }

  @Post('addresses')
  async createAddress(
    @CurrentUser() user: { userId: string; region: string },
    @Body() body: ShippingAddressInput,
  ): Promise<ShippingAddressData> {
    return this.addresses.create(BigInt(user.userId), user.region, body)
  }

  @Put('addresses/:id')
  async updateAddress(
    @CurrentUser() user: { userId: string; region: string },
    @Param('id') id: string,
    @Body() body: Partial<ShippingAddressInput>,
  ): Promise<ShippingAddressData> {
    return this.addresses.update(BigInt(user.userId), user.region, BigInt(id), body)
  }

  @Delete('addresses/:id')
  async deleteAddress(
    @CurrentUser() user: { userId: string },
    @Param('id') id: string,
  ): Promise<{ ok: boolean }> {
    return this.addresses.remove(BigInt(user.userId), BigInt(id))
  }
}
