export const DEFAULT_TRADE_TASKS: {
  stage: string
  title: string
  description?: string
  sortOrder: number
}[] = [
  { stage: 'prep', title: '确认 CNPJ + RADAR 进口资质', sortOrder: 1 },
  { stage: 'prep', title: '签约巴西清关行', sortOrder: 2 },
  { stage: 'prep', title: '签约圣保罗海外仓（3PL）', sortOrder: 3 },
  { stage: 'prep', title: '签约中国货代（海运+出口报关）', sortOrder: 4 },
  { stage: 'procurement', title: '确认 NCM 税号与含税到岸成本', sortOrder: 1 },
  { stage: 'procurement', title: '工厂下单采购', sortOrder: 2 },
  { stage: 'procurement', title: '质检、贴 EAN/箱唛、葡语标签', sortOrder: 3 },
  { stage: 'export', title: '准备 Commercial Invoice', sortOrder: 1 },
  { stage: 'export', title: '准备 Packing List（精确到每箱 SKU）', sortOrder: 2 },
  { stage: 'export', title: '中国出口报关', sortOrder: 3 },
  { stage: 'sea_freight', title: '订舱发运（LCL/FCL）', sortOrder: 1 },
  { stage: 'sea_freight', title: '发 ASN 入仓预报给海外仓', sortOrder: 2 },
  { stage: 'customs', title: '到港换 DO', sortOrder: 1 },
  { stage: 'customs', title: '提交进口申报（SISCOMEX）', sortOrder: 2 },
  { stage: 'customs', title: '缴纳进口税（II/IPI/PIS/COFINS/ICMS）', sortOrder: 3 },
  { stage: 'customs', title: '海关放行', sortOrder: 4 },
  { stage: 'warehouse', title: '拖柜至圣保罗海外仓', sortOrder: 1 },
  { stage: 'warehouse', title: '卸柜清点（实收 vs 单证）', sortOrder: 2 },
  { stage: 'warehouse', title: '扫码上架，系统可售库存就绪', sortOrder: 3 },
  { stage: 'sales', title: '亚马逊巴西 FBM 上架（葡语 listing）', sortOrder: 1 },
  { stage: 'sales', title: '美客多自发货上架（Mercado Envios）', sortOrder: 2 },
  { stage: 'sales', title: '双平台库存同步，设安全库存', sortOrder: 3 },
  { stage: 'fulfillment', title: '测试出库：亚马逊 1 单', sortOrder: 1 },
  { stage: 'fulfillment', title: '测试出库：美客多 1 单', sortOrder: 2 },
]

export const SHIPMENT_STATUS_ORDER = [
  'planning',
  'procuring',
  'ready_export',
  'in_transit',
  'at_port',
  'customs_clearing',
  'customs_cleared',
  'to_warehouse',
  'warehouse_received',
  'shelved',
  'selling',
  'completed',
] as const
