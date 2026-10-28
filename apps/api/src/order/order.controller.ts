import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common'

import { OrderService } from './order.service'

import { JwtAuthGuard, CurrentUser } from '../common/guards'

import type { OrderData, OrderListResponse } from '@web3-mall/shared'



@Controller('orders')

@UseGuards(JwtAuthGuard)

export class OrderController {

  constructor(private readonly order: OrderService) {}



  @Post()

  async create(

    @CurrentUser() user: { userId: string; region: string },

    @Body() body: { shippingAddressId: string; paymentChannel: string; items: { listingId: string; quantity: number }[] },

  ): Promise<OrderData> {

    return this.order.createOrder(BigInt(user.userId), body)

  }



  @Get()

  async list(

    @CurrentUser() user: { userId: string },

    @Query('page') page?: string,

    @Query('pageSize') pageSize?: string,

    @Query('status') status?: string,

  ): Promise<OrderListResponse> {

    return this.order.getUserOrders(BigInt(user.userId), Number(page) || 1, Number(pageSize) || 10, status)

  }



  @Get(':id')

  async get(

    @CurrentUser() user: { userId: string },

    @Param('id') id: string,

  ): Promise<OrderData | null> {

    return this.order.getOrder(BigInt(id), BigInt(user.userId))

  }



  @Post(':id/cancel')

  async cancel(

    @CurrentUser() user: { userId: string },

    @Param('id') id: string,

  ): Promise<{ ok: boolean }> {

    return this.order.cancelOrder(BigInt(id), BigInt(user.userId))

  }



  @Post(':id/confirm')

  async confirm(

    @CurrentUser() user: { userId: string },

    @Param('id') id: string,

  ): Promise<{ ok: boolean }> {

    return this.order.confirmReceipt(BigInt(id), BigInt(user.userId))

  }



  @Post(':id/refund-request')

  async refundRequest(

    @CurrentUser() user: { userId: string },

    @Param('id') id: string,

    @Body() body: { reason?: string },

  ): Promise<{ ok: boolean; refundNo: string }> {

    return this.order.requestRefund(BigInt(id), BigInt(user.userId), body.reason)

  }

}


