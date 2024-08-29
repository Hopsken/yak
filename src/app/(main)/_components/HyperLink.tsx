'use client'

import Link from 'next/link'
import { PropsWithChildren } from 'react'

type Props = PropsWithChildren<{
  href: string
}>

export function HyperLink({ href, children }: Props) {
  return (
    <Link href={href} onClick={() => console.log(href)}>
      {children}
    </Link>
  )
}
