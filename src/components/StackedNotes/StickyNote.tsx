'use client'

import { paneSettings } from '@/consts'
import React, { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import { Prose } from '../Prose'
import clsx from 'clsx'
import { useStackedStore } from './context'
import scrollIntoView from 'scroll-into-view-if-needed'

type Props = {
  index: number
  title: string
  children: React.ReactNode
}

export function StickyNote({ index, title, children }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const offset = useMemo(() => calcOffset(index), [index])
  const { stacked, scrollTo } = useStackedStore()
  const willBeObscured = stacked > index + 0.8
  const withShadow = stacked > 0 && index <= stacked + 1

  useLayoutEffect(() => {
    if (ref.current) {
      scrollIntoView(ref.current, {
        scrollMode: 'if-needed',
        behavior: 'smooth',
        inline: 'center'
      })
    }
  }, [])

  return (
    <div
      ref={ref}
      className={clsx(
        'sticky top-0 w-full overflow-y-auto border-t bg-white [transition:box-shadow_100ms_linear] first-of-type:border-none dark:border-zinc-700 dark:bg-zinc-800 md:w-[625px] md:min-w-[625px] md:border-l md:border-t-0',
        { 'shadow-xl': withShadow }
      )}
      style={offset}
    >
      <div
        className={clsx('h-full p-8 [transition:opacity_75ms_linear]', {
          'opacity-0': willBeObscured
        })}
      >
        <Prose title={title}>{children}</Prose>
      </div>

      {willBeObscured && (
        <div
          onClick={() => scrollTo(index)}
          className='absolute bottom-0 left-0 top-0 mt-10 w-[40px] cursor-pointer overflow-hidden text-lg font-medium leading-[40px] tracking-wide'
          style={{ writingMode: 'vertical-lr' }}
        >
          {title}
        </div>
      )}
    </div>
  )
}

function calcOffset(index: number) {
  return {
    left: paneSettings.labelWidth * index
    // right: 0 - paneSettings.width + paneSettings.labelWidth
  }
}
