// keystatic.config.ts
import { config, fields, collection } from '@keystatic/core'

export default config({
  storage: {
    kind: 'github',
    repo: 'hopsken/garden'
  },
  collections: {
    notes: collection({
      label: 'Notes',
      slugField: 'title',
      path: 'content/notes/*',
      format: { contentField: 'content' },
      schema: {
        title: fields.slug({
          name: { label: 'Title', validation: { isRequired: true } }
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
