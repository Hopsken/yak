import Link from 'next/link'
import { Pencil } from 'lucide-react'
import { appSession, devLoginEnabled } from '@/lib/auth'
import { settings } from '@/lib/atproto'
import { NoteService } from '@/lib/note-service'

export const dynamic = 'force-dynamic'
export default async function AdminPage() {
  const session = await appSession()
  const owner =
    session.did === settings().did &&
    (session.mode === 'oauth' || (session.mode === 'dev' && devLoginEnabled()))
  if (!owner)
    return (
      <main className='flex w-full flex-1 flex-col items-center justify-center gap-3 p-8'>
        <form
          action='/api/auth/login'
          method='post'
          className='w-full max-w-60'
        >
          <button className='w-full rounded border border-transparent bg-zinc-900 px-4 py-2 text-white dark:bg-zinc-700'>
            Log in with ATProto
          </button>
        </form>
        {devLoginEnabled() && (
          <form
            action='/api/auth/dev'
            method='post'
            className='w-full max-w-60'
          >
            <button className='w-full rounded border px-4 py-2'>
              Development login
            </button>
          </form>
        )}
      </main>
    )
  const notes = await NoteService.instance.listNotes()
  return (
    <main className='mx-auto w-full max-w-3xl space-y-6 p-8'>
      <div className='flex items-center justify-between'>
        <h1 className='text-3xl font-bold'>Articles</h1>
        <Link
          href='/admin/edit'
          aria-label='Write a new article'
          title='New article'
          className='inline-flex items-center gap-1.5 rounded-full bg-zinc-900 px-3 py-2 text-sm leading-4 font-medium text-white hover:bg-zinc-800 focus-visible:outline-2 focus-visible:outline-offset-2 dark:bg-zinc-700 dark:hover:bg-zinc-600'
        >
          <Pencil aria-hidden='true' className='size-4' />
          <span>Write</span>
        </Link>
      </div>
      <ul className='divide-y'>
        {notes.map(({ entry }) => (
          <li key={entry.uri} className='flex justify-between gap-4 py-4'>
            <Link href={`/r/${encodeURIComponent(entry.rkey)}`}>
              {entry.title}
            </Link>
            {entry.supported ? (
              <Link
                className='underline'
                href={`/admin/edit?rkey=${encodeURIComponent(entry.rkey)}`}
              >
                Edit
              </Link>
            ) : (
              <span>Read-only format</span>
            )}
          </li>
        ))}
      </ul>
    </main>
  )
}
