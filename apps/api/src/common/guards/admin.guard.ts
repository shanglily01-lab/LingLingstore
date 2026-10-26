import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest()
    const userId = req.user?.userId
    if (!userId) throw new ForbiddenException('需要登录')

    const user = await this.prisma.user.findUnique({
      where: { id: BigInt(userId) },
      select: { role: true },
    })
    if (!user || user.role !== 'admin') {
      throw new ForbiddenException('需要管理员权限')
    }
    return true
  }
}
