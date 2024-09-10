import { ContentNote, AnyNote } from '@/type'

export function isContentNote(note: AnyNote): note is ContentNote {
  return !!(note as ContentNote).content
}
