import { Client } from '@atcute/client'
import { describe, expect, it } from 'vitest'
import { publish } from './publish'
import { findPublication } from './publication'

const config = {
  did: 'did:plc:abcdefghijklmnopqrstuvwx' as const,
  origin: 'https://yak.test',
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
        if (path.includes('collection=site.standard.publication'))
          return Response.json({
            records: [
              { uri: config.publication, value: { url: config.origin } }
            ]
          })
        if (path.startsWith('/xrpc/com.atproto.repo.listRecords'))
          return Response.json({ records: [] })
        if (path.startsWith('/xrpc/com.atproto.repo.getRecord'))
          return Response.json({
            cid: 'previous-cid',
            value: {
              site: config.publication,
              path: `/notes/${encodeURIComponent(slug)}`,
              content: { $type: 'at.markpub.markdown' }
            }
          })
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
    const result = await publish(
      client,
      { ...draft, slug, rkey, cid: 'previous-cid' },
      config
    )
    expect(result.rkey).toBe(rkey)
    expect(written).toMatchObject({
      repo: config.did,
      rkey,
      swapRecord: 'previous-cid',
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

  it('rejects a stale CID before writing through the server client', async () => {
    const calls: string[] = []
    const client = new Client({
      handler: async path => {
        calls.push(path)
        if (path.includes('collection=site.standard.publication'))
          return Response.json({
            records: [
              { uri: config.publication, value: { url: config.origin } }
            ]
          })
        return Response.json({ cid: 'newer-cid', value: {} })
      }
    })
    await expect(
      publish(client, { ...draft, rkey: 'existing', cid: 'stale-cid' }, config)
    ).rejects.toThrow('This article changed')
    expect(calls).toHaveLength(2)
    expect(calls[1]).toContain('com.atproto.repo.getRecord')
  })

  it('creates a publication without specifying its key and uses the returned URI', async () => {
    const uri = `at://${config.did}/site.standard.publication/3mf6xbr3f2222`
    const writes: Record<string, unknown>[] = []
    let created = false
    const client = new Client({
      handler: async (path, init) => {
        if (path.includes('collection=site.standard.publication'))
          return Response.json({
            records: created ? [{ uri, value: { url: config.origin } }] : []
          })
        if (path.includes('com.atproto.repo.listRecords'))
          return Response.json({ records: [] })
        const input = JSON.parse(init.body as string)
        writes.push(input)
        expect(path).toContain('com.atproto.repo.createRecord')
        if (input.collection === 'site.standard.publication') {
          created = true
          return Response.json({ uri, cid: 'publication-cid' })
        }
        return Response.json({
          uri: `at://${config.did}/site.standard.document/3mf6xbr3f2223`,
          cid: 'document-cid'
        })
      }
    })
    const result = await publish(client, draft, config)
    expect(result.rkey).toBe('3mf6xbr3f2223')
    expect(writes).toHaveLength(2)
    expect(writes[0]).toMatchObject({
      collection: 'site.standard.publication',
      record: { url: config.origin }
    })
    expect(writes[0]).not.toHaveProperty('rkey')
    expect(writes[1]).not.toHaveProperty('rkey')
    expect(writes[1]).toMatchObject({
      collection: 'site.standard.document',
      record: { site: uri }
    })
  })

  it.each([false, true])(
    'reads all pages and rejects ambiguous matches (%s)',
    async duplicate => {
      let calls = 0
      const client = new Client({
        handler: async path => {
          calls++
          if (!path.includes('cursor=next'))
            return Response.json({
              records: [
                {
                  uri: config.publication,
                  value: {
                    url: duplicate ? config.origin : `${config.origin}/other`
                  }
                }
              ],
              cursor: 'next'
            })
          return Response.json({
            records: [
              {
                uri: `${config.publication}-second`,
                value: { url: `${config.origin}/` }
              }
            ]
          })
        }
      })
      if (duplicate)
        await expect(publish(client, draft, config)).rejects.toThrow(
          'Multiple publications'
        )
      else
        expect(await findPublication(client, config)).toBe(
          `${config.publication}-second`
        )
      expect(calls).toBe(2)
    }
  )

  it('does not create a publication after a failed lookup', async () => {
    let calls = 0
    const client = new Client({
      handler: async () => {
        calls++
        return Response.json({ error: 'Unavailable' }, { status: 503 })
      }
    })
    await expect(publish(client, draft, config)).rejects.toThrow()
    expect(calls).toBe(1)
  })
})
