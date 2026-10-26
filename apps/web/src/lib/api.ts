import { env } from './env'
import type {
  HealthCheckResponse,
  AuthResponse,
  ProductListResponse,
  ProductCategoryData,
  CartResponse,
  OrderData,
  OrderListResponse,
  UserProfile,
  ShippingAddressData,
  ShippingAddressInput,
  PaymentSessionData,
  AdminProductListResponse,
  AdminOrderListResponse,
  AdminCategoryData,
  AdminDashboardData,
  AdminProductInput,
  TradeDashboardData,
  TradePartnerData,
  TradeShipmentListResponse,
  TradeShipmentDetail,
  TradeWarehouseSkuData,
  TradeFulfillmentListResponse,
  TradeFulfillmentOrderData,
} from '@web3-mall/shared'

let authToken: string | null = null

if (typeof window !== 'undefined') {
  authToken = localStorage.getItem('token')
}

export function setToken(token: string | null) {
  authToken = token
  if (typeof window !== 'undefined') {
    if (token) {
      localStorage.setItem('token', token)
    } else {
      localStorage.removeItem('token')
    }
  }
}

export function getToken(): string | null {
  return authToken
}

interface ProductDetail {
  id: string
  spuNo: string
  nameCn?: string
  nameEn?: string
  descriptionCn?: string
  descriptionEn?: string
  categoryId?: string
  images?: unknown[]
  status: string
  createdAt: string
  listings?: {
    id: string
    productId: string
    region: string
    sku: string
    price: number
    currency: string
    stock: number
    isActive: boolean
  }[]
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`
  }

  const url = `${env.apiBaseUrl}${path}`
  const response = await fetch(url, {
    ...init,
    headers: { ...headers, ...init?.headers },
    cache: 'no-store',
  })

  if (response.status === 401) {
    setToken(null)
    if (typeof window !== 'undefined') {
      window.location.href = '/login'
    }
    throw new Error('未登录')
  }

  if (!response.ok && response.status !== 503) {
    const text = await response.text().catch(() => '')
    throw new Error(text || `API 请求失败: ${response.status}`)
  }
  return (await response.json()) as T
}

export const api = {
  health: (): Promise<HealthCheckResponse> => request('/health'),

  getRegionHint: (): Promise<{ ipCountry: string | null }> => request('/region/hint'),

  // Auth
  login: (data: { phone?: string; email?: string; password?: string; otp?: string }): Promise<AuthResponse> =>
    request('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  register: (data: { region: string; phone?: string; email?: string; password?: string; countryCode?: string; otp: string }): Promise<AuthResponse> =>
    request('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  sendOtp: (data: { phone?: string; email?: string }): Promise<{ ok: boolean }> =>
    request('/auth/send-otp', { method: 'POST', body: JSON.stringify(data) }),

  // User
  getProfile: (): Promise<UserProfile> =>
    request('/user/profile'),

  listAddresses: (): Promise<ShippingAddressData[]> =>
    request('/user/addresses'),

  createAddress: (data: ShippingAddressInput): Promise<ShippingAddressData> =>
    request('/user/addresses', { method: 'POST', body: JSON.stringify(data) }),

  updateAddress: (id: string, data: Partial<ShippingAddressInput>): Promise<ShippingAddressData> =>
    request(`/user/addresses/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  deleteAddress: (id: string): Promise<{ ok: boolean }> =>
    request(`/user/addresses/${id}`, { method: 'DELETE' }),

  // Products
  getProducts: (
    region: string,
    page = 1,
    categoryId?: string,
    keyword?: string,
    pageSize = 20,
  ): Promise<ProductListResponse> => {
    const q = new URLSearchParams({ region, page: String(page), pageSize: String(pageSize) })
    if (categoryId) q.set('categoryId', categoryId)
    if (keyword) q.set('keyword', keyword)
    return request(`/products?${q}`)
  },
  getProduct: (id: string): Promise<ProductDetail> =>
    request(`/products/${id}`),
  getCategories: (): Promise<ProductCategoryData[]> =>
    request('/products/categories'),

  // Cart
  getCart: (): Promise<CartResponse> => request('/cart'),
  addToCart: (listingId: string, quantity: number): Promise<CartResponse> =>
    request('/cart/items', { method: 'POST', body: JSON.stringify({ listingId, quantity }) }),
  updateCartItem: (listingId: string, quantity: number): Promise<CartResponse> =>
    request(`/cart/items/${listingId}`, { method: 'PUT', body: JSON.stringify({ quantity }) }),
  removeCartItem: (listingId: string): Promise<CartResponse> =>
    request(`/cart/items/${listingId}`, { method: 'DELETE' }),
  clearCart: (): Promise<{ ok: boolean }> => request('/cart', { method: 'DELETE' }),

  // Orders
  createOrder: (data: { shippingAddressId: string; paymentChannel: string; items: { listingId: string; quantity: number }[] }): Promise<OrderData> =>
    request('/orders', { method: 'POST', body: JSON.stringify(data) }),
  getOrders: (page = 1, status?: string): Promise<OrderListResponse> => {
    const q = new URLSearchParams({ page: String(page) })
    if (status) q.set('status', status)
    return request(`/orders?${q}`)
  },
  getOrder: (id: string): Promise<OrderData> => request(`/orders/${id}`),
  cancelOrder: (id: string): Promise<{ ok: boolean }> => request(`/orders/${id}/cancel`, { method: 'POST' }),
  confirmOrder: (id: string): Promise<{ ok: boolean }> =>
    request(`/orders/${id}/confirm`, { method: 'POST' }),
  requestRefund: (id: string, reason?: string): Promise<{ ok: boolean; refundNo: string }> =>
    request(`/orders/${id}/refund-request`, { method: 'POST', body: JSON.stringify({ reason }) }),

  createPaymentSession: (
    orderId: string,
    channel: string,
    returnUrl?: string,
  ): Promise<PaymentSessionData> =>
    request(`/payments/orders/${orderId}/session`, {
      method: 'POST',
      body: JSON.stringify({ channel, returnUrl }),
    }),

  mockCompletePayment: (orderId: string): Promise<{ ok: boolean }> =>
    request(`/payments/orders/${orderId}/mock-complete`, { method: 'POST' }),

  syncOrderPayment: (orderId: string): Promise<{ status: string }> =>
    request(`/payments/orders/${orderId}/sync`, { method: 'POST' }),

  // Admin
  admin: {
    dashboard: (): Promise<AdminDashboardData> => request('/admin/dashboard'),

    products: {
      list: (page = 1, params?: { status?: string; categoryId?: string; keyword?: string }): Promise<AdminProductListResponse> => {
        const q = new URLSearchParams({ page: String(page), pageSize: '20' })
        if (params?.status) q.set('status', params.status)
        if (params?.categoryId) q.set('categoryId', params.categoryId)
        if (params?.keyword) q.set('keyword', params.keyword)
        return request(`/admin/products?${q}`)
      },
      get: (id: string): Promise<any> => request(`/admin/products/${id}`),
      create: (data: AdminProductInput): Promise<any> => request('/admin/products', { method: 'POST', body: JSON.stringify(data) }),
      update: (id: string, data: any): Promise<any> => request(`/admin/products/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
      delete: (id: string): Promise<{ ok: boolean }> => request(`/admin/products/${id}`, { method: 'DELETE' }),
      updateListing: (id: string, data: { price?: number; stock?: number; isActive?: boolean }): Promise<any> =>
        request(`/admin/listings/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    },

    categories: {
      list: (): Promise<AdminCategoryData[]> => request('/admin/categories'),
      create: (data: { nameCn: string; nameEn?: string; sortOrder?: number }): Promise<any> =>
        request('/admin/categories', { method: 'POST', body: JSON.stringify(data) }),
      update: (id: string, data: { nameCn?: string; nameEn?: string; sortOrder?: number }): Promise<any> =>
        request(`/admin/categories/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
      delete: (id: string): Promise<{ ok: boolean }> => request(`/admin/categories/${id}`, { method: 'DELETE' }),
    },

    orders: {
      list: (page = 1, params?: { region?: string; status?: string }): Promise<AdminOrderListResponse> => {
        const q = new URLSearchParams({ page: String(page), pageSize: '20' })
        if (params?.region) q.set('region', params.region)
        if (params?.status) q.set('status', params.status)
        return request(`/admin/orders?${q}`)
      },
      get: (id: string): Promise<any> => request(`/admin/orders/${id}`),
      ship: (id: string, data: { trackingNo: string; carrier: string }): Promise<any> =>
        request(`/admin/orders/${id}/ship`, { method: 'POST', body: JSON.stringify(data) }),
      refund: (id: string): Promise<any> => request(`/admin/orders/${id}/refund`, { method: 'POST' }),
    },

    foreignTrade: {
      dashboard: (): Promise<TradeDashboardData> =>
        request('/admin/foreign-trade/dashboard'),

      partners: {
        list: (type?: string): Promise<TradePartnerData[]> => {
          const q = type ? `?type=${type}` : ''
          return request(`/admin/foreign-trade/partners${q}`)
        },
        create: (data: Partial<TradePartnerData>): Promise<TradePartnerData> =>
          request('/admin/foreign-trade/partners', { method: 'POST', body: JSON.stringify(data) }),
        update: (id: string, data: Partial<TradePartnerData>): Promise<TradePartnerData> =>
          request(`/admin/foreign-trade/partners/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
        delete: (id: string): Promise<{ ok: boolean }> =>
          request(`/admin/foreign-trade/partners/${id}`, { method: 'DELETE' }),
      },

      shipments: {
        list: (page = 1, params?: { status?: string }): Promise<TradeShipmentListResponse> => {
          const q = new URLSearchParams({ page: String(page), pageSize: '20' })
          if (params?.status) q.set('status', params.status)
          return request(`/admin/foreign-trade/shipments?${q}`)
        },
        get: (id: string): Promise<TradeShipmentDetail> =>
          request(`/admin/foreign-trade/shipments/${id}`),
        costEstimate: (id: string): Promise<{
          shipmentId: string
          shipmentNo: string
          title: string
          ncmCode: string
          input: import('@web3-mall/shared').TradeCostEstimateInput
          result: import('@web3-mall/shared').TradeCostEstimateResult
        }> => request(`/admin/foreign-trade/shipments/${id}/cost-estimate`),
        create: (data: Record<string, unknown>): Promise<TradeShipmentDetail> =>
          request('/admin/foreign-trade/shipments', { method: 'POST', body: JSON.stringify(data) }),
        update: (id: string, data: Record<string, unknown>): Promise<TradeShipmentDetail> =>
          request(`/admin/foreign-trade/shipments/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
        advance: (id: string): Promise<TradeShipmentDetail> =>
          request(`/admin/foreign-trade/shipments/${id}/advance`, { method: 'POST' }),
        syncInventory: (id: string): Promise<TradeWarehouseSkuData[]> =>
          request(`/admin/foreign-trade/shipments/${id}/sync-inventory`, { method: 'POST' }),
      },

      costEstimate: (input: import('@web3-mall/shared').TradeCostEstimateInput): Promise<import('@web3-mall/shared').TradeCostEstimateResult> =>
        request('/admin/foreign-trade/cost-estimate', { method: 'POST', body: JSON.stringify(input) }),

      tasks: {
        update: (taskId: string, data: { status?: string; notes?: string; dueDate?: string }): Promise<TradeShipmentDetail> =>
          request(`/admin/foreign-trade/tasks/${taskId}`, { method: 'PATCH', body: JSON.stringify(data) }),
      },

      inventory: {
        list: (): Promise<TradeWarehouseSkuData[]> =>
          request('/admin/foreign-trade/inventory'),
        upsert: (data: Record<string, unknown>): Promise<TradeWarehouseSkuData> =>
          request('/admin/foreign-trade/inventory', { method: 'POST', body: JSON.stringify(data) }),
      },

      fulfillment: {
        list: (page = 1, params?: { status?: string; platform?: string }): Promise<TradeFulfillmentListResponse> => {
          const q = new URLSearchParams({ page: String(page), pageSize: '20' })
          if (params?.status) q.set('status', params.status)
          if (params?.platform) q.set('platform', params.platform)
          return request(`/admin/foreign-trade/fulfillment?${q}`)
        },
        create: (data: Record<string, unknown>): Promise<TradeFulfillmentOrderData> =>
          request('/admin/foreign-trade/fulfillment', { method: 'POST', body: JSON.stringify(data) }),
        update: (id: string, data: Record<string, unknown>): Promise<TradeFulfillmentOrderData> =>
          request(`/admin/foreign-trade/fulfillment/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
      },
    },
  },
}
