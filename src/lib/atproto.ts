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
  if (!did || !origin)
    throw new Error(
      'Configure YAK_OWNER_DID and YAK_ORIGIN before starting Yak.'
    )
  if (!/^did:(plc|web):/.test(did)) throw new Error('Unsupported owner DID')
  return {
    did: did as `did:plc:${string}` | `did:web:${string}`,
    origin: new URL(origin).origin
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
