import Markdoc, { Tag, RenderableTreeNodes } from '@markdoc/markdoc'
import React, { ReactNode } from 'react'
import { ContentNote } from '@/type'
import { HyperLink } from './HyperLink'
import { lower } from '@/utils/lower'

function parseBracketLink(
  content: string,
  slugByTitle: Record<string, string>
): RenderableTreeNodes {
  // shortcut
  if (!content.includes('[[') && !content.includes('#')) {
    return content
  }

  const result = []
  const regex = /(?:\[\[([^\]]+)\]\]|#(\w+))/g
  let lastIndex = 0
  let match

  while ((match = regex.exec(content)) !== null) {
    // Push the text before the match
    if (match.index > lastIndex) {
      result.push(content.slice(lastIndex, match.index))
    }

    // Push the Node object
    const title = lower(match[1] || match[2])
    const slug = slugByTitle[title]

    if (!slug) {
      console.error(`No slug found for title: ${title}`)
      continue
    }

    result.push(
      new Tag('BracketLink', { slug }, [
        // if #hashtag then render as is, if [[bracket link]] then render as a link
        // #hashtag => <BracketLink slug="hashtag">#hashtag</BracketLink>
        // [[bracket link]] => <BracketLink slug="bracket-link">bracket link</BracketLink>
        match[2] ? match[0] : match[1]
      ])
    )

    // Update lastIndex
    lastIndex = regex.lastIndex
  }

  // Push any remaining text after the last match
  if (lastIndex < content.length) {
    result.push(content.slice(lastIndex))
  }

  return result
}

export function MarkNote({
  slug,
  entry,
  slugByTitle
}: {
  slug: string
  entry: ContentNote
  slugByTitle: Record<string, string>
}) {
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
            return parseBracketLink(content, slugByTitle)
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
