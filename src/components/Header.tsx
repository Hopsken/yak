import { siteSettings } from '@/consts'
import Link from 'next/link'

export function Header() {
  return (
    <header className='flex w-full flex-wrap items-center border-b px-8 py-3'>
      <div className='text-lg font-medium'>
        <Link href='/'>{siteSettings.title}</Link>
      </div>
    </header>
  )
}
