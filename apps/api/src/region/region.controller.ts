import { Controller, Get, Req } from '@nestjs/common'
import type { Request } from 'express'

@Controller('region')
export class RegionController {
  @Get('hint')
  hint(@Req() req: Request) {
    const ipCountry =
      (req.headers['cf-ipcountry'] as string) ||
      (req.headers['x-debug-country'] as string) ||
      null
    return { ipCountry }
  }
}
