import { ok, type Client } from '@atcute/client'
import type {} from '@atcute/atproto'
import type { Did } from '@atcute/lexicons/syntax'

export async function findPublication(
  client: Client,
  config: { did: Did; origin: string }
) {
  let publication: string | undefined
  let cursor: string | undefined
  do {
    const page = await ok(
      client.get('com.atproto.repo.listRecords', {
        params: {
          repo: config.did,
          collection: 'site.standard.publication',
          limit: 100,
          cursor
        }
      })
    )
    for (const record of page.records) {
      const value = record.value as { url?: unknown }
      if (
        typeof value.url !== 'string' ||
        value.url.replace(/\/$/, '') !== config.origin
      )
        continue
      if (publication) throw new Error('Multiple publications match YAK_ORIGIN')
      publication = record.uri
    }
    cursor = page.cursor
  } while (cursor)
  return publication
}
