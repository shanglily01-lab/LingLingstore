import { SetMetadata } from '@nestjs/common'
import { REQUIRED_REGION_KEY } from '../guards/region.guard'

export const RequiredRegion = (region: string) => SetMetadata(REQUIRED_REGION_KEY, region)
