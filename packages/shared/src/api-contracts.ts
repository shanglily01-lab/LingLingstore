// Health
export type HealthCheckStatus = 'ok' | 'error'

export interface HealthCheckItem {
  status: HealthCheckStatus
  latencyMs?: number
  error?: string
}

export interface HealthCheckResponse {
  status: HealthCheckStatus
  checks: { db: HealthCheckItem; redis: HealthCheckItem }
  timestamp: string
}

// Auth
export interface RegisterRequest {
  region: 'CN' | 'OVERSEAS'
  phone?: string
  email?: string
  password?: string
  countryCode?: string
}

export interface SendOtpRequest {
  phone?: string
  email?: string
}

export interface VerifyOtpRequest {
  phone?: string
  email?: string
  otp: string
}

export interface LoginRequest {
  phone?: string
  email?: string
  password?: string
}

export interface AuthResponse {
  accessToken: string
  user: UserProfile
}

export interface UserProfile {
  id: string
  region: string
  role?: string
  phone?: string
  email?: string
  displayName?: string
  countryCode?: string
}

export interface ShippingAddressData {
  id: string
  recipientName: string
  phone: string
  countryCode: string
  stateProvince?: string
  city: string
  district?: string
  streetAddress: string
  postalCode?: string
  isDefault: boolean
}

export interface ShippingAddressInput {
  recipientName: string
  phone: string
  countryCode: string
  stateProvince?: string
  city: string
  district?: string
  streetAddress: string
  postalCode?: string
  isDefault?: boolean
}

export interface PaymentSessionData {
  paymentIntentId: string
  orderId: string
  channel: string
  amount: number
  currency: string
  expiresAt: string
  payload: {
    type: 'qr_code' | 'redirect' | 'sdk_params' | 'mock'
    data: unknown
  }
}

export interface ShipmentEvent {
  time: string
  location?: string
  description: string
}

export interface ShipmentTrackingData {
  carrier?: string
  trackingNo: string
  status?: string
  events?: ShipmentEvent[]
}

// Product
export interface ProductCategoryData {
  id: string
  nameCn?: string
  nameEn?: string
  parentId?: string
  sortOrder: number
  children?: ProductCategoryData[]
}

export interface ProductData {
  id: string
  spuNo: string
  nameCn?: string
  nameEn?: string
  descriptionCn?: string
  descriptionEn?: string
  categoryId?: string
  images?: any[]
  videos?: any[]
  status: string
  createdAt: string
  listings?: ProductListingData[]
}

export interface ProductListingData {
  id: string
  productId: string
  region: string
  sku: string
  price: number
  currency: string
  stock: number
  isActive: boolean
}

export interface ProductListResponse {
  items: ProductData[]
  total: number
  page: number
  pageSize: number
}

// Cart
export interface CartItemData {
  listingId: string
  productId: string
  nameCn?: string
  nameEn?: string
  image?: string
  sku: string
  price: number
  currency: string
  quantity: number
  stock: number
  region: string
}

export interface CartResponse {
  items: CartItemData[]
  totalAmount: number
  currency: string
  region: string
}

// Order
export interface CreateOrderRequest {
  shippingAddressId: string
  paymentChannel: string
  items: { listingId: string; quantity: number }[]
  note?: string
}

export interface OrderData {
  id: string
  orderNo: string
  status: string
  subtotal: number
  shippingFee: number
  totalAmount: number
  currency: string
  paymentChannel?: string
  trackingNo?: string
  shippingAddressSnapshot?: Record<string, unknown>
  paidAt?: string
  shippedAt?: string
  completedAt?: string
  createdAt: string
  expiresAt: string
  items: OrderItemData[]
  shipment?: ShipmentTrackingData
}

export interface OrderItemData {
  id: string
  productName: string
  image?: string
  sku: string
  price: number
  quantity: number
  subtotal: number
}

export interface OrderListResponse {
  items: OrderData[]
  total: number
  page: number
  pageSize: number
}

// Admin
export interface AdminProductInput {
  nameCn: string
  nameEn: string
  descriptionCn?: string
  descriptionEn?: string
  categoryId?: string
  images?: any[]
  videos?: any[]
  listings: {
    region: string
    sku: string
    price: number
    currency: string
    stock: number
  }[]
}

export interface AdminProductListItem {
  id: string
  spuNo: string
  nameCn?: string
  nameEn?: string
  categoryId?: string
  categoryName?: string
  status: string
  createdAt: string
  image?: string
  cnPrice?: number
  usPrice?: number
  cnStock?: number
  usStock?: number
}

export interface AdminProductListResponse {
  items: AdminProductListItem[]
  total: number
  page: number
  pageSize: number
}

export interface AdminOrderListItem {
  id: string
  orderNo: string
  userName?: string
  region: string
  status: string
  totalAmount: number
  currency: string
  paymentChannel?: string
  trackingNo?: string
  createdAt: string
}

export interface AdminOrderListResponse {
  items: AdminOrderListItem[]
  total: number
  page: number
  pageSize: number
}

export interface AdminCategoryData {
  id: string
  nameCn?: string
  nameEn?: string
  parentId?: string | null
  sortOrder: number
  productCount: number
}

export interface AdminDashboardData {
  totalProducts: number
  totalOrders: number
  totalUsers: number
  revenueToday: number
  revenueMonth: number
  pendingOrders: number
  lowStockItems: number
}
