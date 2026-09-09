import { parseEnv } from 'node:util'
import { readFileSync } from 'node:fs'
import { test, expect } from '@playwright/test'
import { sealData, unsealData } from 'iron-session'
import type { StoredSession } from '@atcute/oauth-node-client'

const env = parseEnv(readFileSync('.env.test-network', 'utf8'))
const origin = env.YAK_ORIGIN!
if (new URL(origin).hostname !== '127.0.0.1')
  throw new Error('Browser tests require the disposable loopback app')

test('public OAuth, refresh, editor, stacked notes, logout and expired session', async ({
  page,
  context
}) => {
  const cookies = () => context.cookies(origin)
  const setCookie = (name: string, value: string) =>
    context.addCookies([
      { name, value, url: origin, httpOnly: true, sameSite: 'Lax' }
    ])
  await page.goto(`${origin}/admin`)
  const metadata = await (
    await context.request.get(`${origin}/oauth-client-metadata.json`)
  ).json()
  expect(metadata.token_endpoint_auth_method).toBe('none')
  expect(metadata.jwks).toBeUndefined()
  await page.getByRole('button', { name: 'Log in with ATProto' }).click()
  await page.waitForURL('https://pds.yak.test:2584/**')
  const stateCookie = (await cookies()).find(c => c.name === 'yak-oauth-state')!
  expect(stateCookie?.httpOnly).toBe(true)
  const stateBytes = Buffer.byteLength(stateCookie.value)
  expect(stateBytes).toBeLessThan(4000)
  await page.locator('input[type=password]').fill(env.YAK_DEV_PASSWORD!)
  await page.getByRole('button', { name: 'Sign in', exact: true }).click()
  await page.getByRole('button', { name: 'Authorize', exact: true }).click()
  await expect(page.getByText('Your articles', { exact: true })).toBeVisible()
  const loggedIn = await cookies()
  expect(loggedIn.some(c => c.name === 'yak-oauth-state')).toBe(false)
  const tokenCookie = loggedIn.find(c => c.name === 'yak-oauth-session')!
  const appCookie = loggedIn.find(c => c.name === 'yak-session')!
  expect(tokenCookie?.httpOnly).toBe(true)
  const sessionBytes = Buffer.byteLength(tokenCookie.value)
  expect(sessionBytes).toBeLessThan(4000)
  const stored = await unsealData<{ key: string; value: StoredSession }>(
    tokenCookie.value,
    { password: env.YAK_SESSION_SECRET! }
  )
  expect(stored.key).toBe(env.YAK_OWNER_DID)
  expect(stored.value.authMethod.method).toBe('none')
  // Force real refresh at the PDS on the next server-side publish.
  stored.value.tokenSet.expires_at = 0
  await setCookie(
    'yak-oauth-session',
    await sealData(stored, {
      password: env.YAK_SESSION_SECRET!,
      ttl: 7 * 86400
    })
  )
  await page.getByRole('link', { name: 'New article' }).click()
  const body = page.getByRole('textbox', { name: 'Article body' })
  await expect(body).toBeVisible()
  const slug = `browser-${Date.now()}`
  await page.getByLabel('Title', { exact: true }).fill('Browser integration')
  await page.getByLabel('Path: /notes/').fill(slug)
  await body.fill('Browser draft survives a reload. #React #中文 #react ')
  await expect(page.getByLabel(/Tags/i)).toHaveCount(0)
  await page.getByLabel('Insert article link').selectOption('hello')
  await page.reload()
  await expect(body).toBeVisible()
  await page.getByRole('button', { name: 'Restore draft' }).click()
  await expect(body).toContainText('Browser draft survives a reload.')
  await expect(body).toContainText('#React #中文 #react')
  await expect(page.getByLabel('Title', { exact: true })).toHaveValue(
    'Browser integration'
  )
  await page.getByRole('button', { name: 'Preview', exact: true }).click()
  await expect(
    page.getByLabel('Article preview', { exact: true })
  ).toContainText('Browser draft survives a reload.')
  await page.getByRole('button', { name: 'Publish', exact: true }).click()
  await expect(page).toHaveURL(`${origin}/admin/edit?slug=${slug}`)
  const refreshedCookie = (await cookies()).find(
    c => c.name === 'yak-oauth-session'
  )!
  const refreshed = await unsealData<typeof stored>(refreshedCookie.value, {
    password: env.YAK_SESSION_SECRET!
  })
  expect(refreshed.value.tokenSet.expires_at! > Date.now()).toBe(true)
  // Compare booleans so failures do not print refresh tokens.
  expect(
    refreshed.value.tokenSet.refresh_token !==
      stored.value.tokenSet.refresh_token
  ).toBe(true)
  await page.getByRole('link', { name: 'View article' }).click()
  await expect(page).toHaveURL(`${origin}/notes/${slug}`)
  await expect(
    page.getByText('Browser draft survives a reload.', { exact: false })
  ).toBeVisible()
  await page.getByRole('link', { name: 'Hello from Yak', exact: true }).click()
  await expect(page).toHaveURL(`${origin}/notes/${slug}?note=hello`)
  await expect(
    page.getByText('Linked to this note', { exact: true })
  ).toBeVisible()
  await page.goBack()
  await expect(page).toHaveURL(`${origin}/notes/${slug}`)
  await page.goForward()
  await expect(page).toHaveURL(`${origin}/notes/${slug}?note=hello`)
  await page.goto(`${origin}/admin`)
  await page.getByRole('button', { name: 'Log out' }).click()
  await expect(
    page.getByRole('button', { name: 'Log in with ATProto' })
  ).toBeVisible()
  expect((await cookies()).some(c => c.name.startsWith('yak-'))).toBe(false)
  refreshed.value.tokenSet.expires_at = 0
  refreshed.value.tokenSet.refresh_token = 'invalid-test-refresh-token'
  await setCookie('yak-session', appCookie.value)
  await setCookie(
    'yak-oauth-session',
    await sealData(refreshed, {
      password: env.YAK_SESSION_SECRET!,
      ttl: 7 * 86400
    })
  )
  const failed = await page.evaluate(async () => {
    const response = await fetch('/api/documents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{}'
    })
    return { status: response.status, body: await response.json() }
  })
  expect(failed.status).toBe(400)
  expect(failed.body.error).toMatch(/Log in again/)
  expect((await cookies()).some(c => c.name === 'yak-session')).toBe(false)
  console.log(
    `OAuth cookie values: state ${stateBytes} bytes, session ${sessionBytes} bytes`
  )
})
