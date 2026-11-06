'use client'

import {
  Children,
  isValidElement,
  PropsWithChildren,
  useEffect,
  useRef,
  useState
} from 'react'
import clsx from 'clsx'
import { Check, Copy } from 'lucide-react'

export function CopyCode({ children }: PropsWithChildren) {
  const ref = useRef<HTMLPreElement>(null)
  const [copied, setCopied] = useState(false)
  const [code] = Children.toArray(children)
  const language = isValidElement<{ className?: string }>(code)
    ? /language-([\w+#-]+)/.exec(code.props.className ?? '')?.[1]
    : undefined

  useEffect(() => {
    if (!copied) return
    const timer = setTimeout(() => setCopied(false), 2000)
    return () => clearTimeout(timer)
  }, [copied])

  async function copy() {
    const text = ref.current?.textContent ?? ''
    try {
      await navigator.clipboard.writeText(text.replace(/\n$/, ''))
      setCopied(true)
    } catch {
      /* Clipboard access can be blocked; leave the button unchanged. */
    }
  }

  return (
    <div className='my-6 overflow-hidden rounded-lg border border-zinc-200 bg-zinc-100 lg:my-8 dark:border-zinc-700 dark:bg-black/50'>
      <div className='flex items-center justify-between gap-2 border-b border-zinc-200 px-3 py-1.5 dark:border-zinc-700'>
        <span className='text-xs font-medium text-zinc-600 dark:text-zinc-400'>
          {language ?? 'text'}
        </span>
        <button
          type='button'
          onClick={copy}
          aria-label={copied ? 'Code copied' : 'Copy code'}
          className={clsx(
            'rounded p-1 transition',
            copied
              ? 'text-emerald-600 dark:text-emerald-400'
              : 'text-zinc-500 hover:bg-zinc-200 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white'
          )}
        >
          {copied ? (
            <Check size={16} aria-hidden='true' />
          ) : (
            <Copy size={16} aria-hidden='true' />
          )}
        </button>
      </div>
      {/* Typography's pre styles outrank plain utilities, so raise the specificity. */}
      <pre
        ref={ref}
        className='[&]:my-0 [&]:rounded-none [&]:border-0 [&]:bg-transparent [&]:text-zinc-900 dark:[&]:text-zinc-300'
      >
        {children}
      </pre>
      <span role='status' className='sr-only'>
        {copied ? 'Code copied' : ''}
      </span>
    </div>
  )
}
