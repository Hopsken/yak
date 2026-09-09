import { ok, type Client } from '@atcute/client'
import type {} from '@atcute/atproto'
import type { Did } from '@atcute/lexicons/syntax'
import {
  SiteStandardDocument,
  SiteStandardPublication
} from '@atcute/standard-site'
import { parse } from '@atcute/lexicons'
import { documentInput, markdownInfo } from './documents'

export async function publish(
  client: Client,
  input: unknown,
  config: { did: Did; origin: string; rkey: string; publication: string }
) {
  const data = documentInput.parse(input)
  if (!!data.rkey !== !!data.cid)
    throw new Error('Record key and revision CID must be supplied together')
  const path = `/notes/${encodeURIComponent(data.slug)}`
  const rkey =
    data.rkey ??
    Array.from(
      new Uint8Array(
        await crypto.subtle.digest(
          'SHA-256',
          new TextEncoder().encode(`${config.publication}:${path}`)
        )
      ),
      byte => byte.toString(16).padStart(2, '0')
    )
      .join('')
      .slice(0, 32)
  let previous: Record<string, unknown> = {}
  if (data.rkey) {
    if (!data.cid) throw new Error('A revision CID is required')
    const record = await ok(
      client.get('com.atproto.repo.getRecord', {
        params: { repo: config.did, collection: 'site.standard.document', rkey }
      })
    )
    previous = record.value as Record<string, unknown>
    if (record.cid !== data.cid)
      throw new Error('This article changed. Reload before publishing.')
    if (previous.site !== config.publication || previous.path !== path)
      throw new Error('Publication and published path cannot change')
    if (
      (previous.content as { $type?: string })?.$type !== 'at.markpub.markdown'
    )
      throw new Error('This article uses an unsupported format')
  }
  // Refuse duplicate paths, including records created by another client.
  let cursor: string | undefined
  do {
    const page = await ok(
      client.get('com.atproto.repo.listRecords', {
        params: {
          repo: config.did,
          collection: 'site.standard.document',
          limit: 100,
          cursor
        }
      })
    )
    if (
      page.records.some(record => {
        const value = record.value as { site?: string; path?: string }
        return (
          value.site === config.publication &&
          value.path === path &&
          record.uri.split('/').at(-1) !== rkey
        )
      })
    )
      throw new Error('This path is already in use')
    cursor = page.cursor
  } while (cursor)
  const existingPublication = await client.get('com.atproto.repo.getRecord', {
    params: {
      repo: config.did,
      collection: 'site.standard.publication',
      rkey: config.rkey
    }
  })
  if (!existingPublication.ok) {
    if (existingPublication.data.error !== 'RecordNotFound')
      throw new Error('Unable to read publication')
    const publication = {
      $type: 'site.standard.publication' as const,
      name: 'Yak',
      url: config.origin
    }
    parse(SiteStandardPublication.mainSchema, publication)
    await ok(
      client.post('com.atproto.repo.putRecord', {
        input: {
          repo: config.did,
          collection: 'site.standard.publication',
          rkey: config.rkey,
          swapRecord: null,
          record: publication
        }
      })
    )
  } else if (
    (existingPublication.data.value as { url?: string }).url?.replace(
      /\/$/,
      ''
    ) !== config.origin
  ) {
    throw new Error('Publication URL does not match YAK_ORIGIN')
  }
  const bytes = new TextEncoder().encode(data.markdown)
  if (bytes.length > 1_000_000)
    throw new Error('Markdown exceeds the 1 MB limit')
  const blob =
    bytes.length > 50_000
      ? await ok(
          client.post('com.atproto.repo.uploadBlob', {
            input: bytes,
            headers: { 'Content-Type': 'text/markdown' }
          })
        )
      : undefined
  const now = new Date().toISOString()
  const record = {
    ...previous,
    $type: 'site.standard.document' as const,
    site: config.publication,
    title: data.title,
    path,
    description: data.description,
    tags: [...new Set(data.tags)],
    publishedAt:
      typeof previous.publishedAt === 'string' ? previous.publishedAt : now,
    updatedAt: now,
    textContent: markdownInfo(data.markdown).text.slice(0, 30_000),
    content: {
      $type: 'at.markpub.markdown',
      flavor: 'commonmark',
      text: {
        $type: 'at.markpub.text',
        markdown: blob ? data.markdown.slice(0, 1000) : data.markdown,
        ...(blob ? { textBlob: blob.blob } : {})
      }
    }
  }
  parse(SiteStandardDocument.mainSchema, record)
  const saved = await ok(
    client.post('com.atproto.repo.putRecord', {
      input: {
        repo: config.did,
        collection: 'site.standard.document',
        rkey,
        swapRecord: data.cid ?? null,
        record
      }
    })
  )
  return { ...saved, slug: data.slug, rkey }
}
