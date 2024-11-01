import { siteSettings } from '@/consts'
import ThemeToggle from './ThemeToggle'
import Link from 'next/link'

export function Header() {
  return (
    <header className='flex w-full flex-wrap items-center justify-between border-b px-8 py-3 dark:border-zinc-700'>
      <div className='flex items-center gap-4 text-lg font-medium'>
        <a href='/'>{siteSettings.title}</a>

        <Link href='/notes' className='text-base text-zinc-600'>
          {'~ls'}
        </Link>
      </div>

      <ThemeToggle />
    </header>
  )
}
