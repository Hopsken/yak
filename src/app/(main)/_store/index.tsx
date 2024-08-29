'use client'

import { PropsWithChildren, createContext, useContext, useMemo } from 'react'

type Context = {
  root: string
  notes: string[]
}

const NotesContext = createContext<Context>({
  root: '',
  notes: []
})

export function NotesProvider({
  children,
  root,
  notes
}: PropsWithChildren<{
  root: string
  notes: string[]
}>) {
  const value = useMemo(
    () => ({
      root,
      notes
    }),
    [root, notes]
  )
  return <NotesContext.Provider value={value}>{children}</NotesContext.Provider>
}

export function useNotes() {
  return useContext(NotesContext)
}
