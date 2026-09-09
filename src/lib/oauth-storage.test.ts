import { describe, expect, it, vi } from 'vitest'
import { webCookies } from 'iron-session'
import type { StoredSession, StoredState } from '@atcute/oauth-node-client'
import { cookieOAuthStorage, OAuthCookieSizeError } from './oauth-storage'

const options = {
  password: 'test-only-cookie-encryption-secret-32-chars',
  secure: true
}
const did = 'did:plc:abcdefghijklmnopqrstuvwx'
const value: StoredSession = {
  authMethod: { method: 'none' },
  dpopKey: {
    alg: 'ES256',
    kty: 'EC',
    crv: 'P-256',
    x: 'test-x',
    y: 'test-y',
    d: 'private-test-key'
  },
  tokenSet: {
    iss: 'https://pds.test',
    aud: 'https://pds.test',
    sub: did,
    scope: 'atproto',
    token_type: 'DPoP',
    access_token: 'private-access-token',
    refresh_token: 'private-refresh-token'
  }
}
function request(cookie = '') {
  return new Request('https://yak.test/api/documents', {
    headers: { Cookie: cookie }
  })
}
function cookieHeader(headers: Headers) {
  return headers
    .getSetCookie()
    .map(cookie => cookie.split(';')[0])
    .join('; ')
}

describe('request-scoped OAuth cookie storage', () => {
  it('encrypts a session, restores it in another request, and writes refresh updates', async () => {
    const headers = new Headers()
    const store = await cookieOAuthStorage(
      webCookies(request(), headers),
      options
    )
    await store.sessions.set(did, value)
    const cookie = headers.get('set-cookie')!
    expect(cookie).not.toContain(value.tokenSet.access_token)
    expect(cookie).not.toContain(value.dpopKey.d)
    expect(cookie).toMatch(/HttpOnly/)
    expect(cookie).toMatch(/Secure/)
    expect(cookie).toMatch(/SameSite=Lax/i)
    expect(cookie).not.toMatch(/Domain=/i)
    const nextHeaders = new Headers()
    const next = await cookieOAuthStorage(
      webCookies(request(cookieHeader(headers)), nextHeaders),
      options
    )
    expect(await next.sessions.get(did)).toEqual(value)
    expect(await next.sessions.get('did:plc:someoneelse')).toBeUndefined()
    const refreshed = {
      ...value,
      tokenSet: { ...value.tokenSet, refresh_token: 'rotated-token' }
    }
    await next.sessions.set(did, refreshed)
    const third = await cookieOAuthStorage(
      webCookies(request(cookieHeader(nextHeaders)), new Headers()),
      options
    )
    expect(await third.sessions.get(did)).toEqual(refreshed)
    // No global singleton may leak the previous browser's session.
    const unrelated = await cookieOAuthStorage(
      webCookies(request(), new Headers()),
      options
    )
    expect(await unrelated.sessions.get(did)).toBeUndefined()
  })

  it('rejects tampered cookies and oversized sessions without splitting cookies', async () => {
    const headers = new Headers()
    const store = await cookieOAuthStorage(
      webCookies(request(), headers),
      options
    )
    await store.sessions.set(did, value)
    const header = cookieHeader(headers)
    const tampered = header.slice(0, -10) + 'tampered!!'
    const next = await cookieOAuthStorage(
      webCookies(request(tampered), new Headers()),
      options
    )
    expect(await next.sessions.get(did)).toBeUndefined()
    await expect(
      store.sessions.set(did, {
        ...value,
        tokenSet: { ...value.tokenSet, access_token: 'x'.repeat(5000) }
      })
    ).rejects.toBeInstanceOf(OAuthCookieSizeError)
    expect(
      headers
        .getSetCookie()
        .every(cookie => cookie.startsWith('yak-oauth-session='))
    ).toBe(true)
    expect(headers.getSetCookie().at(-1)).toContain('Max-Age=0')
  })

  it('expires short-lived state and clears state and session on logout', async () => {
    const headers = new Headers()
    const store = await cookieOAuthStorage(
      webCookies(request(), headers),
      options
    )
    const state: StoredState = {
      dpopKey: value.dpopKey,
      authMethod: value.authMethod,
      pkceVerifier: 'private-verifier',
      issuer: 'https://pds.test',
      redirectUri: 'https://yak.test/api/auth/callback',
      expiresAt: Date.now() + 600_000
    }
    await store.states.set('nonce', state)
    await store.sessions.set(did, value)
    const original = cookieHeader(headers)
    await store.states.delete('nonce')
    expect(await store.states.get('nonce')).toBeUndefined()
    await store.sessions.clear()
    expect(await store.sessions.get(did)).toBeUndefined()
    try {
      vi.useFakeTimers()
      vi.setSystemTime(Date.now() + 700_000)
      const expired = await cookieOAuthStorage(
        webCookies(request(original), new Headers()),
        options
      )
      expect(await expired.states.get('nonce')).toBeUndefined()
      expect(await expired.sessions.get(did)).toEqual(value)
    } finally {
      vi.useRealTimers()
    }
  })
})
