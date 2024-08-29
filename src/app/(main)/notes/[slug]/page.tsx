import { getNoteBySlug } from '@/lib/keystatic/reader'
import { MarkNote } from '../../_components/MarkNote'
import { ScrollContainer, StickyNote } from '@/components/StackedNotes'

export default async function NotePage({
  params,
  searchParams
}: {
  params: { slug: string }
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  const entries = await Promise.all(
    [params.slug].concat(searchParams.note || []).map(async slug => {
      const entry = await getNoteBySlug(slug)
      if (!entry) return null
      return {
        slug,
        ...entry
      }
    })
  )

  const [root] = entries

  if (!root || !entries.length) {
    throw new Error('404')
  }

  return (
    <ScrollContainer panes={entries.length}>
      {entries.map(
        (entry, index) =>
          entry && (
            <StickyNote key={entry.title} title={entry.title} index={index}>
              <MarkNote root={root.slug} slug={entry.slug} entry={entry} />
            </StickyNote>
          )
      )}
    </ScrollContainer>
  )
}
