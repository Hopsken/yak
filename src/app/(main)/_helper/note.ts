import { ContentNote, AnyNote } from '@/type'
import { lower } from '@/utils/lower'

export function isContentNote(note: AnyNote): note is ContentNote {
  return !!(note as ContentNote).content
}

type MatchedLink = {
  title: string
  text: string
}

export function matchLinks(content: string): MatchedLink[] {
  const links: MatchedLink[] = []
  const regex = /(?:\[\[([^\]]+)\]\]|#(\w+))/g

  let match

  while ((match = regex.exec(content)) !== null) {
    links.push({
      title: lower(match[1] || match[2]),
      text: match[2] ? match[0] : match[1]
    })
  }

  return links
}
