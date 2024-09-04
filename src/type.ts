import { EntryWithResolvedLinkedFiles } from '@keystatic/core/reader'
import keystaticConfig from '../keystatic.config'

export type NoteEntry = EntryWithResolvedLinkedFiles<
  (typeof keystaticConfig)['collections']['notes']
>

export type RawNoteEntry = Omit<NoteEntry, 'content'> & {
  content: string
}

export type FullNote = NoteEntry & {
  backlinks: Array<{ title: string; slug: string }>
}
