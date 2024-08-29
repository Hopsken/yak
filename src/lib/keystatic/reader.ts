import { createReader } from '@keystatic/core/reader'

import keystaticConfig from '../../../keystatic.config'
import { singletonSync } from '@/utils/singleton'

export const reader = singletonSync(
  () => createReader(process.cwd(), keystaticConfig),
  'keystatic-reader'
)
