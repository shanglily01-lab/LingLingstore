import { Controller, Get, Post, Put, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common'
import { AdminService } from './admin.service'
import { JwtAuthGuard } from '../common/guards'
import { AdminGuard } from '../common/guards/admin.guard'

@Controller('admin')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminController {
  constructor(private readonly admin: AdminService) {}

  @Get('dashboard')
  async getDashboard() {
    return this.admin.getDashboard()
  }

  @Get('products')
  async listProducts(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('status') status?: string,
    @Query('categoryId') categoryId?: string,
    @Query('keyword') keyword?: string,
  ) {
    return this.admin.listProducts(Number(page) || 1, Number(pageSize) || 20, { status, categoryId, keyword })
  }

  @Post('products')
  async createProduct(
    @Body() body: {
      nameCn: string
      nameEn: string
      descriptionCn?: string
      descriptionEn?: string
      categoryId?: string
      images?: any[]
      listings: { region: string; sku: string; price: number; currency: string; stock: number }[]
    },
  ) {
    return this.admin.createProduct(body)
  }

  @Get('products/:id')
  async getProduct(@Param('id') id: string) {
    return this.admin.getProduct(BigInt(id))
  }

  @Put('products/:id')
  async updateProduct(
    @Param('id') id: string,
    @Body() body: { nameCn?: string; nameEn?: string; descriptionCn?: string; descriptionEn?: string; categoryId?: string; images?: any[]; status?: string },
  ) {
    return this.admin.updateProduct(BigInt(id), body)
  }

  @Delete('products/:id')
  async deleteProduct(@Param('id') id: string) {
    return this.admin.deleteProduct(BigInt(id))
  }

  @Patch('listings/:id')
  async updateListing(
    @Param('id') id: string,
    @Body() body: { price?: number; stock?: number; isActive?: boolean },
  ) {
    return this.admin.updateListing(BigInt(id), body)
  }

  @Get('categories')
  async listCategories() {
    return this.admin.listCategories()
  }

  @Post('categories')
  async createCategory(
    @Body() body: { nameCn: string; nameEn?: string; parentId?: string; sortOrder?: number },
  ) {
    return this.admin.createCategory(body)
  }

  @Put('categories/:id')
  async updateCategory(
    @Param('id') id: string,
    @Body() body: { nameCn?: string; nameEn?: string; sortOrder?: number },
  ) {
    return this.admin.updateCategory(BigInt(id), body)
  }

  @Delete('categories/:id')
  async deleteCategory(@Param('id') id: string) {
    return this.admin.deleteCategory(BigInt(id))
  }

  @Get('orders')
  async listOrders(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('region') region?: string,
    @Query('status') status?: string,
  ) {
    return this.admin.listOrders(Number(page) || 1, Number(pageSize) || 20, region, status)
  }

  @Get('orders/:id')
  async getOrderDetail(@Param('id') id: string) {
    return this.admin.getOrderDetail(BigInt(id))
  }

  @Post('orders/:id/ship')
  async shipOrder(
    @Param('id') id: string,
    @Body() body: { trackingNo: string; carrier: string },
  ) {
    return this.admin.shipOrder(BigInt(id), body.trackingNo, body.carrier)
  }

  @Post('orders/:id/refund')
  async refundOrder(@Param('id') id: string) {
    return this.admin.refundOrder(BigInt(id))
  }
}
