import { getNoteBySlug } from '@/lib/keystatic/reader'
import { MarkNote } from '../../_components/MarkNote'
import { StickyNote } from '@/components/StackedNotes'

export default async function NotePage({
  params,
  searchParams
}: {
  params: { slug: string }
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  const entries = await Promise.all(
    [params.slug]
      .concat(searchParams.note || [])
      .map(slug => getNoteBySlug(slug))
  )

  const [root] = entries

  if (!root || !entries.length) {
    throw new Error('404')
  }

  return entries.map(
    (entry, index) =>
      entry && (
        <StickyNote key={entry.title} title={entry.title} index={index}>
          <MarkNote entry={entry} />
        </StickyNote>
      )
  )
}
