import { describe, it, expect } from 'vitest'
import { buildGraph, markdownInfo, type Note } from './documents'

function note(slug: string, markdown = '', tags: string[] = []): Note {
  return {
    slug,
    title: slug,
    uri: `at://did:plc:test/site.standard.document/${slug}`,
    cid: 'cid',
    rkey: slug,
    description: '',
    tags,
    markdown,
    publishedAt: '2026-01-01T00:00:00Z',
    supported: true,
    backlinks: []
  }
}
describe('derived links', () => {
  it('extracts Unicode hashtags in order and deduplicates topic keys', () => {
    expect(
      markdownInfo(
        '#React #中文，#web-dev (#under_score) #react #Ｒｅａｃｔ\n\n**#café**'
      ).tags
    ).toEqual(['React', '中文', 'web-dev', 'under_score', 'café'])
  })
  it('excludes heading markers, code, image metadata and URL fragments', () => {
    expect(
      markdownInfo(
        [
          '# Heading',
          '## Another heading',
          '`#inline`',
          '```js\n#code\n```',
          '    #indented',
          '[link](https://example.test/#fragment)',
          '[reference][ref]\n\n[ref]: /#definition',
          '![#alt](/#image)',
          'https://example.test/#plain word#embedded ##invalid',
          '> Visible #yes'
        ].join('\n\n')
      ).tags
    ).toEqual(['yes'])
  })
  it('indexes links once, excludes code and external sites, supports references', () => {
    const graph = buildGraph(
      [
        note(
          'a',
          '[B](/notes/b) [again][b]\n\n[b]: /notes/b\n\n`[no](/notes/c)`\n\n[external](https://elsewhere.test/notes/c)'
        ),
        note('b'),
        note('c')
      ],
      'https://yak.test'
    )
    expect(graph.bySlug.get('b')?.backlinks).toEqual([
      { title: 'a', slug: 'a' }
    ])
    expect(graph.bySlug.get('c')?.backlinks).toEqual([])
  })
  it('builds virtual topics and removes edges after edits or deletion', () => {
    const graph = buildGraph(
      [note('a', '[topic](/topics/react)', ['React', 'react'])],
      'https://yak.test'
    )
    expect(graph.topics.get('react')?.backlinks).toHaveLength(1)
    expect(buildGraph([note('a')], 'https://yak.test').topics.size).toBe(0)
    expect(buildGraph([], 'https://yak.test').bySlug.size).toBe(0)
  })
  it('exports unformatted text', () => {
    expect(markdownInfo('# Hello\n\n**World**').text).toBe('Hello\n\nWorld')
  })
})
