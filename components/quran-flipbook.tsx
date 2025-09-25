"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { BookOpen, Bookmark, ChevronLeft, ChevronRight, Loader2 } from "lucide-react"

import { cn } from "@/lib/utils"
import { quranAPI, type Ayah, type Surah } from "@/lib/quran-api"
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

interface QuranPage {
  pageNumber: number
  ayahs: Ayah[]
}

interface QuranSpread {
  left?: QuranPage
  right?: QuranPage
}

interface FocusedAyah {
  ayah: Ayah
  translation?: string
}

export function QuranFlipBook({ initialSurahName, initialAyah, className }: QuranFlipBookProps) {
  const [surahs, setSurahs] = useState<Surah[]>([])
  const [selectedSurah, setSelectedSurah] = useState<Surah | null>(null)
  const [pages, setPages] = useState<QuranPage[]>([])
  const [translationMap, setTranslationMap] = useState<Record<number, string>>({})
  const [spreadIndex, setSpreadIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [isFlipping, setIsFlipping] = useState(false)
  const [flipDirection, setFlipDirection] = useState<"forward" | "backward">("forward")
  const [focusedAyah, setFocusedAyah] = useState<FocusedAyah | null>(null)

  const flipTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const initialSurahRef = useRef<string | undefined>(undefined)
  const isMountedRef = useRef(true)

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
        setSurahs(surahList)
      } catch (error) {
        console.error("Failed to load surah list", error)
      }
    }

    void loadSurahs()
  }, [])

  const spreads = useMemo(() => {
    const spreadCollection: QuranSpread[] = []
    for (let index = 0; index < pages.length; index += 2) {
      spreadCollection.push({
        left: pages[index],
        right: pages[index + 1],
      })
    }
    return spreadCollection
  }, [pages])

  const currentSpread = useMemo(() => spreads[spreadIndex] ?? null, [spreads, spreadIndex])

  const handleSurahLoad = async (surahNumber: number, focusAyah?: number) => {
    setIsLoading(true)
    try {
      const [arabicData, translationData] = await Promise.all([
        quranAPI.getSurah(surahNumber, "quran-uthmani"),
        quranAPI.getSurah(surahNumber, "en.sahih"),
      ])

      if (!isMountedRef.current) return

      if (arabicData) {
        setSelectedSurah(arabicData.surah)

        const groupedPages = groupAyahsByPage(arabicData.ayahs)
        setPages(groupedPages)

        const translationLookup: Record<number, string> = {}
        translationData?.ayahs.forEach((ayah) => {
          translationLookup[ayah.numberInSurah] = ayah.text
        })
        setTranslationMap(translationLookup)

        const targetPageIndex = focusAyah
          ? groupedPages.findIndex((page) => page.ayahs.some((ayah) => ayah.numberInSurah === focusAyah))
          : 0

        const nextSpreadIndex = targetPageIndex >= 0 ? Math.floor(targetPageIndex / 2) : 0
        setSpreadIndex(nextSpreadIndex)

        const fallbackAyah = focusAyah
          ? groupedPages[targetPageIndex]?.ayahs.find((ayah) => ayah.numberInSurah === focusAyah)
          : groupedPages[0]?.ayahs[0]

        if (fallbackAyah) {
          setFocusedAyah({ ayah: fallbackAyah, translation: translationLookup[fallbackAyah.numberInSurah] })
        } else {
          setFocusedAyah(null)
        }
      }
    } catch (error) {
      console.error("Failed to load surah content", error)
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false)
      }
    }
  }

  useEffect(() => {
    if (surahs.length === 0) return

    // Initial load or when parent requests a new surah
    if (!selectedSurah) {
      const target = findSurahMatch(surahs, initialSurahName) ?? surahs[0]
      initialSurahRef.current = initialSurahName
      if (target) {
        void handleSurahLoad(target.number, initialAyah)
      }
      return
    }

    if (initialSurahName && initialSurahName !== initialSurahRef.current) {
      const target = findSurahMatch(surahs, initialSurahName)
      if (target) {
        initialSurahRef.current = initialSurahName
        void handleSurahLoad(target.number, initialAyah)
      }
    }
  }, [surahs, selectedSurah, initialSurahName, initialAyah])

  useEffect(() => {
    if (!initialAyah || pages.length === 0) return
    if (initialSurahName) {
      const matchesInitial = [
        selectedSurah?.englishName,
        selectedSurah?.englishNameTranslation,
        selectedSurah?.name,
      ]
        .filter(Boolean)
        .some((name) => name?.toLowerCase() === initialSurahName.toLowerCase())

      if (!matchesInitial) {
        return
      }
    }

    const targetPageIndex = pages.findIndex((page) => page.ayahs.some((ayah) => ayah.numberInSurah === initialAyah))
    if (targetPageIndex >= 0) {
      const nextSpreadIndex = Math.floor(targetPageIndex / 2)
      if (nextSpreadIndex !== spreadIndex) {
        setSpreadIndex(nextSpreadIndex)
      }
      const ayah = pages[targetPageIndex].ayahs.find((pageAyah) => pageAyah.numberInSurah === initialAyah)
      if (ayah) {
        setFocusedAyah({ ayah, translation: translationMap[ayah.numberInSurah] })
      }
    }
  }, [initialAyah, pages, translationMap, initialSurahName, selectedSurah, spreadIndex])

  useEffect(() => {
    const firstVisibleAyah = currentSpread?.left?.ayahs[0] ?? currentSpread?.right?.ayahs[0]
    if (!firstVisibleAyah) return

    const focusIsVisible = focusedAyah
      ? [currentSpread?.left, currentSpread?.right].some((page) =>
          page?.ayahs.some((ayah) => ayah.number === focusedAyah.ayah.number),
        )
      : false

    if (focusIsVisible) {
      return
    }

    setFocusedAyah({ ayah: firstVisibleAyah, translation: translationMap[firstVisibleAyah.numberInSurah] })
  }, [currentSpread, focusedAyah, translationMap])

  const handleSpreadTurn = (direction: "forward" | "backward") => {
    if (isFlipping) return
    const nextIndex = direction === "forward" ? spreadIndex + 1 : spreadIndex - 1
    if (nextIndex < 0 || nextIndex >= spreads.length) return

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
  }

  const handleAyahFocus = (ayah: Ayah) => {
    setFocusedAyah({ ayah, translation: translationMap[ayah.numberInSurah] })
  }

  const currentPageNumbers = [currentSpread?.left?.pageNumber, currentSpread?.right?.pageNumber].filter(
    (value): value is number => typeof value === "number",
  )

  const surahDescription = selectedSurah
    ? `${selectedSurah.englishNameTranslation} • ${selectedSurah.numberOfAyahs} Ayahs • ${selectedSurah.revelationType}`
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
            value={selectedSurah ? String(selectedSurah.number) : undefined}
            onValueChange={(value) => {
              const surahNumber = Number(value)
              initialSurahRef.current = initialSurahName
              void handleSurahLoad(surahNumber)
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
          {selectedSurah && (
            <Badge variant="outline" className="justify-center border-maroon-200 text-maroon-700">
              {surahDescription}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-16 text-maroon-700">
            <Loader2 className="mr-2 h-6 w-6 animate-spin" /> Loading mushaf pages…
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between gap-4">
              <Button
                variant="outline"
                className="bg-white"
                disabled={spreadIndex === 0 || spreads.length === 0 || isFlipping}
                onClick={() => handleSpreadTurn("backward")}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous pages
              </Button>
              <div className="text-center text-sm text-gray-600">
                {spreads.length > 0 ? (
                  <>
                    Spread {spreadIndex + 1} of {spreads.length}
                    {currentPageNumbers.length > 0 && (
                      <div className="text-xs text-gray-500">Mushaf page{currentPageNumbers.length === 1 ? "" : "s"} {currentPageNumbers.join(" & ")}</div>
                    )}
                  </>
                ) : (
                  <span>Select a surah to begin exploring.</span>
                )}
              </div>
              <Button
                variant="outline"
                className="bg-white"
                disabled={spreadIndex >= spreads.length - 1 || spreads.length === 0 || isFlipping}
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
                {renderPage(currentSpread?.left, "left", selectedSurah, translationMap, focusedAyah, handleAyahFocus)}
                {renderPage(currentSpread?.right, "right", selectedSurah, translationMap, focusedAyah, handleAyahFocus)}
              </div>
            </div>

            <div className="rounded-lg border border-maroon-100 bg-white/90 p-5 shadow-inner">
              <div className="flex items-center gap-2 text-sm font-semibold text-maroon-800">
                <Bookmark className="h-4 w-4" /> Focused Ayah Snippet
              </div>
              {focusedAyah ? (
                <div className="mt-3 space-y-3">
                  <div className="text-right text-2xl font-arabic leading-relaxed text-maroon-900" dir="rtl">
                    {focusedAyah.ayah.text}
                  </div>
                  <p className="text-sm text-gray-700">
                    {focusedAyah.translation ?? "Translation loading…"}
                  </p>
                  <p className="text-xs text-gray-500">
                    Surah {selectedSurah?.englishName ?? ""} • Ayah {focusedAyah.ayah.numberInSurah} • Page {focusedAyah.ayah.page}
                  </p>
                </div>
              ) : (
                <p className="mt-3 text-sm text-gray-500">Hover over an ayah to preview its translation snippet.</p>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

function groupAyahsByPage(ayahs: Ayah[]): QuranPage[] {
  const pageMap = new Map<number, Ayah[]>()
  ayahs.forEach((ayah) => {
    if (!pageMap.has(ayah.page)) {
      pageMap.set(ayah.page, [])
    }
    pageMap.get(ayah.page)?.push(ayah)
  })

  return Array.from(pageMap.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([pageNumber, pageAyahs]) => ({
      pageNumber,
      ayahs: pageAyahs.sort((a, b) => a.numberInSurah - b.numberInSurah),
    }))
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

function renderPage(
  page: QuranPage | undefined,
  side: "left" | "right",
  selectedSurah: Surah | null,
  translationMap: Record<number, string>,
  focusedAyah: FocusedAyah | null,
  onAyahFocus: (ayah: Ayah) => void,
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
            <span>{selectedSurah?.englishName}</span>
          </div>
          <div className="flex-1 space-y-4">
            {page.ayahs.map((ayah) => {
              const isFocused = focusedAyah?.ayah.number === ayah.number
              const translation = translationMap[ayah.numberInSurah]
              return (
                <button
                  key={ayah.number}
                  type="button"
                  onMouseEnter={() => onAyahFocus(ayah)}
                  onFocus={() => onAyahFocus(ayah)}
                  className={cn(
                    "w-full rounded-lg border border-transparent bg-white/80 p-3 text-right shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-maroon-400",
                    "hover:border-maroon-200",
                    isFocused && "border-maroon-300 bg-maroon-50 shadow-md",
                  )}
                >
                  <div className="flex items-center justify-between text-[0.65rem] text-gray-500">
                    <span>Ayah {ayah.numberInSurah}</span>
                    <span>Juz {ayah.juz}</span>
                  </div>
                  <div className="mt-2 text-2xl font-arabic leading-relaxed text-maroon-900" dir="rtl">
                    {ayah.text}
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
