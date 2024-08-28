import { PropsWithChildren } from 'react'

export function Prose(props: PropsWithChildren<{}>) {
  return (
    <article
      className='prose dark:prose-invert
  prose-h1:font-bold prose-h1:text-xl
  prose-a:text-blue-600 prose-p:text-justify prose-img:rounded-xl
  prose-headings:underline'
    >
      {props.children}
    </article>
  )
}
