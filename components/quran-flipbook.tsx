"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { BookOpen, Bookmark, ChevronLeft, ChevronRight } from "lucide-react"

import { cn } from "@/lib/utils"
import { getOfflineSurahList, quranAPI, type Ayah, type Surah } from "@/lib/quran-api"
import { getSurahInfo, getVerseText, parseVerseKey, type VerseKey } from "@/lib/quran-data"
import mushafPages from "@/data/mushaf-pages.json"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface QuranFlipBookProps {
  /**
   * Optional surah name (Arabic or English) that should be opened when the component loads.
   */
  initialSurahName?: string
  /**
   * Optional ayah number (within the surah) that should be highlighted when opened.
   */
  initialAyah?: number
  className?: string
}

type SurahPageInfo = { arabic: string; english: string }

type VerseDisplay = {
  verseKey: VerseKey
  surahNumber: number
  ayahNumber: number
  pageNumber: number
  text: string
  surahName: string
  englishName?: string
}

type MushafPage = {
  pageNumber: number
  verses: VerseDisplay[]
  surahNumbers: number[]
  surahNames: string[]
  surahEnglishNames: string[]
}

type MushafSpread = {
  left: MushafPage | null
  right: MushafPage | null
}

type FocusedAyah = {
  verse: VerseDisplay
  translation?: string
}

const TOTAL_PAGES = 604
const PAGE_DATA = mushafPages as Record<string, VerseKey[]>
const PAGE_LOOKUP = new Map<number, MushafPage>()
const SURAH_FIRST_PAGE = new Map<number, number>()
const VERSE_PAGE_LOOKUP = new Map<string, number>()
const MUSHAF_PAGES: MushafPage[] = []

for (let pageNumber = 1; pageNumber <= TOTAL_PAGES; pageNumber += 1) {
  const verseKeys = PAGE_DATA[String(pageNumber)] ?? []
  const surahInfoMap = new Map<number, SurahPageInfo>()
  const verses: VerseDisplay[] = verseKeys.map((verseKey) => {
    const { surahNumber, ayahNumber } = parseVerseKey(verseKey)
    const surahInfo = getSurahInfo(surahNumber)
    const arabicName = surahInfo?.arabicName ?? `سورة ${surahNumber}`
    const englishName = surahInfo?.englishName ?? `Surah ${surahNumber}`

    if (!surahInfoMap.has(surahNumber)) {
      surahInfoMap.set(surahNumber, { arabic: arabicName, english: englishName })
    }

    const verse: VerseDisplay = {
      verseKey,
      surahNumber,
      ayahNumber,
      pageNumber,
      text: getVerseText(verseKey),
      surahName: arabicName,
      englishName,
    }

    VERSE_PAGE_LOOKUP.set(verseKey, pageNumber)
    if (!SURAH_FIRST_PAGE.has(surahNumber)) {
      SURAH_FIRST_PAGE.set(surahNumber, pageNumber)
    }

    return verse
  })

  const surahNumbers = Array.from(surahInfoMap.keys())
  const surahNames = surahNumbers.map((number) => surahInfoMap.get(number)?.arabic ?? `سورة ${number}`)
  const surahEnglishNames = surahNumbers.map((number) => surahInfoMap.get(number)?.english ?? `Surah ${number}`)

  const page: MushafPage = {
    pageNumber,
    verses,
    surahNumbers,
    surahNames,
    surahEnglishNames,
  }

  PAGE_LOOKUP.set(pageNumber, page)
  MUSHAF_PAGES.push(page)
}

const MUSHAF_SPREADS: MushafSpread[] = []
for (let oddPage = 1; oddPage <= TOTAL_PAGES; oddPage += 2) {
  const rightPage = PAGE_LOOKUP.get(oddPage) ?? null
  const leftPage = PAGE_LOOKUP.get(oddPage + 1) ?? null
  MUSHAF_SPREADS.push({ left: leftPage, right: rightPage })
}

const TOTAL_SPREADS = MUSHAF_SPREADS.length

export function QuranFlipBook({ initialSurahName, initialAyah, className }: QuranFlipBookProps) {
  const [surahs, setSurahs] = useState<Surah[]>(() => getOfflineSurahList())
  const [selectedSurahNumber, setSelectedSurahNumber] = useState<number | null>(null)
  const [spreadIndex, setSpreadIndex] = useState(0)
  const [isFlipping, setIsFlipping] = useState(false)
  const [flipDirection, setFlipDirection] = useState<"forward" | "backward">("forward")
  const [focusedAyah, setFocusedAyah] = useState<FocusedAyah | null>(null)
  const [translationCache, setTranslationCache] = useState<Record<number, Record<number, string>>>({})

  const flipTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const initialSurahRef = useRef<string | null>(null)
  const isMountedRef = useRef(true)
  const loadingTranslationsRef = useRef(new Set<number>())
  const translationCacheRef = useRef<Record<number, Record<number, string>>>({})

  useEffect(() => {
    translationCacheRef.current = translationCache
  }, [translationCache])

  useEffect(() => {
    return () => {
      isMountedRef.current = false
      if (flipTimeoutRef.current) {
        clearTimeout(flipTimeoutRef.current)
      }
    }
  }, [])

  useEffect(() => {
    const loadSurahs = async () => {
      try {
        const surahList = await quranAPI.getSurahs()
        if (!isMountedRef.current) return
        if (surahList.length > 0) {
          setSurahs(surahList)
        }
      } catch (error) {
        console.error("Failed to load surah list", error)
      }
    }

    void loadSurahs()
  }, [])

  const currentSpread = useMemo(() => MUSHAF_SPREADS[spreadIndex] ?? null, [spreadIndex])

  const loadTranslation = useCallback(async (surahNumber: number) => {
    if (translationCacheRef.current[surahNumber] || loadingTranslationsRef.current.has(surahNumber)) {
      return
    }

    loadingTranslationsRef.current.add(surahNumber)
    try {
      const translationData = await quranAPI.getSurah(surahNumber, "en.sahih")
      if (!translationData || !isMountedRef.current) return

      const translationLookup: Record<number, string> = {}
      translationData.ayahs.forEach((ayah: Ayah) => {
        translationLookup[ayah.numberInSurah] = ayah.text
      })

      setTranslationCache((previous) => {
        if (previous[surahNumber]) {
          return previous
        }
        const next = { ...previous, [surahNumber]: translationLookup }
        return next
      })
    } catch (error) {
      console.error(`Failed to load translation for surah ${surahNumber}`, error)
    } finally {
      loadingTranslationsRef.current.delete(surahNumber)
    }
  }, [])

  const goToSurah = useCallback(
    (surahNumber: number, ayahNumber?: number) => {
      const targetPage = getPageForSurah(surahNumber, ayahNumber)
      if (!targetPage) {
        return
      }

      const nextSpreadIndex = getSpreadIndexForPage(targetPage)
      setSpreadIndex(nextSpreadIndex)

      const page = PAGE_LOOKUP.get(targetPage)
      if (!page) {
        return
      }

      const verseCandidate =
        page.verses.find(
          (verse) => verse.surahNumber === surahNumber && (typeof ayahNumber !== "number" || verse.ayahNumber === ayahNumber),
        ) ?? page.verses.find((verse) => verse.surahNumber === surahNumber) ?? page.verses[0]

      if (!verseCandidate) {
        return
      }

      const translation = translationCacheRef.current[verseCandidate.surahNumber]?.[verseCandidate.ayahNumber]
      setFocusedAyah({ verse: verseCandidate, translation })
      setSelectedSurahNumber(surahNumber)
      void loadTranslation(verseCandidate.surahNumber)
    },
    [loadTranslation],
  )

  useEffect(() => {
    if (surahs.length === 0) return

    if (initialSurahName) {
      const match = findSurahMatch(surahs, initialSurahName)
      if (match) {
        const alreadyFocused =
          focusedAyah?.verse.surahNumber === match.number &&
          (typeof initialAyah !== "number" || focusedAyah.verse.ayahNumber === initialAyah)

        if (!alreadyFocused || initialSurahRef.current !== initialSurahName) {
          initialSurahRef.current = initialSurahName
          goToSurah(match.number, initialAyah)
        }
        return
      }
    }

    if (!focusedAyah && surahs.length > 0) {
      const defaultSurah = surahs[0]
      goToSurah(defaultSurah.number)
    }
  }, [surahs, initialSurahName, initialAyah, goToSurah, focusedAyah])

  useEffect(() => {
    if (!initialSurahName && typeof initialAyah === "number" && selectedSurahNumber) {
      const alreadyFocused =
        focusedAyah?.verse.surahNumber === selectedSurahNumber &&
        focusedAyah.verse.ayahNumber === initialAyah
      if (!alreadyFocused) {
        goToSurah(selectedSurahNumber, initialAyah)
      }
    }
  }, [initialAyah, initialSurahName, selectedSurahNumber, goToSurah, focusedAyah])

  useEffect(() => {
    const spread = currentSpread
    if (!spread) return

    const visibleVerses = [...(spread.right?.verses ?? []), ...(spread.left?.verses ?? [])]
    if (visibleVerses.length === 0) {
      return
    }

    const focusVisible = focusedAyah
      ? visibleVerses.some((verse) => verse.verseKey === focusedAyah.verse.verseKey)
      : false

    if (!focusVisible) {
      const firstVerse = visibleVerses[0]
      const translation = translationCacheRef.current[firstVerse.surahNumber]?.[firstVerse.ayahNumber]
      setFocusedAyah({ verse: firstVerse, translation })
      setSelectedSurahNumber(firstVerse.surahNumber)
      void loadTranslation(firstVerse.surahNumber)
    }
  }, [currentSpread, focusedAyah, loadTranslation])

  useEffect(() => {
    if (!focusedAyah) {
      return
    }
    const translation =
      translationCache[focusedAyah.verse.surahNumber]?.[focusedAyah.verse.ayahNumber]
    if (translation && translation !== focusedAyah.translation) {
      setFocusedAyah((previous) => {
        if (!previous) return previous
        if (previous.verse.verseKey !== focusedAyah.verse.verseKey) return previous
        return { ...previous, translation }
      })
    }
  }, [focusedAyah, translationCache])

  useEffect(() => {
    if (focusedAyah) {
      setSelectedSurahNumber(focusedAyah.verse.surahNumber)
    }
  }, [focusedAyah])

  const handleSpreadTurn = useCallback(
    (direction: "forward" | "backward") => {
      if (isFlipping) return
      const nextIndex = direction === "forward" ? spreadIndex + 1 : spreadIndex - 1
      if (nextIndex < 0 || nextIndex >= TOTAL_SPREADS) return

      setFlipDirection(direction)
      setIsFlipping(true)

      if (flipTimeoutRef.current) {
        clearTimeout(flipTimeoutRef.current)
      }

      flipTimeoutRef.current = setTimeout(() => {
        setSpreadIndex(nextIndex)
        flipTimeoutRef.current = setTimeout(() => {
          setIsFlipping(false)
        }, 450)
      }, 150)
    },
    [isFlipping, spreadIndex],
  )

  const handleVerseFocus = useCallback(
    (verse: VerseDisplay) => {
      const translation = translationCacheRef.current[verse.surahNumber]?.[verse.ayahNumber]
      setFocusedAyah({ verse, translation })
      setSelectedSurahNumber(verse.surahNumber)
      void loadTranslation(verse.surahNumber)
    },
    [loadTranslation],
  )

  const currentPageNumbers = useMemo(() => {
    const numbers = [currentSpread?.right?.pageNumber, currentSpread?.left?.pageNumber]
      .filter((value): value is number => typeof value === "number")
      .sort((a, b) => a - b)
    return numbers
  }, [currentSpread])

  const currentSurah = selectedSurahNumber
    ? surahs.find((surah) => surah.number === selectedSurahNumber) ?? null
    : null

  const surahDescription = currentSurah
    ? `${currentSurah.englishNameTranslation} • ${currentSurah.numberOfAyahs} Ayahs • ${currentSurah.revelationType}`
    : ""

  return (
    <Card className={cn("border-maroon-100 bg-cream-50/60 shadow-sm", className)}>
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <CardTitle className="flex items-center gap-2 text-2xl font-semibold text-maroon-800">
          <BookOpen className="h-6 w-6 text-maroon-600" />
          Flipbook Mushaf Explorer
        </CardTitle>
        <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
          <Select
            value={selectedSurahNumber ? String(selectedSurahNumber) : undefined}
            onValueChange={(value) => {
              const surahNumber = Number(value)
              goToSurah(surahNumber)
            }}
          >
            <SelectTrigger className="w-56 bg-white">
              <SelectValue placeholder="Select a surah" />
            </SelectTrigger>
            <SelectContent>
              {surahs.map((surah) => (
                <SelectItem key={surah.number} value={String(surah.number)}>
                  {surah.number}. {surah.englishName} ({surah.englishNameTranslation})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {currentSurah && (
            <Badge variant="outline" className="justify-center border-maroon-200 text-maroon-700">
              {surahDescription}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <Button
            variant="outline"
            className="bg-white"
            disabled={spreadIndex === 0 || isFlipping}
            onClick={() => handleSpreadTurn("backward")}
          >
            <ChevronLeft className="h-4 w-4" />
            Previous pages
          </Button>
          <div className="text-center text-sm text-gray-600">
            <>
              Spread {spreadIndex + 1} of {TOTAL_SPREADS}
              {currentPageNumbers.length > 0 && (
                <div className="text-xs text-gray-500">
                  Mushaf page{currentPageNumbers.length === 1 ? "" : "s"} {currentPageNumbers.join(" & ")}
                </div>
              )}
            </>
          </div>
          <Button
            variant="outline"
            className="bg-white"
            disabled={spreadIndex >= TOTAL_SPREADS - 1 || isFlipping}
            onClick={() => handleSpreadTurn("forward")}
          >
            Next pages
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="flipbook-perspective">
          <div
            className={cn(
              "flipbook-spread mx-auto flex max-w-4xl gap-6 px-4",
              isFlipping && flipDirection === "forward" && "flip-forward",
              isFlipping && flipDirection === "backward" && "flip-backward",
            )}
          >
            {renderPage(currentSpread?.left ?? null, "left", focusedAyah, translationCache, handleVerseFocus)}
            {renderPage(currentSpread?.right ?? null, "right", focusedAyah, translationCache, handleVerseFocus)}
          </div>
        </div>

        <div className="rounded-lg border border-maroon-100 bg-white/90 p-5 shadow-inner">
          <div className="flex items-center gap-2 text-sm font-semibold text-maroon-800">
            <Bookmark className="h-4 w-4" /> Focused Ayah Snippet
          </div>
          {focusedAyah ? (
            <div className="mt-3 space-y-3">
              <div className="text-right text-2xl font-arabic leading-relaxed text-maroon-900" dir="rtl">
                {focusedAyah.verse.text}
              </div>
              <p className="text-sm text-gray-700">
                {focusedAyah.translation ?? "Translation loading…"}
              </p>
              <p className="text-xs text-gray-500">
                {focusedAyah.verse.englishName ?? "Surah"} • Ayah {focusedAyah.verse.ayahNumber} • Page {focusedAyah.verse.pageNumber}
              </p>
            </div>
          ) : (
            <p className="mt-3 text-sm text-gray-500">Hover or focus an āyah to preview its translation snippet.</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function findSurahMatch(surahs: Surah[], name?: string): Surah | undefined {
  if (!name) return undefined
  const lowered = name.toLowerCase()
  return surahs.find((surah) => {
    return (
      surah.englishName.toLowerCase() === lowered ||
      surah.englishNameTranslation.toLowerCase() === lowered ||
      surah.name.toLowerCase() === lowered
    )
  })
}

function getPageForSurah(surahNumber: number, ayahNumber?: number): number | undefined {
  if (typeof ayahNumber === "number") {
    return VERSE_PAGE_LOOKUP.get(`${surahNumber}:${ayahNumber}`)
  }
  return SURAH_FIRST_PAGE.get(surahNumber)
}

function getSpreadIndexForPage(pageNumber: number): number {
  return Math.max(0, Math.floor((pageNumber - 1) / 2))
}

function renderPage(
  page: MushafPage | null,
  side: "left" | "right",
  focusedAyah: FocusedAyah | null,
  translationCache: Record<number, Record<number, string>>,
  onVerseFocus: (verse: VerseDisplay) => void,
) {
  return (
    <div
      className={cn(
        "flipbook-page w-full max-w-sm flex-1 rounded-xl border border-maroon-100/80 bg-white/95 p-5 shadow-lg",
        side === "left" ? "origin-right" : "origin-left",
      )}
    >
      {page ? (
        <div className="flex h-full flex-col gap-4">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>Page {page.pageNumber}</span>
            <span className="text-right">
              {page.surahEnglishNames.join(" • ")}
            </span>
          </div>
          <div className="flex-1 space-y-4">
            {page.verses.map((verse) => {
              const isFocused = focusedAyah?.verse.verseKey === verse.verseKey
              const translation = translationCache[verse.surahNumber]?.[verse.ayahNumber]
              return (
                <button
                  key={verse.verseKey}
                  type="button"
                  onMouseEnter={() => onVerseFocus(verse)}
                  onFocus={() => onVerseFocus(verse)}
                  onClick={() => onVerseFocus(verse)}
                  className={cn(
                    "w-full rounded-lg border border-transparent bg-white/80 p-3 text-right shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-maroon-400",
                    "hover:border-maroon-200",
                    isFocused && "border-maroon-300 bg-maroon-50 shadow-md",
                  )}
                >
                  <div className="flex items-center justify-between text-[0.65rem] text-gray-500">
                    <span>
                      {verse.surahName} • آية {verse.ayahNumber}
                    </span>
                    <span>Page {verse.pageNumber}</span>
                  </div>
                  <div className="mt-2 text-2xl font-arabic leading-relaxed text-maroon-900" dir="rtl">
                    {verse.text}
                  </div>
                  {translation && (
                    <p className="mt-3 text-[0.75rem] text-gray-600">
                      {createTranslationSnippet(translation)}
                    </p>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      ) : (
        <div className="flex h-full items-center justify-center text-sm text-gray-400">No content</div>
      )}
    </div>
  )
}

function createTranslationSnippet(text: string, maxWords = 18): string {
  const words = text.split(/\s+/)
  if (words.length <= maxWords) {
    return text
  }
  return `${words.slice(0, maxWords).join(" ")}…`
}
