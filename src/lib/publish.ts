import { ok, type Client } from '@atcute/client'
import type {} from '@atcute/atproto'
import type { Did } from '@atcute/lexicons/syntax'
import {
  SiteStandardDocument,
  SiteStandardPublication
} from '@atcute/standard-site'
import { parse } from '@atcute/lexicons'
import * as TID from '@atcute/tid'
import { documentInput, markdownInfo } from './documents'
import { findPublication } from './publication'

export async function publish(
  client: Client,
  input: unknown,
  config: { did: Did; origin: string }
) {
  const data = documentInput.parse(input)
  const info = markdownInfo(data.markdown)
  if (info.tags.length > 100 || info.tags.some(tag => tag.length > 128))
    throw new Error('Use at most 100 tags, each at most 128 characters')
  if (!!data.rkey !== !!data.cid)
    throw new Error('Record key and revision CID must be supplied together')
  let publication = await findPublication(client, config)
  if (!publication) {
    if (data.rkey) throw new Error('Publication not found')
    const record = {
      $type: 'site.standard.publication' as const,
      name: 'Yak',
      url: config.origin
    }
    parse(SiteStandardPublication.mainSchema, record)
    const created = await ok(
      client.post('com.atproto.repo.createRecord', {
        input: {
          repo: config.did,
          collection: 'site.standard.publication',
          record
        }
      })
    )
    publication = await findPublication(client, config)
    if (publication !== created.uri)
      throw new Error('Publication changed during creation. Retry publishing.')
  }
  const rkey = data.rkey ?? TID.now()
  const path = `/r/${rkey}`
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
    if (previous.site !== publication || previous.path !== path)
      throw new Error('Publication and published path cannot change')
    if (
      (previous.content as { $type?: string })?.$type !== 'at.markpub.markdown'
    )
      throw new Error('This article uses an unsupported format')
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
    site: publication,
    title: data.title,
    path,
    description: data.description,
    tags: info.tags,
    publishedAt:
      typeof previous.publishedAt === 'string' ? previous.publishedAt : now,
    updatedAt: now,
    textContent: info.text.slice(0, 30_000),
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
    data.rkey
      ? client.post('com.atproto.repo.putRecord', {
          input: {
            repo: config.did,
            collection: 'site.standard.document',
            rkey,
            swapRecord: data.cid,
            record
          }
        })
      : client.post('com.atproto.repo.createRecord', {
          input: {
            repo: config.did,
            collection: 'site.standard.document',
            rkey,
            record
          }
        })
  )
  return { ...saved, rkey }
}
