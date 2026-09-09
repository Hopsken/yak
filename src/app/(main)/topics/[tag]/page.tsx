import { NoteService } from '@/lib/note-service'
import { topicKey } from '@/lib/documents'
import Link from 'next/link'

export default async function TopicPage({
  params
}: {
  params: Promise<{ tag: string }>
}) {
  const key = topicKey((await params).tag)
  const topic = await NoteService.instance.getTopic(key)
  return (
    <main className='mx-auto w-full max-w-3xl p-8'>
      <h1 className='mb-6 text-2xl font-bold'>#{key}</h1>
      <p className='mb-6 text-zinc-500'>Articles about this topic</p>
      <ul className='space-y-3'>
        {topic?.backlinks.map(note => (
          <li key={note.slug}>
            <Link
              className='text-blue-600 underline'
              href={`/r/${encodeURIComponent(note.slug)}`}
            >
              {note.title}
            </Link>
          </li>
        ))}
      </ul>
      {!topic?.backlinks.length && <p>No articles yet.</p>}
    </main>
  )
}
