'use client'

import Link from 'next/link'
import React, { PropsWithChildren, useCallback, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useScrollTo } from '@/components/StackedNotes/context'
import { useNotes } from '../_store'
import { useIsMobile } from '@/hooks/useMediaQuery'
import { isExternalLink } from '@/utils/is-external-link'
import { HiArrowTopRightOnSquare } from 'react-icons/hi2'

type Props = PropsWithChildren<{
  href: string
  from: string
}>

export function HyperLink({ from, href, children }: Props) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const scrollTo = useScrollTo()
  const isMobile = useIsMobile()

  const isNoteLink = useMemo(() => href.startsWith('/r/'), [href])
  const isExternal = useMemo(() => isExternalLink(href), [href])

  const target = useMemo(() => {
    if (href.startsWith('/r/')) {
      const target = href.split('/')[2]
      return target
    }
    return null
  }, [href])

  const { notes } = useNotes()

  const onClick = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>) => {
      if (!target || !isNoteLink || isMobile) {
        return
      }

      // open link if holding alt
      if (e.altKey) {
        e.preventDefault()
        router.push(href)
        return
      }

      // respect cmd/ctrl/shift shortcuts
      if (e.metaKey || e.ctrlKey || e.shiftKey) {
        return
      }

      e.preventDefault()

      if (notes.includes(target)) {
        scrollTo(notes.indexOf(target))
        return
      }

      const params = new URLSearchParams(searchParams)
      params.delete('note')

      const fromIndex = notes.indexOf(from)
      const path = [...notes.slice(0, fromIndex + 1), target]
        .map(encodeURIComponent)
        .join('/')

      router.push(`/r/${path}${params.size ? `?${params}` : ''}`)
      return
    },
    [
      from,
      href,
      isMobile,
      isNoteLink,
      notes,
      router,
      scrollTo,
      searchParams,
      target
    ]
  )

  return (
    <Link
      href={href}
      scroll={false}
      onClick={onClick}
      className='inline-flex items-center gap-1'
    >
      {isExternal && <HiArrowTopRightOnSquare />}
      <span>{children}</span>
    </Link>
  )
}
