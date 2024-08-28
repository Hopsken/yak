import { createReader } from '@keystatic/core/reader'
import React from 'react'
import Markdoc from '@markdoc/markdoc'

import keystaticConfig from '../../../../keystatic.config'

const reader = createReader(process.cwd(), keystaticConfig)

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
      <h1>{post.title}</h1>
      {Markdoc.renderers.react(renderable, React)}
      <hr />
      <a href={`/posts`}>Back to Posts</a>
    </>
  )
}
