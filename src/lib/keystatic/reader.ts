import { createGitHubReader } from '@keystatic/core/reader/github'
import { createReader } from '@keystatic/core/reader'

import keystaticConfig from '../../../keystatic.config'
import { singletonSync } from '@/utils/singleton'
import yak from '../../../yak.config'

const LOCAL_MODE = !!process.env.LOCAL_MODE

export const reader = singletonSync(() => {
  return LOCAL_MODE
    ? createReader(process.cwd(), keystaticConfig)
    : createGitHubReader(keystaticConfig, {
        repo: `${yak.repo.owner}/${yak.repo.name}`,
        token: process.env.GITHUB_ACCESS_TOKEN
      })
}, 'keystatic-reader')

export const getNoteBySlug = async (slug: string) => {
  const note = await reader.collections.notes.read(slug, {
    resolveLinkedFiles: true
  })
  return note
}
