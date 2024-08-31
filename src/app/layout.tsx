import type { Metadata } from 'next'
import { ThemeProvider } from 'next-themes'
import { siteSettings } from '@/consts'

import './globals.css'

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
    <html suppressHydrationWarning>
      <body className='bg-[#fafafc] antialiased dark:bg-zinc-900 dark:text-zinc-100'>
        <ThemeProvider attribute='class'>{children}</ThemeProvider>
      </body>
    </html>
  )
}
