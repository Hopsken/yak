// keystatic.config.ts
import { config, fields, collection } from '@keystatic/core'
import yak from './yak.config'
import { generateSlug } from '@/utils/generate-slug'

const LOCAL_MODE = !!process.env.LOCAL_MODE

export default config({
  storage: LOCAL_MODE
    ? { kind: 'local' }
    : {
        kind: 'github',
        repo: yak.repo
      },
  collections: {
    notes: collection({
      label: 'Notes',
      slugField: 'title',
      path: 'content/notes/*',
      format: { contentField: 'content' },
      schema: {
        title: fields.slug({
          name: { label: 'Title', validation: { isRequired: true } },
          slug: {
            generate: generateSlug,
            description: "Don't change. Automatically generated from the title"
          }
        }),
        pubDate: fields.date({
          label: 'Publish date',
          defaultValue: { kind: 'today' },
          validation: { isRequired: true }
        }),
        updatedDate: fields.date({
          label: 'Updated date',
          defaultValue: { kind: 'today' }
        }),
        draft: fields.checkbox({ label: 'Draft?', defaultValue: true }),
        content: fields.markdoc({ label: 'Content' })
      }
    })
  }
})
