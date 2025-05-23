import { AnyNote } from '@/type'
import { createReader } from './keystatic/reader'
import { matchLinks } from '@/app/(main)/_helper/note'
import { lower } from '@/utils/lower'

type NoteMeta = {
  title: string
  slug: string
  backlinks: string[]
}

export class NoteService {
  private static _instance: NoteService | null = null
  public static get instance() {
    if (!this._instance) {
      this._instance = new NoteService()
    }
    return this._instance
  }

  // slug => note meta
  private _graph: Map<string, NoteMeta> | null = null
  private reader: ReturnType<typeof createReader>

  private constructor() {
    this.reader = createReader()
  }

  private async buildGraph() {
    if (this._graph) return this._graph

    const { notes } = await this.reader.singletons.references.readOrThrow()

    const graph = new Map<string, NoteMeta>()

    for (const note of notes) {
      const slug = note.slug
      if (!slug) continue
      graph.set(slug, {
        ...note,
        slug,
        backlinks: note.backlinks.filter((i): i is string => !!i)
      })
    }

    this._graph = graph
    return graph
  }

  async getNoteMeta(slug: string): Promise<NoteMeta | null> {
    const graph = await this.buildGraph()
    return graph.get(slug) || null
  }

  async getNoteBacklinks(slug: string): Promise<NoteMeta[]> {
    const graph = await this.buildGraph()
    const note = graph.get(slug)

    if (!note) return []
    return note.backlinks
      .map(slug => graph.get(slug))
      .filter((i): i is NoteMeta => !!i)
  }

  async getNoteBySlug(slug: string): Promise<AnyNote> {
    const [note, backlinks] = await Promise.all([
      this.reader.collections.notes.read(slug, {
        resolveLinkedFiles: true
      }),
      this.getNoteBacklinks(slug)
    ])

    // if no file exist for note, then only render the backlinks of it.
    if (!note) {
      const meta = await this.getNoteMeta(slug)
      return {
        title: meta?.title ?? '',
        backlinks
      }
    }

    return {
      ...note,
      backlinks
    }
  }

  async listNotes() {
    return this.reader.collections.notes.all()
  }

  private mapTitleToSlug: Record<string, string> | null = null
  public async getSlugByTitle() {
    if (this.mapTitleToSlug) return this.mapTitleToSlug

    const graph = await this.buildGraph()
    const mapping: Record<string, string> = {}
    for (const note of graph.values()) {
      const lowered = lower(note.title)
      mapping[lowered] = note.slug
    }
    this.mapTitleToSlug = mapping
    return mapping
  }

  private async formatLinks(content: string) {
    const mapTitleToSlug = await this.getSlugByTitle()
    const links = matchLinks(content)
    return links
      .map(link => {
        const slug = mapTitleToSlug[link.title]

        if (!slug) return null

        return { ...link, slug }
      })
      .filter((i): i is { title: string; text: string; slug: string } => !!i)
  }
}
