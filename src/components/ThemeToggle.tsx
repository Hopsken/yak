'use client'

import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { HiOutlineSun, HiOutlineMoon } from 'react-icons/hi2'

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

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
