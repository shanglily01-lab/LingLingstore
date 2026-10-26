// Foreign trade operations — Brazil cross-border workflow

export type TradePartnerType =
  | 'freight_forwarder'
  | 'customs_broker'
  | 'warehouse_3pl'
  | 'other'

export type TradeShipmentStatus =
  | 'planning'
  | 'procuring'
  | 'ready_export'
  | 'in_transit'
  | 'at_port'
  | 'customs_clearing'
  | 'customs_cleared'
  | 'to_warehouse'
  | 'warehouse_received'
  | 'shelved'
  | 'selling'
  | 'completed'
  | 'cancelled'

export type TradeTaskStage =
  | 'prep'
  | 'procurement'
  | 'export'
  | 'sea_freight'
  | 'customs'
  | 'warehouse'
  | 'sales'
  | 'fulfillment'

export type TradeTaskStatus = 'pending' | 'in_progress' | 'done' | 'blocked' | 'skipped'

export type TradeDocumentType =
  | 'invoice'
  | 'packing_list'
  | 'bill_of_lading'
  | 'asn'
  | 'certificate'
  | 'other'

export type TradePlatform = 'amazon_br' | 'mercado_livre'

export type TradeFulfillmentStatus =
  | 'pending'
  | 'pushed_to_warehouse'
  | 'shipped'
  | 'completed'
  | 'cancelled'

export interface TradePartnerData {
  id: string
  name: string
  type: TradePartnerType
  contactName?: string
  phone?: string
  email?: string
  wechat?: string
  address?: string
  notes?: string
  isActive: boolean
  createdAt: string
}

export interface TradeShipmentLineData {
  id: string
  sku: string
  productName: string
  ean?: string
  quantity: number
  cartons?: number
  unitsPerCarton?: number
  unitCostCny?: number
  notes?: string
}

export interface TradeTaskData {
  id: string
  stage: TradeTaskStage
  title: string
  description?: string
  status: TradeTaskStatus
  sortOrder: number
  dueDate?: string
  completedAt?: string
  notes?: string
}

export interface TradeDocumentData {
  id: string
  docType: TradeDocumentType
  title: string
  fileUrl?: string
  notes?: string
  createdAt: string
}

export interface TradeShipmentListItem {
  id: string
  shipmentNo: string
  title: string
  status: TradeShipmentStatus
  destinationCity?: string
  transportMode: string
  lineCount: number
  totalQuantity: number
  taskProgress: { done: number; total: number }
  estimatedArrival?: string
  createdAt: string
}

export interface TradeShipmentDetail {
  id: string
  shipmentNo: string
  title: string
  status: TradeShipmentStatus
  destinationCountry: string
  destinationCity?: string
  portOfLoading?: string
  portOfDischarge?: string
  transportMode: string
  containerNo?: string
  blNo?: string
  ncmCode?: string
  cifValueUsd?: number
  estimatedArrival?: string
  actualArrival?: string
  customsClearedAt?: string
  warehouseReceivedAt?: string
  freightForwarder?: TradePartnerData
  customsBroker?: TradePartnerData
  warehouse3pl?: TradePartnerData
  notes?: string
  lines: TradeShipmentLineData[]
  tasks: TradeTaskData[]
  documents: TradeDocumentData[]
  createdAt: string
  updatedAt: string
}

export interface TradeShipmentListResponse {
  items: TradeShipmentListItem[]
  total: number
  page: number
  pageSize: number
}

export interface TradeDashboardData {
  activeShipments: number
  inTransit: number
  customsPending: number
  warehouseStock: number
  pendingFulfillment: number
  partnersCount: number
  pipeline: { status: TradeShipmentStatus; count: number }[]
  recentShipments: TradeShipmentListItem[]
  overdueTasks: (TradeTaskData & { shipmentNo: string; shipmentTitle: string })[]
}

export interface TradeWarehouseSkuData {
  id: string
  sku: string
  productName: string
  ean?: string
  quantityOnHand: number
  quantityReserved: number
  quantityAvailable: number
  warehouseName?: string
  platformListings: {
    id: string
    platform: TradePlatform
    platformSkuId?: string
    asin?: string
    priceBrl?: number
    isActive: boolean
  }[]
}

export interface TradeFulfillmentOrderData {
  id: string
  orderNo: string
  platform: TradePlatform
  platformOrderId?: string
  status: TradeFulfillmentStatus
  recipientName?: string
  recipientPhone?: string
  shippingAddress?: string
  trackingNo?: string
  carrier?: string
  lines: { sku: string; productName: string; quantity: number }[]
  pushedAt?: string
  shippedAt?: string
  createdAt: string
}

export interface TradeFulfillmentListResponse {
  items: TradeFulfillmentOrderData[]
  total: number
  page: number
  pageSize: number
}

export const TRADE_SHIPMENT_STATUS_LABELS: Record<TradeShipmentStatus, string> = {
  planning: '筹备中',
  procuring: '采购中',
  ready_export: '待出口',
  in_transit: '海运中',
  at_port: '已到港',
  customs_clearing: '清关中',
  customs_cleared: '已清关',
  to_warehouse: '拖柜入仓',
  warehouse_received: '已入库',
  shelved: '已上架',
  selling: '销售中',
  completed: '已完成',
  cancelled: '已取消',
}

export const TRADE_TASK_STAGE_LABELS: Record<TradeTaskStage, string> = {
  prep: '筹备',
  procurement: '采购',
  export: '中国出口',
  sea_freight: '海运',
  customs: '清关',
  warehouse: '海外仓',
  sales: '平台上架',
  fulfillment: '订单履约',
}

export const TRADE_PARTNER_TYPE_LABELS: Record<TradePartnerType, string> = {
  freight_forwarder: '中国货代',
  customs_broker: '清关行',
  warehouse_3pl: '海外仓',
  other: '其他',
}

export const TRADE_PLATFORM_LABELS: Record<TradePlatform, string> = {
  amazon_br: '亚马逊巴西',
  mercado_livre: '美客多',
}
