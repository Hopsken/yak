import { Header } from '@/components/Header'
import React, { ReactNode } from 'react'
import { NotesContainer } from './_components/NotesContainer'

export default function NoteLayout(props: { children: ReactNode }) {
  return (
    <div className='flex h-screen flex-col'>
      <Header />
      <NotesContainer>{props.children}</NotesContainer>
    </div>
  )
}
