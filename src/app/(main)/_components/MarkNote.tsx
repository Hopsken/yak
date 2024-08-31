import Markdoc, { Tag, RenderableTreeNodes } from '@markdoc/markdoc'
import React, { ReactNode } from 'react'
import { NoteEntry } from '@/type'
import { HyperLink } from './HyperLink'
import { generateSlug } from '@/utils/generate-slug'

function parseBracketLink(content: string): RenderableTreeNodes {
  // shortcut
  if (!content.includes('[[')) {
    return content
  }

  const result = []
  const regex = /\[\[([^\]]+)\]\]/g
  let lastIndex = 0
  let match

  while ((match = regex.exec(content)) !== null) {
    // Push the text before the match
    if (match.index > lastIndex) {
      result.push(content.slice(lastIndex, match.index))
    }

    // Push the Node object
    const title = match[1]
    result.push(new Tag('BracketLink', { slug: generateSlug(title) }, [title]))

    // Update lastIndex
    lastIndex = regex.lastIndex
  }

  // Push any remaining text after the last match
  if (lastIndex < content.length) {
    result.push(content.slice(lastIndex))
  }

  return result
}

export function MarkNote({ slug, entry }: { slug: string; entry: NoteEntry }) {
  const { node } = entry.content
  const errors = Markdoc.validate(node)

  if (errors.length) {
    console.error(errors)
    throw new Error('Invalid content')
  }

  const renderable = Markdoc.transform(node, {
    nodes: {
      link: { ...Markdoc.nodes.link, render: 'Link' },
      text: {
        ...Markdoc.nodes.text,
        transform(node) {
          const content = node.attributes.content
          if (typeof content === 'string') {
            return parseBracketLink(content)
          }
          return content
        }
      }
    },
    tags: {
      BracketLink: {
        render: 'BracketLink',
        children: ['text'],
        attributes: {
          slug: { type: String }
        }
      }
    }
  })

  return (
    <>
      {/*  @ts-expect-error */}
      {Markdoc.renderers.react(renderable, React, {
        components: {
          Link: ({ href, children }: { href: string; children: ReactNode }) => {
            return (
              <HyperLink from={slug} href={href}>
                {children}
              </HyperLink>
            )
          },
          BracketLink: ({
            children,
            slug: targetSlug
          }: {
            slug: string
            children: ReactNode
          }) => {
            return (
              <HyperLink from={slug} href={`/notes/${targetSlug}`}>
                {children}
              </HyperLink>
            )
          }
        }
      })}
    </>
  )
}
