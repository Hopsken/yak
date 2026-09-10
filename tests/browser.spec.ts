import { parseEnv } from 'node:util'
import { readFileSync } from 'node:fs'
import { test, expect } from '@playwright/test'
import { sealData, unsealData } from 'iron-session'
import type { StoredSession } from '@atcute/oauth-node-client'
import { isTid } from '@atcute/lexicons/syntax'

const env = parseEnv(readFileSync('.env.test-network', 'utf8'))
const origin = env.YAK_ORIGIN!
if (new URL(origin).hostname !== '127.0.0.1')
  throw new Error('Browser tests require the disposable loopback app')

test('rich Markdown drafts restore, resize, and survive a rejected publish', async ({
  page,
  context
}) => {
  const dialogs: string[] = []
  page.on('dialog', async dialog => {
    dialogs.push(dialog.type())
    await dialog.accept()
  })
  await context.addCookies([
    {
      name: 'yak-session',
      value: await sealData(
        { did: env.YAK_OWNER_DID, mode: 'dev' },
        {
          password: env.YAK_SESSION_SECRET!,
          ttl: 86400
        }
      ),
      url: origin,
      httpOnly: true,
      sameSite: 'Lax'
    }
  ])
  const key = `yak:draft:${env.YAK_OWNER_DID}:${env.YAK_SEED_RKEY}`
  const restored = {
    title: '',
    description: 'Keep existing metadata',
    markdown: '## Unpublished **draft**\n\n* exact spacing  \n',
    rkey: env.YAK_SEED_RKEY,
    cid: 'stale-revision'
  }
  await page.goto(`${origin}/admin`)
  await page.evaluate(
    ({ key, restored }) => {
      localStorage.setItem(key, JSON.stringify(restored))
    },
    { key, restored }
  )
  await page.goto(`${origin}/admin/edit?rkey=${env.YAK_SEED_RKEY}`)
  const title = page.getByRole('textbox', { name: 'Title', exact: true })
  const body = page.getByRole('textbox', { name: 'Article body' })
  await expect(title).toHaveValue('')
  await expect(body.locator('h2')).toHaveText('Unpublished draft')
  await expect(body.locator('strong')).toHaveText('draft')
  await expect(body.locator('li')).toHaveText('exact spacing')
  await body.fill('')
  await body.pressSequentially('## Heading')
  await body.press('Enter')
  await body.pressSequentially('**bold**')
  await body.press('Enter')
  await body.pressSequentially('- item')
  await expect(body.locator('h2')).toHaveText('Heading')
  await expect(body.locator('strong')).toHaveText('bold')
  await expect(body.locator('li')).toHaveText('item')
  await page.reload()
  await expect(body.locator('h2')).toHaveText('Heading')
  await expect(body.locator('strong')).toHaveText('bold')
  await expect(body.locator('li')).toHaveText('item')
  const longTitle =
    'A long title that wraps across several lines on a narrow screen'
  await title.fill(longTitle)
  const longBody = 'A long paragraph in the rich text editor. '
    .repeat(80)
    .trim()
  await body.fill(longBody)
  await body.press('ControlOrMeta+Alt+0')
  await expect(body.locator('h2')).toHaveCount(0)
  await page.setViewportSize({ width: 390, height: 844 })
  await expect
    .poll(() =>
      page.evaluate(() => {
        return (
          [
            ...document.querySelectorAll('textarea, [contenteditable="true"]')
          ].every(input => input.scrollHeight <= input.clientHeight + 1) &&
          document.documentElement.scrollWidth === innerWidth
        )
      })
    )
    .toBe(true)
  await page.reload()
  await expect(title).toHaveValue(longTitle)
  await expect(body).toHaveJSProperty('textContent', longBody)
  let submitted: unknown
  await page.route('**/api/documents', async route => {
    submitted = route.request().postDataJSON()
    await route.fulfill({ status: 409, json: { error: 'Revision conflict' } })
  })
  await page.getByRole('button', { name: 'Publish', exact: true }).click()
  await expect(page.getByRole('status')).toHaveText('Revision conflict')
  expect(submitted).toMatchObject({
    rkey: restored.rkey,
    cid: restored.cid,
    description: restored.description,
    title: longTitle
  })
  expect((submitted as { markdown: string }).markdown.trim()).toBe(longBody)
  await expect(body).toBeEditable()
  await page.reload()
  await expect(body).toHaveJSProperty('textContent', longBody)
  await page.getByRole('link', { name: 'Back to articles' }).click()
  await expect(page).toHaveURL(`${origin}/admin`)
  await expect(
    page.getByRole('heading', { name: 'Articles', exact: true })
  ).toBeVisible()
  expect(dialogs).toEqual([])
})

test('long drafts restore and only unsaved edits require a leave confirmation', async ({
  page,
  context
}) => {
  await context.addCookies([
    {
      name: 'yak-session',
      value: await sealData(
        { did: env.YAK_OWNER_DID, mode: 'dev' },
        { password: env.YAK_SESSION_SECRET!, ttl: 86400 }
      ),
      url: origin,
      httpOnly: true,
      sameSite: 'Lax'
    }
  ])
  const key = `yak:draft:${env.YAK_OWNER_DID}:new`
  await page.goto(`${origin}/admin`)
  await page.evaluate(key => {
    localStorage.setItem(
      key,
      JSON.stringify({
        title: '  Unfinished title  ',
        description: '',
        markdown: 'Long draft survives ' + 'word '.repeat(180_001)
      })
    )
  }, key)
  await page.goto(`${origin}/admin/edit`)
  const title = page.getByRole('textbox', { name: 'Title', exact: true })
  const body = page.getByRole('textbox', { name: 'Article body' })
  await expect(title).toHaveValue('  Unfinished title  ')
  await expect(body).toContainText('Long draft survives')
  await page.clock.install()
  await page.clock.pauseAt(new Date(Date.now() + 1000))
  await page.evaluate(() => {
    const setItem = Storage.prototype.setItem
    document.documentElement.dataset.draftWrites = '0'
    Storage.prototype.setItem = function (...args) {
      if (args[0].startsWith('yak:draft:')) {
        const data = document.documentElement.dataset
        data.draftWrites = String(Number(data.draftWrites) + 1)
      }
      return setItem.apply(this, args)
    }
  })
  await body.fill('Short draft')
  await page.clock.runFor(200)
  await title.fill('Latest title')
  await page.clock.runFor(299)
  await expect(page.locator('html')).toHaveAttribute('data-draft-writes', '0')
  await page.clock.runFor(1)
  await expect(page.locator('html')).toHaveAttribute('data-draft-writes', '1')
  expect(
    await page.evaluate(key => JSON.parse(localStorage.getItem(key)!), key)
  ).toMatchObject({ title: 'Latest title', markdown: 'Short draft' })
  await title.fill('Hidden page draft')
  await page.evaluate(() => {
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      value: 'hidden'
    })
    document.dispatchEvent(new Event('visibilitychange'))
    Reflect.deleteProperty(document, 'visibilityState')
  })
  expect(
    await page.evaluate(
      key => JSON.parse(localStorage.getItem(key)!).title,
      key
    )
  ).toBe('Hidden page draft')
  await page.clock.runFor(300)
  await expect(page.locator('html')).toHaveAttribute('data-draft-writes', '2')
  await page.evaluate(() => {
    const setItem = Storage.prototype.setItem
    Storage.prototype.setItem = function (...args) {
      if (args[1].includes('Cannot save'))
        throw new DOMException('Storage full', 'QuotaExceededError')
      return setItem.apply(this, args)
    }
  })
  await title.fill('Cannot save')
  await page.clock.runFor(300)
  await expect(page.getByRole('status')).toContainText('Unable to save')
  expect(
    await page.evaluate(() =>
      window.dispatchEvent(new Event('beforeunload', { cancelable: true }))
    )
  ).toBe(false)
  await title.fill('Saved again')
  expect(
    await page.evaluate(() =>
      window.dispatchEvent(new Event('beforeunload', { cancelable: true }))
    )
  ).toBe(true)
  await page.reload()
  await expect(title).toHaveValue('Saved again')
  await expect(body).toHaveText('Short draft')
  await title.fill('Saved on navigation')
  await page.getByRole('link', { name: 'Back to articles' }).click()
  await expect(page).toHaveURL(`${origin}/admin`)
  expect(
    await page.evaluate(
      key => JSON.parse(localStorage.getItem(key)!).title,
      key
    )
  ).toBe('Saved on navigation')
  await page.goto(`${origin}/admin/edit`)
  await expect(title).toHaveValue('Saved on navigation')
  await page.route('**/api/documents', route =>
    route.fulfill({
      json: { rkey: env.YAK_SEED_RKEY, cid: 'published-revision' }
    })
  )
  await title.fill('Publish before the save timer runs')
  await page.getByRole('button', { name: 'Publish', exact: true }).click()
  await page.waitForURL(`${origin}/admin/edit?rkey=${env.YAK_SEED_RKEY}`)
  await page.clock.runFor(1000)
  expect(await page.evaluate(key => localStorage.getItem(key), key)).toBeNull()
})

test('public OAuth, refresh, editor, stacked notes, logout and expired session', async ({
  page,
  context
}) => {
  const cookies = () => context.cookies(origin)
  const setCookie = (name: string, value: string) =>
    context.addCookies([
      { name, value, url: origin, httpOnly: true, sameSite: 'Lax' }
    ])
  await page.goto(origin)
  await expect(page).toHaveURL(`${origin}/`)
  await expect(page.getByRole('heading', { name: 'All notes' })).toBeVisible()
  await expect(
    page.getByRole('link', { name: '~ls', exact: true })
  ).toHaveCount(0)
  await expect(
    page.getByRole('link', { name: 'Hello from Yak', exact: true })
  ).toHaveAttribute('href', `/r/${env.YAK_SEED_RKEY}`)
  await expect(
    page.getByRole('banner').getByRole('link', { name: 'Write', exact: true })
  ).toHaveCount(0)
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
  await expect(
    page.getByRole('heading', { name: 'Articles', exact: true })
  ).toBeVisible()
  const loggedIn = await cookies()
  await expect(
    page.getByRole('banner').getByRole('link', { name: 'Write', exact: true })
  ).toHaveAttribute('href', '/admin')
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
  await page.getByRole('link', { name: 'Write a new article' }).click()
  const body = page.getByRole('textbox', { name: 'Article body' })
  await expect(body).toBeVisible()
  await expect(page.getByLabel(/Path|slug/i)).toHaveCount(0)
  await expect(page.getByLabel('Description', { exact: true })).toHaveCount(0)
  await expect(page.locator('main button')).toHaveCount(1)
  await expect(page.locator('main textarea')).toHaveCount(1)
  await expect(body).toHaveClass(/tiptap/)
  const publishButton = page.getByRole('button', {
    name: 'Publish',
    exact: true
  })
  const title = page.getByLabel('Title', { exact: true })
  await expect(publishButton).toBeDisabled()
  await title.fill('Browser integration')
  await expect(publishButton).toBeDisabled()
  await body.fill('   ')
  await expect(publishButton).toBeDisabled()
  await body.fill('')
  await body.pressSequentially('## ')
  await expect(body.locator('h2')).toBeVisible()
  await expect(publishButton).toBeDisabled()
  await body.pressSequentially('A real heading')
  await expect(publishButton).toBeEnabled()
  await title.fill('   ')
  await expect(publishButton).toBeDisabled()
  await title.fill('Browser integration')
  await expect(publishButton).toBeEnabled()
  await body.fill('')
  await expect(publishButton).toBeDisabled()
  const markdown = [
    'Browser draft survives a reload. #React #中文 #react',
    '',
    '## Keep **Markdown** and _syntax_',
    '',
    '* one',
    '* two  ',
    '  continued',
    '',
    '```ts',
    'const raw = "**not bold**"',
    '```',
    '',
    `Read [Hello from Yak](${origin}/r/${env.YAK_SEED_RKEY}).`,
    ''
  ].join('\n')
  await page.getByRole('link', { name: 'Back to articles' }).click()
  await expect(page).toHaveURL(`${origin}/admin`)
  await page.evaluate(
    ({ owner, markdown }) => {
      localStorage.setItem(
        `yak:draft:${owner}:new`,
        JSON.stringify({
          title: 'Browser integration',
          description: '',
          markdown
        })
      )
    },
    { owner: env.YAK_OWNER_DID!, markdown }
  )
  await page.goto(`${origin}/admin/edit`)
  await expect(body.locator('h2')).toHaveText('Keep Markdown and syntax')
  await expect(body.locator('strong')).toHaveText('Markdown')
  await expect(body.locator('em')).toHaveText('syntax')
  await expect(body.locator('li')).toHaveCount(2)
  await expect(body.locator('pre code')).toHaveText(
    'const raw = "**not bold**"'
  )
  await expect(
    body.getByRole('link', { name: 'Hello from Yak' })
  ).toHaveAttribute('href', `${origin}/r/${env.YAK_SEED_RKEY}`)
  await body.press('ControlOrMeta+End')
  await body.press('Enter')
  await body.pressSequentially('Edited in Tiptap.')
  await expect
    .poll(() =>
      page.evaluate(
        owner => localStorage.getItem(`yak:draft:${owner}:new`),
        env.YAK_OWNER_DID!
      )
    )
    .toContain('Edited in Tiptap.')
  const saved = await page.evaluate(
    owner =>
      JSON.parse(localStorage.getItem(`yak:draft:${owner}:new`)!)
        .markdown as string,
    env.YAK_OWNER_DID!
  )
  expect(saved).toContain('## Keep **Markdown** and *syntax*')
  expect(saved).toContain(
    `Read [Hello from Yak](${origin}/r/${env.YAK_SEED_RKEY}).`
  )
  expect(saved).toContain('```ts\nconst raw = "**not bold**"\n```')
  expect(saved).toContain('Edited in Tiptap.')
  await expect(page.getByLabel(/Tags/i)).toHaveCount(0)
  await page.reload()
  await expect(body).toBeVisible()
  await expect(body.locator('h2')).toHaveText('Keep Markdown and syntax')
  await expect(body).toContainText('Edited in Tiptap.')
  await expect(page.getByLabel('Title', { exact: true })).toHaveValue(
    'Browser integration'
  )
  await page.getByRole('button', { name: 'Publish', exact: true }).click()
  await page.waitForURL(`${origin}/admin/edit?rkey=*`)
  await expect(body.locator('h2')).toHaveText('Keep Markdown and syntax')
  await page.reload()
  await expect(body.locator('strong')).toHaveText('Markdown')
  await expect(body.locator('em')).toHaveText('syntax')
  await expect(body.locator('li')).toHaveCount(2)
  await expect(body).toContainText('Edited in Tiptap.')
  expect(
    await page.evaluate(() =>
      Object.keys(localStorage).filter(key => key.startsWith('yak:draft:'))
    )
  ).toEqual([])
  const rkey = new URL(page.url()).searchParams.get('rkey')
  expect(rkey).not.toBeNull()
  expect(isTid(rkey!)).toBe(true)
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
  await page.goto(`${origin}/r/${rkey}`)
  await expect(page).toHaveURL(`${origin}/r/${rkey}`)
  await expect(
    page.getByText('Browser draft survives a reload.', { exact: false })
  ).toBeVisible()
  await page.getByRole('link', { name: 'Hello from Yak', exact: true }).click()
  await expect(page).toHaveURL(`${origin}/r/${rkey}?note=${env.YAK_SEED_RKEY}`)
  await expect(
    page.getByText('Linked to this note', { exact: true })
  ).toBeVisible()
  await page.goBack()
  await expect(page).toHaveURL(`${origin}/r/${rkey}`)
  await page.goForward()
  await expect(page).toHaveURL(`${origin}/r/${rkey}?note=${env.YAK_SEED_RKEY}`)
  await page.goto(`${origin}/admin`)
  await expect(
    page.getByRole('main').getByRole('button', { name: 'Log out' })
  ).toHaveCount(0)
  await page
    .getByRole('banner')
    .getByRole('button', { name: 'Log out' })
    .click()
  await expect(
    page.getByRole('banner').getByRole('link', { name: 'Write', exact: true })
  ).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Log out' })).toHaveCount(0)
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
