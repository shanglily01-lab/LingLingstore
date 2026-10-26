import { Injectable, ForbiddenException } from '@nestjs/common'
import type { PaymentGateway } from './payment-gateway.interface'

@Injectable()
export class PaymentRouterService {
  private readonly gateways: Map<string, PaymentGateway> = new Map()

  register(gateway: PaymentGateway): void {
    this.gateways.set(gateway.channel, gateway)
  }

  getAvailableChannels(region: string): string[] {
    const result: string[] = []
    for (const [channel, gateway] of this.gateways) {
      if (gateway.region === region) {
        result.push(channel)
      }
    }
    return result
  }

  getGateway(channel: string): PaymentGateway {
    const gateway = this.gateways.get(channel)
    if (!gateway) throw new ForbiddenException(`不支持的支付通道: ${channel}`)
    return gateway
  }

  validateChannel(region: string, requested: string): void {
    const allowed = this.getAvailableChannels(region)
    if (!allowed.includes(requested)) {
      throw new ForbiddenException('该区域不支持所选的支付方式')
    }
  }
}
