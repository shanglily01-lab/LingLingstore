import { randomBytes } from 'crypto'
import { mkdir, writeFile } from 'fs/promises'
import { join } from 'path'
import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import type { Request } from 'express'
import { AdminService } from './admin.service'
import { JwtAuthGuard } from '../common/guards'
import { AdminGuard } from '../common/guards/admin.guard'

const PRODUCT_IMAGE_TYPES: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
}
const PRODUCT_IMAGE_MAX_BYTES = 5 * 1024 * 1024
const PRODUCT_VIDEO_TYPES: Record<string, string> = {
  'video/mp4': '.mp4',
  'video/webm': '.webm',
  'video/quicktime': '.mov',
}
const PRODUCT_VIDEO_MAX_BYTES = 30 * 1024 * 1024

function publicUploadUrl(req: Request, filename: string) {
  const forwardedProto = req.headers['x-forwarded-proto']
  const hostHeader = req.headers['x-forwarded-host']
  const host = (Array.isArray(hostHeader) ? hostHeader[0] : hostHeader) || req.get('host') || 'localhost'
  const rawProto = Array.isArray(forwardedProto) ? forwardedProto[0] : forwardedProto
  const proto =
    rawProto?.split(',')[0] ||
    (host.startsWith('localhost') || host.startsWith('127.0.0.1') ? req.protocol : 'https')
  return `${proto}://${host}/uploads/products/${filename}`
}

type UploadedImage = {
  buffer: Buffer
  mimetype: string
  size: number
  originalname: string
}

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

  @Post('uploads/product-image')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: PRODUCT_IMAGE_MAX_BYTES },
    }),
  )
  async uploadProductImage(@UploadedFile() file: UploadedImage | undefined, @Req() req: Request) {
    if (!file?.buffer?.length) {
      throw new BadRequestException('请选择图片')
    }
    const ext = PRODUCT_IMAGE_TYPES[file.mimetype]
    if (!ext) {
      throw new BadRequestException('只支持 JPG、PNG、WEBP、GIF')
    }
    if (file.size > PRODUCT_IMAGE_MAX_BYTES) {
      throw new BadRequestException('单张图片不能超过 5MB')
    }

    const filename = `${Date.now().toString(36)}-${randomBytes(6).toString('hex')}${ext}`
    const dir = join(process.cwd(), 'uploads', 'products')
    await mkdir(dir, { recursive: true })
    await writeFile(join(dir, filename), file.buffer)
    return { url: publicUploadUrl(req, filename) }
  }

  @Post('uploads/product-video')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: PRODUCT_VIDEO_MAX_BYTES },
    }),
  )
  async uploadProductVideo(@UploadedFile() file: UploadedImage | undefined, @Req() req: Request) {
    if (!file?.buffer?.length) {
      throw new BadRequestException('请选择视频')
    }
    const ext = PRODUCT_VIDEO_TYPES[file.mimetype]
    if (!ext) {
      throw new BadRequestException('只支持 MP4、WEBM、MOV')
    }
    if (file.size > PRODUCT_VIDEO_MAX_BYTES) {
      throw new BadRequestException('单个短视频不能超过 30MB')
    }

    const filename = `${Date.now().toString(36)}-${randomBytes(6).toString('hex')}${ext}`
    const dir = join(process.cwd(), 'uploads', 'products')
    await mkdir(dir, { recursive: true })
    await writeFile(join(dir, filename), file.buffer)
    return { url: publicUploadUrl(req, filename) }
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
      videos?: any[]
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
    @Body() body: { nameCn?: string; nameEn?: string; descriptionCn?: string; descriptionEn?: string; categoryId?: string; images?: any[]; videos?: any[]; status?: string },
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
