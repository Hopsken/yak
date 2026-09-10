import { readFile } from 'node:fs/promises'
import { parseEnv } from 'node:util'
import assert from 'node:assert/strict'
import { isTid } from '@atcute/lexicons/syntax'

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
const input = {
  title: 'Integration article',
  description: 'PDS round trip',
  markdown: `A **real** article. #React\n\n[Hello](/r/${env.YAK_SEED_RKEY})`
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
assert.ok(isTid(created.data.rkey), 'New document keys must be TIDs')
const repeated = await write(input)
assert.equal(repeated.status, 200, JSON.stringify(repeated.data))
assert.ok(isTid(repeated.data.rkey), 'Repeated create keys must be TIDs')
assert.notEqual(
  repeated.data.rkey,
  created.data.rkey,
  'Same-title creates must receive distinct keys'
)
const missingKey = await write({ ...input, cid: created.data.cid })
assert.equal(missingKey.status, 400)
assert.match(missingKey.data.error, /supplied together/)
const saved = await fetch(
  `${env.YAK_PDS_URL}/xrpc/com.atproto.repo.getRecord?repo=${env.YAK_OWNER_DID}&collection=site.standard.document&rkey=${created.data.rkey}`
).then(r => r.json())
assert.equal(saved.value.content.$type, 'at.markpub.markdown')
assert.equal(saved.value.content.flavor, 'commonmark')
assert.equal(saved.value.content.text.markdown, input.markdown)
assert.deepEqual(saved.value.tags, ['React'])
assert.equal(saved.value.path, `/r/${created.data.rkey}`)
const repeatedSaved = await fetch(
  `${env.YAK_PDS_URL}/xrpc/com.atproto.repo.getRecord?repo=${env.YAK_OWNER_DID}&collection=site.standard.document&rkey=${repeated.data.rkey}`
).then(r => r.json())
assert.equal(repeatedSaved.value.path, `/r/${repeated.data.rkey}`)
assert.notEqual(repeatedSaved.value.path, saved.value.path)
assert.ok(
  isTid(saved.value.site.split('/').at(-1)),
  'Publication keys must be TIDs'
)
const html = await fetch(`${origin}/r/${created.data.rkey}`).then(r => r.text())
assert.match(html, /A <strong>real<\/strong> article/)
assert.match(html, /rel="site.standard.document"/)
assert.match(
  await fetch(`${origin}/r/${env.YAK_SEED_RKEY}`).then(r => r.text()),
  /Integration article/
)
assert.match(
  await fetch(`${origin}/topics/react`).then(r => r.text()),
  /Integration article/
)
const changed = {
  ...input,
  rkey: created.data.rkey,
  cid: created.data.cid,
  markdown: 'Updated article without links.'
}
const updated = await write(changed)
assert.equal(updated.status, 200, JSON.stringify(updated.data))
assert.equal(updated.data.rkey, created.data.rkey)
const updatedSaved = await fetch(
  `${env.YAK_PDS_URL}/xrpc/com.atproto.repo.getRecord?repo=${env.YAK_OWNER_DID}&collection=site.standard.document&rkey=${created.data.rkey}`
).then(r => r.json())
assert.equal(updatedSaved.value.path, saved.value.path)
const stale = await write(changed)
assert.equal(stale.status, 400)
assert.match(stale.data.error, /changed/)
const large = await write({
  ...changed,
  cid: updated.data.cid,
  markdown: '中'.repeat(16_667)
})
assert.equal(large.status, 400, JSON.stringify(large.data))
assert.match(large.data.error, /50,000-byte limit/)
const unchangedRecord = await fetch(
  `${env.YAK_PDS_URL}/xrpc/com.atproto.repo.getRecord?repo=${env.YAK_OWNER_DID}&collection=site.standard.document&rkey=${created.data.rkey}`
).then(r => r.json())
assert.equal(unchangedRecord.cid, updated.data.cid)
assert.equal(unchangedRecord.value.content.text.markdown, changed.markdown)
assert.equal(unchangedRecord.value.content.text.textBlob, undefined)
assert.equal(
  await fetch(`${origin}/.well-known/site.standard.publication`).then(r =>
    r.text()
  ),
  saved.value.site
)
assert.equal(
  (await fetch(`${origin}/r/missing-root?note=${env.YAK_SEED_RKEY}`)).status,
  404
)
assert.equal((await fetch(`${origin}/notes/${created.data.rkey}`)).status, 404)
const forged = await fetch(`${origin}/api/documents`, {
  method: 'POST',
  headers: { ...headers, Cookie: `yak-session=${env.YAK_OWNER_DID}` },
  body: JSON.stringify(input)
})
assert.equal(forged.status, 400)
console.log(
  'PASS: keyless local dev login, origin checks, forged/absent sessions, distinct TID creates, /r SSR, topics/backlinks, CID/path preservation, stale CID rejection, oversized body rejection, publication verification, no /notes compatibility'
)
