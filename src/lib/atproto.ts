import 'server-only'
import { Client, ok, simpleFetchHandler } from '@atcute/client'
import type {} from '@atcute/atproto'
import type {} from '@atcute/standard-site'
import {
  CompositeDidDocumentResolver,
  PlcDidDocumentResolver,
  WebDidDocumentResolver
} from '@atcute/identity-resolver'

export function settings() {
  const did = process.env.YAK_OWNER_DID
  const origin = process.env.YAK_ORIGIN
  const rkey = 'yak'
  if (!did || !origin)
    throw new Error(
      'Configure YAK_OWNER_DID and YAK_ORIGIN before starting Yak.'
    )
  if (!/^did:(plc|web):/.test(did)) throw new Error('Unsupported owner DID')
  return {
    did: did as `did:plc:${string}` | `did:web:${string}`,
    origin: new URL(origin).origin,
    rkey,
    publication: `at://${did}/site.standard.publication/${rkey}`
  }
}

export async function pdsUrl() {
  if (process.env.NODE_ENV !== 'production' && process.env.YAK_PDS_URL) {
    return process.env.YAK_PDS_URL
  }
  const resolver = new CompositeDidDocumentResolver({
    methods: {
      plc: new PlcDidDocumentResolver(),
      web: new WebDidDocumentResolver()
    }
  })
  const document = await resolver.resolve(settings().did)
  const service = document.service?.find(
    s => s.id === '#atproto_pds' || s.id === `${settings().did}#atproto_pds`
  )
  if (!service || typeof service.serviceEndpoint !== 'string')
    throw new Error('PDS not found in DID document')
  const url = new URL(service.serviceEndpoint)
  if (url.protocol !== 'https:')
    throw new Error('Production PDS must use HTTPS')
  return url.origin
}

export async function publicClient() {
  return new Client({
    handler: simpleFetchHandler({ service: await pdsUrl() })
  })
}

export async function listRecords(collection: string) {
  const client = await publicClient()
  const records = []
  let cursor: string | undefined
  do {
    const page = await ok(
      client.get('com.atproto.repo.listRecords', {
        params: {
          repo: settings().did,
          collection: collection as `${string}.${string}.${string}`,
          limit: 100,
          cursor
        }
      })
    )
    records.push(...page.records)
    cursor = page.cursor
  } while (cursor)
  return records
}

export async function readTextBlob(cid: string) {
  const url = new URL('/xrpc/com.atproto.sync.getBlob', await pdsUrl())
  url.searchParams.set('did', settings().did)
  url.searchParams.set('cid', cid)
  const response = await fetch(url, { signal: AbortSignal.timeout(15000) })
  if (!response.ok) throw new Error('Unable to retrieve article body')
  const text = await response.text()
  if (new TextEncoder().encode(text).byteLength > 1_000_000)
    throw new Error('Article body exceeds Markpub limit')
  return text
}
