import { MarkNote } from '../../_components/MarkNote'
import { ScrollContainer, StickyNote } from '@/components/StackedNotes'
import { NotesProvider } from '../../_store'
import { Backlinks } from '../../_components/Backlinks'
import { isContentNote } from '../../_helper/note'
import { NoteService } from '@/lib/note-service'

export default async function NotePage({
  params,
  searchParams
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const { slug: rootNote } = await params
  const { note: leafNotes = [] } = await searchParams

  const noteService = NoteService.instance

  const loadedEntries = await Promise.all(
    [rootNote].concat(leafNotes).map(async slug => {
      const entry = await noteService.getNoteBySlug(slug)
      if (!entry) return null

      return {
        slug,
        ...entry
      }
    })
  )

  const entries = loadedEntries.filter((i): i is NonNullable<typeof i> => !!i)
  const [root] = entries

  const slugByTitle = await noteService.getSlugByTitle()

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
                {isContentNote(entry) ? (
                  <MarkNote
                    slug={entry.slug}
                    entry={entry}
                    slugByTitle={slugByTitle}
                  />
                ) : null}
                <Backlinks
                  backlinks={entry.backlinks}
                  currentNote={entry.slug}
                />
              </StickyNote>
            )
        )}
      </ScrollContainer>
    </NotesProvider>
  )
}
