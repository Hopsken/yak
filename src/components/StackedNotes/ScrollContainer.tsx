'use client'

import { paneSettings } from '@/consts'
import React, { PropsWithChildren, useCallback, useMemo } from 'react'
import { useSetStackedByScroll } from './context'
import throttle from 'lodash.throttle'

const throttleTime = 16

export function ScrollContainer({
  panes,
  children
}: PropsWithChildren<{ panes: number }>) {
  const setStackedByScroll = useSetStackedByScroll()
  const onScroll = useMemo(() => {
    return throttle((event: React.UIEvent<HTMLDivElement>) => {
      const { scrollLeft } = event.target as HTMLDivElement
      setStackedByScroll(scrollLeft)
    }, throttleTime)
  }, [setStackedByScroll])

  return (
    <main
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
