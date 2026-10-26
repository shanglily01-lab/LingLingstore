import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common'
import { CartService } from './cart.service'
import { JwtAuthGuard, CurrentUser } from '../common/guards'
import type { CartResponse } from '@web3-mall/shared'

@Controller('cart')
@UseGuards(JwtAuthGuard)
export class CartController {
  constructor(private readonly cart: CartService) {}

  @Get()
  async get(@CurrentUser() user: { userId: string }): Promise<CartResponse> {
    return this.cart.getCart(user.userId)
  }

  @Post('items')
  async add(
    @CurrentUser() user: { userId: string },
    @Body() body: { listingId: string; quantity: number },
  ): Promise<CartResponse> {
    return this.cart.addItem(user.userId, body.listingId, body.quantity)
  }

  @Put('items/:listingId')
  async update(
    @CurrentUser() user: { userId: string },
    @Param('listingId') listingId: string,
    @Body() body: { quantity: number },
  ): Promise<CartResponse> {
    return this.cart.updateQuantity(user.userId, listingId, body.quantity)
  }

  @Delete('items/:listingId')
  async remove(
    @CurrentUser() user: { userId: string },
    @Param('listingId') listingId: string,
  ): Promise<CartResponse> {
    return this.cart.removeItem(user.userId, listingId)
  }

  @Delete()
  async clear(@CurrentUser() user: { userId: string }): Promise<{ ok: boolean }> {
    await this.cart.clearCart(user.userId)
    return { ok: true }
  }
}
