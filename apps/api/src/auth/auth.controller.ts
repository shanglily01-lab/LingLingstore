import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common'
import { AuthService } from './auth.service'
import { OtpService } from './otp.service'
import type { AuthResponse } from '@web3-mall/shared'

@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly otp: OtpService,
  ) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(
    @Body() body: { region: string; phone?: string; email?: string; password?: string; countryCode?: string; otp: string },
  ): Promise<AuthResponse> {
    return this.auth.register(body)
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() body: { phone?: string; email?: string; password?: string; otp?: string },
  ): Promise<AuthResponse> {
    return this.auth.login(body)
  }

  @Post('send-otp')
  @HttpCode(HttpStatus.OK)
  async sendOtp(@Body() body: { phone?: string; email?: string }): Promise<{ ok: boolean }> {
    await this.otp.sendOtp(body)
    return { ok: true }
  }
}
