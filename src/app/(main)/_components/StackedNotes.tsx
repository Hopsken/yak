'use client'

import { StickyNote } from '@/components/StackedNotes'
import { useNotes } from '../_store'

export function StackedNotes() {
  const notes = useNotes()

  return (
    <>
      {notes.map((note, idx) => (
        <StickyNote key={idx} index={idx + 1} title={note.title}>
          ABC
        </StickyNote>
      ))}
    </>
  )
}
