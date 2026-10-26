import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../common/prisma/prisma.service'
import type { ShippingAddressData, ShippingAddressInput } from '@web3-mall/shared'

@Injectable()
export class AddressService {
  constructor(private readonly prisma: PrismaService) {}

  async list(userId: bigint): Promise<ShippingAddressData[]> {
    const rows = await this.prisma.shippingAddress.findMany({
      where: { userId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    })
    return rows.map((a) => this.map(a))
  }

  async create(userId: bigint, region: string, input: ShippingAddressInput): Promise<ShippingAddressData> {
    this.validateForRegion(region, input)
    if (input.isDefault) {
      await this.prisma.shippingAddress.updateMany({
        where: { userId },
        data: { isDefault: false },
      })
    }
    const count = await this.prisma.shippingAddress.count({ where: { userId } })
    const row = await this.prisma.shippingAddress.create({
      data: {
        userId,
        recipientName: input.recipientName,
        phone: input.phone,
        countryCode: input.countryCode,
        stateProvince: input.stateProvince,
        city: input.city,
        district: input.district,
        streetAddress: input.streetAddress,
        postalCode: input.postalCode,
        isDefault: input.isDefault ?? count === 0,
      },
    })
    return this.map(row)
  }

  async update(userId: bigint, region: string, id: bigint, input: Partial<ShippingAddressInput>): Promise<ShippingAddressData> {
    const existing = await this.prisma.shippingAddress.findUnique({ where: { id } })
    if (!existing || existing.userId !== userId) throw new NotFoundException('地址不存在')
    if (input.countryCode || input.recipientName) {
      this.validateForRegion(region, { ...existing, ...input } as ShippingAddressInput)
    }
    if (input.isDefault) {
      await this.prisma.shippingAddress.updateMany({ where: { userId }, data: { isDefault: false } })
    }
    const row = await this.prisma.shippingAddress.update({
      where: { id },
      data: {
        recipientName: input.recipientName,
        phone: input.phone,
        countryCode: input.countryCode,
        stateProvince: input.stateProvince,
        city: input.city,
        district: input.district,
        streetAddress: input.streetAddress,
        postalCode: input.postalCode,
        isDefault: input.isDefault,
      },
    })
    return this.map(row)
  }

  async remove(userId: bigint, id: bigint): Promise<{ ok: boolean }> {
    const existing = await this.prisma.shippingAddress.findUnique({ where: { id } })
    if (!existing || existing.userId !== userId) throw new NotFoundException('地址不存在')
    await this.prisma.shippingAddress.delete({ where: { id } })
    return { ok: true }
  }

  private validateForRegion(region: string, input: ShippingAddressInput) {
    if (region === 'CN' && input.countryCode !== 'CN') {
      throw new BadRequestException('国内账号仅可使用中国大陆收货地址')
    }
    if (region === 'OVERSEAS' && input.countryCode === 'CN') {
      throw new BadRequestException('海外账号不可使用中国大陆收货地址')
    }
  }

  private map(a: {
    id: bigint
    recipientName: string
    phone: string
    countryCode: string
    stateProvince: string | null
    city: string
    district: string | null
    streetAddress: string
    postalCode: string | null
    isDefault: boolean
  }): ShippingAddressData {
    return {
      id: String(a.id),
      recipientName: a.recipientName,
      phone: a.phone,
      countryCode: a.countryCode,
      stateProvince: a.stateProvince ?? undefined,
      city: a.city,
      district: a.district ?? undefined,
      streetAddress: a.streetAddress,
      postalCode: a.postalCode ?? undefined,
      isDefault: a.isDefault,
    }
  }
}
