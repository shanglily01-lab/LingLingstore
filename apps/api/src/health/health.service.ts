import { Injectable, Logger } from '@nestjs/common'
import type { HealthCheckItem, HealthCheckResponse } from '@web3-mall/shared'
import { PrismaService } from '../common/prisma/prisma.service'
import { RedisService } from '../redis/redis.service'

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name)

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async check(): Promise<HealthCheckResponse> {
    const [db, redis] = await Promise.all([this.checkDb(), this.checkRedis()])
    const allOk = db.status === 'ok' && redis.status === 'ok'

    return {
      status: allOk ? 'ok' : 'error',
      checks: { db, redis },
      timestamp: new Date().toISOString(),
    }
  }

  private async checkDb(): Promise<HealthCheckItem> {
    const start = Date.now()
    try {
      await this.prisma.ping()
      return { status: 'ok', latencyMs: Date.now() - start }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error)
      this.logger.error(`DB healthcheck 失败: ${message}`)
      return { status: 'error', latencyMs: Date.now() - start, error: message }
    }
  }

  private async checkRedis(): Promise<HealthCheckItem> {
    const start = Date.now()
    try {
      const reply = await this.redis.ping()
      if (reply !== 'PONG') {
        return { status: 'error', latencyMs: Date.now() - start, error: `unexpected: ${reply}` }
      }
      return { status: 'ok', latencyMs: Date.now() - start }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error)
      this.logger.error(`Redis healthcheck 失败: ${message}`)
      return { status: 'error', latencyMs: Date.now() - start, error: message }
    }
  }
}
