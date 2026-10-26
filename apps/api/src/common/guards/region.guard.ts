import { Injectable, ExecutionContext, CanActivate } from '@nestjs/common'
import { Reflector } from '@nestjs/core'

export const REQUIRED_REGION_KEY = 'requiredRegion'

@Injectable()
export class RegionGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<string>(REQUIRED_REGION_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ])
    if (!required) return true

    const request = ctx.switchToHttp().getRequest()
    const user = request.user
    if (!user) return false

    return user.region === required
  }
}
