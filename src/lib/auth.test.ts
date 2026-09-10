import { afterEach, describe, expect, it, vi } from 'vitest'
import { assertOrigin, devLoginEnabled, oauthClient } from './auth'
import { cookieOAuthStorage } from './oauth-storage'
import { webCookies } from 'iron-session'

vi.mock('server-only', () => ({}))
afterEach(() => vi.unstubAllEnvs())

function environment() {
  vi.stubEnv('NODE_ENV', 'development')
  vi.stubEnv('YAK_ORIGIN', 'https://yak.test')
  vi.stubEnv('YAK_OWNER_DID', 'did:plc:owner')
  vi.stubEnv('YAK_PDS_URL', 'http://127.0.0.1:2582')
  vi.stubEnv('YAK_DEV_LOGIN', 'owner.test')
  vi.stubEnv('YAK_DEV_PASSWORD', 'test-only')
}
describe('development authentication boundary', () => {
  it('is disabled in production even with all flags present', () => {
    environment()
    expect(devLoginEnabled()).toBe(true)
    vi.stubEnv('NODE_ENV', 'production')
    expect(devLoginEnabled()).toBe(false)
  })
  it('refuses an external PDS and missing PDS password', () => {
    environment()
    vi.stubEnv('YAK_PDS_URL', 'https://real-pds.example')
    expect(devLoginEnabled()).toBe(false)
    vi.stubEnv('YAK_PDS_URL', 'http://127.0.0.1:2582')
    vi.stubEnv('YAK_DEV_PASSWORD', '')
    expect(devLoginEnabled()).toBe(false)
  })
  it.each(['development', 'production'])(
    'accepts only YAK_ORIGIN in %s',
    mode => {
      environment()
      vi.stubEnv('NODE_ENV', mode)
      // Old configuration must not grant a second origin access.
      vi.stubEnv('YAK_DEV_ORIGIN', 'https://preview.test')
      expect(() =>
        assertOrigin(
          new Request('https://yak.test/api/documents', {
            headers: { Origin: 'https://preview.test' }
          })
        )
      ).toThrow('Invalid request origin')
      expect(() =>
        assertOrigin(new Request('https://yak.test/api/documents'))
      ).toThrow()
      expect(() =>
        assertOrigin(
          new Request('https://yak.test/api/documents', {
            headers: { Origin: 'https://evil.test' }
          })
        )
      ).toThrow()
      expect(() =>
        assertOrigin(
          new Request('https://yak.test/api/documents', {
            headers: { Origin: 'https://yak.test' }
          })
        )
      ).not.toThrow()
    }
  )
})

it('uses public OAuth metadata on production HTTPS without a client key', async () => {
  vi.stubEnv('NODE_ENV', 'production')
  vi.stubEnv('YAK_ORIGIN', 'https://notes.example.com')
  vi.stubEnv('YAK_OWNER_DID', 'did:plc:abcdefghijklmnopqrstuvwx')
  const storage = await cookieOAuthStorage(
    webCookies(new Request('https://notes.example.com'), new Headers()),
    { password: 'test-only-cookie-encryption-secret-32-chars', secure: true }
  )
  const { metadata } = await oauthClient(storage)
  expect(metadata.client_id).toBe(
    'https://notes.example.com/oauth-client-metadata.json'
  )
  expect(metadata.token_endpoint_auth_method).toBe('none')
  expect(metadata.jwks).toBeUndefined()
  expect(metadata.jwks_uri).toBeUndefined()
  expect(metadata.dpop_bound_access_tokens).toBe(true)
  expect(metadata.scope).toBe(
    'atproto repo?collection=site.standard.document&collection=site.standard.publication&action=create&action=update'
  )
  expect(metadata.redirect_uris).toEqual([
    'https://notes.example.com/api/auth/callback'
  ])
})
