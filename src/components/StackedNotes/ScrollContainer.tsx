'use client'

import { paneSettings } from '@/consts'
import React, {
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
      className='flex grow overflow-x-auto overflow-y-auto'
      onScroll={onScroll}
    >
      <div
        className='grow-1 flex'
        style={{ width: panes * paneSettings.width }}
      >
        {children}
      </div>
    </main>
  )
}
