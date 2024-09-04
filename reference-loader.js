const fs = require('fs')
const path = require('path')
const matter = require('gray-matter')

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(file => {
    const filePath = path.join(dir, file)
    if (fs.statSync(filePath).isDirectory()) {
      walkDir(filePath, callback)
    } else {
      callback(filePath)
    }
  })
}

function parseMDocFiles(targetDir) {
  const notes = {}

  walkDir(targetDir, filePath => {
    if (path.extname(filePath) === '.mdoc') {
      const fileContent = fs.readFileSync(filePath, 'utf-8')
      const { data: frontmatter, content } = matter(fileContent)

      if (frontmatter.title) {
        const titles = []
        const regex = /\[\[(.*?)\]\]/g
        let match

        while ((match = regex.exec(content)) !== null) {
          titles.push(match[1])
        }

        notes[frontmatter.title] = {
          slug: path.relative(targetDir, filePath).replace(/\.mdoc$/, ''),
          titles: titles
        }
      }
    }
  })

  return { notes }
}

function findReferences(notesByTitle) {
  const references = {}

  for (const [_, note] of Object.entries(notesByTitle)) {
    note.titles.forEach(refer => {
      const link = notesByTitle[refer].slug
      if (!references[link]) {
        references[link] = { title: refer, backlinks: [] }
      }
      references[link].backlinks.push(note.slug)
    })
  }

  const result = []

  for (const [slug, entry] of Object.entries(references)) {
    result.push({
      slug,
      ...entry
    })
  }

  return result
}

function saveResultToFile(result, outputPath) {
  fs.writeFileSync(outputPath, JSON.stringify(result, null, 2), 'utf-8')
  console.log(`Result saved to ${outputPath}`)
}

const notes = parseMDocFiles(path.join(process.cwd(), 'content/notes'))
const references = findReferences(notes.notes)

saveResultToFile(
  { notes: references },
  path.join(process.cwd(), 'content', 'references.json')
)
