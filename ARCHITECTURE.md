# 跨境法币商城 - 技术架构与实施计划

文档版本: v1.0 (草稿)
日期: 2026-05-20
状态: 待评审

> 配套文档: [PRD.md](./PRD.md) (产品需求)
> 历史版本: [ARCHITECTURE_legacy.md](./ARCHITECTURE_legacy.md) (v0.1 加密支付方向, 已废弃)

---

## 1. 技术选型总表

| 层 | 选型 | 理由 |
|---|---|---|
| 前端框架 | Next.js 15+ (App Router) | SSR/SSG, i18n 路由, Vercel/自建均可 |
| UI 框架 | Tailwind CSS + shadcn/ui | 标准组合, 国际化友好 |
| 状态管理 | TanStack Query (服务态) + Zustand (UI 态) | 不上 Redux |
| 后端框架 | NestJS 10+ | 模块化、DI、Guard 装饰器对接区域路由 |
| ORM | Prisma 5+ | 类型安全, 跨数据库迁移成熟 |
| 数据库 | PostgreSQL 15+ | 事务、JSONB、行级锁 |
| 缓存 | Redis 7+ | 库存锁、订单倒计时、限流、Session |
| 消息队列 | BullMQ (Redis 后端) | 异步任务: 物流推送、对账、邮件 |
| API 网关 / CDN | Cloudflare | CF-IPCountry 自动识别 IP 地理位置, DDoS 防护, WAF |
| 国内支付 SDK | alipay-sdk (Node) / wechatpay-node-v3 / unionpay-js | 维护活跃, TypeScript 友好 |
| 海外支付 SDK | stripe-node / @paypal/checkout-server-sdk | 官方维护 |
| 物流 API | 快递鸟 (国内) + 17track (海外) | 国内外标准方案 |
| 邮件 | Resend (海外) + 阿里云邮件 (国内) | 双通道 |
| 短信 | 阿里云短信 (国内) + Twilio (海外) | 双通道 |
| 对象存储 | 阿里云 OSS (国内) + Cloudflare R2 / S3 (海外) | 国内 OSS 备案要求, 海外用 R2 (零出网费) |
| 部署 | Docker + Kubernetes (Phase 3+) / Docker Compose (MVP) | MVP 阶段单机部署即可 |
| 监控 | Sentry (错误) + Grafana + Prometheus (指标) + Better Stack (日志) | 标准三件套 |

> 移除 v0.1 中所有加密相关依赖: wagmi/viem/RainbowKit/ethers/tronweb/@solana/web3.js/Helius/Chainalysis/KMS

---

## 2. 系统架构图

```
+------------------------------------------------------------------+
|                     Browser / Mobile / WeChat                    |
|             cn.example.com  /  www.example.com (英)              |
+----------+----------------------+--------------------------------+
           |                      |
           | HTTPS (Cloudflare)   |
           v                      v
+--------------------------------------------------------+
|        Cloudflare (CDN + WAF + CF-IPCountry)           |
+----+-------+----------------+-------------+------------+
     |       |                |             |
     v       v                v             v
+--------+ +--------+  +----------+  +---------------+
| Next   | | Static |  | Webhook  |  | Admin Console |
| (SSR)  | | Assets |  | Receiver |  | (内部用, IP白) |
+---+----+ +--------+  +----+-----+  +-------+-------+
    |                       |                |
    | REST/tRPC             | (Stripe/PayPal/支付宝/微信 回调)
    v                       v
+----------------------------------------------------+
|              NestJS API Gateway                    |
|  - RegionGuard (中间件)                            |
|  - AuthGuard (JWT)                                 |
|  - Rate limiting                                   |
|  - Idempotency                                     |
+----+--------------+---------------+----------------+
     |              |               |
     v              v               v
+--------+   +--------------+   +---------------+
|Postgres|   |    Redis     |   |  PaymentGW    |
| (主数据)|   | (锁/队列/缓存)|   |  Cluster      |
+--------+   +--------------+   +-+-------------+
     ^             ^              | 外部调用
     |             |              v
     |             |       +-----------------------+
     |             |       | Alipay/WeChat/UnionPay|
     |             |       | Stripe/PayPal/AP+/WHK |
     |             |       +-----------------------+
     |             |
     +-------------+
            |
            v
     +----------------+
     | BullMQ Workers |
     | - 物流推送      |
     | - 邮件/短信     |
     | - 对账定时任务  |
     | - 订单超时关单  |
     +----------------+
```

### 2.1 关键服务边界

- **API Gateway (NestJS)**: 同步处理用户请求, 区域校验, 业务逻辑
- **Webhook Receiver**: 独立路由(可分离部署), 仅接受第三方支付回调, 验签后入队列
- **PaymentGateway Cluster**: 应用层抽象, 不是独立服务, 是 NestJS Service 集合
- **BullMQ Workers**: 独立进程, 处理异步任务, 失败重试入死信队列

---

## 3. 区域路由层设计 (核心模块)

### 3.1 区域识别策略

**两层判定**:

1. **IP 层 (Cloudflare CF-IPCountry header)**:
   - Cloudflare 自动注入 `CF-IPCountry` header (ISO 3166-1 alpha-2)
   - 中国大陆 = `CN`, 香港 = `HK`, 台湾 = `TW`, 美国 = `US` ...
   - 也可用 `CF-IPCity`, `CF-IPLatitude` 等做更细粒度风控

2. **账号层 (users.region)**:
   - 注册时绑定, 中国大陆手机号默认 `CN`, 邮箱注册用户必须选国家
   - 是支付通道/商品列表的真理来源 (single source of truth)

### 3.2 RegionGuard 中间件

```typescript
// src/common/guards/region.guard.ts
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common'
import { Reflector } from '@nestjs/core'

export type Region = 'CN' | 'OVERSEAS'

export interface RegionContext {
  accountRegion: Region        // user.region 派生而来
  ipCountry: string            // CF-IPCountry
  ipRegion: Region             // CN 大陆 -> 'CN', 其他 -> 'OVERSEAS' (HK/TW/MO 算 OVERSEAS)
  isMismatch: boolean          // accountRegion !== ipRegion
}

@Injectable()
export class RegionGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    const req = ctx.switchToHttp().getRequest()
    const ipCountry = (req.headers['cf-ipcountry'] as string || 'XX').toUpperCase()
    const ipRegion: Region = ipCountry === 'CN' ? 'CN' : 'OVERSEAS'

    const user = req.user  // 由 AuthGuard 注入, 可能为空 (访客)
    const accountRegion: Region = user?.region || ipRegion  // 访客以 IP 为准

    req.regionContext = {
      accountRegion,
      ipCountry,
      ipRegion,
      isMismatch: !!user && user.region !== ipRegion,
    }

    // 路由级要求: 比如支付接口要求账号区域与 body.channel 区域一致
    const required = this.reflector.get<Region>('requiredRegion', ctx.getHandler())
    if (required && accountRegion !== required) {
      return false
    }

    return true
  }
}
```

### 3.3 区域变更流程

```typescript
// src/users/region-change.service.ts
@Injectable()
export class RegionChangeService {
  // 用户在 UI 触发"切换到海外站"
  async requestRegionChange(userId: number, targetRegion: Region, ipCountry: string) {
    // 1. 风控: 检查近 30 天是否频繁切换
    const recentChanges = await this.prisma.regionChangeLog.count({
      where: { userId, createdAt: { gte: thirtyDaysAgo() } }
    })
    if (recentChanges >= 3) {
      throw new ForbiddenException('REGION_CHANGE_FREQUENT')
    }

    // 2. 发起 OTP 验证 (国内手机/海外邮箱)
    const user = await this.prisma.user.findUnique({ where: { id: userId } })
    const otp = generateOtp()
    if (user.region === 'CN') {
      await this.sms.send(user.phone, `验证码: ${otp}`)
    } else {
      await this.email.send(user.email, 'OTP', `Code: ${otp}`)
    }
    await this.redis.setex(`region_otp:${userId}`, 300, otp)

    return { needOtp: true }
  }

  async confirmRegionChange(userId: number, otp: string, targetRegion: Region) {
    const stored = await this.redis.get(`region_otp:${userId}`)
    if (stored !== otp) throw new BadRequestException('OTP_INVALID')

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: { region: targetRegion, regionVerifiedAt: new Date() }
      }),
      this.prisma.regionChangeLog.create({
        data: { userId, fromRegion: '...', toRegion: targetRegion }
      })
    ])
    // 强制重新登录, 清掉所有 session
    await this.redis.del(`session:${userId}`)
  }
}
```

### 3.4 支付通道路由 (硬隔离)

```typescript
// src/payment/payment-router.service.ts
@Injectable()
export class PaymentRouterService {
  private readonly cnGateways = ['alipay', 'wechat', 'unionpay'] as const
  private readonly overseasGateways = ['stripe', 'paypal', 'alipay_plus', 'wechat_hk'] as const

  getAvailableChannels(user: User): PaymentChannel[] {
    if (user.region === 'CN') return [...this.cnGateways]
    return [...this.overseasGateways]
  }

  // 创建支付时硬校验, 即使前端绕过也会被拒
  validateChannel(user: User, requested: string) {
    const allowed = this.getAvailableChannels(user)
    if (!allowed.includes(requested as any)) {
      throw new ForbiddenException(`CHANNEL_NOT_ALLOWED_FOR_REGION`)
    }
  }
}
```

---

## 4. 支付网关抽象层

### 4.1 统一接口

```typescript
// src/payment/payment-gateway.interface.ts
export type Currency = 'CNY' | 'USD' | 'HKD'

export interface PaymentCreateRequest {
  orderId: string
  orderNo: string
  amount: number          // 单位: 分 (CNY 分 / USD cents)
  currency: Currency
  subject: string         // 商品标题 (用于支付页显示)
  notifyUrl: string       // 异步回调地址
  returnUrl?: string      // 同步跳回地址 (网页支付)
  expireSeconds: number   // 支付超时
  metadata?: Record<string, string>
}

export interface PaymentCreateResponse {
  providerOrderId: string    // 第三方平台的订单 ID
  payload: {                 // 前端展示用
    type: 'qr_code' | 'redirect' | 'sdk_params'
    data: any                // type 不同 data 结构不同
  }
}

export interface PaymentCallback {
  providerOrderId: string
  orderNo: string            // 我方订单号 (从第三方原样返回)
  amount: number
  currency: Currency
  status: 'success' | 'failed' | 'refunded' | 'pending'
  paidAt?: Date
  raw: unknown               // 原始 payload, 用于审计
}

export interface PaymentGateway {
  channel: string
  region: Region
  supportedCurrencies: Currency[]

  createPayment(req: PaymentCreateRequest): Promise<PaymentCreateResponse>
  verifyCallback(payload: unknown, signature: string): Promise<PaymentCallback>
  queryStatus(providerOrderId: string): Promise<PaymentCallback>
  refund(providerOrderId: string, amount: number, reason: string): Promise<{ refundId: string; status: string }>
}
```

### 4.2 支付宝实现 (要点 + 伪代码)

```typescript
// src/payment/gateways/alipay.gateway.ts
import AlipaySdk from 'alipay-sdk'

@Injectable()
export class AlipayGateway implements PaymentGateway {
  readonly channel = 'alipay'
  readonly region = 'CN' as const
  readonly supportedCurrencies: Currency[] = ['CNY']

  private sdk: AlipaySdk

  constructor(private config: ConfigService) {
    this.sdk = new AlipaySdk({
      appId: config.get('ALIPAY_APP_ID'),
      privateKey: config.get('ALIPAY_PRIVATE_KEY'),       // 应用私钥 (我们的)
      alipayPublicKey: config.get('ALIPAY_PUBLIC_KEY'),   // 支付宝公钥 (验签用, 从开放平台下载)
      signType: 'RSA2',
      charset: 'utf-8',
    })
  }

  async createPayment(req: PaymentCreateRequest): Promise<PaymentCreateResponse> {
    // PC 网页支付 (alipay.trade.page.pay)
    const url = await this.sdk.pageExec('alipay.trade.page.pay', {
      method: 'GET',
      bizContent: {
        out_trade_no: req.orderNo,
        product_code: 'FAST_INSTANT_TRADE_PAY',
        total_amount: (req.amount / 100).toFixed(2),
        subject: req.subject,
        timeout_express: `${Math.ceil(req.expireSeconds / 60)}m`,
      },
      notifyUrl: req.notifyUrl,
      returnUrl: req.returnUrl,
    })

    return {
      providerOrderId: req.orderNo,  // 支付宝以我方 out_trade_no 为准, 无独立 providerId 在创建时返回
      payload: { type: 'redirect', data: { url } },
    }
  }

  async verifyCallback(payload: unknown, _signature: string): Promise<PaymentCallback> {
    const data = payload as Record<string, string>
    // 支付宝异步回调签名验证: SDK 自动用 alipayPublicKey 验
    const verified = await this.sdk.checkNotifySign(data)
    if (!verified) throw new Error('ALIPAY_SIGN_INVALID')

    return {
      providerOrderId: data.trade_no,
      orderNo: data.out_trade_no,
      amount: Math.round(parseFloat(data.total_amount) * 100),
      currency: 'CNY',
      status: data.trade_status === 'TRADE_SUCCESS' ? 'success' : 'pending',
      paidAt: data.gmt_payment ? new Date(data.gmt_payment) : undefined,
      raw: data,
    }
  }

  async refund(providerOrderId: string, amount: number, reason: string) {
    const result = await this.sdk.exec('alipay.trade.refund', {
      bizContent: {
        trade_no: providerOrderId,
        refund_amount: (amount / 100).toFixed(2),
        refund_reason: reason,
        out_request_no: `REFUND_${providerOrderId}_${Date.now()}`,
      },
    })
    return { refundId: result.tradeNo, status: result.fundChange === 'Y' ? 'success' : 'pending' }
  }
  // ...
}
```

**坑点**:
- 公钥/私钥必须 PKCS8 格式 (开放平台默认是 PKCS1, 用 openssl 转一次)
- 签名 charset 一定要 UTF-8, 中文标题不能乱码
- 异步回调返回必须是字符串 `'success'` (小写), 不带任何其他内容, 否则支付宝会重试

### 4.3 微信支付 v3 实现

```typescript
// src/payment/gateways/wechat.gateway.ts
import { WechatPay } from 'wechatpay-node-v3'

@Injectable()
export class WechatGateway implements PaymentGateway {
  readonly channel = 'wechat'
  readonly region = 'CN' as const
  readonly supportedCurrencies: Currency[] = ['CNY']

  private pay: WechatPay

  constructor(private config: ConfigService) {
    this.pay = new WechatPay({
      appid: config.get('WECHAT_APPID'),
      mchid: config.get('WECHAT_MCHID'),
      publicKey: fs.readFileSync('certs/apiclient_cert.pem'),       // 商户证书
      privateKey: fs.readFileSync('certs/apiclient_key.pem'),       // 商户私钥
      key: config.get('WECHAT_APIV3_KEY'),                          // APIv3 密钥 (32字节)
    })
  }

  async createPayment(req: PaymentCreateRequest): Promise<PaymentCreateResponse> {
    // Native 支付 (PC 扫码)
    const result = await this.pay.transactions_native({
      description: req.subject,
      out_trade_no: req.orderNo,
      notify_url: req.notifyUrl,
      amount: { total: req.amount, currency: 'CNY' },
    })
    // result.code_url 是二维码 URL, 前端用 qrcode lib 生成图片

    return {
      providerOrderId: req.orderNo,
      payload: { type: 'qr_code', data: { codeUrl: result.code_url } },
    }
  }

  async verifyCallback(payload: unknown, headers: any): Promise<PaymentCallback> {
    // 微信 v3 回调验签: 需要平台证书 (跟商户证书不同, 通过证书下载 API 拉取并自动更新)
    const verified = await this.pay.verifySign({
      timestamp: headers['wechatpay-timestamp'],
      nonce: headers['wechatpay-nonce'],
      body: JSON.stringify(payload),
      serial: headers['wechatpay-serial'],
      signature: headers['wechatpay-signature'],
    })
    if (!verified) throw new Error('WECHAT_SIGN_INVALID')

    // 解密 resource (AES-256-GCM, key 是 APIv3 key)
    const resource = (payload as any).resource
    const decrypted = this.pay.decipher_gcm(resource.ciphertext, resource.associated_data, resource.nonce)

    return {
      providerOrderId: decrypted.transaction_id,
      orderNo: decrypted.out_trade_no,
      amount: decrypted.amount.total,
      currency: 'CNY',
      status: decrypted.trade_state === 'SUCCESS' ? 'success' : 'pending',
      paidAt: new Date(decrypted.success_time),
      raw: decrypted,
    }
  }
  // ...
}
```

**坑点**:
- 微信支付 v3 用平台证书验签, 必须实现"定期下载平台证书"逻辑 (证书会轮换), 不能写死
- APIv3 密钥与商户证书是两个不同的东西, 不要混
- Native 支付的 code_url **不是图片 URL**, 是 weixin:// 协议字符串, 前端要自己生成二维码
- JSAPI 支付必须在微信内打开, H5 支付必须在浏览器(不能在微信内)

### 4.4 Stripe 实现

```typescript
// src/payment/gateways/stripe.gateway.ts
import Stripe from 'stripe'

@Injectable()
export class StripeGateway implements PaymentGateway {
  readonly channel = 'stripe'
  readonly region = 'OVERSEAS' as const
  readonly supportedCurrencies: Currency[] = ['USD']

  private stripe: Stripe

  constructor(private config: ConfigService) {
    this.stripe = new Stripe(config.get('STRIPE_SECRET_KEY'), { apiVersion: '2025-04-30' })
  }

  async createPayment(req: PaymentCreateRequest): Promise<PaymentCreateResponse> {
    const intent = await this.stripe.paymentIntents.create({
      amount: req.amount,                  // cents
      currency: req.currency.toLowerCase(),
      automatic_payment_methods: { enabled: true },  // 自动启用 Card / Apple Pay / Google Pay
      metadata: { orderNo: req.orderNo, ...req.metadata },
      // 不指定 confirm, 让前端通过 Stripe.js 调用 confirmPayment
    })

    return {
      providerOrderId: intent.id,
      payload: { type: 'sdk_params', data: { clientSecret: intent.client_secret } },
    }
  }

  async verifyCallback(rawBody: string, signature: string): Promise<PaymentCallback> {
    // Stripe 必须用 raw body 验签, 不能用 parsed JSON
    const event = this.stripe.webhooks.constructEvent(
      rawBody,
      signature,
      this.config.get('STRIPE_WEBHOOK_SECRET'),  // 时间戳容差 5 分钟 (Stripe 默认)
    )

    if (event.type !== 'payment_intent.succeeded') {
      // 其他事件也要记录但不当作 success
      return this.parseEvent(event)
    }

    const intent = event.data.object as Stripe.PaymentIntent
    return {
      providerOrderId: intent.id,
      orderNo: intent.metadata.orderNo,
      amount: intent.amount,
      currency: intent.currency.toUpperCase() as Currency,
      status: 'success',
      paidAt: new Date(intent.created * 1000),
      raw: event,
    }
  }
  // ...
}
```

**坑点**:
- Webhook 验签必须用 **raw body** (Buffer/string), 不能让 NestJS 自动 parse JSON. 必须在 main.ts 排除 `/webhooks/stripe` 路由的 body-parser
- 国内 IP 直连 Stripe API 偶尔慢, 用 HK/SG 出口或 Cloudflare Workers 中转
- 测试环境 Webhook 用 `stripe listen` 转发到 localhost, 不要用 ngrok (Stripe 拒绝 ngrok 的 IP)
- 商品类目限制: Stripe 不接酒精/烟草/医疗器械/虚拟货币等, 申请前先看 [Restricted Businesses](https://stripe.com/restricted-businesses)

### 4.5 PayPal 实现

```typescript
// src/payment/gateways/paypal.gateway.ts
import paypal from '@paypal/checkout-server-sdk'

@Injectable()
export class PayPalGateway implements PaymentGateway {
  readonly channel = 'paypal'
  readonly region = 'OVERSEAS' as const
  readonly supportedCurrencies: Currency[] = ['USD']

  private client: paypal.core.PayPalHttpClient

  constructor(private config: ConfigService) {
    const env = config.get('NODE_ENV') === 'production'
      ? new paypal.core.LiveEnvironment(config.get('PAYPAL_CLIENT_ID'), config.get('PAYPAL_SECRET'))
      : new paypal.core.SandboxEnvironment(config.get('PAYPAL_CLIENT_ID'), config.get('PAYPAL_SECRET'))
    this.client = new paypal.core.PayPalHttpClient(env)
  }

  async createPayment(req: PaymentCreateRequest): Promise<PaymentCreateResponse> {
    const request = new paypal.orders.OrdersCreateRequest()
    request.requestBody({
      intent: 'CAPTURE',
      purchase_units: [{
        reference_id: req.orderNo,
        amount: { currency_code: req.currency, value: (req.amount / 100).toFixed(2) },
      }],
      application_context: {
        return_url: req.returnUrl!,
        cancel_url: `${req.returnUrl}?cancelled=true`,
      },
    })
    const order = await this.client.execute(request)

    // approve_url 是用户跳转的 PayPal 授权链接
    const approveUrl = order.result.links.find((l: any) => l.rel === 'approve')!.href

    return {
      providerOrderId: order.result.id,
      payload: { type: 'redirect', data: { url: approveUrl } },
    }
  }

  // 用户在 PayPal 授权后跳回 returnUrl, 我们调用 Capture 完成扣款
  async captureOrder(providerOrderId: string): Promise<PaymentCallback> {
    const request = new paypal.orders.OrdersCaptureRequest(providerOrderId)
    request.requestBody({})
    const result = await this.client.execute(request)
    // ... 解析 result
  }

  async verifyCallback(payload: any, headers: any): Promise<PaymentCallback> {
    // PayPal Webhook 验签: 调 VERIFY-WEBHOOK-SIGNATURE 接口反向验证
    // SDK 简化版:
    const verifyReq = new paypal.notifications.WebhooksVerifySignatureRequest()
    verifyReq.requestBody({
      auth_algo: headers['paypal-auth-algo'],
      cert_url: headers['paypal-cert-url'],
      transmission_id: headers['paypal-transmission-id'],
      transmission_sig: headers['paypal-transmission-sig'],
      transmission_time: headers['paypal-transmission-time'],
      webhook_id: this.config.get('PAYPAL_WEBHOOK_ID'),
      webhook_event: payload,
    })
    const verifyRes = await this.client.execute(verifyReq)
    if (verifyRes.result.verification_status !== 'SUCCESS') {
      throw new Error('PAYPAL_SIGN_INVALID')
    }
    // ... 解析 event
  }
}
```

**坑点**:
- PayPal Order 流程是两步: Create + Capture, 不是一步到位
- Webhook 验签需要 webhook_id (Dashboard 创建 webhook 后得到)
- PayPal 商户提现到银行卡前需要绑定 PayPal 商家账号 + 验证, 否则资金锁在 PayPal
- 退款会扣商家手续费的固定部分 (百分比手续费可退, 单笔固定费用不可退)
- IPN 和 Webhook 都能收回调, **MVP 只用 Webhook**, IPN 是老协议

### 4.6 异步回调处理 (统一)

```typescript
// src/webhooks/payment-webhook.controller.ts
@Controller('webhooks')
export class PaymentWebhookController {
  constructor(
    private gateways: PaymentGatewayRegistry,
    private orderService: OrderService,
    private prisma: PrismaService,
  ) {}

  // 支付宝
  @Post('alipay')
  async handleAlipay(@Body() body: any, @Res() res: Response) {
    try {
      const callback = await this.gateways.get('alipay').verifyCallback(body, '')
      await this.processCallback('alipay', callback, body)
      res.send('success')   // 必须返回 'success' 字符串
    } catch (e) {
      res.send('fail')
    }
  }

  // 微信
  @Post('wechat')
  async handleWechat(@Body() body: any, @Headers() headers: any, @Res() res: Response) {
    try {
      const callback = await this.gateways.get('wechat').verifyCallback(body, headers)
      await this.processCallback('wechat', callback, body)
      res.json({ code: 'SUCCESS' })
    } catch (e) {
      res.status(500).json({ code: 'FAIL', message: e.message })
    }
  }

  // Stripe (raw body, 中间件已排除 JSON parser)
  @Post('stripe')
  async handleStripe(@Req() req: RawBodyRequest<Request>, @Headers('stripe-signature') sig: string, @Res() res: Response) {
    try {
      const callback = await this.gateways.get('stripe').verifyCallback(req.rawBody!.toString(), sig)
      await this.processCallback('stripe', callback, callback.raw)
      res.json({ received: true })
    } catch (e) {
      res.status(400).json({ error: e.message })
    }
  }

  // 统一入账逻辑
  private async processCallback(channel: string, callback: PaymentCallback, raw: any) {
    // 1. 幂等性: 写 payment_callbacks 表 (UNIQUE constraint 防重复)
    try {
      await this.prisma.paymentCallback.create({
        data: {
          channel,
          providerOrderId: callback.providerOrderId,
          orderNo: callback.orderNo,
          amount: callback.amount,
          currency: callback.currency,
          status: callback.status,
          rawPayload: raw as any,
        },
      })
    } catch (e: any) {
      if (e.code === 'P2002') {
        // 重复回调, 已处理过, 直接返回成功
        return
      }
      throw e
    }

    // 2. 入账 (事务)
    if (callback.status === 'success') {
      await this.orderService.markAsPaid(callback.orderNo, {
        channel,
        providerOrderId: callback.providerOrderId,
        amount: callback.amount,
        currency: callback.currency,
        paidAt: callback.paidAt!,
      })
    }
  }
}
```

**Webhook 安全清单**:
- [ ] 验签前不要解析任何业务逻辑, 验签失败就 fast-fail
- [ ] 验签失败日志记录(IP/timestamp/raw), 但不实时告警 (会产生攻击放大)
- [ ] 同一 callback 二次到达必须幂等返回成功
- [ ] 处理超过 3 秒返回的 webhook 第三方会重试, 重活异步处理 (推入 BullMQ)
- [ ] 监控 webhook 处理成功率, 低于 95% 告警

---

## 5. 数据库 Schema

```sql
-- ============= 用户与区域 =============

CREATE TABLE users (
  id BIGSERIAL PRIMARY KEY,
  region VARCHAR(8) NOT NULL CHECK (region IN ('CN', 'OVERSEAS')),
  country_code CHAR(2),                            -- ISO 3166-1 alpha-2, OVERSEAS 时必填具体国家
  phone VARCHAR(32),                               -- CN 用户必填 (E.164 格式)
  email VARCHAR(255),                              -- OVERSEAS 用户必填
  password_hash VARCHAR(255),                      -- 海外用户密码 (CN 用户走短信不用)
  display_name VARCHAR(64),
  region_verified_at TIMESTAMPTZ,                  -- 最后一次区域校验通过时间
  status SMALLINT DEFAULT 1,                       -- 1=正常, 2=风控, 3=禁用
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(phone),                                   -- 注意: 部分海外用户可能也填手机号, 但不强制唯一约束跨区域
  UNIQUE(email)
);
CREATE INDEX idx_users_region ON users(region);

CREATE TABLE region_change_logs (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES users(id),
  from_region VARCHAR(8),
  to_region VARCHAR(8),
  ip_country VARCHAR(8),
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_region_changes_user ON region_change_logs(user_id, created_at DESC);

-- ============= 商品 =============

CREATE TABLE product_categories (
  id BIGSERIAL PRIMARY KEY,
  parent_id BIGINT REFERENCES product_categories(id),
  name_cn VARCHAR(128),
  name_en VARCHAR(128),
  sort_order INT DEFAULT 0
);

CREATE TABLE products (
  id BIGSERIAL PRIMARY KEY,
  spu_no VARCHAR(64) UNIQUE NOT NULL,              -- 业务 SPU 号
  name_cn VARCHAR(255),
  name_en VARCHAR(255),
  description_cn TEXT,
  description_en TEXT,
  category_id BIGINT REFERENCES product_categories(id),
  images JSONB,                                    -- [{ url, alt_cn, alt_en, sort }]
  status VARCHAR(16) DEFAULT 'active',             -- 'active' | 'archived'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE product_listings (
  id BIGSERIAL PRIMARY KEY,
  product_id BIGINT REFERENCES products(id) NOT NULL,
  region VARCHAR(8) NOT NULL CHECK (region IN ('CN', 'OVERSEAS')),
  sku VARCHAR(64) NOT NULL,
  price BIGINT NOT NULL,                           -- 单位: 最小货币单位 (CNY 分 / USD cents)
  currency VARCHAR(8) NOT NULL,
  stock INT NOT NULL DEFAULT 0,
  reserved_stock INT NOT NULL DEFAULT 0,           -- 锁定库存 (订单 pending 中)
  shipping_template_id BIGINT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(product_id, region),
  UNIQUE(region, sku)
);
CREATE INDEX idx_listings_region_active ON product_listings(region, is_active);

-- ============= 地址 =============

CREATE TABLE shipping_addresses (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES users(id) NOT NULL,
  recipient_name VARCHAR(128) NOT NULL,
  phone VARCHAR(32) NOT NULL,
  country_code CHAR(2) NOT NULL,
  state_province VARCHAR(128),                     -- 中国: 省, 美国: 州
  city VARCHAR(128) NOT NULL,
  district VARCHAR(128),                           -- 中国: 区/县
  street_address TEXT NOT NULL,
  postal_code VARCHAR(16),
  is_default BOOLEAN DEFAULT FALSE,
  id_card_number VARCHAR(32),                      -- 海关申报用 (海外发货 + 国内身份证)
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE shipping_templates (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(128),
  region VARCHAR(8) NOT NULL,
  rules JSONB NOT NULL                             -- [{ country_codes: [], weight_min, weight_max, base_fee, per_kg_fee }]
);

-- ============= 订单 =============

CREATE TABLE orders (
  id BIGSERIAL PRIMARY KEY,
  order_no VARCHAR(32) UNIQUE NOT NULL,
  user_id BIGINT REFERENCES users(id) NOT NULL,
  region VARCHAR(8) NOT NULL,                      -- 冗余, 方便统计
  status VARCHAR(32) NOT NULL DEFAULT 'pending',   -- 见 PRD 状态机
  
  subtotal BIGINT NOT NULL,                        -- 商品总价
  shipping_fee BIGINT NOT NULL,                    -- 运费
  total_amount BIGINT NOT NULL,
  currency VARCHAR(8) NOT NULL,
  
  shipping_address_snapshot JSONB,                 -- 下单时收货地址快照
  
  payment_channel VARCHAR(32),                     -- 'alipay' | 'stripe' | ...
  payment_provider_order_id VARCHAR(128),
  paid_at TIMESTAMPTZ,
  
  shipping_method VARCHAR(64),                     -- 顺丰/EMS/4PX...
  tracking_no VARCHAR(64),
  shipped_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  
  expires_at TIMESTAMPTZ NOT NULL,                 -- 支付窗口截止
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_orders_status_expires ON orders(status, expires_at);
CREATE INDEX idx_orders_user ON orders(user_id, created_at DESC);
CREATE INDEX idx_orders_region_status ON orders(region, status);

CREATE TABLE order_items (
  id BIGSERIAL PRIMARY KEY,
  order_id BIGINT REFERENCES orders(id) NOT NULL,
  product_id BIGINT REFERENCES products(id),
  listing_id BIGINT REFERENCES product_listings(id),
  product_snapshot JSONB NOT NULL,                 -- 下单时商品信息快照
  quantity INT NOT NULL,
  unit_price BIGINT NOT NULL,
  subtotal BIGINT NOT NULL
);
CREATE INDEX idx_order_items_order ON order_items(order_id);

-- ============= 支付 =============

CREATE TABLE payment_intents (
  id BIGSERIAL PRIMARY KEY,
  order_id BIGINT REFERENCES orders(id) NOT NULL,
  channel VARCHAR(32) NOT NULL,
  provider_order_id VARCHAR(128),
  amount BIGINT NOT NULL,
  currency VARCHAR(8) NOT NULL,
  status VARCHAR(32) NOT NULL,                     -- 'created' | 'pending' | 'success' | 'failed' | 'expired'
  raw_create_response JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_intents_order ON payment_intents(order_id);
CREATE INDEX idx_intents_provider ON payment_intents(channel, provider_order_id);

CREATE TABLE payment_callbacks (
  id BIGSERIAL PRIMARY KEY,
  channel VARCHAR(32) NOT NULL,
  provider_order_id VARCHAR(128) NOT NULL,
  order_no VARCHAR(32) NOT NULL,
  amount BIGINT,
  currency VARCHAR(8),
  status VARCHAR(32),
  raw_payload JSONB NOT NULL,
  received_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(channel, provider_order_id, status)       -- 同 channel + 同 provider order + 同 status 只能入一次 (避免重复入账)
);
CREATE INDEX idx_callbacks_order_no ON payment_callbacks(order_no);

CREATE TABLE refunds (
  id BIGSERIAL PRIMARY KEY,
  refund_no VARCHAR(32) UNIQUE NOT NULL,
  order_id BIGINT REFERENCES orders(id) NOT NULL,
  amount BIGINT NOT NULL,
  currency VARCHAR(8) NOT NULL,
  reason TEXT,
  status VARCHAR(32) NOT NULL,                     -- 'pending' | 'approved' | 'rejected' | 'sent' | 'refunded'
  channel VARCHAR(32),
  provider_refund_id VARCHAR(128),
  approved_by BIGINT,
  approved_at TIMESTAMPTZ,
  refunded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============= 物流 =============

CREATE TABLE shipment_tracking (
  id BIGSERIAL PRIMARY KEY,
  order_id BIGINT REFERENCES orders(id) NOT NULL,
  carrier VARCHAR(64),                             -- 'sf' | 'ems' | '17track-aggregated'
  tracking_no VARCHAR(64) NOT NULL,
  status VARCHAR(32),
  events JSONB,                                    -- [{ time, location, description }]
  last_synced_at TIMESTAMPTZ,
  UNIQUE(order_id, tracking_no)
);

-- ============= 审计 =============

CREATE TABLE audit_logs (
  id BIGSERIAL PRIMARY KEY,
  actor_type VARCHAR(16),                          -- 'user' | 'admin' | 'system'
  actor_id BIGINT,
  action VARCHAR(64),
  target_type VARCHAR(32),
  target_id VARCHAR(64),
  payload JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_audit_actor ON audit_logs(actor_type, actor_id, created_at DESC);
```

---

## 6. 安全设计

### 6.1 PCI DSS 合规 (海外信用卡)

- **卡号永不经过我们的服务器**: Stripe Elements (JavaScript SDK) 渲染卡号 iframe, 卡号直接从用户浏览器发送到 Stripe, 我们的后端只拿到 token (`pm_xxx`)
- PCI DSS 评估范围: SAQ A (自评问卷, 不接触卡号商家适用)
- 不在数据库存任何卡号/CVV/Track 数据 (即使加密也不存)
- 日志脱敏: 任何包含 4-19 位连续数字的请求体, 在 Logger 中间件脱敏

### 6.2 回调验签 (所有支付通道)

| 通道 | 算法 | 关键密钥位置 |
|---|---|---|
| 支付宝 | RSA2 (SHA256withRSA) | 支付宝公钥 (开放平台下载) |
| 微信 v3 | SHA256withRSA + AES-256-GCM 解密 | APIv3 密钥 + 平台证书 (自动轮换) |
| 银联 | RSA / SHA256withRSA | 银联公钥 |
| Stripe | HMAC-SHA256 | webhook_secret (Dashboard) |
| PayPal | 反向 HTTP 验证 | webhook_id (API 校验) |
| Alipay+ | RSA2 | 类似支付宝 |

**通用规则**:
- 密钥/证书放在环境变量或 KMS 中 (推荐 AWS KMS / 阿里云 KMS), 不进 git
- 失败的回调记录到 `payment_callbacks` (status='verify_failed'), 同 IP 短时间内大量失败触发风控但不主动告警
- 时间戳验证: Stripe 默认 5 分钟容差; 支付宝/微信无强制时间戳但回调超过 30 分钟视为可疑

### 6.3 通用 Web 安全

- HTTPS only (Cloudflare 强制 TLS 1.2+, HSTS preload)
- 内容安全策略 (CSP): `default-src 'self'; script-src 'self' js.stripe.com www.paypal.com; ...`
- 设置 X-Frame-Options: DENY (防点击劫持)
- CSRF: 使用 SameSite=Strict cookies + Origin 校验
- SQL 注入: 100% 走 Prisma 参数化查询
- XSS: React 默认转义 + 用户输入 markdown 用 DOMPurify
- 限流: Nginx/Cloudflare 层 IP 限流 (1000 req/min/IP); 应用层用户限流 (100 req/min/user)
- 敏感操作 (改密码/改地址/退款) 二次验证

### 6.4 数据隐私

- 收货信息: 加密敏感字段 (姓名/电话/地址), AES-256-GCM, key 在 KMS
- 个人信息出境: 海外用户的国内服务器数据需通过《个人信息出境标准合同》备案 (国家网信办 2023 规定); MVP 阶段海外用户量小可豁免, 但 Phase 3 必须办
- 用户数据导出 (GDPR Right to Access / 个保法): 提供 /api/me/export 接口, 返回 JSON
- 用户数据删除 (Right to Erasure): 提供 /api/me/delete-request 接口, 30 天宽限期后真删除 (订单/账单按法定保留期 5 年)

### 6.5 风控规则

- 单用户日累计订单 > $5000 / ¥30000 → 风控审核 (运营手动放行)
- 单 IP 1 小时下单 > 20 单 → 临时封禁
- 同一收货地址不同账号 > 5 个 → 标记可疑
- 新用户首单 > $200 走 3DS 强验证 (Stripe Radar 自动)
- 同卡号被多账号使用 → Stripe Radar 自动 review

---

## 7. 物流集成

### 7.1 国内物流 (快递鸟)

```typescript
// src/shipping/kdniao.service.ts
@Injectable()
export class KdniaoService {
  async createOrder(carrier: 'SF' | 'JD' | 'YTO', orderInfo: ShipmentInfo): Promise<string> {
    // 调用电子面单 API, 返回快递单号
    const resp = await this.kdniaoClient.callApi('1007', {
      ShipperCode: carrier,
      OrderCode: orderInfo.orderNo,
      SenderInfo: { /* 国内仓地址 */ },
      ReceiverInfo: { /* 用户收货地址 */ },
      Commodity: orderInfo.items,
    })
    return resp.LogisticCode  // 快递单号
  }

  async getTrack(carrier: string, trackingNo: string) {
    return this.kdniaoClient.callApi('1002', {
      ShipperCode: carrier,
      LogisticCode: trackingNo,
    })
  }
}
```

### 7.2 海外物流 (17track)

```typescript
// src/shipping/seventeen-track.service.ts
@Injectable()
export class SeventeenTrackService {
  async register(trackingNo: string, carrierCode?: number) {
    // 注册到 17track 监控
    await axios.post('https://api.17track.net/track/v2.2/register', {
      data: [{ number: trackingNo, carrier: carrierCode }]
    }, {
      headers: { '17token': this.config.get('SEVENTEEN_TRACK_KEY') }
    })
  }

  // 通过 webhook 接收推送 (避免轮询)
  async handleWebhook(payload: any) {
    // payload.event 'TRACKING_UPDATED' / 'TRACKING_STATUS_CHANGED'
    // 写入 shipment_tracking.events
  }
}
```

### 7.3 跨境直邮承运商选择

| 承运商 | 区域 | 时效 | 价格 | 跟踪 |
|---|---|---|---|---|
| 顺丰跨境 (SF International) | 港澳/东南亚 | 3-7 天 | 中-高 | 强 |
| EMS 国际 | 全球 | 5-15 天 | 中 | 中 |
| 4PX 递四方 | 欧美 | 7-15 天 | 低-中 | 中 |
| 燕文物流 | 全球 | 10-30 天 | 低 | 中 |
| DHL eCommerce | 全球 | 5-10 天 | 中-高 | 强 |

MVP 阶段接 2-3 个, 按目的国家自动路由.

### 7.4 海关申报 (Phase 3 完整版)

MVP 简化: 个人物品申报 (CN23 海关单), 价值低于免税额, 由承运商代申报.

完整版: 跨境零售 9610 / 1210 模式, 商品需提前向海关备案, 订单生成时推送电子订单到海关单一窗口.

---

## 8. 项目里程碑与工作量估算

> 估算基于 1 名全栈 + 0.5 名前端 + 0.3 设计.

### Phase 0: 准备 (1 周, 与商户号申请并行 1-3 月)

- [ ] 资质材料整理 (营业执照/法人/经营场所/商品类目说明)
- [ ] 国内商户号: 支付宝 + 微信支付 + 银联同步提交
- [ ] 海外商户号: Stripe / PayPal 注册 (Stripe 商品类目审核 1-2 周)
- [ ] 域名: cn.example.com + www.example.com, ICP 备案启动
- [ ] Cloudflare 接入 (双站点), DNS 配置
- [ ] 仓库 + CI/CD 模板 (GitHub Actions / Drone)
- [ ] 法律咨询 (用户协议 / 隐私政策 / 退款政策中英版)
- [ ] 设计稿 (国内站 PC+H5 + 海外站, Figma)

### Phase 1: 国内单通道 MVP (4-5 周)

**Week 1: 基础架构 + 用户**
- [ ] Next.js + NestJS + Prisma + Docker 脚手架
- [ ] 数据库 Schema 落地 (Prisma migration)
- [ ] Cloudflare 接入 + RegionGuard 中间件
- [ ] 用户注册登录 (手机号 OTP)
- [ ] JWT + Session (Redis)

**Week 2: 商品 + 购物车**
- [ ] 商品 CRUD API + 后台 UI
- [ ] 双库存模型实现
- [ ] 国内站商品列表 / 详情页 SSR
- [ ] 购物车 (Redis 缓存 + 持久化)

**Week 3: 下单 + 支付宝**
- [ ] 下单流程 (订单创建 + 库存锁定)
- [ ] PaymentGateway 接口抽象
- [ ] 支付宝 Native + H5 实现
- [ ] 支付宝 Webhook 处理 + 入账事务
- [ ] 订单超时关单 (BullMQ delayed job)

**Week 4: 微信支付 + 物流**
- [ ] 微信支付 v3 Native + JSAPI + H5
- [ ] 快递鸟 API 集成
- [ ] 物流面单生成 + 轨迹查询
- [ ] 订单管理后台 (列表/详情/标记发货)

**Week 5: 退款 + 对账 + 测试**
- [ ] 退款流程 (申请 -> 审批 -> 调用支付方退款 -> 回调入账)
- [ ] 财务日报 (订单总额/手续费/净收入)
- [ ] 与支付宝/微信商户后台手动对账核验
- [ ] E2E 测试 (Playwright) + 沙箱环境联调
- [ ] 小额生产灰度 (运营内部用户)

### Phase 2: 海外通道接入 (3-4 周)

- [ ] 邮箱注册登录 + Email OTP
- [ ] 海外站商品列表 / 详情 / 购物车 (英文)
- [ ] Stripe Elements + PaymentIntent + Webhook (raw body 处理坑要爬)
- [ ] PayPal Order + Capture + Webhook
- [ ] 跨境运费模板 (国家分组 + 重量分级)
- [ ] 17track API + 海外物流接入 (顺丰跨境 / EMS)
- [ ] 国际订单海关申报 (个人物品简化版)
- [ ] 海外站基础 i18n (中英)
- [ ] 海外退款流 + 区域路由完整测试

### Phase 3: 完整商城能力 (4-5 周)

- [ ] 银联云闪付
- [ ] Alipay+ (港澳台/东南亚)
- [ ] WeChat Pay HK (港澳)
- [ ] 完整 i18n (英/繁中/日/韩)
- [ ] 高级运费 (体积重 + DDP 模式)
- [ ] 商业报关 (9610/1210 模式)
- [ ] 部分退款
- [ ] 财务: 完整对账 + 外汇结汇流水 + 出口退税申报数据
- [ ] 风控系统 (Stripe Radar + 自建规则引擎)
- [ ] 个人信息出境合规备案

### Phase 4: 增值能力 (后续)

- [ ] 评价系统 + 评价审核
- [ ] 优惠券 + 折扣码
- [ ] 积分体系
- [ ] 内置客服工单
- [ ] 多商家入驻 (审核 + 保证金 + 提现)
- [ ] App (React Native)
- [ ] AI 客服 / 智能推荐

**总计**:
- MVP 上线 (Phase 0+1+2): ~12 周
- 完整商城 (到 Phase 3): ~17 周
- 团队配置: 1 全栈 + 0.5 前端 + 0.3 设计 + 0.5 运营 (法务/客服)

---

## 9. 关键风险与缓解 (技术侧)

| 风险 | 缓解 |
|---|---|
| 国内 IP 直连 Stripe 慢/被墙 | 用 Cloudflare Workers 中转, 或部署 NestJS 到香港节点 |
| 支付回调延迟/丢失 | 入账后台主动查询 (queryStatus); 监控未收到回调的 paid 订单 |
| 支付回调重复入账 | UNIQUE 约束 + 事务幂等性 |
| 支付通道临时故障 | 用户选择其他通道; 监控通道成功率, 自动隐藏故障通道 |
| 库存超卖 | 行级锁 (SELECT FOR UPDATE) + 应用层判断库存 |
| 订单超时与已付款竞态 | 支付成功优先级高于超时, 即使过期了的回调也接受入账 |
| 信用卡 Chargeback 损失 | Stripe Radar 自动风控; 保留发货证据 (面单 + 物流轨迹); 单笔金额 + 风险评分双阈值 |
| 跨境数据合规 | 海外用户敏感数据加密 + 个人信息出境备案 |
| 国内站点 ICP 备案不过 | 备用域名 + 临时用接入商内置域名 |
| 商户号被风控 | 多通道并行, 主备切换; 不做平台限制类目 |
| 数据库写入热点 (订单号生成) | 用 Twitter Snowflake / UUID v7 而非 SERIAL |

---

## 10. 待用户决策的技术问题

1. **海外主体补充**: 是否同时申请 HK 公司用于直接接 Stripe 国际版? 国内主体走 Stripe Connect 限制较多 (商品类目 + 仅 USD)
2. **服务器部署位置**:
   - 国内站: 阿里云上海/北京 (备案要求)
   - 海外站: 香港 / 新加坡 / 日本 / 美国 (距离用户近的)
   - MVP 可同区部署, Phase 3 分区
3. **微信支付场景优先级**: Native (PC 扫码) / JSAPI (公众号) / H5 (手机浏览器) / 小程序? 取决于用户主要入口
4. **域名策略**:
   - 主域 + 子域 (cn.example.com / www.example.com)
   - 还是分开域名 (example.cn + example.com)
   - 单域多语言 + i18n 路由 (/zh/, /en/) ?
5. **对象存储**: 国内 OSS + 海外 R2 双备份, 还是仅一边?
6. **Stripe 通过 Connect for China 还是 HK 主体直连**: Connect 限制多, HK 主体灵活但需注册成本
7. **是否上 GraphQL?** MVP 用 REST 够用, Phase 4 多端时再评估 GraphQL
8. **后端单体 vs 微服务?** MVP 单体 NestJS 多模块即可, Phase 3 拆订单/支付/物流为独立服务

---

## 附录

### A. 沙箱环境测试

- 支付宝沙箱: https://open.alipay.com/develop/sandbox/account
- 微信支付沙箱: https://pay.weixin.qq.com/wiki/doc/api/wxa/wxa_sl_api.php?chapter=23_1
- 银联测试: https://open.unionpay.com/tjweb/api/list?apiSvcId=448
- Stripe Test Mode: https://docs.stripe.com/test-mode
- PayPal Sandbox: https://developer.paypal.com/dashboard/applications/sandbox

### B. SDK 参考

- alipay-sdk (Node): https://github.com/alipay/alipay-sdk-nodejs-all
- wechatpay-node-v3: https://github.com/Javen205/IJPay-WX-V3 (社区) / https://github.com/qiandu888/wechatpay-node-v3
- @paypal/checkout-server-sdk: https://github.com/paypal/Checkout-NodeJS-SDK
- stripe-node: https://github.com/stripe/stripe-node
- Cloudflare Workers (Stripe 中转参考): https://developers.cloudflare.com/workers/examples/

### C. 合规参考

- 跨境电商 9610/1210: http://www.customs.gov.cn/customs/302249/302266/302267/
- 个人信息出境标准合同: http://www.cac.gov.cn/2023-02/24/c_1678792608342254.htm
- 电子商务法全文: http://www.npc.gov.cn/zgrdw/npc/xinwen/2018-08/31/content_2061455.htm
- PCI DSS v4.0: https://www.pcisecuritystandards.org/document_library
- GDPR 概览: https://gdpr.eu/

### D. 设计参考 (跨境电商前端)

- Shopify: https://www.shopify.com/
- 速卖通 AliExpress: https://www.aliexpress.com/
- SHEIN: https://www.shein.com/
- Temu: https://www.temu.com/
