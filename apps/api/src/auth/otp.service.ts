import { Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { RedisService } from '../redis/redis.service'
import type { Env } from '../common/config/env.schema'

@Injectable()
export class OtpService implements OnModuleInit {
  private readonly logger = new Logger(OtpService.name)
  private readonly mockMode: boolean

  constructor(
    private readonly config: ConfigService<Env, true>,
    private readonly redis: RedisService,
  ) {
    this.mockMode = this.config.get('OTP_MOCK_MODE', { infer: true })
  }

  onModuleInit(): void {
    if (this.mockMode) {
      this.logger.warn('OTP_MOCK_MODE=true, 使用固定验证码 123456')
    }
  }

  async sendOtp(target: { phone?: string; email?: string }): Promise<void> {
    const otp = this.generateOtp()
    const key = this.getKey(target)

    await this.redis.getClient().setex(key, 300, otp) // 5 分钟有效

    if (this.mockMode) {
      this.logger.log(`[MOCK] OTP for ${JSON.stringify(target)}: ${otp}`)
      return
    }

    if (target.phone) {
      // TODO: 接入阿里云短信
      this.logger.log(`[SMS] 发送 OTP ${otp} 到手机 ${target.phone}`)
    }
    if (target.email) {
      // TODO: 接入 Resend/邮件服务
      this.logger.log(`[EMAIL] 发送 OTP ${otp} 到邮箱 ${target.email}`)
    }
  }

  async verifyOtp(target: { phone?: string; email?: string }, otp: string): Promise<boolean> {
    if (this.mockMode) {
      return otp === '123456'
    }

    const key = this.getKey(target)
    const stored = await this.redis.getClient().get(key)
    if (!stored || stored !== otp) return false

    await this.redis.getClient().del(key)
    return true
  }

  private getKey(target: { phone?: string; email?: string }): string {
    if (target.phone) return `otp:phone:${target.phone}`
    if (target.email) return `otp:email:${target.email}`
    throw new Error('phone or email required')
  }

  private generateOtp(): string {
    return String(Math.floor(100000 + Math.random() * 900000))
  }
}
