import { Injectable, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { ConfigService } from '@nestjs/config'
import * as bcrypt from 'bcrypt'
import { PrismaService } from '../common/prisma/prisma.service'
import { OtpService } from './otp.service'
import type { Env } from '../common/config/env.schema'
import type { AuthResponse, UserProfile } from '@web3-mall/shared'

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService<Env, true>,
    private readonly otp: OtpService,
  ) {}

  async register(params: {
    region: string
    phone?: string
    email?: string
    password?: string
    countryCode?: string
    otp: string
  }): Promise<AuthResponse> {
    // 验证 OTP
    const otpTarget: { phone?: string; email?: string } = {}
    if (params.phone) otpTarget.phone = params.phone
    if (params.email) otpTarget.email = params.email

    const valid = await this.otp.verifyOtp(otpTarget, params.otp)
    if (!valid) throw new UnauthorizedException('验证码错误或已过期')

    // 检查是否已注册
    if (params.phone) {
      const existing = await this.prisma.user.findUnique({ where: { phone: params.phone } })
      if (existing) throw new UnauthorizedException('该手机号已注册')
    }
    if (params.email) {
      const existing = await this.prisma.user.findUnique({ where: { email: params.email } })
      if (existing) throw new UnauthorizedException('该邮箱已注册')
    }

    let passwordHash: string | undefined
    if (params.password) {
      passwordHash = await bcrypt.hash(params.password, 10)
    }

    const user = await this.prisma.user.create({
      data: {
        region: params.region,
        phone: params.phone,
        email: params.email,
        passwordHash,
        countryCode: params.countryCode,
        displayName: params.phone ? params.phone.slice(-4) : params.email?.split('@')[0],
      },
    })

    return this.buildAuthResponse(user)
  }

  async login(params: { phone?: string; email?: string; password?: string; otp?: string }): Promise<AuthResponse> {
    // 查找用户
    let user
    if (params.phone) {
      user = await this.prisma.user.findUnique({ where: { phone: params.phone } })
    } else if (params.email) {
      user = await this.prisma.user.findUnique({ where: { email: params.email } })
    }
    if (!user) throw new UnauthorizedException('用户不存在')

    // 验证
    if (params.otp) {
      const otpTarget: { phone?: string; email?: string } = {}
      if (params.phone) otpTarget.phone = params.phone
      if (params.email) otpTarget.email = params.email
      const valid = await this.otp.verifyOtp(otpTarget, params.otp)
      if (!valid) throw new UnauthorizedException('验证码错误')
    } else if (params.password) {
      if (!user.passwordHash) throw new UnauthorizedException('请使用验证码登录')
      const valid = await bcrypt.compare(params.password, user.passwordHash)
      if (!valid) throw new UnauthorizedException('密码错误')
    } else {
      throw new UnauthorizedException('请提供密码或验证码')
    }

    return this.buildAuthResponse(user)
  }

  async getUserProfile(userId: bigint): Promise<UserProfile> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } })
    if (!user) throw new UnauthorizedException('用户不存在')
    return this.mapUser(user)
  }

  private buildAuthResponse(user: {
    id: bigint
    region: string
    phone: string | null
    email: string | null
    passwordHash: string | null
    displayName: string | null
    countryCode: string | null
  }): AuthResponse {
    const payload = { sub: String(user.id), region: user.region }
    const accessToken = this.jwt.sign(payload, {
      secret: this.config.get('JWT_SECRET', { infer: true }),
      expiresIn: this.config.get('JWT_EXPIRES_IN', { infer: true }),
    })

    return {
      accessToken,
      user: this.mapUser(user),
    }
  }

  private mapUser(user: {
    id: bigint
    region: string
    role?: string | null
    phone: string | null
    email: string | null
    displayName: string | null
    countryCode: string | null
  }): UserProfile {
    return {
      id: String(user.id),
      region: user.region,
      role: user.role ?? 'user',
      phone: user.phone ?? undefined,
      email: user.email ?? undefined,
      displayName: user.displayName ?? undefined,
      countryCode: user.countryCode ?? undefined,
    }
  }
}
