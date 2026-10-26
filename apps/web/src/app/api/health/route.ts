import { NextResponse } from 'next/server'

/**
 * 前端自己的 healthcheck (用于 LB/CDN 探活 Next 服务本身, 与后端 API 健康检查独立).
 * GET /api/health -> 200 { ok: true, app: 'web', timestamp }
 */
export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    ok: true,
    app: 'web',
    timestamp: new Date().toISOString(),
  })
}
