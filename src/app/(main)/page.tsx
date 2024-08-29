import { getNoteBySlug } from '@/lib/keystatic/reader'
import { MarkNote } from './_components/MarkNote'
import { StickyNote } from '@/components/StackedNotes'
import { StackedNotes } from './_components/StackedNotes'

export default async function Home() {
  const homeEntry = await getNoteBySlug('home')

  if (!homeEntry) {
    throw new Error('404')
  }

  return (
    <>
      <StickyNote title={homeEntry.title} index={0}>
        <MarkNote entry={homeEntry} />
      </StickyNote>
      <StackedNotes />
    </>
  )
}
