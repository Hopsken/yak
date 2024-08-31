import { getNoteBySlug, reader } from '@/lib/keystatic/reader'
import { MarkNote } from '../../_components/MarkNote'
import { ScrollContainer, StickyNote } from '@/components/StackedNotes'
import { NotesProvider } from '../../_store'

export default async function NotePage({
  params,
  searchParams
}: {
  params: { slug: string }
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  const rootNote = params.slug
  const leafNotes = searchParams.note || []

  const entries = await Promise.all(
    [rootNote].concat(leafNotes).map(async slug => {
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
    <NotesProvider
      root={root.slug}
      notes={entries.map(i => i?.slug).filter((i): i is string => !!i)}
    >
      <ScrollContainer panes={entries.length}>
        {entries.map(
          (entry, index) =>
            entry && (
              <StickyNote key={entry.title} title={entry.title} index={index}>
                <MarkNote slug={entry.slug} entry={entry} />
              </StickyNote>
            )
        )}
      </ScrollContainer>
    </NotesProvider>
  )
}
