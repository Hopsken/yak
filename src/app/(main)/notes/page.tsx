import { reader } from '@/lib/keystatic/reader'
import { HiArrowDownLeft } from 'react-icons/hi2'
import Link from 'next/link'

export default async function NotesPage() {
  const notes = await reader.collections.notes.all()

  return (
    <main className='flex grow flex-col overflow-x-hidden md:flex-row md:overflow-x-auto md:overflow-y-hidden'>
      <div className='w-full md:flex md:grow'>
        <section className='not-prose text-base font-medium'>
          <h3 className='text-base leading-loose text-gray-500'>All notes</h3>
          <ul className='flex flex-col gap-2 leading-snug'>
            {notes.map(({ slug, entry }) => (
              <li
                key={slug}
                className='inline-flex items-center gap-1 overflow-hidden text-ellipsis whitespace-nowrap'
              >
                <HiArrowDownLeft className='stroke-1' />
                <span className='underline'>
                  <Link href={`/notes/${slug}`}>{entry.title}</Link>
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  )
}
