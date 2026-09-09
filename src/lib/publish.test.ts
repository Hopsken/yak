import { Client } from '@atcute/client'
import { describe, expect, it } from 'vitest'
import { publish } from './publish'

const config = {
  did: 'did:plc:abcdefghijklmnopqrstuvwx' as const,
  origin: 'https://yak.test',
  rkey: 'yak',
  publication:
    'at://did:plc:abcdefghijklmnopqrstuvwx/site.standard.publication/yak'
}
const draft = {
  title: 'Test article',
  slug: 'hello-world',
  tags: [],
  markdown: '**Hello**'
}

describe('portable publishing', () => {
  it.each([
    ['hello-world', '869ef3b8d6da8018914347ded4e1b135'],
    ['中文笔记', '2b0d31a3fb2274a2cb73b58052e90dd0']
  ])('preserves the existing record key for %s', async (slug, rkey) => {
    let written: Record<string, unknown> | undefined
    const client = new Client({
      handler: async (path, init) => {
        if (path.startsWith('/xrpc/com.atproto.repo.listRecords'))
          return Response.json({ records: [] })
        if (path.startsWith('/xrpc/com.atproto.repo.getRecord'))
          return Response.json({ value: { url: config.origin } })
        if (path === '/xrpc/com.atproto.repo.putRecord') {
          written = JSON.parse(init.body as string)
          return Response.json({
            uri: `at://${config.did}/site.standard.document/${rkey}`,
            cid: 'saved-cid'
          })
        }
        throw new Error(`Unexpected request: ${path}`)
      }
    })
    const result = await publish(client, { ...draft, slug }, config)
    expect(result.rkey).toBe(rkey)
    expect(written).toMatchObject({
      repo: config.did,
      rkey,
      swapRecord: null,
      record: {
        site: config.publication,
        path: `/notes/${encodeURIComponent(slug)}`,
        textContent: 'Hello',
        content: {
          $type: 'at.markpub.markdown',
          flavor: 'commonmark',
          text: { markdown: '**Hello**' }
        }
      }
    })
  })

  it('rejects a stale CID before writing through the browser client', async () => {
    const calls: string[] = []
    const client = new Client({
      handler: async path => {
        calls.push(path)
        return Response.json({ cid: 'newer-cid', value: {} })
      }
    })
    await expect(
      publish(client, { ...draft, rkey: 'existing', cid: 'stale-cid' }, config)
    ).rejects.toThrow('This article changed')
    expect(calls).toHaveLength(1)
    expect(calls[0]).toContain('com.atproto.repo.getRecord')
  })
})
