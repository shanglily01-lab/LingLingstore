/**
 * OPTIONAL — Stitch API 很慢（每屏 1–3 分钟），日常开发请直接用 apps/web/design-stitch/*.html。
 *
 * Usage:
 *   STITCH_API_KEY=... pnpm stitch:pull
 *   pnpm stitch:pull:only admin-categories
 */
import { stitch } from '@google/stitch-sdk'
import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const OUT_DIR = path.join(__dirname, '../apps/web/design-stitch')
const MANIFEST_PATH = path.join(OUT_DIR, 'manifest.json')

const BRAND = `Web3Mall — premium cross-border fiat e-commerce (CN + overseas).
Style: modern editorial commerce, deep navy #0f172a + electric indigo #4b41e1 / #4f46e5 accents,
warm off-white surfaces #f8f9ff, subtle editorial shadows, refined typography (Inter or system-ui),
generous whitespace, no generic AI purple gradients. Chinese UI labels where shown.
Match visual language of an upscale editorial storefront.`

const SCREENS = [
  {
    id: 'home',
    deviceType: 'DESKTOP',
    prompt: `${BRAND} Desktop homepage. Sticky header Web3Mall, nav 商品/购物车/订单/登录.
Hero 双轨制跨境法币商城, CTAs 浏览商品 + 注册. 热门推荐 4-col cards. 为什么选择我们 6 features. Footer.`,
  },
  {
    id: 'products',
    deviceType: 'DESKTOP',
    prompt: `${BRAND} Desktop product listing. Breadcrumb 首页/全部商品. Category pill filters.
Product grid cards 4:5 image, title, red price. Empty state. Same store header.`,
  },
  {
    id: 'product-detail',
    deviceType: 'DESKTOP',
    prompt: `${BRAND} Desktop product detail. Two columns: large 4:5 image left; title, SKU, price, description,
buttons 加入购物车 + 查看购物车 right. Breadcrumb back to list.`,
  },
  {
    id: 'login',
    deviceType: 'DESKTOP',
    prompt: `${BRAND} Desktop login page centered card: 登录 title, phone + password fields, 登录 button,
link 注册. Minimal header only. Clean form on off-white surface.`,
  },
  {
    id: 'register',
    deviceType: 'DESKTOP',
    prompt: `${BRAND} Desktop register page: 注册, region toggle 中国大陆/海外, phone or email, password, OTP + 发送验证码,
submit 注册, link 登录.`,
  },
  {
    id: 'cart',
    deviceType: 'DESKTOP',
    prompt: `${BRAND} Desktop shopping cart: line items with thumb, title, SKU, qty stepper, delete;
summary card 合计 + 去结算. Empty state 购物车是空的.`,
  },
  {
    id: 'checkout',
    deviceType: 'DESKTOP',
    prompt: `${BRAND} Desktop checkout: order line items, payment method tiles 支付宝/微信 or Stripe/PayPal,
price breakdown 小计/运费/合计, 提交订单 CTA.`,
  },
  {
    id: 'orders',
    deviceType: 'DESKTOP',
    prompt: `${BRAND} Desktop 我的订单 list: order cards with orderNo, date, status badge, total, 查看详情.`,
  },
  {
    id: 'admin-dashboard',
    deviceType: 'DESKTOP',
    prompt: `${BRAND} Admin 管理概览: left sidebar 仪表盘/商品/分类/订单, stat cards grid, 收益概览 panel.`,
  },
  {
    id: 'admin-products',
    deviceType: 'DESKTOP',
    prompt: `${BRAND} Admin 商品管理: sidebar, toolbar +新增商品, filters, data table, pagination.`,
  },
  {
    id: 'admin-product-form',
    deviceType: 'DESKTOP',
    prompt: `${BRAND} Admin 新增商品 form: bilingual name/desc, category, image URL, CN and OVERSEAS SKU/price/stock sections,
取消 + 创建商品 footer.`,
  },
  {
    id: 'admin-categories',
    deviceType: 'DESKTOP',
    prompt: `${BRAND} Admin 分类管理: +新增分类, inline create row, table 分类名称/英文名/排序/商品数/操作.`,
  },
  {
    id: 'admin-orders',
    deviceType: 'DESKTOP',
    prompt: `${BRAND} Admin 订单管理: status + region filters, orders table, 详情 action, pagination.`,
  },
]

const RETRY_MS = [0, 8000, 20000]
const PAUSE_BETWEEN_MS = 4000

function parseArgs() {
  const argv = process.argv.slice(2)
  const force = argv.includes('--force')
  const onlyIdx = argv.indexOf('--only')
  const only =
    onlyIdx >= 0 && argv[onlyIdx + 1]
      ? argv[onlyIdx + 1].split(',').map((s) => s.trim())
      : null
  return { force, only }
}

async function readManifest() {
  try {
    const raw = await fs.readFile(MANIFEST_PATH, 'utf8')
    return JSON.parse(raw)
  } catch {
    return null
  }
}

async function downloadUrl(url, filePath) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Download failed ${res.status}: ${url}`)
  const body = await res.text()
  await fs.writeFile(filePath, body, 'utf8')
  return body.length
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

async function generateWithRetry(project, spec) {
  let lastErr
  for (let attempt = 0; attempt < RETRY_MS.length; attempt++) {
    if (RETRY_MS[attempt] > 0) {
      console.log(`  retry in ${RETRY_MS[attempt] / 1000}s (attempt ${attempt + 1})...`)
      await sleep(RETRY_MS[attempt])
    }
    try {
      const screen = await project.generate(spec.prompt, spec.deviceType)
      const htmlUrl = await screen.getHtml()
      const imageUrl = await screen.getImage().catch(() => null)
      return { screen, htmlUrl, imageUrl }
    } catch (err) {
      lastErr = err
      const msg = err instanceof Error ? err.message : String(err)
      console.warn(`  attempt ${attempt + 1} failed: ${msg}`)
    }
  }
  throw lastErr
}

async function resolveProjectId(existingManifest) {
  const fromEnv = process.env.STITCH_PROJECT_ID?.trim()
  if (fromEnv) return fromEnv
  if (existingManifest?.projectId) return String(existingManifest.projectId)

  console.log('Creating Stitch project...')
  const created = await stitch.callTool('create_project', { title: 'Web3Mall UI' })
  const projectId =
    created?.projectId ??
    created?.id ??
    created?.name?.replace?.('projects/', '') ??
    String(created?.project?.projectId ?? '')

  if (!projectId) {
    console.error('create_project response:', JSON.stringify(created, null, 2))
    process.exit(1)
  }
  return String(projectId)
}

async function main() {
  const { force, only } = parseArgs()

  if (!process.env.STITCH_API_KEY) {
    console.error('Set STITCH_API_KEY (from Cursor mcp.json stitch X-Goog-Api-Key)')
    process.exit(1)
  }

  await fs.mkdir(OUT_DIR, { recursive: true })

  const prev = await readManifest()
  const projectId = await resolveProjectId(prev)
  console.log('Project ID:', projectId)
  console.log('Stitch web:', `https://stitch.withgoogle.com/projects/${projectId}`)

  const project = stitch.project(projectId)
  const existingById = new Map((prev?.screens ?? []).map((s) => [s.id, s]))
  const manifest = {
    projectId,
    projectTitle: 'Web3Mall UI',
    stitchWebUrl: `https://stitch.withgoogle.com/projects/${projectId}`,
    updatedAt: new Date().toISOString(),
    screens: [...(prev?.screens ?? [])],
    failed: [],
  }

  let specs = SCREENS
  if (only?.length) {
    specs = SCREENS.filter((s) => only.includes(s.id))
    if (specs.length === 0) {
      console.error('No matching screens for --only:', only.join(','))
      process.exit(1)
    }
  }

  for (const spec of specs) {
    const htmlPath = path.join(OUT_DIR, `${spec.id}.html`)
    const hasFile = await fs
      .access(htmlPath)
      .then(() => true)
      .catch(() => false)

    if (hasFile && !force && existingById.has(spec.id)) {
      console.log(`Skip ${spec.id} (already exists, use --force)`)
      continue
    }

    console.log(`Generating: ${spec.id}...`)
    try {
      const { screen, htmlUrl, imageUrl } = await generateWithRetry(project, spec)
      const bytes = await downloadUrl(htmlUrl, htmlPath)
      const entry = {
        id: spec.id,
        screenId: screen.screenId,
        htmlPath: `design-stitch/${spec.id}.html`,
        htmlBytes: bytes,
        htmlUrl,
        imageUrl,
        generatedAt: new Date().toISOString(),
      }
      const idx = manifest.screens.findIndex((s) => s.id === spec.id)
      if (idx >= 0) manifest.screens[idx] = entry
      else manifest.screens.push(entry)
      existingById.set(spec.id, entry)
      console.log(`  ok ${spec.id}.html (${bytes} bytes)`)
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      console.error(`  FAILED ${spec.id}: ${msg}`)
      manifest.failed.push({ id: spec.id, error: msg, at: new Date().toISOString() })
    }

    await fs.writeFile(MANIFEST_PATH, JSON.stringify(manifest, null, 2))
    await sleep(PAUSE_BETWEEN_MS)
  }

  manifest.pending = SCREENS.map((s) => s.id).filter((id) => !existingById.has(id))
  manifest.lastError = manifest.failed.length
    ? manifest.failed[manifest.failed.length - 1].error
    : null
  await fs.writeFile(MANIFEST_PATH, JSON.stringify(manifest, null, 2))

  console.log('\nDone:', OUT_DIR)
  console.log('Generated:', manifest.screens.map((s) => s.id).join(', ') || '(none)')
  if (manifest.pending.length) console.log('Pending:', manifest.pending.join(', '))
  if (manifest.failed.length) process.exit(2)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
