import { siteSettings } from '@/consts'
import { appSession, devLoginEnabled } from '@/lib/auth'
import { settings } from '@/lib/atproto'
import { LogIn, LogOut } from 'lucide-react'
import ThemeToggle from './ThemeToggle'
import Link from 'next/link'
import yak from '../../yak.config'

export async function Header() {
  const session = await appSession()
  const owner =
    session.did === settings().did &&
    (session.mode === 'oauth' || (session.mode === 'dev' && devLoginEnabled()))
  return (
    <header className='flex w-full flex-wrap items-center justify-between border-b px-8 py-3 dark:border-zinc-700'>
      <div className='flex items-center gap-4 text-lg font-medium'>
        <Link href='/'>{siteSettings.title}</Link>

        {yak.links?.map(link => (
          <Link
            key={link.href}
            href={link.href}
            className='text-base text-zinc-600'
          >
            {link.text}
          </Link>
        ))}
        {owner && (
          <Link
            href='/admin'
            className='text-base text-zinc-600 dark:text-zinc-300'
          >
            Write
          </Link>
        )}
      </div>

      <div className='flex items-center gap-1'>
        {owner ? (
          <form action='/api/auth/logout' method='post'>
            <button
              aria-label='Log out'
              title='Log out'
              className='rounded p-2 text-zinc-600 hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-offset-2 dark:text-zinc-300 dark:hover:bg-zinc-800'
            >
              <LogOut aria-hidden='true' className='size-4' />
            </button>
          </form>
        ) : (
          <Link
            href='/admin'
            aria-label='Sign in'
            title='Sign in'
            className='rounded p-2 text-zinc-600 hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-offset-2 dark:text-zinc-300 dark:hover:bg-zinc-800'
          >
            <LogIn aria-hidden='true' className='size-4' />
          </Link>
        )}
        <ThemeToggle />
      </div>
    </header>
  )
}
