import { Injectable, UnauthorizedException } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { ExtractJwt, Strategy } from 'passport-jwt'
import { ConfigService } from '@nestjs/config'
import { PrismaService } from '../common/prisma/prisma.service'
import type { Env } from '../common/config/env.schema'

interface JwtPayload {
  sub: string
  region: string
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService<Env, true>,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get('JWT_SECRET', { infer: true }),
    })
  }

  async validate(payload: JwtPayload): Promise<{ userId: string; region: string; role: string }> {
    const user = await this.prisma.user.findUnique({
      where: { id: BigInt(payload.sub) },
      select: { id: true, region: true, role: true, status: true },
    })
    if (!user || user.status !== 1) {
      throw new UnauthorizedException('用户不存在或已禁用')
    }
    return { userId: String(user.id), region: user.region, role: user.role }
  }
}
