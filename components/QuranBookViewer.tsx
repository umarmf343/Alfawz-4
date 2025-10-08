"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { ChevronLeft, ChevronRight, Egg, Sparkles, Target, Timer, Volume2 } from "lucide-react"

import pages from "@/data/mushaf-pages.json"
import { getSurahInfo, getVerseText, parseVerseKey, type VerseKey } from "@/lib/quran-data"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import { useQuranReader, type VerseSelection } from "@/hooks/use-quran-reader"
import { useUser } from "@/hooks/use-user"
import { useToast } from "@/hooks/use-toast"
import { calculateHasanatForText, countArabicLetters } from "@/lib/hasanat"

const TOTAL_PAGES = 604
const MAX_ODD_PAGE = TOTAL_PAGES % 2 === 0 ? TOTAL_PAGES - 1 : TOTAL_PAGES
const PAGE_DATA = pages as Record<string, VerseKey[]>

const INITIAL_CHALLENGE_DURATION = 60
const MIN_CHALLENGE_DURATION = 30
const CHALLENGE_DURATION_STEP = 5
const INITIAL_CHALLENGE_TARGET = 3
const CHALLENGE_TARGET_STEP = 2

type PageSide = "left" | "right"

type VerseDisplay = {
  verseKey: VerseKey
  pageNumber: number
  surahNumber: number
  ayahNumber: number
  text: string
  surahName: string
  englishName?: string
  isSurahStart: boolean
}

type HasanatPopup = {
  id: number
  amount: number
  verseKey: string
  surah: string
}

function clampOddPage(pageNumber: number): number {
  const oddPage = pageNumber % 2 === 0 ? pageNumber - 1 : pageNumber
  if (oddPage < 1) return 1
  if (oddPage > MAX_ODD_PAGE) return MAX_ODD_PAGE
  return oddPage
}

function createSelection(verse: VerseDisplay): VerseSelection {
  return {
    verseKey: verse.verseKey,
    ayahNumber: verse.ayahNumber,
    surahNumber: verse.surahNumber,
    pageNumber: verse.pageNumber,
    text: verse.text,
    surahName: verse.surahName,
    englishName: verse.englishName,
  }
}

function getChallengeDuration(level: number): number {
  return Math.max(
    MIN_CHALLENGE_DURATION,
    INITIAL_CHALLENGE_DURATION - (level - 1) * CHALLENGE_DURATION_STEP,
  )
}

export function QuranBookViewer() {
  const { currentVerse, setCurrentVerse } = useQuranReader()
  const { recordQuranReaderProgress, dashboard } = useUser()
  const { toast } = useToast()
  const [currentOddPage, setCurrentOddPage] = useState<number>(1)
  const [pageInput, setPageInput] = useState<string>("1")
  const [isAnimating, setIsAnimating] = useState(false)
  const [flipDirection, setFlipDirection] = useState<"forward" | "backward" | null>(null)
  const [sessionHasanat, setSessionHasanat] = useState(0)
  const [hasanatPopups, setHasanatPopups] = useState<HasanatPopup[]>([])
  const popupTimeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([])
  const awardedVersesRef = useRef<Set<string>>(new Set())
  const celebratedSurahsRef = useRef<Set<number>>(new Set())
  const [celebrationBanner, setCelebrationBanner] = useState<
    | null
    | {
        type: "surah" | "daily"
        message: string
      }
  >(null)
  const bannerTimeoutRef = useRef<number | null>(null)
  const [hasCelebratedDailyGoal, setHasCelebratedDailyGoal] = useState(false)
  const [eggLevel, setEggLevel] = useState(1)
  const [versesRecited, setVersesRecited] = useState(0)
  const [timeRemaining, setTimeRemaining] = useState(() => getChallengeDuration(1))
  const [isTimerActive, setIsTimerActive] = useState(false)
  const [challengeStatus, setChallengeStatus] = useState<"idle" | "cracked" | "failed">("idle")
  const [hasChallengeStarted, setHasChallengeStarted] = useState(false)

  const currentChallengeTarget = useMemo(
    () => INITIAL_CHALLENGE_TARGET + (eggLevel - 1) * CHALLENGE_TARGET_STEP,
    [eggLevel],
  )

  const challengeProgress = useMemo(() => {
    if (currentChallengeTarget === 0) {
      return 0
    }
    return Math.min(100, Math.round((versesRecited / currentChallengeTarget) * 100))
  }, [currentChallengeTarget, versesRecited])

  const dailyTargetGoal = dashboard?.dailyTarget.targetAyahs ?? 0
  const dailyTargetCompleted = dashboard?.dailyTarget.completedAyahs ?? 0

  const showCelebrationBanner = useCallback((type: "surah" | "daily", message: string) => {
    if (bannerTimeoutRef.current) {
      window.clearTimeout(bannerTimeoutRef.current)
      bannerTimeoutRef.current = null
    }
    setCelebrationBanner({ type, message })
    bannerTimeoutRef.current = window.setTimeout(() => {
      setCelebrationBanner(null)
      bannerTimeoutRef.current = null
    }, 6000)
  }, [])

  const launchConfettiBurst = useCallback(async (colors: string[]) => {
    const confetti = (await import("canvas-confetti")).default
    const defaults = {
      spread: 80,
      scalar: 1.1,
      ticks: 220,
      origin: { y: 0.62 },
      colors,
    }

    confetti({ ...defaults, particleCount: 200, origin: { ...defaults.origin, x: 0.32 } })
    confetti({ ...defaults, particleCount: 220, origin: { ...defaults.origin, x: 0.68 } })
  }, [])

  const celebrateSurahCompletion = useCallback(
    (surahName: string) => {
      showCelebrationBanner("surah", `Masha’Allah! You completed Surah ${surahName}. 🌙`)
      toast({
        title: "Surah complete",
        description: `Surah ${surahName} is now sealed in your ledger. Keep the khatm journey glowing!`,
      })
      void launchConfettiBurst(["#0f766e", "#0ea5e9", "#f97316", "#fde68a", "#a855f7"])
    },
    [launchConfettiBurst, showCelebrationBanner, toast],
  )

  const celebrateDailyTarget = useCallback(
    (completed: number, goal: number) => {
      showCelebrationBanner("daily", `Daily goal reached! ${completed} ayahs recited — target of ${goal} secured.`)
      toast({
        title: "Daily target secured",
        description: `You reached today’s ${goal}-ayah intention. Every verse beyond continues to brighten your scale.`,
      })
      void launchConfettiBurst(["#047857", "#10b981", "#f59e0b", "#fde68a", "#dc2626"])
    },
    [launchConfettiBurst, showCelebrationBanner, toast],
  )

  const formattedTimer = useMemo(() => {
    const minutes = Math.floor(timeRemaining / 60)
    const seconds = timeRemaining % 60
    return `${minutes}:${seconds.toString().padStart(2, "0")}`
  }, [timeRemaining])

  const challengeMessage = useMemo(() => {
    if (challengeStatus === "cracked") {
      return "Mashallah! You cracked the egg. A tougher challenge is hatching."
    }
    if (challengeStatus === "failed") {
      return "Time's up. Reset to try cracking the egg again."
    }
    if (!hasChallengeStarted) {
      return "Press start and recite verses to begin cracking the egg."
    }
    const versesRemaining = Math.max(currentChallengeTarget - versesRecited, 0)
    if (versesRemaining === 0) {
      return "Ready to hatch the next challenge?"
    }
    const verseLabel = versesRemaining === 1 ? "verse" : "verses"
    return `Recite ${versesRemaining} more ${verseLabel} to break the egg.`
  }, [challengeStatus, currentChallengeTarget, hasChallengeStarted, versesRecited])

  const spawnHasanatPopup = useCallback(
    (amount: number, verse: VerseSelection) => {
      const id = Date.now() + Math.random()
      setHasanatPopups((previous) => [
        ...previous,
        {
          id,
          amount,
          verseKey: verse.verseKey,
          surah: verse.surahName,
        },
      ])

      const timeoutId = window.setTimeout(() => {
        setHasanatPopups((previous) => previous.filter((popup) => popup.id !== id))
        popupTimeoutsRef.current = popupTimeoutsRef.current.filter((entry) => entry !== timeoutId)
      }, 1600)
      popupTimeoutsRef.current.push(timeoutId)
    },
    [],
  )

  const awardHasanatForCurrentVerse = useCallback(() => {
    if (!currentVerse) {
      return
    }
    if (awardedVersesRef.current.has(currentVerse.verseKey)) {
      return
    }

    const lettersCount = countArabicLetters(currentVerse.text)
    const hasanatAwarded = calculateHasanatForText(currentVerse.text)

    if (lettersCount === 0 || hasanatAwarded === 0) {
      return
    }

    awardedVersesRef.current.add(currentVerse.verseKey)
    spawnHasanatPopup(hasanatAwarded, currentVerse)
    setSessionHasanat((previous) => previous + hasanatAwarded)

    recordQuranReaderProgress({
      verseKey: currentVerse.verseKey,
      surah: currentVerse.surahName,
      ayahNumber: currentVerse.ayahNumber,
      pageNumber: currentVerse.pageNumber,
      lettersCount,
      hasanatAwarded,
    })

    const surahInfo = getSurahInfo(currentVerse.surahNumber)
    if (
      surahInfo &&
      currentVerse.ayahNumber >= surahInfo.ayahCount &&
      !celebratedSurahsRef.current.has(currentVerse.surahNumber)
    ) {
      celebratedSurahsRef.current.add(currentVerse.surahNumber)
      celebrateSurahCompletion(currentVerse.englishName ?? currentVerse.surahName)
    }
  }, [celebrateSurahCompletion, currentVerse, recordQuranReaderProgress, spawnHasanatPopup])

  useEffect(() => {
    return () => {
      popupTimeoutsRef.current.forEach((timeoutId) => {
        clearTimeout(timeoutId)
      })
      popupTimeoutsRef.current = []
      if (bannerTimeoutRef.current) {
        window.clearTimeout(bannerTimeoutRef.current)
        bannerTimeoutRef.current = null
      }
    }
  }, [])

  const leftPageNumber = useMemo(() => {
    const candidate = currentOddPage + 1
    return candidate <= TOTAL_PAGES ? candidate : null
  }, [currentOddPage])

  const visiblePages = useMemo(() => {
    const pagesToShow = [{ pageNumber: currentOddPage, side: "right" as PageSide }]
    if (leftPageNumber) {
      pagesToShow.unshift({ pageNumber: leftPageNumber, side: "left" as PageSide })
    }
    return pagesToShow
  }, [currentOddPage, leftPageNumber])

  const prefetchedPages = useMemo(() => {
    const neighbors = [
      currentOddPage - 2,
      currentOddPage - 1,
      currentOddPage + 2,
      currentOddPage + 3,
    ].filter((pageNumber): pageNumber is number => pageNumber >= 1 && pageNumber <= TOTAL_PAGES)
    return neighbors
  }, [currentOddPage])

  const verseCache = useMemo(() => {
    const cache = new Map<number, VerseDisplay[]>()
    const pageNumbers = new Set<number>([
      currentOddPage,
      ...(leftPageNumber ? [leftPageNumber] : []),
      ...prefetchedPages,
    ])

    pageNumbers.forEach((pageNumber) => {
      const verseKeys = PAGE_DATA[String(pageNumber)] ?? []
      const versesForPage = verseKeys.map((verseKey) => {
        const { surahNumber, ayahNumber } = parseVerseKey(verseKey)
        const surah = getSurahInfo(surahNumber)
        return {
          verseKey,
          pageNumber,
          surahNumber,
          ayahNumber,
          text: getVerseText(verseKey),
          surahName: surah?.arabicName ?? `سورة ${surahNumber}`,
          englishName: surah?.englishName,
          isSurahStart: ayahNumber === 1,
        }
      })
      cache.set(pageNumber, versesForPage)
    })

    return cache
  }, [currentOddPage, leftPageNumber, prefetchedPages])

  const triggerTurnAnimation = useCallback((direction: "forward" | "backward") => {
    setFlipDirection(direction)
    setIsAnimating(true)
    window.setTimeout(() => {
      setIsAnimating(false)
      setFlipDirection(null)
    }, 420)
  }, [])

  const handleSpreadChange = useCallback(
    (direction: "forward" | "backward") => {
      if (isAnimating) return
      triggerTurnAnimation(direction)
      setCurrentOddPage((page) => {
        if (direction === "forward") {
          return Math.min(page + 2, MAX_ODD_PAGE)
        }
        return Math.max(page - 2, 1)
      })
    },
    [isAnimating, triggerTurnAnimation],
  )

  const handleNext = useCallback(() => {
    if (currentOddPage >= MAX_ODD_PAGE) return
    awardHasanatForCurrentVerse()
    handleSpreadChange("forward")
  }, [awardHasanatForCurrentVerse, currentOddPage, handleSpreadChange])

  const handlePrevious = useCallback(() => {
    if (currentOddPage <= 1) return
    handleSpreadChange("backward")
  }, [currentOddPage, handleSpreadChange])

  const handlePageSubmit = useCallback(() => {
    const target = Number.parseInt(pageInput, 10)
    if (Number.isNaN(target)) {
      setPageInput(String(currentOddPage))
      return
    }
    const nextOdd = clampOddPage(target)
    setCurrentOddPage(nextOdd)
    setPageInput(String(nextOdd))
  }, [currentOddPage, pageInput])

  const handleVerseSelect = useCallback(
    (verse: VerseDisplay) => {
      setCurrentVerse(createSelection(verse))
      if (verse.pageNumber !== currentOddPage && verse.pageNumber !== leftPageNumber) {
        setCurrentOddPage(clampOddPage(verse.pageNumber))
      }

      setVersesRecited((previous) => {
        const baseCount = challengeStatus === "failed" ? 0 : previous
        const nextCount = Math.min(baseCount + 1, currentChallengeTarget)
        return nextCount
      })

      setHasChallengeStarted(true)

      if (challengeStatus === "failed") {
        setTimeRemaining(getChallengeDuration(eggLevel))
        setChallengeStatus("idle")
        setIsTimerActive(true)
      } else if (!isTimerActive) {
        setIsTimerActive(true)
      }
    },
    [challengeStatus, currentChallengeTarget, currentOddPage, eggLevel, isTimerActive, leftPageNumber, setCurrentVerse],
  )

  useEffect(() => {
    setPageInput(String(currentOddPage))
  }, [currentOddPage])

  useEffect(() => {
    if (!isTimerActive) {
      return
    }
    const intervalId = window.setInterval(() => {
      setTimeRemaining((previous) => {
        if (previous <= 1) {
          window.clearInterval(intervalId)
          setIsTimerActive(false)
          setHasChallengeStarted(false)
          setChallengeStatus((status) => (status === "cracked" ? status : "failed"))
          return 0
        }
        return previous - 1
      })
    }, 1000)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [isTimerActive])

  useEffect(() => {
    if (challengeStatus !== "idle") {
      return
    }
    if (versesRecited >= currentChallengeTarget) {
      setChallengeStatus("cracked")
      setIsTimerActive(false)
      setHasChallengeStarted(false)
    }
  }, [challengeStatus, currentChallengeTarget, versesRecited])

  useEffect(() => {
    if (challengeStatus !== "cracked") {
      return
    }
    const timeoutId = window.setTimeout(() => {
      setEggLevel((previousLevel) => {
        const nextLevel = previousLevel + 1
        setVersesRecited(0)
        setTimeRemaining(getChallengeDuration(nextLevel))
        setChallengeStatus("idle")
        setIsTimerActive(false)
        setHasChallengeStarted(false)
        return nextLevel
      })
    }, 1600)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [challengeStatus])

  useEffect(() => {
    if (currentVerse) {
      return
    }
    const firstVerseKey = PAGE_DATA["1"]?.[0]
    if (!firstVerseKey) return
    const defaultVerse = verseCache.get(1)?.find((verse) => verse.verseKey === firstVerseKey)
    if (defaultVerse) {
      setCurrentVerse(createSelection(defaultVerse))
    }
  }, [currentVerse, setCurrentVerse, verseCache])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowRight") {
        event.preventDefault()
        handleNext()
      }
      if (event.key === "ArrowLeft") {
        event.preventDefault()
        handlePrevious()
      }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => {
      window.removeEventListener("keydown", onKeyDown)
    }
  }, [handleNext, handlePrevious])

  useEffect(() => {
    if (dailyTargetGoal === 0) {
      return
    }

    if (dailyTargetCompleted >= dailyTargetGoal) {
      if (!hasCelebratedDailyGoal) {
        setHasCelebratedDailyGoal(true)
        celebrateDailyTarget(dailyTargetCompleted, dailyTargetGoal)
      }
      return
    }

    if (hasCelebratedDailyGoal) {
      setHasCelebratedDailyGoal(false)
    }
  }, [celebrateDailyTarget, dailyTargetCompleted, dailyTargetGoal, hasCelebratedDailyGoal])

  const animationClass = isAnimating
    ? flipDirection === "forward"
      ? "mushaf-turn-forward"
      : "mushaf-turn-backward"
    : ""

  return (
    <article className="relative mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8">
      <div
        className="pointer-events-none absolute right-4 top-4 z-40 flex flex-col items-end gap-2"
        aria-live="polite"
      >
        {hasanatPopups.map((popup) => (
          <div
            key={popup.id}
            className="animate-hasanat-float rounded-full bg-emerald-500/95 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-emerald-500/30"
          >
            +{popup.amount.toLocaleString()} hasanat
            <span className="ml-2 text-xs font-medium text-emerald-100">{popup.surah}</span>
          </div>
        ))}
      </div>
      <section className="relative overflow-hidden rounded-3xl border border-amber-100 bg-gradient-to-r from-amber-50 via-white to-amber-100/70 p-6 shadow-sm">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 items-start gap-4">
            <div
              className={cn(
                "relative flex h-16 w-16 shrink-0 items-center justify-center rounded-full border-4 text-amber-800 transition-colors",
                challengeStatus === "cracked"
                  ? "border-emerald-400 bg-emerald-50 text-emerald-700"
                  : challengeStatus === "failed"
                    ? "border-rose-300 bg-rose-50 text-rose-600"
                    : "border-amber-300 bg-amber-50",
              )}
            >
              <Egg className="h-8 w-8" aria-hidden />
              <span className="absolute -bottom-2 right-0 rounded-full bg-amber-500 px-2 py-0.5 text-xs font-semibold text-white shadow">
                Lv. {eggLevel}
              </span>
            </div>
            <div className="space-y-2">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-3">
                <p className="text-base font-semibold text-slate-800">Break the Egg Challenge</p>
                <div className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide text-amber-700">
                  <Target className="h-3.5 w-3.5" aria-hidden />
                  {currentChallengeTarget} verses
                </div>
              </div>
              <p className="max-w-xl text-sm text-slate-600" aria-live="polite">
                {challengeMessage}
              </p>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-medium uppercase tracking-wide text-slate-500">
                  <span>Progress</span>
                  <span>{challengeProgress}%</span>
                </div>
                <Progress value={challengeProgress} className="h-2" aria-hidden={false} />
              </div>
            </div>
          </div>
          <div className="flex w-full flex-col gap-3 sm:w-48">
            <div className="flex items-center justify-between rounded-2xl border border-amber-200 bg-white/80 px-4 py-3 text-sm font-semibold text-amber-700 shadow-sm">
              <span className="inline-flex items-center gap-2">
                <Timer className="h-4 w-4" aria-hidden />
                Timer
              </span>
              <span className="font-mono text-base">{formattedTimer}</span>
            </div>
            <div className="flex flex-col gap-2">
              <Button
                size="sm"
                className="bg-amber-500 text-white hover:bg-amber-600"
                onClick={() => {
                  if (isTimerActive) {
                    setIsTimerActive(false)
                    return
                  }

                  if (challengeStatus === "failed") {
                    setVersesRecited(0)
                    setTimeRemaining(getChallengeDuration(eggLevel))
                    setChallengeStatus("idle")
                  } else if (timeRemaining <= 0) {
                    setTimeRemaining(getChallengeDuration(eggLevel))
                  }

                  setHasChallengeStarted(true)
                  setIsTimerActive(true)
                }}
              >
                {isTimerActive ? "Pause" : hasChallengeStarted ? "Resume" : "Start Challenge"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setEggLevel(1)
                  setVersesRecited(0)
                  setTimeRemaining(getChallengeDuration(1))
                  setChallengeStatus("idle")
                  setIsTimerActive(false)
                  setHasChallengeStarted(false)
                }}
              >
                Reset Challenge
              </Button>
            </div>
          </div>
        </div>
      </section>
      <header className="space-y-2 text-center">
        <p className="text-sm font-medium uppercase tracking-[0.3em] text-amber-700">Student Quran Reader</p>
        <h1 className="text-3xl font-semibold text-slate-800 sm:text-4xl">مصحف المدينة المنورة</h1>
        <p className="text-sm text-slate-500">
          Navigate the Mushaf pages, select an āyah, and start your live tajwīd analysis instantly.
        </p>
      </header>

      {celebrationBanner ? (
        <div
          className={cn(
            "flex items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-sm shadow-md transition-all",
            celebrationBanner.type === "surah"
              ? "border-emerald-200 bg-emerald-50/90 text-emerald-800"
              : "border-amber-200 bg-amber-50/90 text-amber-800",
          )}
        >
          <Sparkles className="h-4 w-4" aria-hidden />
          <span>{celebrationBanner.message}</span>
        </div>
      ) : null}

      <div
        className={cn(
          "relative mx-auto w-full rounded-3xl border border-slate-200 bg-gradient-to-b from-white to-amber-50/60 p-6 shadow-[0_20px_60px_-30px_rgba(76,29,149,0.35)] transition-transform", 
          animationClass,
        )}
      >
        <div className="pointer-events-none absolute inset-y-0 left-1/2 hidden w-px -translate-x-1/2 bg-slate-200 lg:block" aria-hidden />
        <div className="grid gap-4 lg:grid-cols-2">
          {visiblePages.map(({ pageNumber, side }) => {
            const verses = verseCache.get(pageNumber) ?? []
            const isRightPage = side === "right"
            return (
              <section
                key={`${side}-${pageNumber}`}
                aria-label={`Page ${pageNumber}`}
                dir="rtl"
                className={cn(
                  "flex h-full flex-col gap-4 rounded-2xl bg-white/90 p-6 shadow-inner ring-1 ring-inset ring-slate-100 backdrop-blur",
                  isRightPage ? "lg:rounded-l-2xl" : "lg:rounded-r-2xl",
                )}
              >
                <header className="flex items-center justify-between text-sm text-slate-500">
                  <span>{isRightPage ? "الصفحة اليمنى" : "الصفحة اليسرى"}</span>
                  <span className="font-medium text-slate-700">{pageNumber}</span>
                </header>

                <div className="flex flex-col gap-3">
                  {verses.length === 0 ? (
                    <p className="text-sm text-slate-400">هذه الصفحة خالية.</p>
                  ) : (
                    verses.map((verse) => {
                      const isActive = currentVerse?.verseKey === verse.verseKey
                      return (
                        <button
                          key={verse.verseKey}
                          type="button"
                          onClick={() => handleVerseSelect(verse)}
                          className={cn(
                            "group w-full rounded-xl border px-4 py-3 text-right transition-all duration-200",
                            "border-transparent bg-white/70 text-slate-900 hover:border-amber-200 hover:bg-amber-50/70",
                            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/40",
                            isActive && "border-amber-300 bg-amber-100/80 shadow-inner",
                          )}
                          aria-pressed={isActive}
                          aria-label={`Recite verse ${verse.ayahNumber} from ${verse.surahName}`}
                        >
                          {verse.isSurahStart ? (
                            <p className="mb-1 text-sm font-semibold text-emerald-700">
                              {verse.surahName}
                              {verse.englishName ? <span className="ml-2 text-xs text-slate-400">({verse.englishName})</span> : null}
                            </p>
                          ) : null}
                          <p className="font-[family:var(--font-tajawal)] text-2xl leading-[2.4] tracking-wide text-slate-900">
                            {verse.text}
                          </p>
                          <div className="mt-3 flex items-center justify-between text-sm text-slate-500">
                            <span>{`${verse.surahName} • ${verse.ayahNumber}`}</span>
                            <span className="inline-flex items-center gap-1 text-primary">
                              <Volume2 className="h-4 w-4" aria-hidden />
                              تلاوة
                            </span>
                          </div>
                        </button>
                      )
                    })
                  )}
                </div>
              </section>
            )
          })}
        </div>
      </div>

      <footer className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handlePrevious}
            disabled={currentOddPage <= 1}
            aria-label="Previous page spread"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden />
            الصفحة السابقة
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={handleNext}
            disabled={currentOddPage >= MAX_ODD_PAGE}
            aria-label="Next page spread"
          >
            الصفحة التالية
            <ChevronRight className="h-4 w-4" aria-hidden />
          </Button>
        </div>

        <div className="flex flex-col items-center text-sm text-slate-500 sm:items-start">
          <span className="text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-amber-600">Session hasanat</span>
          <span className="text-xl font-semibold text-emerald-600">
            +{sessionHasanat.toLocaleString()}
          </span>
        </div>

        <div className="flex items-center gap-3 text-sm text-slate-600">
          <span>اذهب إلى صفحة</span>
          <form
            className="flex items-center gap-2"
            onSubmit={(event) => {
              event.preventDefault()
              handlePageSubmit()
            }}
          >
            <Input
              value={pageInput}
              onChange={(event) => setPageInput(event.target.value)}
              onBlur={handlePageSubmit}
              className="w-20 text-center"
              inputMode="numeric"
              aria-label="Page number"
            />
            <span className="text-slate-400">/ {TOTAL_PAGES}</span>
          </form>
        </div>

        <div className="text-sm font-medium text-slate-700">
          الصفحة الحالية: {currentOddPage}
          {leftPageNumber ? ` – ${leftPageNumber}` : ""} من {TOTAL_PAGES}
        </div>
      </footer>
    </article>
  )
}
