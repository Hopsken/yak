import { MarkNote } from '../../_components/MarkNote'
import { ScrollContainer, StickyNote } from '@/components/StackedNotes'
import { NotesProvider } from '../../_store'
import { Backlinks } from '../../_components/Backlinks'
import { NoteService } from '@/lib/note-service'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { topicKey } from '@/lib/documents'
import { settings } from '@/lib/atproto'

export async function generateMetadata({
  params
}: {
  params: Promise<{ rkey: string }>
}) {
  const note = await NoteService.instance.getNoteBySlug((await params).rkey)
  return note
    ? {
        title: note.title,
        description: note.description,
        alternates: {
          canonical: `${settings().origin}/r/${encodeURIComponent(note.rkey)}`
        }
      }
    : {}
}

export default async function NotePage({
  params,
  searchParams
}: {
  params: Promise<{ rkey: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const { rkey: rootNote } = await params
  const { note: leafNotes = [] } = await searchParams

  const noteService = NoteService.instance
  const root = await noteService.getNoteBySlug(rootNote)
  if (!root) notFound()

  const loadedEntries = await Promise.all(
    [...new Set([rootNote].concat(leafNotes))].slice(0, 12).map(async slug => {
      const entry = await noteService.getNoteBySlug(slug)
      if (!entry) return null
      return entry
    })
  )

  const entries = loadedEntries.filter((i): i is NonNullable<typeof i> => !!i)

  return (
    <NotesProvider
      root={root.slug}
      notes={entries.map(i => i?.slug).filter((i): i is string => !!i)}
    >
      <link rel='site.standard.document' href={root.uri} />
      <ScrollContainer panes={entries.length}>
        {entries.map(
          (entry, index) =>
            entry && (
              <StickyNote key={entry.uri} title={entry.title} index={index}>
                <MarkNote slug={entry.slug} entry={entry} />
                <nav
                  aria-label='Topics'
                  className='flex flex-wrap gap-3 text-sm'
                >
                  {entry.tags.map(tag => (
                    <Link
                      key={tag}
                      href={`/topics/${encodeURIComponent(topicKey(tag))}`}
                    >
                      #{tag}
                    </Link>
                  ))}
                </nav>
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
