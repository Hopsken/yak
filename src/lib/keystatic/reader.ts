import { createReader } from '@keystatic/core/reader'

import keystaticConfig from '../../../keystatic.config'
import { singletonSync } from '@/utils/singleton'
import { RawNoteEntry } from '@/type'

export const reader = singletonSync(
  () => createReader(process.cwd(), keystaticConfig),
  'keystatic-reader'
)

export const getNoteBySlug = async (slug: string) => {
  const note = await reader.collections.notes.read(slug)
  return {
    ...note,
    content: `#ABC

  [NextJS](/notes/nextjs)
    `
  } as RawNoteEntry
}
