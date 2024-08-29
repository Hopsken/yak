'use client'

import Link from 'next/link'
import { PropsWithChildren, useCallback } from 'react'
import { useNotesStore } from '../_store'
import { useStore } from 'zustand'

type Props = PropsWithChildren<{
  href: string
}>

export function HyperLink({ href, children }: Props) {
  const store = useNotesStore()
  const appendNote = useStore(store, s => s.appendNote)
  const onClick = useCallback(() => {
    appendNote({
      title: 'Test',
      description: 'test',
      pubDate: new Date().toISOString(),
      updatedDate: null,
      draft: false,
      content: {
        node: null
      }
    })
  }, [appendNote])
  return (
    <Link href={href} scroll={false} onClick={onClick}>
      {children}
    </Link>
  )
}
