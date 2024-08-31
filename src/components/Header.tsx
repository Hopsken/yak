import { siteSettings } from '@/consts'
import ThemeToggle from './ThemeToggle'

export function Header() {
  return (
    <header className='flex w-full flex-wrap items-center justify-between border-b px-8 py-3 dark:border-zinc-700'>
      <div className='text-lg font-medium'>
        <a href='/'>{siteSettings.title}</a>
      </div>

      <ThemeToggle />
    </header>
  )
}
