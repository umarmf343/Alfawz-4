"use client"

import { createContext, useContext, useMemo, useState, type ReactNode } from "react"

export type VerseSelection = {
  verseKey: string
  surahNumber: number
  ayahNumber: number
  pageNumber: number
  text: string
  surahName: string
  englishName?: string
}

interface QuranReaderContextValue {
  currentVerse: VerseSelection | null
  setCurrentVerse: (selection: VerseSelection | null) => void
}

const QuranReaderContext = createContext<QuranReaderContextValue | undefined>(undefined)

export function QuranReaderProvider({ children }: { children: ReactNode }) {
  const [currentVerse, setCurrentVerse] = useState<VerseSelection | null>(null)
  const value = useMemo(() => ({ currentVerse, setCurrentVerse }), [currentVerse])

  return <QuranReaderContext.Provider value={value}>{children}</QuranReaderContext.Provider>
}

export function useQuranReader() {
  const context = useContext(QuranReaderContext)
  if (!context) {
    throw new Error("useQuranReader must be used within a QuranReaderProvider")
  }
  return context
}
