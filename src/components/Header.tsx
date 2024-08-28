import { siteSettings } from '@/consts'

export function Header() {
  return (
    <header className='flex w-full flex-wrap items-center border-b px-8 py-3'>
      <div className='text-lg font-medium'>
        <a href='/'>{siteSettings.title}</a>
      </div>
    </header>
  )
}
