import { parseEnv } from 'node:util'
import { readFileSync } from 'node:fs'
import { test, expect } from '@playwright/test'

const env = parseEnv(readFileSync('.env.test-network', 'utf8'))
const origin = env.YAK_ORIGIN!
if (new URL(origin).hostname !== '127.0.0.1')
  throw new Error('Browser tests require the disposable loopback app')

test('stack paths preserve order, branching and history without query notes', async ({
  page
}) => {
  // Keep all three panes in view so scrolling does not hide the branch link.
  await page.setViewportSize({ width: 2200, height: 900 })
  const login = await page.request.post(`${origin}/api/auth/dev`, {
    headers: { Origin: origin }
  })
  expect(login.ok()).toBe(true)
  async function create(title: string, markdown: string) {
    const response = await page.request.post(`${origin}/api/documents`, {
      headers: { Origin: origin },
      data: { title, markdown, description: '' }
    })
    expect(response.ok()).toBe(true)
    return (await response.json()).rkey as string
  }
  const d = await create('Stack D', 'Fourth note.')
  const c = await create('Stack C', 'Third note.')
  const b = await create('Stack B', `[Open C](/r/${c})\n\n[Open D](/r/${d})`)
  const a = await create('Stack A', `[Open B](/r/${b})`)
  const headings = page.getByRole('heading', { level: 1 })

  await page.goto(`${origin}/r/${a}?source=test`)
  await page.getByRole('link', { name: 'Open B', exact: true }).click()
  await expect(page).toHaveURL(`${origin}/r/${a}/${b}?source=test`)
  await page.getByRole('link', { name: 'Open C', exact: true }).click()
  await expect(page).toHaveURL(`${origin}/r/${a}/${b}/${c}?source=test`)
  await expect(headings).toHaveText(['Stack A', 'Stack B', 'Stack C'])
  await page.reload()
  await expect(headings).toHaveText(['Stack A', 'Stack B', 'Stack C'])
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    'href',
    `${origin}/r/${a}`
  )
  await page.getByRole('link', { name: 'Open B', exact: true }).click()
  await expect(page).toHaveURL(`${origin}/r/${a}/${b}/${c}?source=test`)
  await page.getByRole('link', { name: 'Open D', exact: true }).click()
  await expect(page).toHaveURL(`${origin}/r/${a}/${b}/${d}?source=test`)
  await expect(headings).toHaveText(['Stack A', 'Stack B', 'Stack D'])
  await page.goBack()
  await expect(headings).toHaveText(['Stack A', 'Stack B', 'Stack C'])
  await page.goForward()
  await expect(headings).toHaveText(['Stack A', 'Stack B', 'Stack D'])

  await page.goto(`${origin}/r/${a}?note=${c}&note=${b}`)
  await expect(page).toHaveURL(`${origin}/r/${a}?note=${c}&note=${b}`)
  await expect(headings).toHaveText(['Stack A'])

  // Reverse the leaf order to catch implementations that sort the keys.
  await page.goto(`${origin}/r/${a}/${c}/${b}`)
  await expect(headings).toHaveText(['Stack A', 'Stack C', 'Stack B'])
  await page.goto(`${origin}/r/${a}/${b}/${a}/missing-note/${d}`)
  await expect(headings).toHaveText(['Stack A', 'Stack B', 'Stack D'])
  const missing = await page.goto(`${origin}/r/missing-root/${b}`)
  expect(missing?.status()).toBe(404)

  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto(`${origin}/r/${a}`)
  await page.getByRole('link', { name: 'Open B', exact: true }).click()
  await expect(page).toHaveURL(`${origin}/r/${b}`)
  await expect(headings).toHaveText(['Stack B'])
})
