import Markdown from 'react-markdown'
import { HyperLink } from './HyperLink'
import type { Note } from '@/lib/documents'
import { settings } from '@/lib/atproto'

export function MarkNote({ slug, entry }: { slug: string; entry: Note }) {
  const origin = settings().origin
  return (
    <Markdown
      components={{
        a: ({ href = '', children }) => {
          let target = href
          try {
            const url = new URL(href, origin + '/r/' + encodeURIComponent(slug))
            if (url.origin === origin)
              target = url.pathname + url.search + url.hash
          } catch {
            /* react-markdown filters unsafe URLs. */
          }
          return (
            <HyperLink from={slug} href={target}>
              {children}
            </HyperLink>
          )
        }
      }}
    >
      {entry.markdown}
    </Markdown>
  )
}
