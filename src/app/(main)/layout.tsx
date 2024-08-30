import { Header } from '@/components/Header'
import React, { ReactNode } from 'react'

export default function NoteLayout(props: { children: ReactNode }) {
  return (
    <div className='flex flex-col md:h-screen'>
      <Header />
      {props.children}
    </div>
  )
}
