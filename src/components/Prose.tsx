import { PropsWithChildren } from 'react'

export function Prose({
  title,
  children
}: PropsWithChildren<{
  title?: string
}>) {
  return (
    <article className='prose prose-zinc text-balance lg:prose-lg dark:prose-invert prose-h1:text-xl prose-h1:font-bold prose-a:text-blue-600 prose-img:rounded-xl dark:prose-a:text-blue-200'>
      {title && <h1>{title}</h1>}
      {children}
    </article>
  )
}
