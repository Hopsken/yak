'use client'

import { paneSettings } from '@/consts'
import React, {
  CSSProperties,
  PropsWithChildren,
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef
} from 'react'
import { useSetScrollTo, useSetStackedByScroll } from './context'
import throttle from 'lodash.throttle'

const throttleTime = 16

export function ScrollContainer({
  panes,
  children
}: PropsWithChildren<{ panes: number }>) {
  const containerRef = useRef<HTMLDivElement>(null)
  const setScrollTo = useSetScrollTo()

  const setStackedByScroll = useSetStackedByScroll()
  const onScroll = useMemo(() => {
    return throttle((event: React.UIEvent<HTMLDivElement>) => {
      const { scrollLeft } = event.target as HTMLDivElement
      setStackedByScroll(scrollLeft)
    }, throttleTime)
  }, [setStackedByScroll])

  useLayoutEffect(() => {
    const scrollTo = (index: number) => {
      containerRef.current?.scrollTo({
        top: 0,
        left: index * (paneSettings.width - paneSettings.labelWidth),
        behavior: 'smooth'
      })
    }
    setScrollTo(scrollTo)
  }, [setScrollTo])

  return (
    <main
      ref={containerRef}
      className='flex grow flex-col overflow-x-hidden md:flex-row md:overflow-x-auto md:overflow-y-hidden'
      onScroll={onScroll}
    >
      <div
        className='w-full md:flex md:w-(--panes-width) md:grow'
        style={
          {
            '--panes-width': `calc(${paneSettings.width} * ${panes})`
          } as CSSProperties
        }
      >
        {children}
      </div>
    </main>
  )
}
