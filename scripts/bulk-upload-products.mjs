/**
 * 批量上架本地商品。不访问其他网站，只读取你自己的目录。
 *
 * 目录示例：
 *   catalog/products.json
 *   catalog/chips/1.jpg
 *   catalog/chips/2.jpg
 *   catalog/chips/intro.mp4
 *
 * products.json 是数组，每一项：
 *   nameCn        中文名，必填
 *   nameEn        英文名，不填就用中文名
 *   category      品类中文名，没有会自动新建
 *   categoryEn    品类英文名
 *   spec          规格，写入中文描述
 *   specEn        英文规格
 *   priceCny      人民币元。大陆销售用
 *   priceUsd      美元。海外销售用
 *   stock         库存，默认 0
 *   sku           货号，必填，两边销售会自动加 CN- / OV- 前缀
 *   sellCn        是否大陆销售，默认有 priceCny 就卖
 *   sellUs        是否海外销售，默认有美元价，或设置了汇率，就卖
 *   images        相对 products.json 的图片路径，1 到 6 张
 *   videos        相对路径，最多 2 个，可省略。mp4 / webm / mov，单个不超过 30MB、60 秒
 *
 * 只上海外、用人民币换美元时：sellCn 设为 false，并设置环境变量 USD_CNY_RATE（1 美元兑多少人民币）。
 *
 * PowerShell：
 *   $env:API_BASE_URL="https://api.linglingstore.store"
 *   $env:ADMIN_PHONE="你的管理员手机号"
 *   $env:ADMIN_PASSWORD="你的密码"
 *   $env:USD_CNY_RATE="7.1"
 *   node scripts/bulk-upload-products.mjs D:\catalog\products.json
 *
 * 先检查不上传：node scripts/bulk-upload-products.mjs D:\catalog\products.json --dry-run
 */

import { readFile } from 'fs/promises'
import { basename, dirname, extname, resolve } from 'path'

const IMAGE_TYPES = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
}
const VIDEO_TYPES = {
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.mov': 'video/quicktime',
}
const IMAGE_MAX = 5 * 1024 * 1024
const VIDEO_MAX = 30 * 1024 * 1024

const apiBase = (process.env.API_BASE_URL || 'https://api.linglingstore.store').replace(/\/$/, '')
const dryRun = process.argv.includes('--dry-run')
const catalogPath = process.argv.find((arg) => !arg.startsWith('-') && arg.endsWith('.json'))

function fail(message) {
  console.error(message)
  process.exit(1)
}

function yuanToMinor(yuan) {
  const minor = Math.round(Number(yuan) * 100)
  if (!Number.isFinite(minor) || minor < 0) fail(`价格无效：${yuan}`)
  return minor
}

async function api(path, { token, method = 'GET', json, form } = {}) {
  const headers = {}
  if (token) headers.Authorization = `Bearer ${token}`
  let body
  if (json) {
    headers['Content-Type'] = 'application/json'
    body = JSON.stringify(json)
  } else if (form) {
    body = form
  }
  const response = await fetch(`${apiBase}${path}`, { method, headers, body })
  const text = await response.text()
  let data = null
  if (text) {
    try {
      data = JSON.parse(text)
    } catch {
      data = text
    }
  }
  if (!response.ok) {
    const message = data && typeof data === 'object' ? data.message : text
    throw new Error(Array.isArray(message) ? message.join('，') : message || `请求失败 ${response.status}`)
  }
  return data
}

async function login() {
  const phone = process.env.ADMIN_PHONE
  const password = process.env.ADMIN_PASSWORD
  if (!phone || !password) fail('请设置 ADMIN_PHONE 和 ADMIN_PASSWORD')
  const auth = await api('/auth/login', { method: 'POST', json: { phone, password } })
  if (!auth?.accessToken) fail('登录没有返回 token')
  if (auth.user?.role && auth.user.role !== 'admin') fail('这个账号不是管理员')
  return auth.accessToken
}

async function uploadFile(token, filePath, kind) {
  const ext = extname(filePath).toLowerCase()
  const types = kind === 'image' ? IMAGE_TYPES : VIDEO_TYPES
  const mime = types[ext]
  if (!mime) throw new Error(`${basename(filePath)} 格式不支持`)
  const bytes = await readFile(filePath)
  const max = kind === 'image' ? IMAGE_MAX : VIDEO_MAX
  if (bytes.length > max) throw new Error(`${basename(filePath)} 超过 ${kind === 'image' ? '5MB' : '30MB'}`)
  const form = new FormData()
  form.append('file', new Blob([bytes], { type: mime }), basename(filePath))
  const endpoint = kind === 'image' ? '/admin/uploads/product-image' : '/admin/uploads/product-video'
  const uploaded = await api(endpoint, { token, method: 'POST', form })
  if (!uploaded?.url) throw new Error(`${basename(filePath)} 上传后没有地址`)
  return uploaded.url
}

async function categoryId(token, cache, nameCn, nameEn) {
  if (cache.has(nameCn)) return cache.get(nameCn)
  const existing = await api('/admin/categories', { token })
  for (const category of existing || []) {
    if (category.nameCn) cache.set(category.nameCn, category.id)
  }
  if (cache.has(nameCn)) return cache.get(nameCn)
  try {
    await api('/admin/categories', { token, method: 'POST', json: { nameCn, nameEn: nameEn || nameCn, sortOrder: cache.size + 1 } })
  } catch (err) {
    console.warn(`新建品类「${nameCn}」的响应异常，改为重新查询：${err.message}`)
  }
  const again = await api('/admin/categories', { token })
  for (const category of again || []) {
    if (category.nameCn) cache.set(category.nameCn, category.id)
  }
  if (!cache.has(nameCn)) throw new Error(`品类没有建成：${nameCn}`)
  return cache.get(nameCn)
}

function listingsFor(item, rate) {
  const listings = []
  const sellCn = item.sellCn !== false && item.priceCny != null && item.priceCny !== ''
  let priceUsd = item.priceUsd
  if ((priceUsd == null || priceUsd === '') && item.priceCny != null && rate) {
    priceUsd = Number(item.priceCny) / rate
  }
  const sellUs = item.sellUs !== false && priceUsd != null && priceUsd !== ''
  if (item.sellCn === false && item.sellUs === false) throw new Error('至少选择大陆销售或海外销售')
  if (!sellCn && !sellUs) throw new Error('缺少价格。大陆填 priceCny，海外填 priceUsd，或设置 USD_CNY_RATE')
  const stock = Number(item.stock ?? 0)
  const sku = String(item.sku || '').trim()
  if (!sku) throw new Error('缺少 sku')
  if (sellCn) {
    listings.push({ region: 'CN', sku: `CN-${sku}`, price: yuanToMinor(item.priceCny), currency: 'CNY', stock })
  }
  if (sellUs) {
    listings.push({ region: 'OVERSEAS', sku: `OV-${sku}`, price: yuanToMinor(priceUsd), currency: 'USD', stock })
  }
  return listings
}

async function main() {
  if (!catalogPath) fail('用法：node scripts/bulk-upload-products.mjs <products.json> [--dry-run]')
  const filePath = resolve(catalogPath)
  const root = dirname(filePath)
  const items = JSON.parse(await readFile(filePath, 'utf8'))
  if (!Array.isArray(items) || items.length === 0) fail('products.json 必须是非空数组')
  const rate = process.env.USD_CNY_RATE ? Number(process.env.USD_CNY_RATE) : null
  if (process.env.USD_CNY_RATE && (!Number.isFinite(rate) || rate <= 0)) fail('USD_CNY_RATE 必须是大于 0 的数字')

  for (const [index, item] of items.entries()) {
    const label = item.nameCn || `第 ${index + 1} 个`
    if (!item.nameCn) fail(`${label} 缺少 nameCn`)
    const images = Array.isArray(item.images) ? item.images : []
    const videos = Array.isArray(item.videos) ? item.videos : []
    if (images.length < 1 || images.length > 6) fail(`${label} 需要 1 到 6 张图片`)
    if (videos.length > 2) fail(`${label} 最多 2 个视频`)
    listingsFor(item, rate)
    for (const rel of [...images, ...videos]) {
      await readFile(resolve(root, rel))
    }
    console.log(`检查通过：${label}，图片 ${images.length}，视频 ${videos.length}`)
  }
  if (dryRun) {
    console.log('干跑结束，没有上传。')
    return
  }

  const token = await login()
  const categories = new Map()
  for (const item of items) {
    const label = item.nameCn
    try {
      const images = []
      for (const rel of item.images) {
        images.push(await uploadFile(token, resolve(root, rel), 'image'))
      }
      const videos = []
      for (const rel of item.videos || []) {
        videos.push(await uploadFile(token, resolve(root, rel), 'video'))
      }
      const category = item.category ? await categoryId(token, categories, item.category, item.categoryEn) : undefined
      const created = await api('/admin/products', {
        token,
        method: 'POST',
        json: {
          nameCn: item.nameCn,
          nameEn: item.nameEn || item.nameCn,
          descriptionCn: item.spec || undefined,
          descriptionEn: item.specEn || item.spec || undefined,
          categoryId: category,
          images: images.map((url, sort) => ({ url, sort: sort + 1, alt_cn: item.nameCn, alt_en: item.nameEn || item.nameCn })),
          videos: videos.map((url, sort) => ({ url, sort: sort + 1 })),
          listings: listingsFor(item, rate),
        },
      })
      console.log(`已上架：${label}，SPU ${created.spuNo}`)
    } catch (err) {
      console.error(`失败：${label}：${err.message}`)
    }
  }
}

main().catch((err) => fail(err.message || String(err)))
