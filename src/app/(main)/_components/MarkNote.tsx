import Markdoc from '@markdoc/markdoc'
import React, { ReactNode } from 'react'
import { NoteEntry } from '@/type'
import { HyperLink } from './HyperLink'

export function MarkNote({ entry }: { entry: NoteEntry }) {
  const { node } = entry.content
  const errors = Markdoc.validate(node)

  if (errors.length) {
    console.error(errors)
    throw new Error('Invalid content')
  }

  const renderable = Markdoc.transform(node, {
    nodes: {
      link: { ...Markdoc.nodes.link, render: 'Link' }
    }
  })
  return (
    <>
      {/*  @ts-expect-error */}
      {Markdoc.renderers.react(renderable, React, {
        components: {
          Link: ({ href, children }: { href: string; children: ReactNode }) => {
            return <HyperLink href={href}>{children}</HyperLink>
          }
        }
      })}
    </>
  )
}
