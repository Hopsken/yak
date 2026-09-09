import { getIronSession, type CookieJar, type CookieStore } from 'iron-session'
import type {
  OAuthClientStores,
  StoredSession,
  StoredState
} from '@atcute/oauth-node-client'

// Atcute's contract is the storage boundary; a future DO adapter implements it.
export type OAuthStorage = Pick<OAuthClientStores, 'sessions' | 'states'>

export class OAuthCookieSizeError extends Error {
  constructor() {
    super(
      'OAuth data exceeds the single-cookie limit. This PDS needs a different session storage backend.'
    )
  }
}

export async function cookieOAuthStorage(
  cookies: CookieStore | CookieJar,
  options: { password: string; secure: boolean }
): Promise<OAuthStorage> {
  async function store<T extends object>(cookieName: string, ttl: number) {
    const session = await getIronSession<{ key: string; value: T }>(cookies, {
      password: options.password,
      cookieName,
      ttl,
      chunk: false,
      cookieOptions: {
        httpOnly: true,
        secure: options.secure,
        sameSite: 'lax',
        path: '/'
      }
    })
    return {
      get(key: string) {
        return session.key === key ? session.value : undefined
      },
      async set(key: string, value: T) {
        session.key = key
        session.value = value
        try {
          await session.save()
        } catch (error) {
          session.destroy()
          if (
            error instanceof Error &&
            error.message.includes('Cookie length is too big')
          )
            throw new OAuthCookieSizeError()
          throw error
        }
      },
      delete(key: string) {
        if (session.key === key) session.destroy()
      },
      clear() {
        session.destroy()
      }
    }
  }
  return {
    states: await store<StoredState>('yak-oauth-state', 600),
    sessions: await store<StoredSession>('yak-oauth-session', 7 * 86400)
  }
}
