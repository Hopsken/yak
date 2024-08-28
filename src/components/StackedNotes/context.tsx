import { paneSettings } from '@/consts'
import { PropsWithChildren, createContext, useContext } from 'react'
import { createStore, useStore } from 'zustand'

interface Store {
  scroll: number
  stacked: number
  scrollTo: (index: number) => void
  setScrollTo: (fn: (index: number) => void) => void
  setStackedByScroll: (offset: number) => void
}

const store = createStore<Store>(set => ({
  scroll: 0,
  stacked: 0,
  scrollTo: () => void 0,
  setScrollTo: fn => {
    set(prev => ({ ...prev, scrollTo: fn }))
  },
  setStackedByScroll: scroll => {
    set(prev => ({
      ...prev,
      scroll,
      stacked: scroll / (paneSettings.width - paneSettings.labelWidth)
    }))
  }
}))

const StoreContext = createContext(store)

export function StackedProvider({ children }: PropsWithChildren<{}>) {
  return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>
}

export const useSetStackedByScroll = () => {
  const store = useContext(StoreContext)
  return useStore(store, s => s.setStackedByScroll)
}

export const useSetScrollTo = () => {
  const store = useContext(StoreContext)
  return useStore(store, s => s.setScrollTo)
}

export const useStackedStore = () => {
  const store = useContext(StoreContext)
  return useStore(store)
}
