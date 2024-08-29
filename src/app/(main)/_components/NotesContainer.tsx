'use client'

import { ScrollContainer } from '@/components/StackedNotes'
import { useNotes } from '../_store'
import { PropsWithChildren } from 'react'

export function NotesContainer({ children }: PropsWithChildren<{}>) {
  const notes = useNotes()

  return <ScrollContainer panes={notes.length + 1}>{children}</ScrollContainer>
}
