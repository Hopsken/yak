import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { ThemeProvider } from 'next-themes'
import { siteSettings } from '@/consts'

import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  style: ['normal', 'italic'],
  display: 'swap'
})

export const metadata: Metadata = {
  title: siteSettings.title,
  description: siteSettings.description
}

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html className={inter.className} suppressHydrationWarning>
      <body className='bg-white antialiased dark:bg-zinc-900 dark:text-zinc-100 md:bg-[#fafafc]'>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  )
}
