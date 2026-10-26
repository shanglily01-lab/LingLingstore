import { Controller, Get, Param, Query } from '@nestjs/common'
import { ProductService } from './product.service'
import { OptionalJwtAuthGuard, CurrentUser } from '../common/guards'
import { UseGuards } from '@nestjs/common'
import type { ProductListResponse } from '@web3-mall/shared'

@Controller('products')
export class ProductController {
  constructor(private readonly product: ProductService) {}

  @Get()
  async list(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('region') region?: string,
    @Query('categoryId') categoryId?: string,
    @Query('keyword') keyword?: string,
  ): Promise<ProductListResponse> {
    return this.product.listProducts(
      region ?? 'CN',
      Number(page) || 1,
      Number(pageSize) || 20,
      categoryId,
      keyword,
    )
  }

  @Get('categories')
  async categories() {
    return this.product.listCategories()
  }

  @Get(':id')
  @UseGuards(OptionalJwtAuthGuard)
  async get(@Param('id') id: string, @CurrentUser() user?: { region: string }) {
    const region = user?.region ?? 'CN'
    return this.product.getProduct(BigInt(id), region)
  }
}
