import { EntryWithResolvedLinkedFiles } from '@keystatic/core/reader'
import keystaticConfig from '../keystatic.config'

export type NoteEntry = EntryWithResolvedLinkedFiles<
  (typeof keystaticConfig)['collections']['notes']
>

export type RawNoteEntry = Omit<NoteEntry, 'content'> & {
  content: string
}

type WithBacklinks = {
  backlinks: Array<{ title: string; slug: string }>
}

export type VirtualNote = Omit<NoteEntry, 'content'> & WithBacklinks

export type ContentNote = NoteEntry & WithBacklinks

export type AnyNote = VirtualNote | ContentNote
