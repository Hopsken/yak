import { Header } from '@/components/Header'
import React, { ReactNode } from 'react'
import { NotesContainer } from './_components/NotesContainer'
import { NoteStoreProvider } from './_store'

export default function NoteLayout(props: {
  children: ReactNode
  panes: React.ReactNode
}) {
  return (
    <div className='flex h-screen flex-col'>
      <Header />
      <NoteStoreProvider>
        <NotesContainer>
          {props.children}
          {props.panes}
        </NotesContainer>
      </NoteStoreProvider>
    </div>
  )
}
