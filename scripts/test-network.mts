import { readFile } from 'node:fs/promises'
import { parseEnv } from 'node:util'
import assert from 'node:assert/strict'

const env = parseEnv(await readFile('.env.test-network', 'utf8'))
const origin = env.YAK_ORIGIN!
assert.equal(
  new URL(origin).hostname,
  '127.0.0.1',
  'Integration tests must use a local app'
)
assert.equal(
  new URL(env.YAK_PDS_URL!).hostname,
  '127.0.0.1',
  'Integration tests must use an isolated PDS'
)
const headers = { Origin: origin, 'Content-Type': 'application/json' }
assert.equal(
  (await fetch(`${origin}/api/auth/callback?code=invalid&state=invalid`))
    .status,
  403
)
const unauthorized = await fetch(`${origin}/api/documents`, {
  method: 'POST',
  headers,
  body: '{}'
})
assert.equal(unauthorized.status, 400)
assert.match(await unauthorized.text(), /Owner login required/)
const badOrigin = await fetch(`${origin}/api/auth/dev`, {
  method: 'POST',
  headers: { Origin: 'https://evil.invalid' }
})
assert.equal(badOrigin.status, 400)
const login = await fetch(`${origin}/api/auth/dev`, {
  method: 'POST',
  headers: { Origin: origin },
  redirect: 'manual'
})
assert.equal(login.status, 303)
assert.equal(login.headers.get('location'), `${origin}/admin`)
const cookie = login.headers.get('set-cookie')!.split(';')[0]!
assert.match(cookie, /^yak-session=/)
const slug = `integration-${Date.now()}`
const input = {
  title: 'Integration article',
  slug,
  description: 'PDS round trip',
  tags: ['React'],
  markdown: 'A **real** article.\n\n[Hello](/notes/hello)'
}
async function write(data: unknown) {
  const response = await fetch(`${origin}/api/documents`, {
    method: 'POST',
    headers: { ...headers, Cookie: cookie },
    body: JSON.stringify(data)
  })
  return { status: response.status, data: await response.json() }
}
const created = await write(input)
assert.equal(created.status, 200, JSON.stringify(created.data))
const missingKey = await write({ ...input, cid: created.data.cid })
assert.equal(missingKey.status, 400)
assert.match(missingKey.data.error, /supplied together/)
const saved = await fetch(
  `${env.YAK_PDS_URL}/xrpc/com.atproto.repo.getRecord?repo=${env.YAK_OWNER_DID}&collection=site.standard.document&rkey=${created.data.rkey}`
).then(r => r.json())
assert.equal(saved.value.content.$type, 'at.markpub.markdown')
assert.equal(saved.value.content.flavor, 'commonmark')
assert.equal(saved.value.content.text.markdown, input.markdown)
assert.equal(saved.value.path, `/notes/${slug}`)
const html = await fetch(`${origin}/notes/${slug}`).then(r => r.text())
assert.match(html, /A <strong>real<\/strong> article/)
assert.match(html, /rel="site.standard.document"/)
assert.match(
  await fetch(`${origin}/notes/hello`).then(r => r.text()),
  /Integration article/
)
assert.match(
  await fetch(`${origin}/topics/react`).then(r => r.text()),
  /Integration article/
)
const duplicate = await write(input)
assert.equal(duplicate.status, 400)
const changed = {
  ...input,
  rkey: created.data.rkey,
  cid: created.data.cid,
  markdown: 'Updated article without links.',
  tags: []
}
const updated = await write(changed)
assert.equal(updated.status, 200, JSON.stringify(updated.data))
const stale = await write(changed)
assert.equal(stale.status, 400)
assert.match(stale.data.error, /changed/)
const renamed = await write({
  ...changed,
  cid: updated.data.cid,
  slug: 'changed-path'
})
assert.equal(renamed.status, 400)
const large = await write({
  ...changed,
  cid: updated.data.cid,
  markdown: 'Large body.\n\n'.repeat(6000)
})
assert.equal(large.status, 200, JSON.stringify(large.data))
const blobRecord = await fetch(
  `${env.YAK_PDS_URL}/xrpc/com.atproto.repo.getRecord?repo=${env.YAK_OWNER_DID}&collection=site.standard.document&rkey=${created.data.rkey}`
).then(r => r.json())
assert.ok(blobRecord.value.content.text.textBlob)
assert.match(
  await fetch(`${origin}/notes/${slug}`).then(r => r.text()),
  /Large body/
)
assert.equal(
  await fetch(`${origin}/.well-known/site.standard.publication`).then(r =>
    r.text()
  ),
  `at://${env.YAK_OWNER_DID}/site.standard.publication/yak`
)
assert.equal(
  (await fetch(`${origin}/notes/missing-root?note=hello`)).status,
  404
)
const forged = await fetch(`${origin}/api/documents`, {
  method: 'POST',
  headers: { ...headers, Cookie: `yak-session=${env.YAK_OWNER_DID}` },
  body: JSON.stringify(input)
})
assert.equal(forged.status, 400)
console.log(
  'PASS: keyless local dev login, origin checks, forged/absent sessions, create/read/SSR, topics/backlinks, duplicate/CID/path checks, large body blob, publication verification, root 404'
)
