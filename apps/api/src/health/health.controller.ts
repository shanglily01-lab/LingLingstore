import { Controller, Get, HttpCode, HttpStatus, Res } from '@nestjs/common'
import type { Response } from 'express'
import type { HealthCheckResponse } from '@web3-mall/shared'
import { HealthService } from './health.service'

@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  /**
   * 健康检查端点.
   * - 全部 OK -> 200 + { status: 'ok', ... }
   * - 任一失败 -> 503 + { status: 'error', ... } (JSON 结构相同, 失败的 check 带 error 字段)
   */
  @Get()
  @HttpCode(HttpStatus.OK)
  async check(@Res({ passthrough: true }) res: Response): Promise<HealthCheckResponse> {
    const result = await this.healthService.check()
    if (result.status === 'error') {
      res.status(HttpStatus.SERVICE_UNAVAILABLE)
    }
    return result
  }
}
