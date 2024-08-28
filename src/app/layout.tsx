import type { Metadata } from 'next'
import { siteSettings } from '@/consts'

import './globals.css'

export const metadata: Metadata = {
  title: siteSettings.title,
  description: siteSettings.description,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html>
      <body>{children}</body>
    </html>
  )
}
