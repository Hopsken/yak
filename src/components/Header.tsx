import { siteSettings } from '@/consts'

export function Header() {
  return (
    <header className='flex flex-wrap items-center px-8 py-3 w-full shadow-sm'>
      <h1 className='text-lg font-medium'>
        <a href='/'>{siteSettings.title}</a>
      </h1>
    </header>
  )
}
