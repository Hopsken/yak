import { EntryWithResolvedLinkedFiles } from '@keystatic/core/reader'
import keystaticConfig from '../keystatic.config'

export type NoteEntry = EntryWithResolvedLinkedFiles<
  (typeof keystaticConfig)['collections']['notes']
>
