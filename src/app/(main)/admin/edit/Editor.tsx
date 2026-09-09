'use client'

import { useEffect, useRef, useState } from 'react'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { Markdown as TiptapMarkdown } from '@tiptap/markdown'
import Image from '@tiptap/extension-image'
import Markdown from 'react-markdown'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { z } from 'zod'
import {
  documentInput,
  type DocumentInput,
  type NoteMeta
} from '@/lib/documents'

export function Editor({
  initial,
  owner,
  origin,
  notes
}: {
  initial: DocumentInput
  owner: string
  origin: string
  notes: NoteMeta[]
}) {
  const router = useRouter()
  const [draft, setDraft] = useState(initial)
  const [preview, setPreview] = useState(false)
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const dirty = useRef(false)
  const key = `yak:draft:${owner}:${initial.rkey ?? 'new'}`
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ underline: false, strike: false }),
      Image,
      TiptapMarkdown
    ],
    content: initial.markdown,
    contentType: 'markdown',
    editorProps: {
      attributes: {
        role: 'textbox',
        'aria-label': 'Article body',
        class:
          'prose prose-zinc dark:prose-invert max-w-none min-h-80 p-6 outline-none'
      }
    },
    onUpdate: ({ editor }) => {
      dirty.current = true
      setDraft(value => ({ ...value, markdown: editor.getMarkdown() }))
    }
  })
  useEffect(() => {
    if (!dirty.current) return
    try {
      localStorage.setItem(key, JSON.stringify(draft))
    } catch {
      /* Export remains available if browser storage is full. */
    }
  }, [draft, key])
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (dirty.current) event.preventDefault()
    }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [])

  function change(patch: Partial<DocumentInput>) {
    dirty.current = true
    setDraft(value => ({ ...value, ...patch }))
  }
  function restore() {
    try {
      const saved = localStorage.getItem(key)
      if (!saved) return setMessage('No local draft found.')
      const data = documentInput
        .extend({ title: z.string(), slug: z.string() })
        .parse(JSON.parse(saved))
      if (
        data.rkey !== initial.rkey ||
        (initial.rkey && data.slug !== initial.slug)
      )
        throw new Error('Wrong draft')
      dirty.current = true
      setDraft(data)
      editor?.commands.setContent(data.markdown, {
        contentType: 'markdown',
        emitUpdate: false
      })
      setMessage(
        'Local draft restored. A stale revision will be rejected when you publish.'
      )
    } catch {
      setMessage(
        'Unable to restore this draft. Export your current work before retrying.'
      )
    }
  }
  function download() {
    const url = URL.createObjectURL(
      new Blob([draft.markdown], { type: 'text/markdown' })
    )
    const link = document.createElement('a')
    link.href = url
    link.download = `${draft.slug || 'draft'}.md`
    link.click()
    URL.revokeObjectURL(url)
  }
  async function publish() {
    setBusy(true)
    setMessage('Publishing…')
    editor?.setEditable(false)
    try {
      const response = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(draft)
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error)
      dirty.current = false
      try {
        localStorage.removeItem(key)
      } catch {
        // A browser storage failure must not report a successful write as failed.
      }
      setDraft(value => ({ ...value, cid: result.cid, rkey: result.rkey }))
      setMessage('Published. Your article is now on the blog.')
      // A new route/key prevents a published article from reusing the new-draft slot.
      if (!initial.rkey)
        router.replace(`/admin/edit?slug=${encodeURIComponent(result.slug)}`)
      router.refresh()
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : 'Publishing failed. Your draft is retained.'
      )
    } finally {
      setBusy(false)
      editor?.setEditable(true)
    }
  }
  const button =
    'rounded border px-3 py-1.5 text-sm hover:bg-zinc-100 disabled:opacity-50 dark:hover:bg-zinc-800'
  return (
    <main className='mx-auto w-full max-w-5xl space-y-5 p-4 md:p-8'>
      <header className='flex flex-wrap items-center justify-between gap-3'>
        <h1 className='text-2xl font-bold'>
          {draft.rkey ? 'Edit article' : 'New article'}
        </h1>
        <Link href='/admin' className='underline'>
          All articles
        </Link>
      </header>
      <p className='text-sm text-zinc-500'>
        Tiptap · CommonMark · Private drafts stay in this browser only. Use
        Restore draft after reopening. Export a backup if browser storage is
        unavailable.
      </p>
      <fieldset disabled={busy} className='space-y-4'>
        <label className='block'>
          Title
          <input
            value={draft.title}
            onChange={e => change({ title: e.target.value })}
            className='mt-1 block w-full rounded border bg-transparent p-2 text-xl'
          />
        </label>
        <label className='block'>
          Path: /notes/
          <input
            value={draft.slug}
            readOnly={!!draft.rkey}
            onChange={e => change({ slug: e.target.value })}
            className='mt-1 block w-full rounded border bg-transparent p-2'
          />
        </label>
        <label className='block'>
          Description
          <textarea
            value={draft.description}
            onChange={e => change({ description: e.target.value })}
            className='mt-1 block w-full rounded border bg-transparent p-2'
          />
        </label>
        <div className='flex flex-wrap gap-2'>
          <button
            type='button'
            className={button}
            onClick={() => editor?.chain().focus().toggleBold().run()}
          >
            Bold
          </button>
          <button
            type='button'
            className={button}
            onClick={() => editor?.chain().focus().toggleItalic().run()}
          >
            Italic
          </button>
          <button
            type='button'
            className={button}
            onClick={() =>
              editor?.chain().focus().toggleHeading({ level: 2 }).run()
            }
          >
            Heading
          </button>
          <button
            type='button'
            className={button}
            onClick={() => editor?.chain().focus().toggleBulletList().run()}
          >
            List
          </button>
          <button
            type='button'
            className={button}
            onClick={() => editor?.chain().focus().toggleCodeBlock().run()}
          >
            Code
          </button>
          <button
            type='button'
            className={button}
            onClick={() => {
              const url = prompt('Image URL (HTTPS)')
              if (url?.startsWith('https://'))
                editor
                  ?.chain()
                  .focus()
                  .setImage({
                    src: url,
                    alt: prompt('Image description') ?? ''
                  })
                  .run()
            }}
          >
            Image URL
          </button>
          <select
            aria-label='Insert article link'
            value=''
            className={button}
            onChange={e => {
              const note = notes.find(n => n.slug === e.target.value)
              if (note)
                editor
                  ?.chain()
                  .focus()
                  .insertContent({
                    type: 'text',
                    text: note.title,
                    marks: [
                      {
                        type: 'link',
                        attrs: {
                          href: `${origin}/notes/${encodeURIComponent(note.slug)}`
                        }
                      }
                    ]
                  })
                  .run()
            }}
          >
            <option value=''>Insert article link…</option>
            {notes.map(note => (
              <option key={note.slug} value={note.slug}>
                {note.title}
              </option>
            ))}
          </select>
          <button
            type='button'
            className={button}
            onClick={() => setPreview(!preview)}
          >
            {preview ? 'Edit' : 'Preview'}
          </button>
        </div>
        <section
          className='rounded border bg-white dark:bg-zinc-900'
          aria-label={preview ? 'Article preview' : 'Article editor'}
        >
          {preview ? (
            <div className='prose prose-zinc dark:prose-invert min-h-80 max-w-none p-6'>
              <Markdown>{draft.markdown}</Markdown>
            </div>
          ) : (
            <EditorContent editor={editor} />
          )}
        </section>
        <div className='flex flex-wrap gap-3'>
          <button
            type='button'
            className='rounded bg-zinc-900 px-4 py-2 text-white dark:bg-zinc-700'
            onClick={publish}
          >
            Publish
          </button>
          <button type='button' className={button} onClick={restore}>
            Restore draft
          </button>
          <button type='button' className={button} onClick={download}>
            Export Markdown
          </button>
          <label className={button}>
            Import Markdown
            <input
              type='file'
              accept='.md,.markdown,text/markdown'
              className='sr-only'
              onChange={async e => {
                const file = e.target.files?.[0]
                if (!file) return
                if (file.size > 1_000_000)
                  return setMessage('File exceeds 1 MB')
                const markdown = await file.text()
                change({ markdown })
                editor?.commands.setContent(markdown, {
                  contentType: 'markdown',
                  emitUpdate: false
                })
              }}
            />
          </label>
          {draft.rkey && (
            <Link
              className={button}
              href={`/notes/${encodeURIComponent(draft.slug)}`}
            >
              View article
            </Link>
          )}
        </div>
      </fieldset>
      <p role='status' className='text-sm'>
        {message}
      </p>
    </main>
  )
}
