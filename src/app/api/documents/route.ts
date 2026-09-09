import { revalidateTag } from 'next/cache'
import { Mutex } from 'async-mutex'
import { appSession, assertOrigin, oauthStorage, ownerClient } from '@/lib/auth'
import { ClientResponseError } from '@atcute/client'
import {
  TokenInvalidError,
  TokenRefreshError,
  TokenRevokedError
} from '@atcute/oauth-node-client'
import { publish } from '@/lib/publish'
import { settings } from '@/lib/atproto'
const writes = new Mutex()
export async function POST(request: Request) {
  try {
    assertOrigin(request)
    const client = await ownerClient()
    const input = await request.json()
    const result = await writes.runExclusive(() =>
      publish(client, input, settings())
    )
    revalidateTag('documents', { expire: 0 })
    return Response.json(result)
  } catch (error) {
    if (
      error instanceof TokenInvalidError ||
      error instanceof TokenRefreshError ||
      error instanceof TokenRevokedError ||
      (error instanceof ClientResponseError && error.status === 401)
    ) {
      ;(await appSession()).destroy()
      await (await oauthStorage()).sessions.clear()
      return Response.json(
        {
          error: 'OAuth session expired. Log in again; your draft is retained.'
        },
        { status: 400 }
      )
    }
    return Response.json(
      { error: error instanceof Error ? error.message : 'Publishing failed' },
      { status: 400 }
    )
  }
}
