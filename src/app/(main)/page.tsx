import { reader } from '@/lib/keystatic/reader'
import { NoteStoreProvider } from './_store'
import { NotesContainer } from './_components/NotesContainer'
import { MarkNote } from './_components/MarkNote'
import { StickyNote } from '@/components/StackedNotes'

export default async function Home() {
  const homeEntry = await reader.collections.notes.read('home', {
    resolveLinkedFiles: true
  })

  if (!homeEntry) {
    throw new Error('404')
  }

  return (
    <StickyNote title={homeEntry.title} index={0}>
      <MarkNote entry={homeEntry} />
    </StickyNote>
  )
}
