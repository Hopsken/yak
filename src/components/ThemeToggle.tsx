'use client'

import { useTheme } from 'next-themes'
import { useSyncExternalStore } from 'react'
import { HiOutlineSun, HiOutlineMoon } from 'react-icons/hi2'

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  )

  if (!mounted) return null

  return (
    <button
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className='rounded p-2'
    >
      {theme === 'light' ? <HiOutlineSun /> : <HiOutlineMoon />}
    </button>
  )
}
