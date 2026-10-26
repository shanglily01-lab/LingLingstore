import type { TradeTaskStage } from './foreign-trade'

export type GuideTipLevel = 'info' | 'warning' | 'danger'

export interface GuideAction {
  id: string
  label: string
  description: string
  href?: string
  systemHint?: string
}

export interface GuideTip {
  level: GuideTipLevel
  title: string
  body: string
}

export interface GuideStage {
  id: TradeTaskStage
  order: number
  title: string
  subtitle: string
  duration: string
  summary: string
  actions: GuideAction[]
  tips: GuideTip[]
  beforeNext: string[]
}

/** 巴西扑克牌 · 中国海运 → 圣保罗海外仓 · 亚马逊/美客多 新手全流程 */
export const FOREIGN_TRADE_BEGINNER_GUIDE: GuideStage[] = [
  {
    id: 'prep',
    order: 1,
    title: '筹备阶段',
    subtitle: '主体、资质、找齐三大服务商',
    duration: '约 2–8 周',
    summary: '在发货之前，先把「谁能帮你清关、谁收货、谁运货」确定下来。没有 CNPJ 和清关行，货到了巴西港口也进不了仓。',
    actions: [
      {
        id: 'cnpj',
        label: '确认或注册巴西 CNPJ + RADAR 进口资质',
        description: 'CNPJ 是巴西公司税号，RADAR 是进口资质。没有它们，无法正规清关。可自己注册或找合规代理。',
      },
      {
        id: 'customs_broker',
        label: '签约清关行（熟悉桑托斯 → 圣保罗）',
        description: '用 NCM 9504.40.00 做「1 万副扑克牌」含税到岸价模拟，书面确认是否需要 INMETRO。',
        href: '/admin/foreign-trade/partners',
        systemHint: '在「服务商」中添加类型为「清关行」的合作伙伴',
      },
      {
        id: 'warehouse',
        label: '签约圣保罗海外仓（3PL）',
        description: '确认：能否接桑托斯拖柜、能否打亚马逊/美客多面单、退件怎么处理、推单方式。',
        href: '/admin/foreign-trade/partners',
        systemHint: '在「服务商」中添加类型为「海外仓」的合作伙伴',
      },
      {
        id: 'freight',
        label: '签约中国货代（海运 + 出口报关）',
        description: '问清楚：LCL 海运费、中国港杂、是否配合巴西清关行、能否港到仓一条龙。',
        href: '/admin/foreign-trade/partners',
        systemHint: '在「服务商」中添加类型为「中国货代」的合作伙伴',
      },
      {
        id: 'platform_accounts',
        label: '注册亚马逊巴西 + 美客多卖家账号',
        description: '需要 CNPJ、葡语 listing 准备、收款账户（Payoneer 等）。可先注册，listing 入仓前备好。',
      },
    ],
    tips: [
      {
        level: 'danger',
        title: '最大误区：以为有货代就够了',
        body: '货代管运输，清关行管进巴西国门，海外仓管收货发货。三者必须提前签好并拉群沟通。',
      },
      {
        level: 'warning',
        title: '清关行报价务必含「含税到岸价」',
        body: '让清关行按你的 CIF 货值分项列出 II、IPI、PIS/COFINS、ICMS，不要只看海运费。',
      },
      {
        level: 'info',
        title: '扑克牌相对友好',
        body: 'NCM 9504.40.00，成人娱乐向一般不需 INMETRO。包装和文案避免儿童玩具定位。',
      },
    ],
    beforeNext: [
      'CNPJ + RADAR 已确认',
      '清关行、海外仓、货代三方已录入系统',
      '含税到岸成本模拟已完成',
    ],
  },
  {
    id: 'procurement',
    order: 2,
    title: '采购阶段',
    subtitle: '选品、算税、下单、质检贴标',
    duration: '约 2–4 周',
    summary: '采购前先算清楚到仓成本，再决定采购量和零售价。扑克牌要准备 EAN 条码、箱唛、葡语盒标。',
    actions: [
      {
        id: 'ncm_cost',
        label: '清关行确认 NCM + 含税到岸成本',
        description: '扑克牌 NCM：9504.40.00。综合税负常见为货值+运费的 50%–80%，以清关行模拟为准。',
        href: '/admin/foreign-trade/cost',
        systemHint: '使用「成本估算」工具测算，再与清关行书面报价核对',
      },
      {
        id: 'create_shipment',
        label: '在系统创建货运批次',
        description: '创建后会自动生成 24 项标准任务清单，后续按清单逐项勾选即可。',
        href: '/admin/foreign-trade/shipments',
        systemHint: '点击「新建批次」，填写名称如「2026-Q2 扑克牌首单」',
      },
      {
        id: 'add_skus',
        label: '添加 SKU 明细（品名、数量、箱规、EAN）',
        description: '首单建议 2–3 个 SKU，5,000–20,000 副，LCL 拼柜试跑。',
        href: '/admin/foreign-trade/shipments',
        systemHint: '进入批次详情，绑定 SKU 与服务商',
      },
      {
        id: 'factory_order',
        label: '工厂下单 + 质检',
        description: '1688/工厂直采，确认 Poker Size 63×88mm、280–300gsm 铜版纸、外箱耐压。',
      },
      {
        id: 'labeling',
        label: '贴 EAN 条码、箱唛、葡语标签',
        description: '盒上建议有：Cartas de baralho、进口商 CNPJ、Fabricado na China。外箱贴 SKU/数量箱唛。',
      },
    ],
    tips: [
      {
        level: 'danger',
        title: '税算不足 = 卖一单亏一单',
        body: '定价前必须知道「每副到仓成本」。不要只按采购价 × 2 定价。',
      },
      {
        level: 'warning',
        title: '首单不要整柜',
        body: '建议 LCL 拼柜 5,000–20,000 副，跑通全流程后再加大货量。',
      },
      {
        level: 'info',
        title: '参考零售价（巴西）',
        body: '普通纸扑克 R$22–32/副；进口塑料扑克 R$20–35；Copag 专业德州牌 R$50–72。',
      },
    ],
    beforeNext: [
      '批次已创建并绑定三大服务商',
      'SKU、数量、EAN 已确定',
      '工厂已下单，箱唛和标签规范已发给工厂',
    ],
  },
  {
    id: 'export',
    order: 3,
    title: '中国出口',
    subtitle: '单证准备 + 出口报关',
    duration: '约 3–5 天',
    summary: '发票、装箱单、提单信息必须和实物完全一致。单证错误是清关被扣的首要原因。',
    actions: [
      {
        id: 'invoice',
        label: '准备 Commercial Invoice（商业发票）',
        description: '含：买卖双方、SKU、数量、单价、总价、NCM、Incoterms（通常 CIF Santos）。',
      },
      {
        id: 'packing_list',
        label: '准备 Packing List（装箱单）',
        description: '精确到每箱：SKU、副数、毛重、净重、尺寸。和工厂实际装箱一致。',
      },
      {
        id: 'export_decl',
        label: '中国出口报关',
        description: '货代安排买单出口或退税报关，货送港口或货代仓集货。',
      },
      {
        id: 'bind_partners',
        label: '批次绑定货代 / 清关行 / 海外仓',
        description: '确保系统里服务商和本批次对应，方便跟单。',
        href: '/admin/foreign-trade/shipments',
        systemHint: '批次详情 → 服务商下拉框选择对应公司',
      },
    ],
    tips: [
      {
        level: 'danger',
        title: '三单一致',
        body: 'Invoice、Packing List、实物 的 SKU 名称、数量、金额必须一致，否则巴西海关不放行。',
      },
      {
        level: 'warning',
        title: '葡语品名规范',
        body: '用清关行提供的规范品名，不要自己瞎填导致 NCM 归类错误。',
      },
    ],
    beforeNext: [
      'Invoice 和 Packing List 已审核',
      '出口报关已委托货代',
      '批次状态可推进到「待出口」',
    ],
  },
  {
    id: 'sea_freight',
    order: 4,
    title: '海运阶段',
    subtitle: '订舱发运 + 入仓预报',
    duration: '海运 35–45 天',
    summary: '货在海上时就要把海外仓对接好。开船前发 ASN，避免货到没人接。',
    actions: [
      {
        id: 'booking',
        label: '货代订舱（LCL 拼柜 / FCL 整柜）',
        description: '深圳/宁波 → 桑托斯港，首单建议 LCL。记录柜号、提单号到批次。',
        href: '/admin/foreign-trade/shipments',
        systemHint: '批次详情填写柜号、提单号、预计到港日',
      },
      {
        id: 'asn',
        label: '发 ASN 入仓预报给海外仓',
        description: '含：柜号/提单号、ETA、SKU 明细表、箱唛样式、是否代贴标。',
      },
      {
        id: 'advance_status',
        label: '系统推进批次状态 →「海运中」',
        description: '开船后在系统更新状态，团队可见当前进度。',
        href: '/admin/foreign-trade/shipments',
        systemHint: '批次详情 →「推进到下一阶段」',
      },
      {
        id: 'weekly_follow',
        label: '每周跟单三句话',
        description: '问货代：货在哪？问清关行：申报了吗？问海外仓：柜到了吗？',
      },
    ],
    tips: [
      {
        level: 'warning',
        title: '开船前必须发 ASN',
        body: '没预报 = 仓库没安排卸柜人手 = 延误上架。',
      },
      {
        level: 'info',
        title: '桑托斯 → 圣保罗',
        body: '清关后拖柜约 60–90 km，1–2 天到仓。',
      },
    ],
    beforeNext: [
      '已开船，提单号已录入',
      'ASN 已发海外仓',
      '批次状态为「海运中」',
    ],
  },
  {
    id: 'customs',
    order: 5,
    title: '清关阶段',
    subtitle: '进口申报、缴税、海关放行',
    duration: '约 7–15 天（查验另计）',
    summary: '这是新手最该关注的环节。放行之前，货不能进海外仓，也不能卖。',
    actions: [
      {
        id: 'do',
        label: '到港换 DO（Delivery Order）',
        description: '船到桑托斯后，货代/清关行向船公司换取提货单。',
      },
      {
        id: 'declare',
        label: '清关行提交进口申报（SISCOMEX）',
        description: '用你的 CNPJ 做进口申报，NCM 9504.40.00。',
      },
      {
        id: 'pay_tax',
        label: '缴纳进口税',
        description: 'II + IPI + PIS/COFINS + ICMS（圣保罗约 18%）。清关行会代缴。',
      },
      {
        id: 'inspect',
        label: '等待海关审核（可能查验）',
        description: '正常 7–15 工作日；查验可能 2–4 周。提前备好认证复印件。',
      },
      {
        id: 'cleared',
        label: '放行后推进状态 →「已清关」',
        description: '记录实际到港日、清关完成日。',
        href: '/admin/foreign-trade/shipments',
        systemHint: '勾选清关相关任务 + 推进批次状态',
      },
    ],
    tips: [
      {
        level: 'danger',
        title: '清关三大翻车',
        body: '① NCM 税号错误 → 补税/扣货  ② 单证与实物不符 → 不放行  ③ 无 CNPJ/RADAR → 无法申报',
      },
      {
        level: 'danger',
        title: '进口税是大头',
        body: '扑克牌综合税负常见 50%–80%（相对 CIF）。定价必须基于到岸成本，不是采购价。',
      },
      {
        level: 'warning',
        title: '被查验怎么办',
        body: '保持与清关行每日沟通，备齐 Invoice、Packing List、提单、产品图片。不要催货代却联系不上清关行。',
      },
      {
        level: 'info',
        title: '扑克牌认证',
        body: '成人扑克一般不需 INMETRO；listing 和包装避免儿童玩具表述。',
      },
    ],
    beforeNext: [
      '海关已放行',
      '进口税已缴纳',
      '批次状态为「已清关」或「拖柜入仓」',
    ],
  },
  {
    id: 'warehouse',
    order: 6,
    title: '海外仓阶段',
    subtitle: '拖柜、收货、清点、上架',
    duration: '约 3–7 天',
    summary: '货进圣保罗仓并上架后，系统里才有「可售库存」，才能开始卖。',
    actions: [
      {
        id: 'truck',
        label: '安排拖柜：桑托斯港 → 圣保罗海外仓',
        description: '清关行或货代安排，通常 1–2 天到仓。',
      },
      {
        id: 'unload',
        label: '仓库卸柜 / 拆柜 + 清点',
        description: '按 SKU 扫码，核对实收数量 = 装箱单数量。',
      },
      {
        id: 'shelve',
        label: '上架入系统',
        description: '仓库 WMS 出现可售库存。如有需要代贴 FNSKU/EAN。',
      },
      {
        id: 'sync_inv',
        label: '系统同步库存到海外仓',
        description: '批次入库后，一键把 SKU 数量同步到库存模块。',
        href: '/admin/foreign-trade/shipments',
        systemHint: '批次详情 →「同步库存到海外仓」（状态需已入库）',
      },
      {
        id: 'verify',
        label: '核对库存数量',
        description: '在库存页确认在库/可售数量正确。',
        href: '/admin/foreign-trade/inventory',
        systemHint: '「海外仓库存」查看各 SKU 可售数量',
      },
    ],
    tips: [
      {
        level: 'danger',
        title: '实收 ≠ 单证 要立刻对账',
        body: '少货、错 SKU 要在签收时和仓库/清关行确认，不要等上架后才发现。',
      },
      {
        level: 'warning',
        title: '平台先别开售',
        body: '入仓完成、库存同步之前，listing 库存保持 0，避免超卖。',
      },
    ],
    beforeNext: [
      '仓库已确认收货数量',
      '系统库存已同步',
      '批次状态为「已上架」或「销售中」',
    ],
  },
  {
    id: 'sales',
    order: 7,
    title: '平台上架',
    subtitle: '亚马逊 FBM + 美客多自发货',
    duration: '约 1–2 周',
    summary: '共用同一海外仓库存，双平台同时卖。Listing 必须葡语，价格基于到仓成本。',
    actions: [
      {
        id: 'amazon_listing',
        label: '亚马逊巴西 FBM 上架',
        description: 'Merchant Fulfilled，发货地圣保罗，Handling Time 1–2 天，绑定 EAN。',
      },
      {
        id: 'ml_listing',
        label: '美客多自发货上架（Mercado Envios）',
        description: '非 Full 模式，平台生成面单推给海外仓打印。',
      },
      {
        id: 'pricing',
        label: '定价：到仓成本 + 仓配 + 佣金 + 广告 + 利润',
        description: '纸牌建议 R$22–32/副；留 5–10% 安全库存防超卖。',
      },
      {
        id: 'stock_live',
        label: '入仓完成后改可售库存',
        description: '确认海外仓可售数量后再在平台放开销售。',
        href: '/admin/foreign-trade/inventory',
        systemHint: '库存页确认 quantityAvailable > 0',
      },
    ],
    tips: [
      {
        level: 'warning',
        title: '双平台共仓防超卖',
        body: '可售库存 = 在库 − 预留 − 安全库存。两平台共用，必须同步扣减。',
      },
      {
        level: 'info',
        title: '美客多往往起量更快',
        body: '可先略低价测转化，亚马逊同步；30 天看哪边 ROAS 更好。',
      },
    ],
    beforeNext: [
      '两个平台 listing 已上线',
      '库存已设为可售',
      '平台面单格式已与海外仓试打',
    ],
  },
  {
    id: 'fulfillment',
    order: 8,
    title: '订单履约',
    subtitle: '来单 → 推仓 → 贴单 → 发货 → 回款',
    duration: '日常持续',
    summary: '首单目标：跑通一次完整履约。平台来单后推给海外仓，回填运单号。',
    actions: [
      {
        id: 'test_amz',
        label: '测试出库：亚马逊 1 单',
        description: '创建履约单 → 推仓 → 仓库贴单 → 填运单号 → 确认签收。',
        href: '/admin/foreign-trade/fulfillment',
        systemHint: '「订单履约」→ 新建 → 选 amazon_br',
      },
      {
        id: 'test_ml',
        label: '测试出库：美客多 1 单',
        description: '确认 Mercado Envios 面单仓库能正常打印。',
        href: '/admin/foreign-trade/fulfillment',
        systemHint: '「订单履约」→ 新建 → 选 mercado_livre',
      },
      {
        id: 'flow',
        label: '熟悉日常履约流程',
        description: '待推仓 → 已推仓 → 已发货（扣库存）→ 已完成。发货当天回填 tracking。',
      },
      {
        id: 'returns',
        label: '确认退件方案',
        description: '和海外仓约定：退件地址、是否重新上架、谁承担运费。',
      },
    ],
    tips: [
      {
        level: 'warning',
        title: '面单格式先测再打',
        body: '亚马逊和美客多面单格式不同，首单前让 3PL 各试打 1 张。',
      },
      {
        level: 'info',
        title: '首单成功标准',
        body: '不是赚大钱，而是：海运→清关→入仓→出库→回款 全流程跑通一次。',
      },
    ],
    beforeNext: [
      '两个平台各完成 1 单测试出库',
      '运单号回填正常',
      '库存扣减正确',
    ],
  },
]

export const GUIDE_PROGRESS_STORAGE_KEY = 'foreign-trade-guide-progress-v1'

export interface GuideProgressSnapshot {
  checkedActions: Record<string, boolean>
  completedStages: Record<string, boolean>
  lastStageId?: TradeTaskStage
}

export function emptyGuideProgress(): GuideProgressSnapshot {
  return { checkedActions: {}, completedStages: {} }
}
