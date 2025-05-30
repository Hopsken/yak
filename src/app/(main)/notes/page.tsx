import { HiArrowDownLeft } from 'react-icons/hi2'
import Link from 'next/link'
import { Prose } from '@/components/Prose'
import { NoteService } from '@/lib/note-service'

export default async function NotesPage() {
  const notes = await NoteService.instance.listNotes()

  return (
    <main className='flex grow flex-col overflow-x-hidden md:flex-row md:overflow-x-auto md:overflow-y-hidden'>
      <div className='w-full md:flex md:grow'>
        <Prose>
          <section className='not-prose p-8 text-base font-medium'>
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
        </Prose>
      </div>
    </main>
  )
}
