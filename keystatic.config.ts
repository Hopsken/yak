// keystatic.config.ts
import { config, fields, collection, singleton } from '@keystatic/core'
import yak from './yak.config'
import { generateSlug } from '@/utils/generate-slug'

const LOCAL_MODE = true

export default config({
  storage: LOCAL_MODE
    ? { kind: 'local' }
    : {
        kind: 'github',
        repo: yak.repo
      },
  // storage: { kind: 'local' },
  collections: {
    notes: collection({
      label: 'Notes',
      slugField: 'title',
      path: 'content/notes/*',
      entryLayout: 'content',
      format: { contentField: 'content' },
      schema: {
        title: fields.slug({
          name: { label: 'Title', validation: { isRequired: true } },
          slug: {
            generate: generateSlug,
            description: "Don't change. Automatically generated from the title"
          }
        }),
        content: fields.markdoc({ label: 'Content' })
      }
    })
  },
  singletons: {
    references: singleton({
      label: 'References',
      format: 'json',
      path: 'content/references',
      schema: {
        notes: fields.array(
          fields.object(
            {
              slug: fields.relationship({ label: 'Note', collection: 'notes' }),
              title: fields.text({ label: 'Title' }),
              backlinks: fields.array(
                fields.relationship({
                  label: 'Back links',
                  description: 'A list of pages have mentioned this note',
                  collection: 'notes'
                }),
                {
                  itemLabel: ({ value }) => `[[${value}]]`
                }
              )
            }
            // {
            //   layout: [6, 6]
            // }
          ),
          {
            label: 'Back links',
            itemLabel: ({ fields }) => {
              return `${fields.title.value} (${fields.backlinks.elements.length} backlinks)`
            }
          }
        )
      }
    })
  }
})
