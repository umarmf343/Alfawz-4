"use client"

import { useEffect, useMemo, useState } from "react"

import quranText from "@/data/quran/quran-uthmani.json"
import { normalizeVerseKey } from "@/lib/verse-validator"

const verseCache = new Map<string, string>()
const verseSource = quranText as Record<string, string>

export interface VersePreview {
  key: string
  text: string
}

export function getCachedVerseText(key: string): string {
  const normalized = normalizeVerseKey(key)
  if (!normalized) {
    return ""
  }
  if (verseCache.has(normalized)) {
    return verseCache.get(normalized) ?? ""
  }
  const text = verseSource[normalized] ?? ""
  verseCache.set(normalized, text)
  return text
}

export function useQuranVerses(keys: string[]): { verses: VersePreview[]; isLoading: boolean } {
  const [verses, setVerses] = useState<VersePreview[]>([])

  const normalizedSignature = useMemo(
    () => keys.map((key) => normalizeVerseKey(key)).join("|"),
    [keys],
  )

  useEffect(() => {
    const normalizedKeys = keys.map((key) => normalizeVerseKey(key)).filter((key) => key.length > 0)
    const nextVerses = normalizedKeys.map((key) => ({ key, text: getCachedVerseText(key) }))
    setVerses(nextVerses)
  }, [normalizedSignature, keys])

  return { verses, isLoading: false }
}
