import React from 'react'
import Markdoc from '@markdoc/markdoc'
import { reader } from '@/lib/keystatic/reader'
import { Prose } from '@/components/Prose'
import { StickyNote } from '@/components/StackedNotes'
import { MarkNote } from '@/app/(main)/_components/MarkNote'

export default async function Post({ params }: { params: { slug: string } }) {
  const post = await reader.collections.notes.read(params.slug, {
    resolveLinkedFiles: true
  })

  if (!post) {
    return <div>No Post Found</div>
  }

  return (
    <StickyNote index={1} title={post.title}>
      <MarkNote entry={post} />
    </StickyNote>
  )
}
