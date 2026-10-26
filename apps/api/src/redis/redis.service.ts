import { Inject, Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Redis } from 'ioredis'
import type { Env } from '../common/config/env.schema'

/**
 * Redis 客户端服务. 包装 ioredis, 提供原始 client 与 ping 方法.
 */
@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name)
  private client!: Redis

  constructor(@Inject(ConfigService) private readonly config: ConfigService<Env, true>) {}

  onModuleInit(): void {
    const url = this.config.get('REDIS_URL', { infer: true })
    this.client = new Redis(url, {
      lazyConnect: true,
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      connectTimeout: 3000,
    })

    this.client.on('connect', () => this.logger.log('Redis 已连接'))
    this.client.on('error', (err: Error) => this.logger.error(`Redis 错误: ${err.message}`))
    this.client.on('close', () => this.logger.warn('Redis 连接已关闭'))
  }

  async onModuleDestroy(): Promise<void> {
    if (this.client) {
      await this.client.quit()
      this.logger.log('Redis 已断开')
    }
  }

  getClient(): Redis {
    return this.client
  }

  async ping(): Promise<string> {
    if (this.client.status === 'wait' || this.client.status === 'end') {
      await this.client.connect()
    }
    return this.client.ping()
  }
}
