import React from 'react'
import Markdoc from '@markdoc/markdoc'
import { reader } from '@/lib/keystatic/reader'
import { Prose } from '@/components/Prose'

export default async function Post({ params }: { params: { slug: string } }) {
  const post = await reader.collections.posts.read(params.slug)
  if (!post) {
    return <div>No Post Found</div>
  }
  const { node } = await post.content()
  const errors = Markdoc.validate(node)
  if (errors.length) {
    console.error(errors)
    throw new Error('Invalid content')
  }
  const renderable = Markdoc.transform(node)
  return (
    <>
      <Prose title={post.title}>
        {/* @ts-expect-error */}
        {Markdoc.renderers.react(renderable, React)}
      </Prose>
      <h1>{post.title}</h1>
    </>
  )
}
