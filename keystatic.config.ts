// keystatic.config.ts
import { config, fields, collection } from '@keystatic/core'

export default config({
  storage: {
    kind: 'local'
  },
  collections: {
    notes: collection({
      label: 'Posts',
      slugField: 'title',
      path: 'src/content/posts/*',
      format: { contentField: 'content' },
      schema: {
        title: fields.slug({
          name: { label: 'Title', validation: { isRequired: true } }
        }),
        description: fields.text({
          label: 'Description',
          validation: { isRequired: false }
        }),
        pubDate: fields.date({
          label: 'Publish date',
          defaultValue: { kind: 'today' },
          validation: {
            isRequired: true
          }
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
