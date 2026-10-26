# 跨境法币商城 - 项目规划文档

> 国内主体运营的双轨制跨境电商. 国内用户用人民币(支付宝/微信/银联)在国内站点购物, 海外用户用美元(Stripe/PayPal/Alipay+/WeChat HK)在海外站点购物.
> 状态: 草稿待评审 (v1.0, 2026-05-20)

> 注: 仓库目录名 `web3-mall` 是历史遗留. 项目早期方向(v0.1)曾定位为"加密支付实物商城", 因国内主体合规原因调整为纯法币方向. 见下文【方向变更说明】.

---

## 文档导航

| 文档 | 内容 | 主要读者 |
|---|---|---|
| [PRD.md](./PRD.md) | 产品需求: 用户角色、功能列表、状态机、合规要点、MVP 划分 | 产品/业务方/工程师 |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | 技术架构: 选型、区域路由、支付网关抽象、Schema、安全、里程碑 | 工程师/架构师 |
| [PRD_legacy.md](./PRD_legacy.md) | (已废弃) v0.1 加密支付方向 PRD | 仅作历史参考 |
| [ARCHITECTURE_legacy.md](./ARCHITECTURE_legacy.md) | (已废弃) v0.1 加密支付方向架构 | 仅作历史参考 |

---

## 方向变更说明 (v0.1 -> v1.0)

**v0.1 (2026-04-29)**: 加密支付实物商城, 支持 USDT/USDC 多链支付.

**v1.0 (2026-05-20)**: 重新定位为国内主体的双轨制跨境法币电商.

**变更原因 (合规)**:

- 项目主体为国内企业
- 依据央行等十部委 2021-09-15《关于进一步防范和处置虚拟货币交易炒作风险的通知》, 国内主体向任何用户(包括海外)提供加密货币支付服务均属非法金融活动
- 技术上做地理隔离无法规避主体管辖责任, 必须从产品形态层面砍掉加密支付通道
- 若未来希望保留加密支付路径, 需通过香港/新加坡海外主体独立运营 (路径 C, 双主体架构), 不在本次方案范围

**历史文档保留**: v0.1 文档以 `_legacy.md` 后缀归档, 不再维护, 仅供未来海外主体团队启动加密商城时参考.

---

## 一图概览 (v1.0 法币流程)

```
[国内用户]                              [海外用户]
   |                                       |
   | CF-IPCountry=CN                       | CF-IPCountry=US/JP/...
   | account.region='CN'                   | account.region='OVERSEAS'
   v                                       v
+-------+                              +--------+
| 国内站 |                              | 海外站  |
|cn.xxx |                              |www.xxx |
+---+---+                              +----+---+
    |                                       |
    | 浏览 CN listings (CNY 计价)           | 浏览 OVERSEAS listings (USD 计价)
    v                                       v
   下单 -> 选支付:                        下单 -> 选支付:
   - 支付宝 (Native/H5)                    - Stripe (Card/Apple/Google Pay)
   - 微信支付 (Native/JSAPI/H5)            - PayPal
   - 银联云闪付                            - Alipay+ / WeChat HK (Phase 3)
        |                                       |
        v                                       v
    第三方支付网关回调 (Webhook)
        |                                       |
        v                                       v
    后端验签 -> 入账 -> 订单 paid -> 国内仓发货
                                       |
                                       |---> 国内快递 (顺丰/京东/中通)
                                       |
                                       +---> 跨境直邮 (顺丰跨境/EMS/4PX)
```

---

## 核心决策 (已锁定, 见 PRD 6.3 节)

- **主体**: 国内企业 (本次讨论锁定)
- **不接加密支付**: 任何区域/币种均不支持
- **区域识别**: IP (CF-IPCountry) + 账号 (users.region) 双重判定, 账号锚定为准
- **商品策略**: 完全独立双库存 (CN listing 与 OVERSEAS listing 互不影响), 共享 SPU
- **履约**: 国内仓 + 跨境直邮 (MVP 不开海外仓)
- **货币**: CN 用 CNY, OVERSEAS 用 USD, 不实时换算
- **MVP 范围**: 自营单商家, 无评价/优惠券/积分系统, 中英双语
- **国内支付**: 支付宝 + 微信 + 银联
- **海外支付**: Stripe + PayPal + Alipay+ + WeChat HK
- **技术栈**: Next.js + NestJS + Prisma + PostgreSQL + Redis + Cloudflare

---

## 必看的开放问题 (评审重点)

详见 [PRD 6.2 节](./PRD.md#62-待决策问题) 与 [ARCHITECTURE 第 10 节](./ARCHITECTURE.md#10-待用户决策的技术问题). 关键决策:

1. **是否同时申请香港主体直连 Stripe 国际版?** 国内主体走 Stripe Connect 有商品类目限制
2. **首发品类是什么?** 影响支付商户号申请方向 (部分品类有限制)
3. **海外站客单价定位?** $20-50 / $50-200 / $200+, 影响风控与物流方式
4. **微信支付主场景?** Native (PC) / JSAPI (公众号) / H5 (浏览器) / 小程序
5. **海外站发货时效目标?** 决定承运商组合

---

## 关键风险提示 (必看)

1. **国内支付商户号审核周期 1-3 个月** - 必须 Phase 0 立即提交, 不可延后
2. **Stripe 商品类目限制** - 部分类目 Stripe 直接拒, 需提前确认; 备选 PayPal 防单点故障
3. **跨境物流时效不稳定** - 7-30 天波动, 客服压力大, 商品页必须明确告知
4. **Chargeback 损失** - 海外信用卡可拒付, 保留发货证据 (面单 + 物流) 应对争议
5. **PCI DSS 合规** - 卡号绝不落库, 全程走 Stripe Elements / PayPal SDK, 否则评估范围爆炸
6. **个人信息出境合规** - 海外用户数据存国内服务器需备案, MVP 海外用户少可豁免, Phase 3 必办
7. **支付回调幂等性** - 回调必须可重复入账不出错, 否则被攻击或重试就出资损

详见 [PRD 6.1 节](./PRD.md#61-已识别风险) 与 [ARCHITECTURE 第 9 节](./ARCHITECTURE.md#9-关键风险与缓解-技术侧).

---

## 工作量估算

| 阶段 | 周期 | 产出 |
|---|---|---|
| Phase 0 准备 | 1 周 (商户号申请并行 1-3 个月) | 资质/账户/域名/法务就绪 |
| Phase 1 国内 MVP | 4-5 周 | 国内站点跑通: 支付宝+微信支付, 国内仓发货 |
| Phase 2 海外通道 | 3-4 周 | 海外站点上线: Stripe+PayPal, 跨境直邮 |
| Phase 3 完整能力 | 4-5 周 | 银联/Alipay+/WeChat HK, 完整 i18n, 商业报关 |
| Phase 4 增值 | 4-6 周 | 评价/优惠券/积分/客服系统 |

**关键路径**: 国内支付商户号申请 1-3 个月, 必须 Phase 0 启动. 技术开发可并行.

总计 **MVP 上线 ~12 周** (Phase 0+1+2), 完整商城 **~17 周** (含 Phase 3), 团队配置 1 全栈 + 0.5 前端 + 0.3 设计 + 0.5 运营/法务.

---

## 下一步

1. 评审 PRD.md 与 ARCHITECTURE.md, 决策开放问题
2. Phase 0 启动:
   - 提交国内商户号申请 (支付宝/微信/银联)
   - 启动 Stripe / PayPal 海外账号
   - 域名 + ICP 备案
   - 法律咨询 (用户协议/隐私/退款政策)
3. 锁定首发品类 + 客单价区间
4. 仓库初始化 + Phase 1 开发启动 (已完成 Step 1 脚手架, 见下文)

---

## 快速开始 (Step 1 脚手架)

### 前置依赖

- Node.js 20.x LTS (推荐用 nvm / fnm 管理多版本)
- pnpm 9.x (通过 corepack 启用: `corepack enable && corepack prepare pnpm@9.15.0 --activate`)
- 一台可远程访问的 PostgreSQL 16 + Redis 7 (装在你的云服务器上, 安装步骤见 [docs/setup-cloud-server.md](./docs/setup-cloud-server.md))

### 启动步骤

```bash
# 1. 安装所有依赖
pnpm install

# 2. 复制环境变量模板, 填入你的云服务器 PG/Redis 连接串
cp .env.example .env
# 编辑 .env, 改 DATABASE_URL 和 REDIS_URL

# 3. 生成 Prisma 客户端 (首次必须)
pnpm --filter api exec prisma generate

# 4. 同时启动前后端
pnpm dev

# 或单独启动
pnpm dev:api    # NestJS 在 http://localhost:3001
pnpm dev:web    # Next.js 在 http://localhost:3000
```

### 验证启动成功

打开 http://localhost:3000 , 应看到首页显示 PostgreSQL 与 Redis 的连接状态:

- 绿点 + OK + 延迟毫秒数: 连接正常
- 红点 + ERROR: 检查 .env 配置与云服务器防火墙

后端健康检查可直接访问: http://localhost:3001/health

### 工程结构

```
d:/web3-mall/
├── apps/
│   ├── web/          # Next.js 15 前端 (App Router)
│   └── api/          # NestJS 10 后端
├── packages/
│   └── shared/       # 前后端共享类型 (Region / API 契约)
├── docs/
│   └── setup-cloud-server.md   # 云服务器依赖安装指引
├── PRD.md            # 产品需求文档
├── ARCHITECTURE.md   # 技术架构文档
└── ...               # 工程化配置 (tsconfig / eslint / prettier / etc.)
```

### 常用命令

```bash
pnpm typecheck             # 全量类型检查
pnpm lint                  # 全量 lint
pnpm format                # prettier 格式化
pnpm build                 # 全量构建
pnpm --filter api prisma:generate  # 重新生成 Prisma 客户端
```

### Step 1 验证 checklist

- [ ] `pnpm install` 完成, 无报错
- [ ] `pnpm typecheck` 通过 (api + web + shared 三个 workspace 都 0 错误)
- [ ] `pnpm dev:api` 启动后控制台显示 "API listening on http://localhost:3001"
- [ ] `curl http://localhost:3001/health` 返回 JSON, db/redis 都 status: ok
- [ ] `pnpm dev:web` 启动后访问 http://localhost:3000 看到两个绿点
- [ ] `pnpm build` 全量构建通过

通过后可进入 Step 2: Prisma 业务 schema + 区域路由中间件 + 用户注册登录.
