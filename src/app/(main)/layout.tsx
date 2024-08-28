import { Header } from '@/components/Header'
import { ReactNode } from 'react'

export default function NoteLayout(props: { children: ReactNode }) {
  return (
    <div className='flex h-screen flex-col'>
      <Header />

      {props.children}
    </div>
  )
}
