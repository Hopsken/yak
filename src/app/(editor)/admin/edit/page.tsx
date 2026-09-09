import { redirect, notFound } from 'next/navigation'
import { appSession, devLoginEnabled } from '@/lib/auth'
import { settings } from '@/lib/atproto'
import { NoteService } from '@/lib/note-service'
import { Editor } from './Editor'

export const dynamic = 'force-dynamic'

export default async function EditPage({
  searchParams
}: {
  searchParams: Promise<{ rkey?: string }>
}) {
  const session = await appSession()
  if (
    session.did !== settings().did ||
    !(session.mode === 'oauth' || (session.mode === 'dev' && devLoginEnabled()))
  )
    redirect('/admin')
  const { rkey } = await searchParams
  const note = rkey ? await NoteService.instance.getNoteBySlug(rkey) : null
  if (rkey && (!note || !note.supported)) notFound()
  return (
    <Editor
      key={note?.uri ?? 'new'}
      initial={
        note
          ? {
              title: note.title,
              description: note.description,
              markdown: note.markdown,
              rkey: note.rkey,
              cid: note.cid
            }
          : { title: '', description: '', markdown: '' }
      }
      owner={settings().did}
    />
  )
}
