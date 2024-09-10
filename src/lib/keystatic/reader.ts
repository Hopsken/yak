import { createGitHubReader } from '@keystatic/core/reader/github'
import {
  EntryWithResolvedLinkedFiles,
  createReader
} from '@keystatic/core/reader'

import keystaticConfig from '../../../keystatic.config'
import { singletonSync } from '@/utils/singleton'
import yak from '../../../yak.config'
import { ContentNote, AnyNote } from '@/type'

const LOCAL_MODE = !!process.env.LOCAL_MODE

export const reader = singletonSync(() => {
  return LOCAL_MODE
    ? createReader(process.cwd(), keystaticConfig)
    : createGitHubReader(keystaticConfig, {
        repo: `${yak.repo.owner}/${yak.repo.name}`,
        token: process.env.GITHUB_ACCESS_TOKEN
      })
}, 'keystatic-reader')

type BacklinksMap = Record<
  string,
  {
    title: string
    backlinks: string[]
  }
>

export const getReferenceMap = async (): Promise<BacklinksMap> => {
  const referenceMap = await reader.singletons.references.read()
  const { notes } = referenceMap || {}

  if (!notes) return {} as BacklinksMap

  return notes?.reduce((acc, cur) => {
    const slug = cur.slug
    if (!slug) return acc
    acc[slug] = {
      title: cur.title,
      backlinks: cur.backlinks.filter((i): i is string => !!i)
    }
    return acc
  }, {} as BacklinksMap)
}

export const getNoteBySlug = async (slug: string): Promise<AnyNote> => {
  const [note, references] = await Promise.all([
    reader.collections.notes.read(slug, {
      resolveLinkedFiles: true
    }),
    getReferenceMap()
  ])

  const backlinks =
    references[slug]?.backlinks.map(slug => ({
      title: references[slug]?.title || '',
      slug
    })) || []

  // if no file exist for note, then only render the backlinks of it.
  if (!note) {
    return {
      title: references[slug]?.title || '',
      backlinks
    }
  }

  return {
    ...note,
    backlinks
  }
}
