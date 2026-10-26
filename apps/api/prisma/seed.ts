import { config } from 'dotenv'
import { resolve } from 'path'
import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcrypt'
import { DEFAULT_TRADE_TASKS } from '../src/foreign-trade/default-tasks'

//  monorepo 根目录 .env（apps/api 下执行 prisma 时默认读不到）
config({ path: resolve(__dirname, '../../../.env') })
config({ path: resolve(__dirname, '../.env') })

const prisma = new PrismaClient()

// Unsplash photo IDs for product images in different categories
const IMAGES = {
  phone: [
    'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1580910051074-3eb694886505?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&h=400&fit=crop',
  ],
  laptop: [
    'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=400&h=400&fit=crop',
  ],
  tablet: [
    'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1561154464-82e9adf32764?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1587033411391-5d9e51cce126?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1632633173527-400d8750a06f?w=400&h=400&fit=crop',
  ],
  audio: [
    'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1487215078519-e21cc028cb29?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1558089687-f282ffcbc126?w=400&h=400&fit=crop',
  ],
  watch: [
    'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1546868871-af0de0ae72ab?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=400&h=400&fit=crop',
  ],
  camera: [
    'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1510127034890-ba27508e9f1c?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=400&h=400&fit=crop',
  ],
  clothing: [
    'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=400&fit=crop',
  ],
  home: [
    'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1544457070-4cd773b4d71e?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=400&h=400&fit=crop',
  ],
  kitchen: [
    'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1590794056226-79ef3a8147e1?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1556911220-bff31c812dba?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1556909114-6c86ef9a1a09?w=400&h=400&fit=crop',
  ],
  beauty: [
    'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1585386959984-a4155224a1ad?w=400&h=400&fit=crop',
  ],
  food: [
    'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&h=400&fit=crop',
  ],
  sport: [
    'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1572495641004-28421e29adf9?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&h=400&fit=crop',
  ],
}

// ============= 商品数据定义 =============

// Category 1: 手机通讯
const phoneProducts = [
  { nameCn: '苹果 iPhone 16 Pro Max 256GB', nameEn: 'Apple iPhone 16 Pro Max 256GB', descCn: 'A18 Pro 芯片 · 6.9 英寸超视网膜 XDR 显示屏 · 4800 万像素主摄 · 钛金属设计', descEn: 'A18 Pro chip · 6.9" Super Retina XDR display · 48MP main camera · Titanium design', priceCN: 999900, priceUS: 119999 },
  { nameCn: '华为 Mate 70 Pro+ 512GB', nameEn: 'Huawei Mate 70 Pro+ 512GB', descCn: '麒麟 9100 芯片 · 5000 万像素超感知影像 · 卫星通信 · 昆仑玻璃', descEn: 'Kirin 9100 chip · 50MP Ultra Vision camera · Satellite communication · Kunlun Glass', priceCN: 899900, priceUS: 109999 },
  { nameCn: '小米 15 Ultra 1TB', nameEn: 'Xiaomi 15 Ultra 1TB', descCn: '骁龙 8 Gen 4 · 徕卡光学 Summilux 镜头 · 6000mAh 金沙江电池', descEn: 'Snapdragon 8 Gen 4 · Leica Summilux optics · 6000mAh battery', priceCN: 699900, priceUS: 89999 },
  { nameCn: 'OPPO Find X8 Pro', nameEn: 'OPPO Find X8 Pro', descCn: '天玑 9400 处理器 · 5000 万像素哈苏三摄 · 80W 超级闪充', descEn: 'Dimensity 9400 · 50MP Hasselblad triple camera · 80W SuperVOOC', priceCN: 599900, priceUS: 79999 },
  { nameCn: 'vivo X200 Pro 蔡司版', nameEn: 'vivo X200 Pro ZEISS Edition', descCn: '天玑 9400 · 蔡司 APO 超级长焦 · 6000mAh 蓝海电池', descEn: 'Dimensity 9400 · ZEISS APO super telephoto · 6000mAh battery', priceCN: 549900, priceUS: 74999 },
  { nameCn: '三星 Galaxy S25 Ultra', nameEn: 'Samsung Galaxy S25 Ultra', descCn: '骁龙 8 Gen 4 · 2 亿像素 AI 相机 · S Pen · Galaxy AI', descEn: 'Snapdragon 8 Gen 4 · 200MP AI camera · S Pen · Galaxy AI', priceCN: 899900, priceUS: 129999 },
  { nameCn: '荣耀 Magic7 Pro', nameEn: 'Honor Magic7 Pro', descCn: '骁龙 8 Gen 4 · 鹰眼相机 · 青海湖电池 5850mAh · 护眼屏', descEn: 'Snapdragon 8 Gen 4 · Falcon Camera · 5850mAh battery · Eye-comfort display', priceCN: 569900, priceUS: 77999 },
  { nameCn: '一加 Ace 5 Pro', nameEn: 'OnePlus Ace 5 Pro', descCn: '骁龙 8 Gen 4 · 120Hz 电竞屏 · 100W 超级闪充 · 电竞天线', descEn: 'Snapdragon 8 Gen 4 · 120Hz gaming display · 100W charging', priceCN: 399900, priceUS: 59999 },
]

// Category 2: 电脑办公
const laptopProducts = [
  { nameCn: '苹果 MacBook Pro 16" M4 Max', nameEn: 'Apple MacBook Pro 16" M4 Max', descCn: 'M4 Max 芯片 · 48GB 统一内存 · 1TB 固态硬盘 · Liquid Retina XDR 显示屏', descEn: 'M4 Max chip · 48GB unified memory · 1TB SSD · Liquid Retina XDR display', priceCN: 2799900, priceUS: 349999 },
  { nameCn: '联想 ThinkPad X1 Carbon Gen 13', nameEn: 'Lenovo ThinkPad X1 Carbon Gen 13', descCn: '酷睿 Ultra 9 · 32GB LPDDR5x · 1TB SSD · 14" 2.8K OLED · 1.08kg', descEn: 'Core Ultra 9 · 32GB LPDDR5x · 1TB SSD · 14" 2.8K OLED · 1.08kg', priceCN: 1499900, priceUS: 189999 },
  { nameCn: '戴尔 XPS 16 9640', nameEn: 'Dell XPS 16 9640', descCn: '酷睿 Ultra 9 · 32GB 内存 · 1TB SSD · 16.3" 4K OLED 触控屏', descEn: 'Core Ultra 9 · 32GB RAM · 1TB SSD · 16.3" 4K OLED touch', priceCN: 1699900, priceUS: 219999 },
  { nameCn: '华为 MateBook X Pro 2025', nameEn: 'Huawei MateBook X Pro 2025', descCn: '酷睿 Ultra 9 · 32GB 内存 · 2TB SSD · 14.2" 3.1K OLED · 980g', descEn: 'Core Ultra 9 · 32GB RAM · 2TB SSD · 14.2" 3.1K OLED · 980g', priceCN: 1299900, priceUS: 169999 },
  { nameCn: '华硕 ROG 枪神 8 Plus 超竞版', nameEn: 'ASUS ROG Strix Scar 18', descCn: 'i9-14900HX · RTX 4090 · 64GB DDR5 · 2TB SSD · 18" MiniLED 2.5K 240Hz', descEn: 'i9-14900HX · RTX 4090 · 64GB DDR5 · 2TB SSD · 18" MiniLED 2.5K 240Hz', priceCN: 2599900, priceUS: 329999 },
  { nameCn: '微软 Surface Laptop 7', nameEn: 'Microsoft Surface Laptop 7', descCn: '骁龙 X Elite · 16GB 内存 · 512GB SSD · 15" PixelSense 触控屏', descEn: 'Snapdragon X Elite · 16GB RAM · 512GB SSD · 15" PixelSense touch', priceCN: 1199900, priceUS: 149999 },
  { nameCn: '惠普 Spectre x360 16', nameEn: 'HP Spectre x360 16', descCn: '酷睿 Ultra 7 · 16GB 内存 · 1TB SSD · 16" 2.8K OLED 触控翻转', descEn: 'Core Ultra 7 · 16GB RAM · 1TB SSD · 16" 2.8K OLED 2-in-1', priceCN: 999900, priceUS: 129999 },
  { nameCn: '小米 RedmiBook Pro 16 2025', nameEn: 'Xiaomi RedmiBook Pro 16 2025', descCn: '酷睿 Ultra 7 · 32GB 内存 · 1TB SSD · 16" 3.2K 165Hz 高刷屏', descEn: 'Core Ultra 7 · 32GB RAM · 1TB SSD · 16" 3.2K 165Hz display', priceCN: 699900, priceUS: 89999 },
]

// Category 3: 平板电脑
const tabletProducts = [
  { nameCn: '苹果 iPad Pro M4 13"', nameEn: 'Apple iPad Pro M4 13"', descCn: 'M4 芯片 · 13" Ultra Retina XDR · Apple Pencil Pro · 超轻薄设计', descEn: 'M4 chip · 13" Ultra Retina XDR · Apple Pencil Pro · Ultra-thin design', priceCN: 1099900, priceUS: 129999 },
  { nameCn: '华为 MatePad Pro 13.2"', nameEn: 'Huawei MatePad Pro 13.2"', descCn: '麒麟 9010 · 13.2" OLED · 星闪手写笔 · 天生会画', descEn: 'Kirin 9010 · 13.2" OLED · NearLink stylus · GoPaint', priceCN: 599900, priceUS: 79999 },
  { nameCn: '三星 Galaxy Tab S10 Ultra', nameEn: 'Samsung Galaxy Tab S10 Ultra', descCn: '天玑 9300+ · 14.6" Dynamic AMOLED 2X · S Pen · 超大电池', descEn: 'Dimensity 9300+ · 14.6" Dynamic AMOLED 2X · S Pen · Large battery', priceCN: 899900, priceUS: 119999 },
  { nameCn: '小米平板 7S Pro', nameEn: 'Xiaomi Pad 7S Pro', descCn: '骁龙 8 Gen 3 · 12.4" 3K 144Hz 屏 · 10000mAh · 键盘套装', descEn: 'Snapdragon 8 Gen 3 · 12.4" 3K 144Hz · 10000mAh · Keyboard kit', priceCN: 399900, priceUS: 54999 },
  { nameCn: '联想拯救者 Y900', nameEn: 'Lenovo Legion Y900', descCn: '天玑 9000 · 14.5" 3K OLED 120Hz · JBL 八扬声器 · 游戏平板', descEn: 'Dimensity 9000 · 14.5" 3K OLED 120Hz · JBL 8-speaker', priceCN: 499900, priceUS: 64999 },
  { nameCn: 'OPPO Pad 4 Pro', nameEn: 'OPPO Pad 4 Pro', descCn: '骁龙 8 Gen 3 · 12.1" 2.8K 144Hz · 9510mAh · 67W 快充', descEn: 'Snapdragon 8 Gen 3 · 12.1" 2.8K 144Hz · 9510mAh · 67W fast charge', priceCN: 329900, priceUS: 44999 },
]

// Category 4: 耳机音响
const audioProducts = [
  { nameCn: '苹果 AirPods Max (USB-C)', nameEn: 'Apple AirPods Max (USB-C)', descCn: '自适应均衡 · 主动降噪 · 通透模式 · 空间音频 · 20 小时续航', descEn: 'Adaptive EQ · Active Noise Cancellation · Transparency · Spatial audio · 20h battery', priceCN: 399900, priceUS: 54999 },
  { nameCn: '索尼 WH-1000XM6 头戴降噪', nameEn: 'Sony WH-1000XM6 Wireless', descCn: '旗舰级降噪 · Hi-Res Audio · 30 小时续航 · 触控面板 · 多点连接', descEn: 'Industry-leading ANC · Hi-Res Audio · 30h battery · Touch sensor · Multipoint', priceCN: 299900, priceUS: 39999 },
  { nameCn: '华为 FreeBuds Pro 4', nameEn: 'Huawei FreeBuds Pro 4', descCn: '超感知降噪 · 麒麟 A2 芯片 · 无损音质 · 星闪连接', descEn: 'Ultra-sensing ANC · Kirin A2 chip · Lossless audio · NearLink', priceCN: 149900, priceUS: 19999 },
  { nameCn: '小米 Buds 5 Pro', nameEn: 'Xiaomi Buds 5 Pro', descCn: '三单元旗舰 · 哈曼调音 · 双设备连接 · 40dB 主动降噪', descEn: 'Triple-driver flagship · Harman tuning · Dual device · 40dB ANC', priceCN: 119900, priceUS: 16999 },
  { nameCn: 'Bose QC Ultra 降噪耳机', nameEn: 'Bose QuietComfort Ultra', descCn: '沉浸式空间音频 · CustomTune 智能调校 · 24 小时续航', descEn: 'Immersive spatial audio · CustomTune technology · 24h battery', priceCN: 329900, priceUS: 42999 },
  { nameCn: '漫步者 S3000MKII 蓝牙音箱', nameEn: 'Edifier S3000MKII Speaker', descCn: 'Hi-Res 无线 · 平面振膜高音 · 192kHz/24bit · 蓝牙 5.3', descEn: 'Hi-Res Wireless · Planar tweeter · 192kHz/24bit · Bluetooth 5.3', priceCN: 329900, priceUS: 39999 },
  { nameCn: '哈曼卡顿 SoundSticks 4', nameEn: 'Harman Kardon SoundSticks 4', descCn: '标志性透明设计 · 8 个全频喇叭 · 100W 澎湃音效 · 蓝牙 5.2', descEn: 'Iconic transparent design · 8 full-range drivers · 100W sound · BT 5.2', priceCN: 299900, priceUS: 34999 },
  { nameCn: 'JBL Charge 5 便携音箱', nameEn: 'JBL Charge 5', descCn: 'IP67 防水防尘 · 20 小时播放 · 30W 震撼低音 · 可作为充电宝', descEn: 'IP67 waterproof · 20h playtime · 30W deep bass · Power bank function', priceCN: 129900, priceUS: 17999 },
]

// Category 5: 智能穿戴
const wearableProducts = [
  { nameCn: '苹果 Apple Watch Ultra 3', nameEn: 'Apple Watch Ultra 3', descCn: '49mm 钛金属 · 3000nit 亮度 · 精准双频 GPS · 潜水模式', descEn: '49mm titanium · 3000 nits · Precision dual-frequency GPS · Dive mode', priceCN: 699900, priceUS: 79999 },
  { nameCn: '苹果 Apple Watch Series 10', nameEn: 'Apple Watch Series 10', descCn: '46mm 大屏 · 睡眠呼吸暂停检测 · 血氧 · ECG · 快充', descEn: '46mm display · Sleep apnea detection · Blood oxygen · ECG · Fast charge', priceCN: 399900, priceUS: 49999 },
  { nameCn: '华为 WATCH GT 5 Pro', nameEn: 'Huawei WATCH GT 5 Pro', descCn: '钛合金表体 · 高尔夫球场模式 · 14 天续航 · 健康管理', descEn: 'Titanium body · Golf mode · 14-day battery · Health management', priceCN: 299900, priceUS: 39999 },
  { nameCn: '三星 Galaxy Watch Ultra', nameEn: 'Samsung Galaxy Watch Ultra', descCn: '钛金属 · Galaxy AI · 生物活性传感器 · 3nm 处理器', descEn: 'Titanium · Galaxy AI · BioActive sensor · 3nm processor', priceCN: 499900, priceUS: 64999 },
  { nameCn: '小米 手环 9 Pro', nameEn: 'Xiaomi Smart Band 9 Pro', descCn: '1.74" AMOLED 大屏 · 全天心率血氧 · 21 天续航 · 50 米防水', descEn: '1.74" AMOLED · 24/7 HR & SpO2 · 21-day battery · 50m waterproof', priceCN: 39900, priceUS: 5999 },
  { nameCn: 'OPPO Watch 4 Pro', nameEn: 'OPPO Watch 4 Pro', descCn: '骁龙 W7 芯片 · 双芯架构 · 5 天全智能续航 · 羽毛球模式', descEn: 'Snapdragon W7 · Dual-engine · 5-day smart battery · Badminton mode', priceCN: 249900, priceUS: 32999 },
]

// Category 6: 摄影摄像
const cameraProducts = [
  { nameCn: '索尼 A7M5 全画幅微单', nameEn: 'Sony A7M5 Full-Frame Mirrorless', descCn: '5000 万像素 · AI 自动对焦 · 8K 视频 · 机身防抖 8 档', descEn: '50MP · AI autofocus · 8K video · 8-stop IBIS', priceCN: 2299900, priceUS: 299999 },
  { nameCn: '佳能 EOS R5 Mark II', nameEn: 'Canon EOS R5 Mark II', descCn: '4500 万像素 · DIGIC X2 · 8K 60p RAW · 眼控对焦', descEn: '45MP · DIGIC X2 · 8K 60p RAW · Eye Control AF', priceCN: 2899900, priceUS: 389999 },
  { nameCn: '尼康 Z8 全画幅微单', nameEn: 'Nikon Z8 Full-Frame Mirrorless', descCn: '4570 万像素 · EXPEED 7 · 8K 30p · 120fps 连拍', descEn: '45.7MP · EXPEED 7 · 8K 30p · 120fps burst', priceCN: 2799900, priceUS: 369999 },
  { nameCn: '富士 X-T6 复古微单', nameEn: 'Fujifilm X-T6', descCn: '4000 万像素 X-Trans · 经典胶片模拟 · 6.2K 视频 · 小巧轻便', descEn: '40MP X-Trans · Classic film simulations · 6.2K video · Compact', priceCN: 1299900, priceUS: 169999 },
  { nameCn: '大疆 DJI Pocket 3', nameEn: 'DJI Pocket 3', descCn: '1 英寸 CMOS · 4K/120fps · 三轴云台 · 人像跟随 · 便携 vlog', descEn: '1" CMOS · 4K/120fps · 3-axis gimbal · Subject tracking · Vlog camera', priceCN: 449900, priceUS: 59999 },
  { nameCn: 'GoPro Hero 14 Black', nameEn: 'GoPro Hero 14 Black', descCn: '5.3K 60fps · HyperSmooth 7.0 · 防水 10m · 运动相机旗舰', descEn: '5.3K 60fps · HyperSmooth 7.0 · Waterproof 10m · Action camera', priceCN: 399900, priceUS: 54999 },
  { nameCn: '大疆 Air 4 无人机', nameEn: 'DJI Air 4 Drone', descCn: '4/3 CMOS 哈苏相机 · 46 分钟续航 · 全向避障 · O4 图传', descEn: '4/3 CMOS Hasselblad · 46min flight · Omnidirectional obstacle sensing · O4', priceCN: 899900, priceUS: 119999 },
  { nameCn: '索尼 ZV-E10 II Vlog 相机', nameEn: 'Sony ZV-E10 II Vlog Camera', descCn: 'APSC 画幅 · 4K 120fps · 产品展示功能 · 内置 3 胶囊麦克风', descEn: 'APSC sensor · 4K 120fps · Product showcase mode · Built-in 3-capsule mic', priceCN: 749900, priceUS: 99999 },
]

// Category 7: 服饰鞋包
const fashionProducts = [
  { nameCn: '加拿大鹅 Expedition 派克大衣', nameEn: 'Canada Goose Expedition Parka', descCn: '极地级保暖 · 625 蓬松度白鹅绒 · Arctic Tech 面料 · -30°C 防护', descEn: 'Extreme warmth · 625 fill power white goose down · Arctic Tech · -30°C rated', priceCN: 1199900, priceUS: 179999 },
  { nameCn: '始祖鸟 Alpha SV 冲锋衣', nameEn: 'Arc\'teryx Alpha SV Jacket', descCn: 'GORE-TEX Pro 面料 · 3 层压胶 · 防水透气 · 高山攀登旗舰', descEn: 'GORE-TEX Pro · 3-layer laminate · Waterproof breathable · Alpine climbing', priceCN: 899900, priceUS: 79999 },
  { nameCn: '耐克 Air Jordan 39 "Green Glow"', nameEn: 'Nike Air Jordan 39 "Green Glow"', descCn: 'ZoomX + Air 双气垫 · 编织鞋面 · 实战篮球鞋', descEn: 'ZoomX + Air dual cushioning · Woven upper · Performance basketball', priceCN: 169900, priceUS: 22499 },
  { nameCn: '阿迪达斯 Ultraboost Light', nameEn: 'Adidas Ultraboost Light', descCn: 'Light Boost 中底 · Continental 橡胶外底 · Primeknit+ 鞋面', descEn: 'Light Boost midsole · Continental outsole · Primeknit+ upper', priceCN: 129900, priceUS: 18999 },
  { nameCn: 'Moncler 男士羽绒夹克', nameEn: 'Moncler Men\'s Down Jacket', descCn: '90% 白鹅绒 · 尼龙亮面面料 · 可拆卸帽 · 经典徽章', descEn: '90% goose down · Nylon glossy fabric · Detachable hood · Classic badge', priceCN: 799900, priceUS: 119999 },
  { nameCn: '李宁 超轻 21 跑鞋', nameEn: 'Li-Ning Ultra Light 21', descCn: '䨻科技中底 · 200g 超轻 · 透气网面 · 马拉松竞速', descEn: 'BOOM technology · 200g ultra-light · Breathable mesh · Marathon racing', priceCN: 79900, priceUS: 11999 },
]

// Category 8: 家居生活
const homeProducts = [
  { nameCn: '戴森 V18 Detect 无绳吸尘器', nameEn: 'Dyson V18 Detect Cordless Vacuum', descCn: '240AW 强劲吸力 · 激光探测技术 · 压电传感器 · 70 分钟续航', descEn: '240AW suction · Laser detection · Piezo sensor · 70min runtime', priceCN: 599900, priceUS: 79999 },
  { nameCn: '石头 G30 自清洁扫拖机器人', nameEn: 'Roborock G30 Robot Vacuum', descCn: '机械臂拖布 · 18000Pa 吸力 · 自清洁基站 · AI 避障 3.0', descEn: 'Robotic arm mop · 18000Pa suction · Self-cleaning dock · AI Obstacle Avoidance 3.0', priceCN: 499900, priceUS: 89999 },
  { nameCn: '米家 空调 鎏金版 3匹', nameEn: 'Xiaomi Air Conditioner 3HP', descCn: '新一级能效 · 变频冷暖 · 智能互联 · 56°C 高温自清洁', descEn: 'Grade 1 energy · Inverter heating/cooling · Smart connectivity · Self-cleaning', priceCN: 699900, priceUS: 89999 },
  { nameCn: '小米 双开门冰箱 630L', nameEn: 'Xiaomi French Door Refrigerator 630L', descCn: '630L 超大容量 · 风冷无霜 · 银离子除菌 · 智能控温', descEn: '630L capacity · Frost-free · Silver ion sterilization · Smart temperature control', priceCN: 499900, priceUS: 74999 },
  { nameCn: '海尔 全自动洗衣机 10kg', nameEn: 'Haier Fully Automatic Washer 10kg', descCn: 'FPA 直驱电机 · 智能投放 · 紫外线除菌 · 1.1 洗净比', descEn: 'FPA direct drive · Auto dosing · UV sterilization · 1.1 wash ratio', priceCN: 599900, priceUS: 69999 },
  { nameCn: '小米 净水器 1600G Pro', nameEn: 'Xiaomi Water Purifier 1600G Pro', descCn: '1600G 大通量 · 3.5L/min · 双 RO 滤芯 · 即滤即饮', descEn: '1600G capacity · 3.5L/min · Dual RO filter · Instant filtration', priceCN: 399900, priceUS: 54999 },
  { nameCn: '极米 RS Pro 4 投影仪', nameEn: 'Xgimi RS Pro 4 Projector', descCn: '4K 超高清 · 3000 ISO 流明 · 光学变焦 · 哈曼卡顿音响', descEn: '4K UHD · 3000 ISO lumens · Optical zoom · Harman Kardon audio', priceCN: 799900, priceUS: 149999 },
  { nameCn: '天猫精灵 INEW 智能屏', nameEn: 'Tmall Genie INEW Smart Display', descCn: '10.1" 高清屏 · 智能家居中控 · 视频通话 · 儿童模式', descEn: '10.1" HD screen · Smart home hub · Video calls · Kids mode', priceCN: 59900, priceUS: 9999 },
]

// Category 9: 厨卫家电
const kitchenProducts = [
  { nameCn: '美的 微蒸烤一体机 72L', nameEn: 'Midea Microwave Oven Combo 72L', descCn: '微波+蒸汽+烘烤三合一 · 72L 大容量 · 彩色触控屏 · APP 远程', descEn: 'Microwave+Steam+Bake 3-in-1 · 72L capacity · Color touch screen · APP control', priceCN: 599900, priceUS: 69999 },
  { nameCn: '飞利浦 全自动咖啡机 3200', nameEn: 'Philips Auto Espresso 3200', descCn: 'LatteGo 奶泡系统 · 陶瓷研磨器 · 12 档研磨 · 一键清洁', descEn: 'LatteGo milk system · Ceramic grinder · 12 grind settings · One-touch clean', priceCN: 499900, priceUS: 69999 },
  { nameCn: '小米 IH 电饭煲 3L', nameEn: 'Xiaomi IH Rice Cooker 3L', descCn: 'IH 电磁加热 · 3L 容量 · 精铁内胆 · APP 24 小时预约', descEn: 'IH electromagnetic heating · 3L capacity · Iron inner pot · 24h APP timer', priceCN: 39900, priceUS: 5999 },
  { nameCn: '九阳 破壁机 Y9', nameEn: 'Joyoung Blender Y9', descCn: '40000 转/分 · 真空破壁 · 热烘除菌 · 8 叶刀头', descEn: '40000rpm · Vacuum blending · Heat sterilization · 8-blade', priceCN: 199900, priceUS: 25999 },
  { nameCn: '方太 智能油烟机 JCD10', nameEn: 'Fotile Smart Range Hood JCD10', descCn: '26m³/min 大吸力 · 智能巡航 · 挥手控制 · 自清洁', descEn: '26m³/min suction · Smart cruise · Wave control · Self-cleaning', priceCN: 599900, priceUS: 79999 },
  { nameCn: '摩飞 多功能料理锅', nameEn: 'Morphy Richards Multi-Cooker', descCn: '6 盘配置 · 1400W 大功率 · 不粘涂层 · 煎烤涮烙', descEn: '6-plate set · 1400W · Non-stick coating · Grill/BBQ/Hotpot', priceCN: 129900, priceUS: 17999 },
  { nameCn: '北鼎 即热式饮水机 S9', nameEn: 'Buydeem Instant Hot Water Dispenser S9', descCn: '3 秒即热 · 8 段水温 · 3L 水箱 · 自清洁 · 童锁', descEn: '3s instant heat · 8 temp levels · 3L tank · Self-clean · Child lock', priceCN: 149900, priceUS: 19999 },
]

// Category 10: 美妆护肤
const beautyProducts = [
  { nameCn: '海蓝之谜 经典面霜 60ml', nameEn: 'La Mer Crème de la Mer 60ml', descCn: 'Miracle Broth™ 活性精萃 · 深层修护 · 抗老 · 明星面霜', descEn: 'Miracle Broth™ · Deep repair · Anti-aging · Iconic moisturizer', priceCN: 289900, priceUS: 34999 },
  { nameCn: 'SK-II 神仙水 330ml', nameEn: 'SK-II Facial Treatment Essence 330ml', descCn: '90% 以上 PITERA™ · 改善肤质 · 提亮肤色 · 调节水油平衡', descEn: '90%+ PITERA™ · Skin texture improvement · Brightening · Balance', priceCN: 259900, priceUS: 29999 },
  { nameCn: '兰蔻 小黑瓶 100ml', nameEn: 'Lancôme Advanced Génifique 100ml', descCn: '二裂酵母精华 · 微生态修护 · 肌底液 · 维稳修护', descEn: 'Bifida ferment essence · Microbiome repair · Serum · Skin defense', priceCN: 179900, priceUS: 19999 },
  { nameCn: '雅诗兰黛 小棕瓶 100ml', nameEn: 'Estée Lauder Advanced Night Repair 100ml', descCn: 'Chronolux Power Signal 技术 · 夜间修护 · 抗皱紧致', descEn: 'Chronolux Power Signal · Night repair · Anti-wrinkle · Firming', priceCN: 169900, priceUS: 18999 },
  { nameCn: '赫莲娜 黑绷带面霜 50ml', nameEn: 'HR Black Blemish Cream 50ml', descCn: '30% 玻色因 · 修护抗老 · 绷带质地 · 敏感肌适用', descEn: '30% Pro-Xylane · Repair & anti-aging · Bandage texture · Sensitive skin', priceCN: 399900, priceUS: 47999 },
  { nameCn: 'CeraVe 适乐肤 修护乳 473ml', nameEn: 'CeraVe Moisturizing Lotion 473ml', descCn: '3 重神经酰胺 · MVE 缓释技术 · 全天保湿 · 敏感肌', descEn: '3 essential ceramides · MVE delivery · 24h hydration · Sensitive skin', priceCN: 19900, priceUS: 2999 },
  { nameCn: '戴森 Airwrap i.d. 多功能美发器', nameEn: 'Dyson Airwrap i.d. Multi-styler', descCn: '智能温控 · 康达效应 · 无线设计 · 多造型配件', descEn: 'Intelligent heat control · Coanda effect · Cordless design · Multiple attachments', priceCN: 499900, priceUS: 59999 },
  { nameCn: 'Tom Ford 四色眼影盘 #31', nameEn: 'Tom Ford Eye Color Quad #31', descCn: '丝缎质地 · 高显色 · 四色搭配 · 高级感妆效', descEn: 'Silk texture · High pigmentation · 4-color palette · Luxury finish', priceCN: 79900, priceUS: 8999 },
]

// Category 11: 食品饮料
const foodProducts = [
  { nameCn: '贵州茅台 飞天 53度 500ml', nameEn: 'Moutai Feitian 53% 500ml', descCn: '酱香型白酒 · 大曲坤沙 · 年份陈酿 · 国酒经典', descEn: 'Sauce-aroma Baijiu · Daqu kunsha · Vintage · National liquor', priceCN: 1499900, priceUS: 299999 },
  { nameCn: '五粮液 普五 第八代 52度', nameEn: 'Wuliangye Pu Wu 8th Gen 52%', descCn: '浓香型白酒 · 百年传承 · 五粮酿造 · 商务宴请', descEn: 'Strong-aroma Baijiu · Century heritage · 5-grain · Business banquet', priceCN: 1099900, priceUS: 179999 },
  { nameCn: '德芙 丝滑牛奶巧克力礼盒 1kg', nameEn: 'Dove Silky Chocolate Gift Box 1kg', descCn: '丝滑口感 · 牛奶巧克力 · 分享装 · 节日送礼', descEn: 'Smooth texture · Milk chocolate · Share pack · Gift ready', priceCN: 19900, priceUS: 3499 },
  { nameCn: '三只松鼠 坚果大礼包 2kg', nameEn: 'Three Squirrels Nut Gift 2kg', descCn: '11 种坚果混合 · 每日坚果 · 年货礼盒 · 新鲜烘焙', descEn: '11 nut varieties · Daily nuts · Gift box · Fresh roasted', priceCN: 16800, priceUS: 2999 },
  { nameCn: '星巴克 中度烘焙 哥伦比亚 200g', nameEn: 'Starbucks Medium Roast Colombia 200g', descCn: '100% 阿拉比卡 · 坚果可可风味 · 家庭享用', descEn: '100% Arabica · Nut & cocoa notes · Home enjoyment', priceCN: 9900, priceUS: 1599 },
  { nameCn: '蒙牛 特仑苏 纯牛奶 250ml×24', nameEn: 'Mengniu Deluxe Milk 250ml×24', descCn: '3.6g 优质乳蛋白 · 限定牧场 · 全脂营养', descEn: '3.6g high-quality protein · Limited pasture · Whole milk', priceCN: 8900, priceUS: 3999 },
  { nameCn: '良品铺子 零食大礼包 1.5kg', nameEn: 'Bestore Snack Gift Box 1.5kg', descCn: '30+ 种零食组合 · 追剧必备 · 儿童零食 · 独立小包装', descEn: '30+ snack variety · Movie night essential · Kids snacks · Individual packs', priceCN: 12800, priceUS: 2499 },
  { nameCn: '雀巢 金牌咖啡 罐装 200g', nameEn: 'Nescafé Gold Can 200g', descCn: '冻干技术 · 精选阿拉比卡 · 丝滑口感 · 速溶咖啡', descEn: 'Freeze-dried · Selected Arabica · Smooth taste · Instant coffee', priceCN: 10900, priceUS: 1599 },
]

// Category 12: 运动户外
const sportProducts = [
  { nameCn: '野小兽 M1 家用跑步机', nameEn: 'Yesoul M1 Home Treadmill', descCn: '折叠设计 · 静音电机 · 15° 坡度 · 智能 APP · 占地仅 0.5m²', descEn: 'Foldable · Quiet motor · 15° incline · Smart APP · 0.5m² footprint', priceCN: 399900, priceUS: 49999 },
  { nameCn: 'Keep 智能动感单车 C3', nameEn: 'Keep Smart Cycle C3', descCn: '磁控阻力 · 皮带传动 · 100 档调节 · 直播课程', descEn: 'Magnetic resistance · Belt drive · 100 levels · Live classes', priceCN: 249900, priceUS: 32999 },
  { nameCn: '尤尼克斯 天斧 100ZZ 羽毛球拍', nameEn: 'Yonex Astrox 100ZZ Badminton', descCn: 'Namd 碳素 · 回转力系统 · 力量型 · 专业比赛拍', descEn: 'Namd carbon fiber · Rotational Generator System · Power type · Pro level', priceCN: 219900, priceUS: 29999 },
  { nameCn: '迪卡侬 MH500 冲锋衣', nameEn: 'Decathlon MH500 Rain Jacket', descCn: '防水 15000mm · 透气 15000g/m²/24h · 可收纳风帽', descEn: 'Waterproof 15000mm · Breathable 15000g · Packable hood', priceCN: 49900, priceUS: 7999 },
  { nameCn: '华为智选 智能跳绳 S10', nameEn: 'Huawei Smart Jump Rope S10', descCn: '计数精准 · 自由/KM 双模式 · 心率监测 · 连接健康 APP', descEn: 'Accurate counting · Free/KM mode · Heart rate · Health APP', priceCN: 16900, priceUS: 2499 },
  { nameCn: 'The North Face 1996 羽绒服', nameEn: 'The North Face 1996 Retro Nuptse', descCn: '700 蓬松度鹅绒 · 防风保暖 · 经典立领 · 可收纳', descEn: '700 fill goose down · Windproof · Classic stand collar · Packable', priceCN: 329900, priceUS: 32999 },
  { nameCn: '小米 米家筋膜枪 Pro', nameEn: 'Xiaomi Mijia Massage Gun Pro', descCn: '60kg 按压力度 · 12mm 振幅 · 5 档变速 · 长续航', descEn: '60kg pressure · 12mm amplitude · 5 speed levels · Long battery', priceCN: 59900, priceUS: 8999 },
]

interface ProductDefinition {
  nameCn: string
  nameEn: string
  descCn: string
  descEn: string
  priceCN: number
  priceUS: number
}

const PRODUCT_IMAGE_COUNT = 4

function buildProductImages(p: ProductDefinition, pool: string[]) {
  const base = pool.length >= PRODUCT_IMAGE_COUNT ? pool : [...pool, ...pool, ...pool]
  return Array.from({ length: PRODUCT_IMAGE_COUNT }, (_, i) => ({
    url: base[i % base.length],
    alt_cn: p.nameCn,
    alt_en: p.nameEn,
    sort: i + 1,
  }))
}

async function createCategory(nameCn: string, nameEn: string, sort: number, products: ProductDefinition[], catImages: string[]) {
  const category = await prisma.productCategory.create({
    data: { nameCn, nameEn, sortOrder: sort },
  })
  console.log(`  📂 创建分类: ${nameCn} (${products.length} 个商品)`)

  for (let i = 0; i < products.length; i++) {
    const p = products[i]
    const spuNo = `SPU${String(sort).padStart(2, '0')}${String(i + 1).padStart(3, '0')}`

    await prisma.product.create({
      data: {
        spuNo,
        nameCn: p.nameCn,
        nameEn: p.nameEn,
        descriptionCn: p.descCn,
        descriptionEn: p.descEn,
        categoryId: category.id,
        images: buildProductImages(p, catImages) as any,
        status: 'active',
        listings: {
          create: [
            {
              region: 'CN',
              sku: `CN-${spuNo}`,
              price: p.priceCN,
              currency: 'CNY',
              stock: Math.floor(Math.random() * 200) + 20,
            },
            {
              region: 'OVERSEAS',
              sku: `OV-${spuNo}`,
              price: p.priceUS,
              currency: 'USD',
              stock: Math.floor(Math.random() * 100) + 10,
            },
          ],
        },
      },
    })
    if ((i + 1) % 10 === 0 || i === products.length - 1) {
      console.log(`    ✅ 已创建 ${i + 1}/${products.length} 个商品`)
    }
  }

  return category
}

async function main() {
  console.log('🌱 开始创建海量种子数据...')
  console.log('')

  // 1. 清空旧数据
  console.log('🗑️ 清空旧数据...')
  await prisma.$executeRaw`TRUNCATE TABLE shipment_trackings, refunds, payment_callbacks, payment_intents, order_items, orders, product_listings, products, product_categories, shipping_addresses, region_change_logs, audit_logs, users RESTART IDENTITY CASCADE`
  console.log('✅ 已清空所有旧数据')
  console.log('')

  // 2. 创建所有分类和商品
  const cat1 = await createCategory('手机通讯', 'Mobile Phones', 1, phoneProducts, IMAGES.phone)
  const cat2 = await createCategory('电脑办公', 'Computers & Office', 2, laptopProducts, IMAGES.laptop)
  const cat3 = await createCategory('平板电脑', 'Tablets', 3, tabletProducts, IMAGES.tablet)
  const cat4 = await createCategory('耳机音响', 'Audio & Headphones', 4, audioProducts, IMAGES.audio)
  const cat5 = await createCategory('智能穿戴', 'Wearables', 5, wearableProducts, IMAGES.watch)
  const cat6 = await createCategory('摄影摄像', 'Cameras & Photo', 6, cameraProducts, IMAGES.camera)
  const cat7 = await createCategory('服饰鞋包', 'Fashion', 7, fashionProducts, IMAGES.clothing)
  const cat8 = await createCategory('家居生活', 'Home & Living', 8, homeProducts, IMAGES.home)
  const cat9 = await createCategory('厨卫家电', 'Kitchen & Appliances', 9, kitchenProducts, IMAGES.kitchen)
  const cat10 = await createCategory('美妆护肤', 'Beauty & Skincare', 10, beautyProducts, IMAGES.beauty)
  const cat11 = await createCategory('食品饮料', 'Food & Beverages', 11, foodProducts, IMAGES.food)
  const cat12 = await createCategory('运动户外', 'Sports & Outdoors', 12, sportProducts, IMAGES.sport)

  const totalProducts = phoneProducts.length + laptopProducts.length + tabletProducts.length +
    audioProducts.length + wearableProducts.length + cameraProducts.length +
    fashionProducts.length + homeProducts.length + kitchenProducts.length +
    beautyProducts.length + foodProducts.length + sportProducts.length
  console.log(`\n✅ 共创建 ${totalProducts} 个商品`)

  // 3. 创建测试用户
  const passwordHash = await bcrypt.hash('123456', 10)
  const user = await prisma.user.create({
    data: {
      region: 'CN',
      phone: '13800138000',
      passwordHash,
      displayName: '张三',
      countryCode: 'CN',
      role: 'admin',
    },
  })
  const overseasUser = await prisma.user.create({
    data: {
      region: 'OVERSEAS',
      email: 'test@example.com',
      passwordHash,
      displayName: 'John Smith',
      countryCode: 'US',
    },
  })
  console.log('✅ 创建了测试用户')
  console.log('   - 国内: 13800138000 / 123456')
  console.log('   - 海外: test@example.com / 123456')

  // 4. 创建收货地址
  await prisma.shippingAddress.create({
    data: {
      userId: user.id,
      recipientName: '张三',
      phone: '13800138000',
      countryCode: 'CN',
      city: '上海市',
      district: '浦东新区',
      streetAddress: '张江高科技园区 100 号',
      isDefault: true,
    },
  })
  await prisma.shippingAddress.create({
    data: {
      userId: overseasUser.id,
      recipientName: 'John Smith',
      phone: '+1-555-1234',
      countryCode: 'US',
      stateProvince: 'CA',
      city: 'San Francisco',
      streetAddress: '123 Market St',
      isDefault: true,
    },
  })
  console.log('✅ 创建了收货地址')

  // 外贸运营示例数据
  const ff = await prisma.tradePartner.create({
    data: {
      name: '深圳XX国际货运',
      type: 'freight_forwarder',
      contactName: '李经理',
      phone: '+86-13800001111',
      wechat: 'freight_xx',
    },
  })
  const cb = await prisma.tradePartner.create({
    data: {
      name: 'Santos SP 清关行',
      type: 'customs_broker',
      contactName: 'Carlos',
      email: 'customs@example.br',
    },
  })
  const wh = await prisma.tradePartner.create({
    data: {
      name: 'São Paulo 3PL 仓',
      type: 'warehouse_3pl',
      contactName: 'Warehouse Ops',
      address: 'Guarulhos, SP, Brazil',
    },
  })
  await prisma.tradeShipment.create({
    data: {
      shipmentNo: 'SH202606100001',
      title: '扑克牌首单 LCL 试跑',
      status: 'planning',
      destinationCity: 'São Paulo',
      portOfLoading: 'Shenzhen/Yantian',
      portOfDischarge: 'Santos',
      transportMode: 'sea_lcl',
      ncmCode: '9504.40.00',
      cifValueUsd: 5000,
      freightForwarderId: ff.id,
      customsBrokerId: cb.id,
      warehouse3plId: wh.id,
      lines: {
        create: [
          { sku: 'POKER-CLASSIC', productName: '经典纸扑克', ean: '6900000000012', quantity: 5000, cartons: 50, unitsPerCarton: 100 },
          { sku: 'POKER-BR-THEME', productName: '巴西主题扑克', ean: '6900000000013', quantity: 3000, cartons: 30, unitsPerCarton: 100 },
        ],
      },
      tasks: {
        create: DEFAULT_TRADE_TASKS.map((t) => ({ ...t, status: 'pending' })),
      },
    },
  })
  console.log('✅ 创建了外贸运营示例数据（服务商 + 首单批次）')
  console.log('')

  console.log('🎉 种子数据全部创建完成！')
  console.log('')
  console.log('📦 商品总数:', totalProducts)
  console.log('📂 分类数量: 12')
  console.log('👤 测试账号:')
  console.log('   - 国内用户: 13800138000 / 123456')
  console.log('   - 海外用户: test@example.com / 123456')
  console.log('   - OTP 验证码: 123456')
}

main()
  .catch((e) => {
    console.error('❌ 种子数据创建失败:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
