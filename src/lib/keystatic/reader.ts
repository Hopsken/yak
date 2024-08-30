import { createGitHubReader } from '@keystatic/core/reader/github'

import keystaticConfig from '../../../keystatic.config'
import { singletonSync } from '@/utils/singleton'
import yak from '../../../yak.config'

export const reader = singletonSync(
  () =>
    createGitHubReader(keystaticConfig, {
      repo: `${yak.repo.owner}/${yak.repo.name}`,
      token: process.env.GITHUB_ACCESS_TOKEN
    }),
  'keystatic-reader'
)

export const getNoteBySlug = async (slug: string) => {
  const note = await reader.collections.notes.read(slug, {
    resolveLinkedFiles: true
  })
  return note
}
