'use client'

import Link from 'next/link'
import { PropsWithChildren, useMemo } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'

type Props = PropsWithChildren<{
  href: string
}>

export function HyperLink({ href, children }: Props) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const inlineLink = useMemo(() => {
    if (href.startsWith('/notes')) {
      const params = new URLSearchParams(searchParams)
      params.append('note', href.split('/')[2])
      return pathname + '?' + params.toString()
    }
    return href
  }, [href, pathname, searchParams])
  return (
    <Link href={inlineLink} scroll={false}>
      {children}
    </Link>
  )
}
