'use client'

import Link from 'next/link'
import React, { PropsWithChildren, useCallback, useMemo } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useScrollTo } from '@/components/StackedNotes/context'
import { useNotes } from '../_store'

type Props = PropsWithChildren<{
  href: string
  from: string
}>

export function HyperLink({ from, href, children }: Props) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const router = useRouter()
  const scrollTo = useScrollTo()

  const isNoteLink = useMemo(() => href.startsWith('/notes'), [href])

  const target = useMemo(() => {
    if (href.startsWith('/notes')) {
      const target = href.split('/')[2]
      return target
    }
    return null
  }, [href])

  const { notes } = useNotes()

  const onClick = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>) => {
      if (!target || !isNoteLink) return

      e.preventDefault()

      if (notes.includes(target)) {
        scrollTo(notes.indexOf(target))
        return
      }

      const params = new URLSearchParams(searchParams)
      // reset all
      params.delete('note')

      // if from root, direct append to params
      const fromIndex = notes.indexOf(from)
      for (let i = 1; i <= fromIndex; i++) {
        params.append('note', notes[i])
      }
      params.append('note', target)

      router.push(pathname + '?' + params.toString())
      return
    },
    [from, isNoteLink, notes, pathname, router, scrollTo, searchParams, target]
  )

  return (
    <Link href={href} scroll={false} onClick={onClick}>
      {children}
    </Link>
  )
}
