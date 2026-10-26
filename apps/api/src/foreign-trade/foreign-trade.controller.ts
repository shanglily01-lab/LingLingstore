import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common'
import { ForeignTradeService } from './foreign-trade.service'
import type { TradeCostEstimateInput } from '@web3-mall/shared'
import { JwtAuthGuard } from '../common/guards'
import { AdminGuard } from '../common/guards/admin.guard'

@Controller('admin/foreign-trade')
@UseGuards(JwtAuthGuard, AdminGuard)
export class ForeignTradeController {
  constructor(private readonly ft: ForeignTradeService) {}

  @Get('dashboard')
  getDashboard() {
    return this.ft.getDashboard()
  }

  // Partners
  @Get('partners')
  listPartners(@Query('type') type?: string) {
    return this.ft.listPartners(type)
  }

  @Post('partners')
  createPartner(@Body() body: Record<string, string>) {
    return this.ft.createPartner(body as any)
  }

  @Put('partners/:id')
  updatePartner(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return this.ft.updatePartner(BigInt(id), body as any)
  }

  @Delete('partners/:id')
  deletePartner(@Param('id') id: string) {
    return this.ft.deletePartner(BigInt(id))
  }

  // Shipments
  @Get('shipments')
  listShipments(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('status') status?: string,
  ) {
    return this.ft.listShipments(Number(page) || 1, Number(pageSize) || 20, status)
  }

  @Get('shipments/:id')
  getShipment(@Param('id') id: string) {
    return this.ft.getShipment(BigInt(id))
  }

  @Get('shipments/:id/cost-estimate')
  getShipmentCostEstimate(@Param('id') id: string) {
    return this.ft.getShipmentCostEstimate(BigInt(id))
  }

  @Post('cost-estimate')
  estimateCost(@Body() body: TradeCostEstimateInput) {
    return this.ft.estimateCost(body)
  }

  @Post('shipments')
  createShipment(@Body() body: Record<string, unknown>) {
    return this.ft.createShipment(body as any)
  }

  @Put('shipments/:id')
  updateShipment(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return this.ft.updateShipment(BigInt(id), body as any)
  }

  @Post('shipments/:id/advance')
  advanceShipment(@Param('id') id: string) {
    return this.ft.advanceShipmentStatus(BigInt(id))
  }

  @Post('shipments/:id/lines')
  addLine(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return this.ft.addShipmentLine(BigInt(id), body as any)
  }

  @Delete('shipments/lines/:lineId')
  deleteLine(@Param('lineId') lineId: string) {
    return this.ft.deleteShipmentLine(BigInt(lineId))
  }

  @Post('shipments/:id/sync-inventory')
  syncInventory(@Param('id') id: string) {
    return this.ft.syncInventoryFromShipment(BigInt(id))
  }

  // Tasks
  @Patch('tasks/:taskId')
  updateTask(@Param('taskId') taskId: string, @Body() body: Record<string, unknown>) {
    return this.ft.updateTask(BigInt(taskId), body as any)
  }

  // Documents
  @Post('shipments/:id/documents')
  addDocument(@Param('id') id: string, @Body() body: Record<string, string>) {
    return this.ft.addDocument(BigInt(id), body as any)
  }

  @Delete('documents/:docId')
  deleteDocument(@Param('docId') docId: string) {
    return this.ft.deleteDocument(BigInt(docId))
  }

  // Warehouse
  @Get('inventory')
  listInventory() {
    return this.ft.listWarehouseSkus()
  }

  @Post('inventory')
  upsertInventory(@Body() body: Record<string, unknown>) {
    return this.ft.upsertWarehouseSku(body as any)
  }

  @Post('inventory/:sku/adjust')
  adjustStock(
    @Param('sku') sku: string,
    @Body() body: { delta: number; reason?: string },
  ) {
    return this.ft.adjustWarehouseStock(decodeURIComponent(sku), body.delta, body.reason)
  }

  @Post('inventory/listings')
  upsertListing(@Body() body: Record<string, unknown>) {
    return this.ft.upsertPlatformListing(body as any)
  }

  // Fulfillment
  @Get('fulfillment')
  listFulfillment(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('status') status?: string,
    @Query('platform') platform?: string,
  ) {
    return this.ft.listFulfillmentOrders(
      Number(page) || 1,
      Number(pageSize) || 20,
      status,
      platform,
    )
  }

  @Post('fulfillment')
  createFulfillment(@Body() body: Record<string, unknown>) {
    return this.ft.createFulfillmentOrder(body as any)
  }

  @Patch('fulfillment/:id')
  updateFulfillment(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return this.ft.updateFulfillmentStatus(BigInt(id), body as any)
  }
}
