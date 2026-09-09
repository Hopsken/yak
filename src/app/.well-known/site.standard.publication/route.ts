import { settings, publicClient } from '@/lib/atproto'
import { ok } from '@atcute/client'
export const dynamic = 'force-dynamic'
export async function GET() {
  const config = settings()
  const record = await ok(
    (await publicClient()).get('com.atproto.repo.getRecord', {
      params: {
        repo: config.did,
        collection: 'site.standard.publication',
        rkey: config.rkey
      }
    })
  )
  const value = record.value as { url?: string }
  if (value.url?.replace(/\/$/, '') !== config.origin)
    return new Response('Publication URL does not match YAK_ORIGIN', {
      status: 409
    })
  return new Response(config.publication, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' }
  })
}
