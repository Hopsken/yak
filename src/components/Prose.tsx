import { PropsWithChildren } from 'react'

export function Prose(props: PropsWithChildren<{}>) {
  return (
    <article className='prose dark:prose-invert prose-h1:text-xl prose-h1:font-bold prose-p:text-justify prose-a:text-blue-600 prose-img:rounded-xl'>
      {props.children}
    </article>
  )
}
