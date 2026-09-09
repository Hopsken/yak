import 'server-only'
import { cookies } from 'next/headers'
import { getIronSession } from 'iron-session'
import { OAuthClient, scope } from '@atcute/oauth-node-client'
import {
  CompositeDidDocumentResolver,
  CompositeHandleResolver,
  DohJsonHandleResolver,
  LocalActorResolver,
  PlcDidDocumentResolver,
  WebDidDocumentResolver,
  WellKnownHandleResolver
} from '@atcute/identity-resolver'
import { Client, ok, simpleFetchHandler } from '@atcute/client'
import { settings } from './atproto'
import { cookieOAuthStorage, type OAuthStorage } from './oauth-storage'

export function secret() {
  const value = process.env.YAK_SESSION_SECRET
  if (!value || value.length < 32)
    throw new Error('YAK_SESSION_SECRET must contain at least 32 characters')
  return value
}

type AppSession = { did?: string; mode?: 'oauth' | 'dev'; oauthNonce?: string }
export async function appSession() {
  return getIronSession<AppSession>(await cookies(), {
    password: secret(),
    cookieName: 'yak-session',
    ttl: 60 * 60 * 24 * 7,
    cookieOptions: {
      httpOnly: true,
      sameSite: 'lax',
      secure: settings().origin.startsWith('https://'),
      path: '/'
    }
  })
}

export async function oauthStorage(): Promise<OAuthStorage> {
  return cookieOAuthStorage(await cookies(), {
    password: secret(),
    secure: settings().origin.startsWith('https://')
  })
}

// Each request owns its stores and any Set-Cookie writes, including token refresh.
export async function oauthClient(storage?: OAuthStorage) {
  const origin = settings().origin
  const development = process.env.NODE_ENV !== 'production'
  const loopback = development && new URL(origin).hostname === '127.0.0.1'
  return new OAuthClient({
    metadata: {
      ...(!loopback
        ? {
            client_id: `${origin}/oauth-client-metadata.json`,
            client_name: 'Yak',
            client_uri: origin
          }
        : {}),
      redirect_uris: [`${origin}/api/auth/callback`],
      scope: [
        scope.repo({
          collection: ['site.standard.document', 'site.standard.publication'],
          action: ['create', 'update']
        }),
        scope.blob({ accept: ['text/markdown'] })
      ]
    },
    stores: storage ?? (await oauthStorage()),
    actorResolver: new LocalActorResolver({
      handleResolver: new CompositeHandleResolver({
        methods: {
          dns: new DohJsonHandleResolver({
            dohUrl: 'https://cloudflare-dns.com/dns-query'
          }),
          http: new WellKnownHandleResolver()
        }
      }),
      didDocumentResolver: new CompositeDidDocumentResolver({
        methods: {
          plc: new PlcDidDocumentResolver({
            apiUrl: development ? process.env.YAK_PLC_URL : undefined
          }),
          web: new WebDidDocumentResolver()
        }
      })
    })
  })
}

export function devLoginEnabled() {
  return (
    process.env.NODE_ENV === 'development' &&
    !!process.env.YAK_DEV_LOGIN &&
    !!process.env.YAK_DEV_PASSWORD &&
    ['127.0.0.1', '[::1]'].includes(
      new URL(process.env.YAK_PDS_URL ?? 'https://disabled.invalid').hostname
    )
  )
}

export function assertOrigin(request: Request) {
  if (request.headers.get('origin') !== settings().origin)
    throw new Error('Invalid request origin')
}

export async function devClient() {
  if (!devLoginEnabled()) throw new Error('Development login disabled')
  const handler = simpleFetchHandler({ service: process.env.YAK_PDS_URL! })
  const rpc = new Client({ handler })
  const login = await ok(
    rpc.post('com.atproto.server.createSession', {
      input: {
        identifier: process.env.YAK_DEV_LOGIN!,
        password: process.env.YAK_DEV_PASSWORD!
      }
    })
  )
  if (login.did !== settings().did)
    throw new Error('Development account is not the owner')
  return new Client({
    handler: (path, init) => {
      const headers = new Headers(init.headers)
      headers.set('authorization', `Bearer ${login.accessJwt}`)
      return handler(path, { ...init, headers })
    }
  })
}

export async function ownerClient() {
  const session = await appSession()
  if (session.did !== settings().did) throw new Error('Owner login required')
  if (session.mode === 'dev') return devClient()
  if (session.mode !== 'oauth') throw new Error('OAuth login required')
  try {
    return new Client({
      handler: await (await oauthClient()).restore(settings().did)
    })
  } catch {
    session.destroy()
    throw new Error(
      'OAuth session expired or could not be restored. Log in again; your draft is retained.'
    )
  }
}

export const loginNonce = () => crypto.randomUUID()
