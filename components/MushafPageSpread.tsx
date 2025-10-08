"use client"

import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react"

import { cn } from "@/lib/utils"
import {
  formatArabicNumber,
  getPageMarkers,
  getPageVerses,
  getVerseDisplayData,
  getPageForVerse,
  resolveSurahNumber,
  TOTAL_MUSHAF_PAGES,
  type VerseKey,
} from "@/lib/mushaf-data"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useOptionalQuranReader } from "@/hooks/use-quran-reader"
import { useMushafNavigation } from "@/hooks/useMushafNavigation"

interface MushafPageSpreadProps {
  className?: string
  initialPage?: number
  initialSurah?: number
  initialSurahName?: string
  initialAyah?: number
  initialVerseKey?: VerseKey
  activeVerseKey?: VerseKey | null
}

type VerseDisplay = ReturnType<typeof getVerseDisplayData> & { pageNumber: number }

type PageContent = {
  pageNumber: number
  verses: VerseDisplay[]
  markers: ReturnType<typeof getPageMarkers>
}

const HIGHLIGHT_TIMEOUT = 2000

function resolveInitialSettings({
  initialPage,
  initialVerseKey,
  initialSurah,
  initialSurahName,
  initialAyah,
}: {
  initialPage?: number
  initialVerseKey?: VerseKey
  initialSurah?: number
  initialSurahName?: string
  initialAyah?: number
}) {
  if (initialVerseKey) {
    const page = getPageForVerse(initialVerseKey)
    if (page) {
      return { page, verseKey: initialVerseKey }
    }
  }

  const surahNumber =
    initialSurah ?? resolveSurahNumber(initialSurahName) ?? null

  if (surahNumber) {
    const ayah = initialAyah && initialAyah > 0 ? initialAyah : 1
    const tentativeVerse = `${surahNumber}:${ayah}` as VerseKey
    const page = getPageForVerse(tentativeVerse)
    if (page) {
      return { page, verseKey: tentativeVerse }
    }
  }

  if (initialPage && initialPage >= 1 && initialPage <= TOTAL_MUSHAF_PAGES) {
    return { page: initialPage, verseKey: null }
  }

  return { page: 1, verseKey: null }
}

function createPageContent(pageNumber: number): PageContent {
  const verseKeys = getPageVerses(pageNumber)
  const verses = verseKeys.map((verseKey) => ({
    ...getVerseDisplayData(verseKey),
    pageNumber,
  }))
  const markers = getPageMarkers(pageNumber)
  return { pageNumber, verses, markers }
}

type VerseCardProps = {
  verse: VerseDisplay
  isActive: boolean
  onSelect: (verse: VerseDisplay) => void
}

const VerseCard = ({ verse, isActive, onSelect }: VerseCardProps) => {
  const handleClick = useCallback(() => onSelect(verse), [onSelect, verse])
  const handleKey = useCallback(
    (event: KeyboardEvent<HTMLSpanElement>) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault()
        onSelect(verse)
      }
    },
    [onSelect, verse],
  )

  return (
    <span
      data-verse={verse.verseKey}
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={handleKey}
      aria-label={`${verse.surahName}، الآية ${formatArabicNumber(verse.ayahNumber)}`}
      className={cn(
        "verse mx-1 inline-block cursor-pointer rounded-md px-1 py-0.5 text-[1.35rem] leading-relaxed transition focus:outline-none focus:ring-2 focus:ring-emerald-500",
        isActive
          ? "bg-amber-200/80 text-emerald-900 ring-2 ring-green-500"
          : "hover:bg-amber-100/80",
      )}
    >
      {verse.text}
    </span>
  )
}

export function MushafPageSpread({
  className,
  initialPage,
  initialSurah,
  initialSurahName,
  initialAyah,
  initialVerseKey,
  activeVerseKey: activeVerseKeyProp,
}: MushafPageSpreadProps) {
  const initial = useMemo(
    () =>
      resolveInitialSettings({
        initialPage,
        initialSurah,
        initialSurahName,
        initialAyah,
        initialVerseKey,
      }),
    [initialAyah, initialPage, initialSurah, initialSurahName, initialVerseKey],
  )
  const readerContext = useOptionalQuranReader()
  const [isNightMode, setIsNightMode] = useState(false)
  const [transientHighlight, setTransientHighlight] = useState<VerseKey | null>(
    initial.verseKey,
  )
  const highlightTimer = useRef<NodeJS.Timeout | null>(null)

  const activeVerseKey = activeVerseKeyProp ?? readerContext?.currentVerse?.verseKey ?? null

  const navigation = useMushafNavigation({
    initialPage: initial.page,
    activeVerseKey,
  })

  const rightPageContent = useMemo(() => createPageContent(navigation.rightPage), [navigation.rightPage])
  const leftPageContent = useMemo(
    () => (navigation.leftPage ? createPageContent(navigation.leftPage) : null),
    [navigation.leftPage],
  )

  useEffect(() => {
    if (activeVerseKey) {
      setTransientHighlight(activeVerseKey)
    }
  }, [activeVerseKey])

  const handleVerseSelect = useCallback(
    (verse: VerseDisplay) => {
      if (highlightTimer.current) {
        clearTimeout(highlightTimer.current)
      }
      setTransientHighlight(verse.verseKey)
      highlightTimer.current = setTimeout(() => {
        setTransientHighlight(null)
      }, HIGHLIGHT_TIMEOUT)

      readerContext?.setCurrentVerse({
        verseKey: verse.verseKey,
        surahNumber: verse.surahNumber,
        ayahNumber: verse.ayahNumber,
        pageNumber: verse.pageNumber,
        text: verse.text,
        surahName: verse.surahName,
        englishName: verse.surahEnglishName,
      })
    },
    [readerContext],
  )

  useEffect(() => {
    return () => {
      if (highlightTimer.current) {
        clearTimeout(highlightTimer.current)
      }
    }
  }, [])

  const toggleNightMode = useCallback(() => {
    setIsNightMode((previous) => !previous)
  }, [])

  const handleSubmit = useCallback(
    (event: React.FormEvent) => {
      event.preventDefault()
      navigation.submitPageInput()
    },
    [navigation],
  )

  const spreadAriaLabel = useMemo(() => {
    const base = navigation.leftPage
      ? `${formatArabicNumber(navigation.rightPage)} – ${formatArabicNumber(navigation.leftPage)}`
      : formatArabicNumber(navigation.rightPage)
    return `صفحة ${base} من المصحف`
  }, [navigation.leftPage, navigation.rightPage])

  const renderPage = useCallback(
    (content: PageContent | null, side: "left" | "right") => {
      if (!content) {
        return (
          <div
            key={`${side}-empty`}
            className={cn(
              "mushaf-page flex w-full max-w-[26rem] flex-1 flex-col justify-center rounded-3xl border border-dashed border-stone-300/60 bg-transparent p-8 text-center text-sm text-stone-400 print:border-0",
              isNightMode ? "border-emerald-700/40 text-emerald-200/40" : "",
            )}
            aria-hidden
          >
            الصفحة فارغة
          </div>
        )
      }

      const activeKeys = new Set([activeVerseKey, transientHighlight].filter(Boolean) as VerseKey[])

      return (
        <article
          key={content.pageNumber}
          dir="rtl"
          className={cn(
            "mushaf-page relative flex w-full max-w-[26rem] flex-col gap-4 rounded-3xl border border-stone-300 bg-gradient-to-br from-amber-50 via-amber-100/60 to-amber-50 px-7 py-8 text-slate-900 shadow-2xl shadow-amber-200/40 transition-colors print:bg-white print:shadow-none",
            isNightMode &&
              "border-emerald-900/60 from-emerald-950 via-emerald-900/80 to-emerald-950 text-emerald-100 shadow-emerald-950/30",
          )}
          aria-label={`صفحة ${formatArabicNumber(content.pageNumber)}`}
        >
          <header className="flex items-center justify-between text-sm font-medium text-stone-500">
            <span className="tracking-[0.3em] text-stone-500">
              ص {formatArabicNumber(content.pageNumber)}
            </span>
            <div className="flex items-center gap-2 text-xs">
              {content.markers.map((marker) => (
                <span
                  key={`${marker.type}-${marker.number}`}
                  className={cn(
                    "rounded-full border px-2 py-0.5",
                    marker.type === "juz"
                      ? "border-amber-400 bg-amber-100 text-amber-800"
                      : "border-emerald-400 bg-emerald-100 text-emerald-800",
                  )}
                >
                  {marker.type === "juz"
                    ? `جزء ${formatArabicNumber(marker.number)}`
                    : `حزب ${formatArabicNumber(marker.number)}`}
                </span>
              ))}
            </div>
          </header>

          <div className="flex flex-col gap-4 text-right">
            {content.verses.map((verse) => {
              const showSurahHeader = verse.ayahNumber === 1
              return (
                <div key={verse.verseKey} className="space-y-2">
                  {showSurahHeader && (
                    <div className="text-center text-lg font-semibold tracking-wide text-emerald-700">
                      {verse.surahName}
                    </div>
                  )}
                  <VerseCard
                    verse={verse}
                    isActive={activeKeys.has(verse.verseKey)}
                    onSelect={handleVerseSelect}
                  />
                </div>
              )
            })}
          </div>
        </article>
      )
    },
    [activeVerseKey, handleVerseSelect, isNightMode, transientHighlight],
  )

  return (
    <section className="mushaf-spread-wrapper relative mx-auto flex w-full max-w-6xl flex-col items-center gap-6 px-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button variant={isNightMode ? "secondary" : "outline"} onClick={toggleNightMode}>
            {isNightMode ? "وضع النهار" : "وضع الليل"}
          </Button>
        </div>
        <form className="flex items-center gap-2" onSubmit={handleSubmit}>
          <label htmlFor="mushaf-page-input" className="text-sm text-stone-600">
            اذهب إلى الصفحة
          </label>
          <Input
            id="mushaf-page-input"
            value={navigation.pageInput}
            onChange={(event) => navigation.setPageInput(event.target.value)}
            className="w-24 text-center"
            inputMode="numeric"
            pattern="[0-9]*"
            aria-describedby="mushaf-page-error"
          />
          <Button type="submit" variant="default">
            انتقال
          </Button>
        </form>
      </div>
      {navigation.inputError && (
        <p id="mushaf-page-error" className="text-sm text-amber-700">
          {navigation.inputError}
        </p>
      )}

      <div className="flex w-full items-center justify-center gap-4">
        <Button variant="ghost" onClick={navigation.goToPreviousSpread} className="whitespace-nowrap">
          ← السابق
        </Button>
        <div
          className={cn(
            "mushaf-spread relative flex w-full max-w-5xl items-stretch justify-between gap-6 rounded-[2.5rem] border border-stone-200 bg-gradient-to-r from-stone-100/70 via-amber-50/60 to-stone-100/70 p-6 shadow-2xl shadow-stone-300/40 transition-colors print:border-0 print:bg-white",
            isNightMode &&
              "border-emerald-900 bg-gradient-to-r from-emerald-950 via-emerald-900 to-emerald-950 shadow-emerald-950/40",
            className,
          )}
          dir="rtl"
          aria-label={spreadAriaLabel}
        >
          {renderPage(leftPageContent, "left")}
          {renderPage(rightPageContent, "right")}
        </div>
        <Button variant="ghost" onClick={navigation.goToNextSpread} className="whitespace-nowrap">
          التالي →
        </Button>
      </div>

      <p className="text-sm text-stone-600">
        صفحة {formatArabicNumber(navigation.rightPage)}
        {navigation.leftPage ? ` – ${formatArabicNumber(navigation.leftPage)}` : ""} من {formatArabicNumber(navigation.totalPages)}
      </p>
    </section>
  )
}

export default MushafPageSpread
