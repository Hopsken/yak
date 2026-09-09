import { cache } from 'react'
import { unstable_cache } from 'next/cache'
import { listRecords, publicClient, readTextBlob, settings } from './atproto'
import { findPublication } from './publication'
import { buildGraph, type Note } from './documents'
import { z } from 'zod'

const recordSchema = z.object({
  $type: z.literal('site.standard.document'),
  title: z.string(),
  site: z.string(),
  path: z.string().optional(),
  description: z.string().optional(),
  tags: z.array(z.string()).optional(),
  publishedAt: z.string(),
  updatedAt: z.string().optional(),
  textContent: z.string().optional(),
  content: z.unknown().optional()
})
const markpubSchema = z.object({
  $type: z.literal('at.markpub.markdown'),
  text: z.object({
    markdown: z.string(),
    textBlob: z.object({ ref: z.object({ $link: z.string() }) }).optional()
  })
})

const snapshot = cache(async () => {
  const config = settings()
  const notes = await unstable_cache(
    async () => {
      const publication = await findPublication(await publicClient(), config)
      if (!publication) return []
      const records = await listRecords('site.standard.document')
      const result: Note[] = []
      for (const record of records) {
        const parsed = recordSchema.safeParse(record.value)
        if (!parsed.success || parsed.data.site !== publication) continue
        const doc = parsed.data
        const slug = record.uri.split('/').at(-1)!
        if (doc.path !== `/r/${slug}`) continue
        const body = markpubSchema.safeParse(doc.content)
        const markdown = body.success
          ? body.data.text.textBlob
            ? await readTextBlob(body.data.text.textBlob.ref.$link)
            : body.data.text.markdown
          : (doc.textContent ?? '')
        result.push({
          title: doc.title,
          slug,
          uri: record.uri,
          cid: record.cid,
          rkey: record.uri.split('/').at(-1)!,
          description: doc.description ?? '',
          tags: doc.tags ?? [],
          markdown,
          supported: body.success,
          publishedAt: doc.publishedAt,
          updatedAt: doc.updatedAt,
          backlinks: []
        })
      }
      return result.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
    },
    ['documents', config.did, config.origin],
    { revalidate: 30, tags: ['documents'] }
  )()
  return buildGraph(notes, config.origin)
})

export class NoteService {
  static readonly instance = new NoteService()
  async getNoteBySlug(slug: string) {
    return (await snapshot()).bySlug.get(slug) ?? null
  }
  async listNotes() {
    return [...(await snapshot()).bySlug.values()].map(entry => ({
      slug: entry.slug,
      entry
    }))
  }
  async getTopic(key: string) {
    return (await snapshot()).topics.get(key)
  }
}
