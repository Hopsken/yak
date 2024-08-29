'use client'

import { paneSettings } from '@/consts'
import React, { useMemo } from 'react'
import { Prose } from '../Prose'
import clsx from 'clsx'
import { useStackedStore } from './context'

type Props = {
  index: number
  title: string
  children: React.ReactNode
}

export function StickyNote({ index, title, children }: Props) {
  const offset = useMemo(() => calcOffset(index), [index])
  const { stacked, scrollTo } = useStackedStore()
  const willBeObscured = stacked > index + 0.8
  const withShadow = stacked > 0 && index <= stacked + 1

  return (
    <div
      className={clsx(
        'sticky top-0 w-[625px] min-w-[625px] overflow-y-auto border-l bg-white first-of-type:border-none',
        { 'shadow-xl': withShadow }
      )}
      style={offset}
    >
      <div
        className={clsx(
          'h-full overflow-hidden p-8 [transition:box-shadow_100ms_linear,opacity_75ms_linear]',
          {
            'opacity-0': willBeObscured
          }
        )}
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
