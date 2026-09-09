'use client'

import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import { Markdown } from '@tiptap/markdown'
import { Placeholder } from '@tiptap/extensions'
import { EditorContent, useEditor } from '@tiptap/react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Send } from 'lucide-react'
import { HiOutlineArrowLeft } from 'react-icons/hi2'
import { z } from 'zod'
import { documentInput, type DocumentInput } from '@/lib/documents'

export function Editor(props: { initial: DocumentInput; owner: string }) {
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  )
  return mounted ? <DraftEditor {...props} /> : null
}

function DraftEditor({
  initial,
  owner
}: {
  initial: DocumentInput
  owner: string
}) {
  const router = useRouter()
  const key = `yak:draft:${owner}:${initial.rkey ?? 'new'}`
  const [draft, setDraft] = useState(() => {
    try {
      const saved = localStorage.getItem(key)
      if (saved) {
        const data = documentInput
          .extend({ title: z.string() })
          .parse(JSON.parse(saved))
        if (data.rkey === initial.rkey) return data
      }
    } catch {
      // Unavailable storage or an invalid draft must not prevent editing.
    }
    return initial
  })
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const dirty = useRef(false)
  const title = useRef<HTMLTextAreaElement>(null)
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ underline: false, strike: false }),
      Image,
      Markdown,
      Placeholder.configure({ placeholder: 'Start writing…' })
    ],
    content: draft.markdown,
    contentType: 'markdown',
    editorProps: {
      attributes: {
        role: 'textbox',
        'aria-label': 'Article body',
        'aria-multiline': 'true',
        class:
          'prose prose-zinc dark:prose-invert min-h-80 max-w-none break-words text-lg leading-8 outline-none [&>:first-child]:mt-0 [&_.is-editor-empty]:before:pointer-events-none [&_.is-editor-empty]:before:float-left [&_.is-editor-empty]:before:h-0 [&_.is-editor-empty]:before:text-zinc-400 [&_.is-editor-empty]:before:content-[attr(data-placeholder)]'
      }
    },
    onUpdate: ({ editor }) => change({ markdown: editor.getMarkdown() })
  })

  let hasBody = false
  editor?.state.doc.descendants(node => {
    if (
      node.isText
        ? node.text?.trim()
        : node.isLeaf && node.type.name !== 'hardBreak'
    )
      hasBody = true
  })
  const canPublish = !busy && !!draft.title.trim() && hasBody

  useEffect(() => {
    const resize = () => {
      const input = title.current
      if (!input) return
      input.style.height = 'auto'
      input.style.height = `${input.scrollHeight}px`
    }
    resize()
    window.addEventListener('resize', resize)
    return () => window.removeEventListener('resize', resize)
  }, [draft.title])

  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (dirty.current) event.preventDefault()
    }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [])

  function change(patch: Partial<DocumentInput>) {
    dirty.current = true
    const next = { ...draft, ...patch }
    setDraft(next)
    try {
      localStorage.setItem(key, JSON.stringify(next))
    } catch {
      setMessage(
        'Unable to save this draft in your browser. Keep this page open until you publish.'
      )
    }
  }

  async function publish() {
    if (!canPublish) return
    setBusy(true)
    setMessage('Publishing…')
    editor?.setEditable(false, false)
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
        // A storage failure must not report a successful write as failed.
      }
      setDraft(value => ({ ...value, cid: result.cid, rkey: result.rkey }))
      setMessage('Published. Your article is now on the blog.')
      // A new route/key prevents a published article from reusing the new-draft slot.
      if (!initial.rkey)
        router.replace(`/admin/edit?rkey=${encodeURIComponent(result.rkey)}`)
      router.refresh()
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : 'Publishing failed. Your draft is retained.'
      )
    } finally {
      setBusy(false)
      editor?.setEditable(true, false)
    }
  }

  return (
    <main className='flex min-h-dvh w-full flex-col bg-white dark:bg-zinc-900'>
      <fieldset disabled={busy} className='flex min-w-0 flex-1 flex-col'>
        <div className='flex items-center justify-between px-4 py-4 md:px-8'>
          <Link
            href='/admin'
            aria-label='Back to articles'
            className='rounded-lg p-2.5 text-zinc-600 hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-offset-2 dark:text-zinc-300 dark:hover:bg-zinc-800'
          >
            <HiOutlineArrowLeft aria-hidden='true' className='size-5' />
          </Link>
          <button
            type='button'
            disabled={!canPublish}
            className='inline-flex items-center gap-1.5 rounded-lg bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900'
            onClick={publish}
          >
            <Send aria-hidden='true' className='size-4' />
            {busy ? 'Publishing…' : 'Publish'}
          </button>
        </div>
        <div className='mx-auto w-full max-w-3xl flex-1 px-6 pb-12'>
          <h1 className='sr-only'>
            {draft.rkey ? 'Edit article' : 'New article'}
          </h1>
          <textarea
            ref={title}
            aria-label='Title'
            placeholder='Title'
            rows={1}
            value={draft.title}
            onChange={e => change({ title: e.target.value.replace(/\n/g, '') })}
            className='block w-full resize-none overflow-hidden border-0 bg-transparent p-0 text-4xl leading-tight font-bold placeholder:text-zinc-400 focus:outline-none md:text-5xl'
          />
          <EditorContent editor={editor} className='mt-8' />
          <p role='status' className='mt-4 text-sm empty:hidden'>
            {message}
          </p>
        </div>
      </fieldset>
    </main>
  )
}
