#!/usr/bin/env node

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

function generateSlug(input) {
  return input
    .trim() // Remove leading and trailing spaces
    .toLowerCase() // Convert to lowercase (affects only ASCII letters)
    .normalize('NFKD') // Normalize to NFKD form
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritical marks
    .replace(/[^a-z0-9\p{Script=Han}]+/gu, '-') // Replace non-alphanumeric and non-Chinese characters with hyphens
    .replace(/^-+|-+$/g, '') // Remove leading and trailing hyphens
    .replace(/-+/g, '-') // Remove consecutive hyphens
}

function parseMDocFiles(targetDir) {
  const notes = {}

  walkDir(targetDir, filePath => {
    if (path.extname(filePath) === '.mdoc') {
      const fileContent = fs.readFileSync(filePath, 'utf-8')
      const { data: frontmatter, content } = matter(fileContent)

      if (frontmatter.title) {
        const titles = []
        const regex = /(?:\[\[([^\]]+)\]\]|#(\w+))/g
        let match

        while ((match = regex.exec(content)) !== null) {
          titles.push(match[1] || match[2])
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

  for (const [title, note] of Object.entries(notesByTitle)) {
    if (!references[note.slug]) {
      references[note.slug] = { title, backlinks: [] }
    }

    note.titles.forEach(refer => {
      const link = notesByTitle[refer]?.slug || generateSlug(refer)

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
