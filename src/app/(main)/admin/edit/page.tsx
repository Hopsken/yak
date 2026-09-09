import { redirect, notFound } from 'next/navigation'
import { appSession, devLoginEnabled } from '@/lib/auth'
import { settings } from '@/lib/atproto'
import { NoteService } from '@/lib/note-service'
import { Editor } from './Editor'

export default async function EditPage({
  searchParams
}: {
  searchParams: Promise<{ slug?: string }>
}) {
  const session = await appSession()
  if (
    session.did !== settings().did ||
    !(session.mode === 'oauth' || (session.mode === 'dev' && devLoginEnabled()))
  )
    redirect('/admin')
  const { slug } = await searchParams
  const note = slug ? await NoteService.instance.getNoteBySlug(slug) : null
  if (slug && (!note || !note.supported)) notFound()
  const notes = await NoteService.instance.listNotes()
  return (
    <Editor
      key={note?.uri ?? 'new'}
      initial={
        note
          ? {
              title: note.title,
              slug: note.slug,
              description: note.description,
              markdown: note.markdown,
              rkey: note.rkey,
              cid: note.cid
            }
          : { title: '', slug: '', description: '', markdown: '' }
      }
      owner={settings().did}
      origin={settings().origin}
      notes={notes.map(({ entry }) => ({
        title: entry.title,
        slug: entry.slug
      }))}
    />
  )
}
