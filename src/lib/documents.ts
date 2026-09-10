import { z } from 'zod'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import { visit } from 'unist-util-visit'
import { toString } from 'mdast-util-to-string'

export const documentInput = z.object({
  title: z.string().trim().min(1).max(500),
  description: z.string().max(3000).default(''),
  markdown: z
    .string()
    .refine(
      value => new TextEncoder().encode(value).byteLength <= 50_000,
      'Markdown exceeds the 50,000-byte limit'
    ),
  rkey: z
    .string()
    .regex(/^[a-zA-Z0-9._~:-]+$/)
    .optional(),
  cid: z.string().optional()
})

export type DocumentInput = z.infer<typeof documentInput>
export type NoteMeta = { title: string; slug: string }
export type Note = NoteMeta & {
  uri: string
  cid: string
  rkey: string
  description: string
  tags: string[]
  markdown: string
  publishedAt: string
  updatedAt?: string
  supported: boolean
  backlinks: NoteMeta[]
}

export function markdownInfo(markdown: string) {
  const tree = unified().use(remarkParse).parse(markdown)
  const links: string[] = []
  const tags = new Map<string, string>()
  visit(tree, 'text', node => {
    for (const match of node.value.matchAll(
      /(?:^|[\s([{"'，。！？；：、（【])#([\p{L}\p{N}_][\p{L}\p{M}\p{N}_-]*)/gu
    )) {
      const tag = match[1]
      if (!tags.has(topicKey(tag))) tags.set(topicKey(tag), tag)
    }
  })
  const definitions = new Map<string, string>()
  visit(tree, 'definition', node => {
    definitions.set(node.identifier, node.url)
  })
  visit(tree, 'link', node => {
    links.push(node.url)
  })
  visit(tree, 'linkReference', node => {
    const url = definitions.get(node.identifier)
    if (url) links.push(url)
  })
  return {
    links,
    tags: [...tags.values()],
    text: tree.children.map(node => toString(node)).join('\n\n')
  }
}

export const topicKey = (tag: string) =>
  tag.trim().normalize('NFKC').toLowerCase()

export function buildGraph(notes: Note[], origin: string) {
  const bySlug = new Map(
    notes.map(note => [note.slug, { ...note, backlinks: [] as NoteMeta[] }])
  )
  const topics = new Map<string, { title: string; backlinks: NoteMeta[] }>()
  for (const note of notes) {
    const meta = { title: note.title, slug: note.slug }
    for (const tag of new Set(note.tags.map(topicKey))) {
      const topic = topics.get(tag) ?? { title: tag, backlinks: [] }
      topic.backlinks.push(meta)
      topics.set(tag, topic)
    }
    const targets = new Set<string>()
    for (const href of markdownInfo(note.markdown).links) {
      try {
        const url = new URL(
          href,
          origin + '/r/' + encodeURIComponent(note.slug)
        )
        if (url.origin !== new URL(origin).origin) continue
        if (url.pathname.startsWith('/r/')) {
          targets.add(decodeURIComponent(url.pathname.slice(3)))
        } else if (url.pathname.startsWith('/topics/')) {
          const key = topicKey(decodeURIComponent(url.pathname.slice(8)))
          const topic = topics.get(key) ?? { title: key, backlinks: [] }
          if (!topic.backlinks.some(i => i.slug === note.slug))
            topic.backlinks.push(meta)
          topics.set(key, topic)
        }
      } catch {
        /* Invalid external links do not create graph edges. */
      }
    }
    for (const slug of targets) {
      if (slug !== note.slug) bySlug.get(slug)?.backlinks.push(meta)
    }
  }
  return { bySlug, topics }
}
