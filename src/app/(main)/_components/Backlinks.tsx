import { ContentNote } from '@/type'
import { HyperLink } from './HyperLink'
import { HiArrowDownLeft } from 'react-icons/hi2'

type Props = {
  currentNote: string
  backlinks: ContentNote['backlinks']
}

export function Backlinks({ currentNote, backlinks }: Props) {
  if (!backlinks.length) {
    return null
  }

  return (
    <section className='not-prose text-base font-medium'>
      <h3 className='text-base leading-loose text-gray-500'>
        Linked to this note
      </h3>
      <ul className='flex flex-col gap-2 leading-snug'>
        {backlinks.map(({ slug, title }) => (
          <li
            key={slug}
            className='inline-flex items-center gap-1 overflow-hidden text-ellipsis whitespace-nowrap'
          >
            <HiArrowDownLeft className='stroke-1' />
            <span className='underline'>
              <HyperLink href={`/notes/${slug}`} from={currentNote}>
                {title}
              </HyperLink>
            </span>
          </li>
        ))}
      </ul>
    </section>
  )
}
