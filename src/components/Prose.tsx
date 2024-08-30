import { PropsWithChildren } from 'react'

export function Prose({
  title,
  children
}: PropsWithChildren<{
  title?: string
}>) {
  return (
    <article className='prose prose-slate text-balance lg:prose-lg prose-h1:text-xl prose-h1:font-bold prose-a:text-blue-600 prose-img:rounded-xl'>
      {title && <h1>{title}</h1>}
      {children}
    </article>
  )
}
