import { Header } from '@/components/Header'
import { ReactNode } from 'react'

export default function NoteLayout(props: { children: ReactNode }) {
  return (
    <div className='flex flex-col h-screen'>
      <Header />
      <main>{props.children}</main>
    </div>
  )
}
