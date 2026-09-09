import Link from 'next/link'
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
      <main className='mx-auto w-full max-w-xl space-y-6 p-8'>
        <h1 className='text-3xl font-bold'>Write on Yak</h1>
        <p>
          Only the configured owner can publish. Drafts stay in your browser.
        </p>
        <form action='/api/auth/login' method='post'>
          <button className='rounded bg-zinc-900 px-4 py-2 text-white dark:bg-zinc-700'>
            Log in with ATProto
          </button>
        </form>
        {devLoginEnabled() && (
          <form
            action='/api/auth/dev'
            method='post'
            className='space-y-3 border-t pt-6'
          >
            <p>Isolated development network</p>
            <button className='rounded border px-4 py-2'>
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
        <h1 className='text-3xl font-bold'>Your articles</h1>
        <form action='/api/auth/logout' method='post'>
          <button className='underline'>Log out</button>
        </form>
      </div>
      <Link
        href='/admin/edit'
        className='inline-block rounded bg-zinc-900 px-4 py-2 text-white dark:bg-zinc-700'
      >
        New article
      </Link>
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
