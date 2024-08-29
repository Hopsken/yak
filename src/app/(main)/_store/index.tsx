'use client'

import { NoteEntry } from '@/type'
import { PropsWithChildren, createContext, useContext, useMemo } from 'react'
import { createStore, useStore } from 'zustand'

type NotesStore = {
  notes: NoteEntry[]
  appendNote: (entry: NoteEntry) => void
}

function createNotesStore(first?: NoteEntry) {
  return createStore<NotesStore>(set => ({
    notes: first ? [first] : [],
    appendNote: entry => {
      set(prev => ({ ...prev, notes: [...prev.notes, entry] }))
    }
  }))
}

const NotesStoreContext = createContext(createNotesStore())

export function NoteStoreProvider({ children }: PropsWithChildren<{}>) {
  const store = useMemo(() => {
    return createNotesStore()
  }, [])
  return (
    <NotesStoreContext.Provider value={store}>
      {children}
    </NotesStoreContext.Provider>
  )
}

export function useNotesStore() {
  return useContext(NotesStoreContext)
}

export function useNotes() {
  const store = useNotesStore()
  return useStore(store, s => s.notes)
}
