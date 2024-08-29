import { reader } from '@/lib/keystatic/reader'
import { MarkNote } from '../../_components/MarkNote'
import { StickyNote } from '@/components/StackedNotes'

export default async function NotePage({
  params
}: {
  params: { slug: string }
}) {
  const entry = await reader.collections.notes.read(params.slug, {
    resolveLinkedFiles: true
  })

  if (!entry) {
    throw new Error('404')
  }

  return (
    <StickyNote title={entry.title} index={0}>
      <MarkNote entry={entry} />
    </StickyNote>
  )
}
