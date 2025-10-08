"use client"

import { useState, useRef, useEffect, useMemo, useCallback, useId } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import { useUser } from "@/hooks/use-user"
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  BookOpen,
  Settings,
  Bookmark,
  Share,
  MicOff,
  RotateCcw,
  AlertCircle,
  Sparkles,
  ArrowLeft,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
  Headphones,
  Disc3,
  Clock3,
  Egg,
  Target,
  Timer,
} from "lucide-react"
import Link from "next/link"
import { MushafVerse } from "@/components/quran/mushaf-verse"
import { MobileRecitationClient } from "@/components/recitation/mobile-recitation-client"
import { useMushafFontLoader } from "@/hooks/useMushafFontLoader"
import type { MicrophonePermissionStatus } from "@/hooks/useMicrophoneStream"
import { quranAPI, type Surah as QuranSurah, type Ayah as QuranAyah } from "@/lib/quran-api"
import { calculateHasanatForText, countArabicLetters } from "@/lib/hasanat"
import { tokenSpawner } from "@/lib/hasanat/token-spawner"
import { cn } from "@/lib/utils"
import {
  calculateRecitationMetricScores,
  createLiveSessionSummary,
  MISTAKE_CATEGORY_META,
  type LiveMistake,
  type LiveSessionSummary,
  type MistakeCategory,
} from "@/lib/recitation-analysis"
import { MUSHAF_FONTS_AVAILABLE, type MushafOverlayMode } from "@/lib/mushaf-fonts"

const FALLBACK_AUDIO_BASE = "https://cdn.islamic.network/quran/audio/128/ar.alafasy"
const GWANI_ARCHIVE_BASE_URL = "https://archive.org/download/MoshafGwaniDahir"
const GWANI_RECITER_NAME = "Shaykh Gwani Dahir"

type ReaderAyah = QuranAyah & {
  translation?: string
  transliteration?: string
}

type HasanatPopup = {
  id: number
  label: string
  amount?: number
  variant: "hasanat" | "celebration"
}

type QuranNavigationNextDetail = {
  surahNumber: number
  ayahNumber: number
}

declare global {
  interface WindowEventMap {
    "quran:navigation:next": CustomEvent<QuranNavigationNextDetail>
  }
}

type CelebrationState = {
  reason: "dailyTarget" | "surahComplete" | "dailySurah"
  title: string
  description: string
  highlight?: string
  footnote?: string
}

const DAILY_SURAH_NUMBERS = new Set([18, 112, 113, 114])

const FALLBACK_SURAH: {
  metadata: QuranSurah
  ayahs: ReaderAyah[]
  audioUrls: string[]
} = {
  metadata: {
    number: 1,
    name: "Al-Fatiha",
    englishName: "The Opening",
    englishNameTranslation: "The Opening",
    numberOfAyahs: 7,
    revelationType: "Meccan",
  },
  ayahs: [
    {
      number: 1,
      numberInSurah: 1,
      text: "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ",
      translation: "In the name of Allah, the Entirely Merciful, the Especially Merciful.",
      transliteration: "Bismillahir-Rahmanir-Raheem",
      juz: 1,
      manzil: 1,
      page: 1,
      ruku: 1,
      hizbQuarter: 1,
    },
    {
      number: 2,
      numberInSurah: 2,
      text: "الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ",
      translation: "All praise is due to Allah, Lord of the worlds.",
      transliteration: "Alhamdu lillahi rabbil-alameen",
      juz: 1,
      manzil: 1,
      page: 1,
      ruku: 1,
      hizbQuarter: 1,
    },
    {
      number: 3,
      numberInSurah: 3,
      text: "الرَّحْمَٰنِ الرَّحِيمِ",
      translation: "The Entirely Merciful, the Especially Merciful,",
      transliteration: "Ar-Rahmanir-Raheem",
      juz: 1,
      manzil: 1,
      page: 1,
      ruku: 1,
      hizbQuarter: 1,
    },
    {
      number: 4,
      numberInSurah: 4,
      text: "مَالِكِ يَوْمِ الدِّينِ",
      translation: "Sovereign of the Day of Recompense.",
      transliteration: "Maliki yawmid-deen",
      juz: 1,
      manzil: 1,
      page: 1,
      ruku: 1,
      hizbQuarter: 1,
    },
    {
      number: 5,
      numberInSurah: 5,
      text: "إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ",
      translation: "It is You we worship and You we ask for help.",
      transliteration: "Iyyaka na'budu wa iyyaka nasta'een",
      juz: 1,
      manzil: 1,
      page: 1,
      ruku: 1,
      hizbQuarter: 1,
    },
    {
      number: 6,
      numberInSurah: 6,
      text: "اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ",
      translation: "Guide us to the straight path -",
      transliteration: "Ihdinassiratal-mustaqeem",
      juz: 1,
      manzil: 1,
      page: 1,
      ruku: 1,
      hizbQuarter: 1,
    },
    {
      number: 7,
      numberInSurah: 7,
      text:
        "صِرَاطَ الَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ الْمَغْضُوبِ عَلَيْهِمْ وَلَا الضَّالِّينَ",
      translation:
        "The path of those upon whom You have bestowed favor, not of those who have evoked [Your] anger or of those who are astray.",
      transliteration:
        "Siratal-lazeena an'amta alayhim ghayril-maghdoobi alayhim wa lad-dalleen",
      juz: 1,
      manzil: 1,
      page: 1,
      ruku: 1,
      hizbQuarter: 1,
    },
  ],
  audioUrls: Array.from({ length: 7 }, (_, index) => `${FALLBACK_AUDIO_BASE}/${index + 1}.mp3`),
}

const RECITER_AUDIO_SLUGS = {
  mishary: "ar.alafasy",
  sudais: "ar.alafasy",
  husary: "ar.husary",
  minshawi: "ar.minshawi",
} as const

type ReciterKey = keyof typeof RECITER_AUDIO_SLUGS

const TRANSCRIPTION_UNAVAILABLE_MESSAGE =
  "AI transcription isn't configured on this server yet. Add a TARTEEL_API_KEY and refresh to enable live analysis."

const DEFAULT_ANALYSIS_PROMPT = "Start the live analysis to receive recitation feedback in real time."

const TRANSCRIPTION_AVAILABLE = process.env.NEXT_PUBLIC_TRANSCRIPTION_ENABLED === "true"

const INITIAL_CHALLENGE_DURATION = 60
const MIN_CHALLENGE_DURATION = 30
const CHALLENGE_DURATION_STEP = 5
const INITIAL_CHALLENGE_TARGET = 3
const CHALLENGE_TARGET_STEP = 2

const getChallengeDuration = (level: number) =>
  Math.max(MIN_CHALLENGE_DURATION, INITIAL_CHALLENGE_DURATION - (level - 1) * CHALLENGE_DURATION_STEP)

type RecitationMetric = {
  id: string
  label: string
  score: number
  trend: number
  description: string
}

const formatTimeDisplay = (seconds: number) => {
  if (!Number.isFinite(seconds) || seconds < 0) {
    return "0:00"
  }

  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = Math.floor(seconds % 60)

  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`
}


export default function QuranReaderPage() {
  const { profile, dashboard, stats, incrementDailyTarget, submitRecitationResult, recordQuranReaderProgress } = useUser()
  const userLocale = profile?.locale ?? "en"
  const prefersArabicInterface = userLocale.toLowerCase().startsWith("ar")
  const dailyTarget = dashboard?.dailyTarget
  const dailyTargetGoal = dailyTarget?.targetAyahs ?? 0
  const dailyTargetCompleted = dailyTarget?.completedAyahs ?? 0
  const dailyGoalMet = dailyTargetGoal > 0 && dailyTargetCompleted >= dailyTargetGoal
  const dailyTargetPercent = dailyTargetGoal === 0
    ? 0
    : Math.max(0, Math.min(100, Math.round((dailyTargetCompleted / dailyTargetGoal) * 100)))
  const remainingAyahs = Math.max(dailyTargetGoal - dailyTargetCompleted, 0)

  const [isPlaying, setIsPlaying] = useState(false)
  const [currentAyah, setCurrentAyah] = useState(0)
  const [volume, setVolume] = useState([75])
  const [playbackSpeed, setPlaybackSpeed] = useState("1")
  const [showTranslation, setShowTranslation] = useState(true)
  const [showTransliteration, setShowTransliteration] = useState(false)
  const [showAllAyahs, setShowAllAyahs] = useState(true)
  const [isRecording, setIsRecording] = useState(false)
  const isMushafTypographySupported = MUSHAF_FONTS_AVAILABLE
  const [useMushafTypography, setUseMushafTypography] = useState(isMushafTypographySupported)
  const [mushafOverlayMode, setMushafOverlayMode] = useState<MushafOverlayMode>("tajweed")
  const [liveVolume, setLiveVolume] = useState(0)
  const [microphonePermission, setMicrophonePermission] = useState<MicrophonePermissionStatus>("unknown")
  const [fontSize, setFontSize] = useState("text-4xl")
  const [reciter, setReciter] = useState<ReciterKey>("mishary")
  const [surahList, setSurahList] = useState<QuranSurah[]>([FALLBACK_SURAH.metadata])
  const [selectedSurah, setSelectedSurah] = useState<number>(FALLBACK_SURAH.metadata.number)
  const [surahData, setSurahData] = useState<{ metadata: QuranSurah; ayahs: ReaderAyah[] }>(() => ({
    metadata: FALLBACK_SURAH.metadata,
    ayahs: FALLBACK_SURAH.ayahs,
  }))
  const [ayahAudioUrls, setAyahAudioUrls] = useState<string[]>(FALLBACK_SURAH.audioUrls)
  const [isSurahLoading, setIsSurahLoading] = useState(false)
  const [surahError, setSurahError] = useState<string | null>(null)
  const [audioError, setAudioError] = useState<string | null>(null)
  const [sessionRecited, setSessionRecited] = useState(0)
  const [hasanatPopups, setHasanatPopups] = useState<HasanatPopup[]>([])
  const [celebration, setCelebration] = useState<CelebrationState | null>(null)
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)
  const isCelebrationOpen = Boolean(celebration)
  const [hasDailyGoalCelebrated, setHasDailyGoalCelebrated] = useState(false)
  const [recitationMetrics, setRecitationMetrics] = useState<RecitationMetric[]>(() => [
    {
      id: "accuracy",
      label: "Accuracy",
      score: 88,
      trend: 0,
      description: "Word-for-word alignment with the ayah text",
    },
    {
      id: "completeness",
      label: "Completeness",
      score: 84,
      trend: 0,
      description: "Coverage of the expected words in the verse",
    },
    {
      id: "flow",
      label: "Flow",
      score: 86,
      trend: 0,
      description: "Smooth pacing without substitutions",
    },
    {
      id: "extras",
      label: "Extra words",
      score: 92,
      trend: 0,
      description: "Control of additions beyond the verse",
    },
  ])
  const [isLiveAnalysisSupported, setIsLiveAnalysisSupported] = useState<boolean>(() => TRANSCRIPTION_AVAILABLE)
  const [analysisMessage, setAnalysisMessage] = useState(
    TRANSCRIPTION_AVAILABLE ? DEFAULT_ANALYSIS_PROMPT : TRANSCRIPTION_UNAVAILABLE_MESSAGE,
  )
  const [isAnalysisStarted, setIsAnalysisStarted] = useState(false)
  const [liveTranscription, setLiveTranscription] = useState("")
  const [liveMistakes, setLiveMistakes] = useState<LiveMistake[]>([])
  const [liveAnalysisError, setLiveAnalysisError] = useState<string | null>(null)
  const [isProcessingLiveChunk, setIsProcessingLiveChunk] = useState(false)
  const [isFinalizingLiveSession, setIsFinalizingLiveSession] = useState(false)
  const [liveSessionSummary, setLiveSessionSummary] = useState<LiveSessionSummary | null>(null)
  const [gwaniSelectedSurah, setGwaniSelectedSurah] = useState<number>(FALLBACK_SURAH.metadata.number)
  const [isGwaniPlaying, setIsGwaniPlaying] = useState(false)
  const [gwaniCurrentTime, setGwaniCurrentTime] = useState(0)
  const [gwaniDuration, setGwaniDuration] = useState(0)
  const [isGwaniLoading, setIsGwaniLoading] = useState(false)
  const [gwaniError, setGwaniError] = useState<string | null>(null)
  const [gwaniVolume, setGwaniVolume] = useState<number[]>([80])
  const [eggLevel, setEggLevel] = useState(1)
  const [versesRecited, setVersesRecited] = useState(0)
  const [timeRemaining, setTimeRemaining] = useState(() => getChallengeDuration(1))
  const [isTimerActive, setIsTimerActive] = useState(false)
  const [challengeStatus, setChallengeStatus] = useState<"idle" | "cracked" | "failed">("idle")
  const [hasChallengeStarted, setHasChallengeStarted] = useState(false)
  const [isEggSplashOpen, setIsEggSplashOpen] = useState(false)
  const allAyahsToggleId = useId()

  const popupTimeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([])
  const awardedAyahsRef = useRef<Set<string>>(new Set())

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

  const activeAyah = surahData.ayahs[currentAyah]
  const totalAyahs = surahData.ayahs.length

  const getAyahDisplayNumber = useCallback(
    (ayah: ReaderAyah | undefined, index: number) => ayah?.numberInSurah ?? ayah?.number ?? index + 1,
    [],
  )

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return
    }

    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)")
    const updatePreference = () => {
      const prefersReduced = mediaQuery.matches
      setPrefersReducedMotion(prefersReduced)
      tokenSpawner.setReducedMotionPreference(prefersReduced)
    }

    updatePreference()

    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", updatePreference)
      return () => {
        mediaQuery.removeEventListener("change", updatePreference)
      }
    }

    mediaQuery.addListener(updatePreference)
    return () => {
      mediaQuery.removeListener(updatePreference)
    }
  }, [])

  const spawnHasanatPopup = useCallback((popup: Omit<HasanatPopup, "id">) => {
    const id = Date.now() + Math.random()
    setHasanatPopups((previous) => [
      ...previous,
      {
        id,
        label: popup.label,
        amount: popup.amount,
        variant: popup.variant ?? (typeof popup.amount === "number" ? "hasanat" : "celebration"),
      },
    ])

    const timeoutId = window.setTimeout(() => {
      setHasanatPopups((previous) => previous.filter((popup) => popup.id !== id))
      popupTimeoutsRef.current = popupTimeoutsRef.current.filter((entry) => entry !== timeoutId)
    }, 1600)

    popupTimeoutsRef.current.push(timeoutId)
  }, [])
  const emitNavigationNext = useCallback((detail: QuranNavigationNextDetail) => {
    if (typeof window === "undefined") {
      return
    }

    window.dispatchEvent(new CustomEvent<QuranNavigationNextDetail>("quran:navigation:next", { detail }))
  }, [])
  const awardHasanatForCurrentAyah = useCallback(() => {
    if (!activeAyah) {
      return false
    }

    const ayahNumber = getAyahDisplayNumber(activeAyah, currentAyah)
    const verseKey = `${surahData.metadata.number}:${ayahNumber}`

    if (awardedAyahsRef.current.has(verseKey)) {
      return false
    }

    const lettersCount = countArabicLetters(activeAyah.text)
    const hasanatAwarded = calculateHasanatForText(activeAyah.text)

    if (lettersCount === 0 || hasanatAwarded === 0) {
      return false
    }

    awardedAyahsRef.current.add(verseKey)

    const surahLabel =
      surahData.metadata.englishName || surahData.metadata.name || `Surah ${surahData.metadata.number}`
    spawnHasanatPopup({
      amount: hasanatAwarded,
      label: `${surahLabel} • Ayah ${ayahNumber}`,
      variant: "hasanat",
    })

    recordQuranReaderProgress({
      verseKey,
      surah: surahLabel,
      ayahNumber,
      pageNumber: activeAyah.page,
      lettersCount,
      hasanatAwarded,
    })

    return true
  }, [
    activeAyah,
    currentAyah,
    getAyahDisplayNumber,
    recordQuranReaderProgress,
    spawnHasanatPopup,
    surahData.metadata.englishName,
    surahData.metadata.name,
    surahData.metadata.number,
  ])

  useEffect(() => {
    return () => {
      popupTimeoutsRef.current.forEach((timeoutId) => {
        window.clearTimeout(timeoutId)
      })
      popupTimeoutsRef.current = []
    }
  }, [])

  const gwaniTheme = useMemo(() => {
    if (gwaniError) {
      return {
        card: "border-rose-500/40 bg-rose-500/5 shadow-[0_25px_60px_-35px_rgba(244,63,94,0.85)]",
        header: "bg-gradient-to-r from-rose-500 via-rose-600 to-rose-700",
        chip: "bg-white/20 text-rose-50",
        button:
          "bg-gradient-to-r from-rose-500 via-rose-600 to-rose-700 hover:from-rose-600 hover:to-rose-800 focus-visible:ring-rose-400/40",
        sliderAccent:
          "[&_[data-slider-range]]:bg-rose-400 [&_[data-slider-thumb]]:border-rose-500 [&_[data-slider-thumb]]:shadow-[0_0_0_4px_rgba(244,63,94,0.2)]",
        progressAccent: "[&>div]:bg-rose-400/80",
        accentText: "text-rose-50",
        secondaryText: "text-rose-100/80",
        discTint: "text-rose-100/60",
        statusChip: "border border-rose-400/40 bg-rose-500/15 text-rose-50",
        statusHelperText: "text-rose-50/80",
        statusIconWrapper: "bg-rose-500/25 text-rose-50",
      }
    }

    if (isGwaniLoading) {
      return {
        card: "border-amber-400/40 bg-amber-400/10 shadow-[0_20px_55px_-35px_rgba(251,191,36,0.65)]",
        header: "bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500",
        chip: "bg-black/20 text-amber-50",
        button:
          "bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500 hover:from-amber-500 hover:to-orange-600 focus-visible:ring-amber-400/40",
        sliderAccent:
          "[&_[data-slider-range]]:bg-amber-400 [&_[data-slider-thumb]]:border-amber-500 [&_[data-slider-thumb]]:shadow-[0_0_0_4px_rgba(251,191,36,0.25)]",
        progressAccent: "[&>div]:bg-amber-400/80",
        accentText: "text-amber-50",
        secondaryText: "text-amber-100/85",
        discTint: "text-amber-100/70",
        statusChip: "border border-amber-400/40 bg-amber-400/20 text-amber-900 dark:text-amber-50",
        statusHelperText: "text-amber-900/70 dark:text-amber-100/80",
        statusIconWrapper: "bg-amber-500/25 text-amber-50",
      }
    }

    if (isGwaniPlaying) {
      return {
        card: "border-emerald-500/45 bg-emerald-500/10 shadow-[0_28px_60px_-35px_rgba(16,185,129,0.7)]",
        header: "bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-600",
        chip: "bg-black/10 text-emerald-50",
        button:
          "bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-600 hover:from-emerald-600 hover:to-teal-700 focus-visible:ring-emerald-400/40",
        sliderAccent:
          "[&_[data-slider-range]]:bg-emerald-400 [&_[data-slider-thumb]]:border-emerald-500 [&_[data-slider-thumb]]:shadow-[0_0_0_4px_rgba(16,185,129,0.25)]",
        progressAccent: "[&>div]:bg-emerald-400/85",
        accentText: "text-emerald-50",
        secondaryText: "text-emerald-100/80",
        discTint: "text-emerald-100/65",
        statusChip: "border border-emerald-400/45 bg-emerald-500/20 text-emerald-900 dark:text-emerald-50",
        statusHelperText: "text-emerald-900/70 dark:text-emerald-100/75",
        statusIconWrapper: "bg-emerald-500/25 text-emerald-50",
      }
    }

    return {
      card: "border-border/50 bg-muted/20",
      header: "bg-gradient-to-r from-indigo-500 via-indigo-600 to-sky-600",
      chip: "bg-white/20 text-indigo-50",
      button:
        "bg-gradient-to-r from-indigo-500 via-indigo-600 to-sky-600 hover:from-indigo-600 hover:to-sky-700 focus-visible:ring-indigo-400/40",
      sliderAccent:
        "[&_[data-slider-range]]:bg-indigo-400 [&_[data-slider-thumb]]:border-indigo-500 [&_[data-slider-thumb]]:shadow-[0_0_0_4px_rgba(99,102,241,0.25)]",
      progressAccent: "[&>div]:bg-indigo-400/85",
      accentText: "text-white",
      secondaryText: "text-indigo-100/80",
      discTint: "text-indigo-100/60",
      statusChip: "border border-indigo-400/30 bg-indigo-500/15 text-indigo-900 dark:text-indigo-50",
      statusHelperText: "text-indigo-900/70 dark:text-indigo-100/80",
      statusIconWrapper: "bg-indigo-500/20 text-indigo-50",
    }
  }, [gwaniError, isGwaniLoading, isGwaniPlaying])

  const gwaniStatus = useMemo(() => {
    if (gwaniError) {
      return {
        label: "Stream unavailable",
        description: "We couldn't reach the Kano archive right now. Try again shortly, in shaa Allah.",
        icon: AlertCircle,
        isAnimated: false,
      }
    }

    if (isGwaniLoading) {
      return {
        label: "Connecting to stream",
        description: "Buffering the Kano studio recitation for you…",
        icon: Loader2,
        isAnimated: true,
      }
    }

    if (isGwaniPlaying) {
      return {
        label: "Now playing",
        description: "Streaming directly from the Gwani Dahiru archive.",
        icon: Headphones,
        isAnimated: false,
      }
    }

    return {
      label: "Ready when you are",
      description: "Choose a surah and press play to begin your session.",
      icon: Sparkles,
      isAnimated: false,
    }
  }, [gwaniError, isGwaniLoading, isGwaniPlaying])

  const formatInferenceLatency = (latency: number | null | undefined) => {
    if (typeof latency !== "number" || Number.isNaN(latency) || latency <= 0) {
      return "—"
    }
    return `${Math.round(latency)} ms`
  }

  const getInferenceEngineLabel = (engine: LiveSessionSummary["analysis"]["engine"]) => {
    if (engine === "tarteel") {
      return "Tarteel recitation engine"
    }

    if (engine === "nvidia") {
      return "NVIDIA GPU pipeline"
    }

    return "On-device AI"
  }

  const getMistakeCategoryLabel = (category: MistakeCategory) =>
    MISTAKE_CATEGORY_META[category]?.label ?? category
  const { status: mushafFontStatus, isReady: areMushafFontsReady, error: mushafFontError } = useMushafFontLoader(
    useMushafTypography && isMushafTypographySupported,
  )

  useEffect(() => {
    let isMounted = true

    const verifyTranscriptionAvailability = async () => {
      try {
        const response = await fetch("/api/transcribe/status", { cache: "no-store" })
        if (!response.ok) {
          throw new Error(`Unexpected status: ${response.status}`)
        }

        const payload = (await response.json()) as { enabled: boolean; reason?: string }
        if (!isMounted) {
          return
        }

        if (!payload.enabled) {
          const message = payload.reason ?? TRANSCRIPTION_UNAVAILABLE_MESSAGE
          setIsLiveAnalysisSupported(false)
          setAnalysisMessage(message)
          setLiveAnalysisError(message)
          return
        }

        setIsLiveAnalysisSupported(true)
        setLiveAnalysisError((previous) => (previous === TRANSCRIPTION_UNAVAILABLE_MESSAGE ? null : previous))
        setAnalysisMessage((previous) =>
          previous === TRANSCRIPTION_UNAVAILABLE_MESSAGE ? DEFAULT_ANALYSIS_PROMPT : previous,
        )
      } catch (error) {
        if (!isMounted) {
          return
        }

        console.warn("Failed to verify transcription availability", error)
        setIsLiveAnalysisSupported(false)
        setAnalysisMessage(TRANSCRIPTION_UNAVAILABLE_MESSAGE)
        setLiveAnalysisError(TRANSCRIPTION_UNAVAILABLE_MESSAGE)
      }
    }

    void verifyTranscriptionAvailability()

    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    let isMounted = true

    const fetchSurahs = async () => {
      try {
        const surahs = await quranAPI.getSurahs()
        if (!isMounted || surahs.length === 0) {
          return
        }

        setSurahList(
          surahs.some((surah) => surah.number === FALLBACK_SURAH.metadata.number)
            ? surahs
            : [FALLBACK_SURAH.metadata, ...surahs],
        )
      } catch (error) {
        console.error("Failed to load surah list", error)
      }
    }

    fetchSurahs()

    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    setLiveTranscription("")
    setLiveMistakes([])
    setLiveSessionSummary(null)
  }, [currentAyah, selectedSurah])

  useEffect(() => {
    let isMounted = true

    const fetchSurah = async () => {
      setIsSurahLoading(true)
      setSurahError(null)
      setCurrentAyah(0)

      if (selectedSurah === FALLBACK_SURAH.metadata.number) {
        setSurahData({
          metadata: FALLBACK_SURAH.metadata,
          ayahs: FALLBACK_SURAH.ayahs,
        })
      }

      try {
        const [arabicData, translationData, transliterationData] = await Promise.all([
          quranAPI.getSurah(selectedSurah, "quran-uthmani"),
          quranAPI.getSurah(selectedSurah, "en.sahih"),
          quranAPI.getSurah(selectedSurah, "en.transliteration"),
        ])

        if (!isMounted) {
          return
        }

        if (!arabicData) {
          throw new Error("Missing Arabic surah data")
        }

        const translations = translationData?.ayahs ?? []
        const transliterations = transliterationData?.ayahs ?? []

        const combinedAyahs = arabicData.ayahs.map((ayah, index) => {
          const fallbackAyah =
            selectedSurah === FALLBACK_SURAH.metadata.number ? FALLBACK_SURAH.ayahs[index] : undefined

          return {
            ...ayah,
            translation: translations[index]?.text ?? fallbackAyah?.translation,
            transliteration: transliterations[index]?.text ?? fallbackAyah?.transliteration,
          }
        })

        setSurahData({
          metadata: { ...arabicData.surah, numberOfAyahs: combinedAyahs.length },
          ayahs: combinedAyahs,
        })
      } catch (error) {
        console.error("Failed to load surah data", error)

        if (!isMounted) {
          return
        }

        setSurahError("We couldn't load the selected surah. Displaying fallback content.")

        if (selectedSurah !== FALLBACK_SURAH.metadata.number) {
          setSelectedSurah(FALLBACK_SURAH.metadata.number)
        } else {
          setSurahData({
            metadata: FALLBACK_SURAH.metadata,
            ayahs: FALLBACK_SURAH.ayahs,
          })
        }
      } finally {
        if (isMounted) {
          setIsSurahLoading(false)
        }
      }
    }

    fetchSurah()

    return () => {
      isMounted = false
    }
  }, [selectedSurah])

  useEffect(() => {
    let isMounted = true

    const fetchAudio = async () => {
      setAudioError(null)

      try {
        const reciterSlug = RECITER_AUDIO_SLUGS[reciter] ?? RECITER_AUDIO_SLUGS.mishary
        const audioSegments = await quranAPI.getSurahAudio(selectedSurah, reciterSlug)

        if (!isMounted) {
          return
        }

        if (audioSegments.length > 0) {
          setAyahAudioUrls(audioSegments.map((segment) => segment.url))
        } else if (selectedSurah === FALLBACK_SURAH.metadata.number) {
          setAyahAudioUrls(FALLBACK_SURAH.audioUrls)
        } else {
          setAyahAudioUrls([])
          setAudioError("Audio for this reciter is unavailable. Try a different reciter.")
        }
      } catch (error) {
        console.error("Failed to load audio", error)

        if (!isMounted) {
          return
        }

        if (selectedSurah === FALLBACK_SURAH.metadata.number) {
          setAyahAudioUrls(FALLBACK_SURAH.audioUrls)
        } else {
          setAyahAudioUrls([])
          setAudioError("Audio for this reciter is unavailable. Try a different reciter.")
        }
      }
    }

    fetchAudio()

    return () => {
      isMounted = false
    }
  }, [selectedSurah, reciter])

  const weakestMetric = useMemo(() => {
    if (recitationMetrics.length === 0) {
      return null
    }
    return recitationMetrics.reduce((lowest, metric) => (metric.score < lowest.score ? metric : lowest), recitationMetrics[0])
  }, [recitationMetrics])

  const averageRecitationMetric = useMemo(() => {
    if (recitationMetrics.length === 0) {
      return 0
    }
    const total = recitationMetrics.reduce((sum, metric) => sum + metric.score, 0)
    return Math.round(total / recitationMetrics.length)
  }, [recitationMetrics])

  const mushafFontSupportText = useMemo(() => {
    if (!isMushafTypographySupported) {
      return "Mushaf typography is disabled because the font assets are missing. Run `npm run fonts:mushaf` and convert the TTX files to WOFF/WOFF2, then restart the server."
    }

    if (!useMushafTypography || mushafFontStatus === "ready") {
      return null
    }

    if (mushafFontStatus === "loading") {
      return "Loading Mushaf font assets…"
    }

    const base = "Font files not found. Run npm run fonts:mushaf and convert the TTX exports to WOFF/WOFF2."
    return mushafFontError ? `${base} ${mushafFontError}` : base
  }, [isMushafTypographySupported, mushafFontStatus, mushafFontError, useMushafTypography])

  const audioRef = useRef<HTMLAudioElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const mediaStreamRef = useRef<MediaStream | null>(null)
  const liveAudioContextRef = useRef<AudioContext | null>(null)
  const liveVolumeProcessorRef = useRef<ScriptProcessorNode | null>(null)
  const liveMeterGainRef = useRef<GainNode | null>(null)
  const chunkQueueRef = useRef<Blob[]>([])
  const isProcessingChunkRef = useRef(false)
  const sessionChunksRef = useRef<Blob[]>([])
  const shouldFinalizeRef = useRef(false)
  const recordingStartRef = useRef<number | null>(null)
  const recorderMimeTypeRef = useRef<string | null>(null)
  const gwaniAudioRef = useRef<HTMLAudioElement>(null)
  const expectedTextRef = useRef(activeAyah?.text ?? "")
  const ayahIdRef = useRef(
    `${surahData.metadata.number}:${activeAyah?.numberInSurah ?? activeAyah?.number ?? currentAyah + 1}`,
  )
  const activeAudioSrc = useMemo(() => ayahAudioUrls[currentAyah] ?? "", [ayahAudioUrls, currentAyah])
  const gwaniAudioSrc = useMemo(() => {
    const paddedNumber = gwaniSelectedSurah.toString().padStart(3, "0")
    return `${GWANI_ARCHIVE_BASE_URL}/${paddedNumber}.mp3`
  }, [gwaniSelectedSurah])
  const ayahSelectValue = totalAyahs === 0 ? "" : getAyahDisplayNumber(activeAyah, currentAyah).toString()
  const gwaniSurahDetails = useMemo(
    () => surahList.find((surah) => surah.number === gwaniSelectedSurah) ?? FALLBACK_SURAH.metadata,
    [gwaniSelectedSurah, surahList],
  )
  const gwaniProgressPercent = useMemo(() => {
    if (!Number.isFinite(gwaniDuration) || gwaniDuration <= 0) {
      return 0
    }

    return Math.min(100, Math.max(0, (gwaniCurrentTime / gwaniDuration) * 100))
  }, [gwaniCurrentTime, gwaniDuration])

  useEffect(() => {
    const audio = gwaniAudioRef.current
    if (!audio) {
      return
    }

    const handleLoadedMetadata = () => {
      setGwaniDuration(Number.isFinite(audio.duration) ? audio.duration : 0)
      setIsGwaniLoading(false)
    }

    const handleTimeUpdate = () => {
      setGwaniCurrentTime(Number.isFinite(audio.currentTime) ? audio.currentTime : 0)
    }

    const handlePlay = () => {
      setIsGwaniPlaying(true)
      setGwaniError(null)
      setIsGwaniLoading(false)
    }

    const handlePause = () => {
      setIsGwaniPlaying(false)
    }

    const handleWaiting = () => {
      setIsGwaniLoading(true)
    }

    const handleCanPlay = () => {
      setIsGwaniLoading(false)
    }

    const handleEnded = () => {
      setIsGwaniPlaying(false)
      setGwaniCurrentTime(Number.isFinite(audio.duration) ? audio.duration : 0)
    }

    const handleError = () => {
      setIsGwaniPlaying(false)
      setIsGwaniLoading(false)
      setGwaniError("We couldn't stream this recitation. Please try again shortly.")
    }

    audio.addEventListener("loadedmetadata", handleLoadedMetadata)
    audio.addEventListener("timeupdate", handleTimeUpdate)
    audio.addEventListener("play", handlePlay)
    audio.addEventListener("pause", handlePause)
    audio.addEventListener("waiting", handleWaiting)
    audio.addEventListener("canplay", handleCanPlay)
    audio.addEventListener("ended", handleEnded)
    audio.addEventListener("error", handleError)

    return () => {
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata)
      audio.removeEventListener("timeupdate", handleTimeUpdate)
      audio.removeEventListener("play", handlePlay)
      audio.removeEventListener("pause", handlePause)
      audio.removeEventListener("waiting", handleWaiting)
      audio.removeEventListener("canplay", handleCanPlay)
      audio.removeEventListener("ended", handleEnded)
      audio.removeEventListener("error", handleError)
    }
  }, [])

  useEffect(() => {
    const audio = gwaniAudioRef.current
    if (!audio) {
      return
    }

    audio.pause()
    audio.currentTime = 0
    setIsGwaniPlaying(false)
    setGwaniCurrentTime(0)
    setGwaniDuration(0)
    setGwaniError(null)
    setIsGwaniLoading(true)
    audio.load()
  }, [gwaniAudioSrc])

  useEffect(() => {
    const audio = gwaniAudioRef.current
    if (!audio) {
      return
    }

    const [volumeValue] = gwaniVolume
    const normalizedVolume = Number.isFinite(volumeValue) ? volumeValue / 100 : 0.8
    audio.volume = Math.min(1, Math.max(0, normalizedVolume))
  }, [gwaniVolume])

  useEffect(() => {
    expectedTextRef.current = activeAyah?.text ?? ""
    const ayahNumber = activeAyah?.numberInSurah ?? activeAyah?.number ?? currentAyah + 1
    ayahIdRef.current = `${surahData.metadata.number}:${ayahNumber}`
  }, [activeAyah, currentAyah, surahData.metadata.number])

  const handlePlayPause = async () => {
    const audioEl = audioRef.current
    if (!audioEl) return

    if (isPlaying) {
      audioEl.pause()
      setIsPlaying(false)
      return
    }

    if (!activeAudioSrc) {
      setAudioError("Audio for this ayah is not available yet. Try a different reciter.")
      return
    }

    if (audioEl.canPlayType("audio/mpeg") === "") {
      setAudioError("Your browser can't play MP3 audio. Try a different browser.")
      return
    }

    setAudioError(null)

    try {
      await audioEl.play()
      setIsPlaying(true)
    } catch (error) {
      console.error("Failed to play audio", error)
      setIsPlaying(false)
      setAudioError("We couldn't start the recitation. Please try again.")
    }
  }

  const handleReciteAyah = useCallback(() => {
    if (!activeAyah) {
      return
    }

    const willAdvance = currentAyah < totalAyahs - 1
    const isNewRecitation = awardHasanatForCurrentAyah()
    if (isNewRecitation) {
      incrementDailyTarget(1)
      setSessionRecited((count) => count + 1)

      if (totalAyahs > 0 && currentAyah >= totalAyahs - 1) {
        const surahNumber = surahData.metadata.number
        const arabicName = surahData.metadata.name || `Surah ${surahNumber}`
        const englishName = surahData.metadata.englishName
        const combinedName = englishName ? `${arabicName} • ${englishName}` : arabicName
        const isDailySurah = DAILY_SURAH_NUMBERS.has(surahNumber)

        spawnHasanatPopup({
          label: `${isDailySurah ? "Daily" : ""} Surah complete • ${combinedName}`.trim(),
          variant: "celebration",
        })

        setCelebration({
          reason: isDailySurah ? "dailySurah" : "surahComplete",
          title: isDailySurah ? "Daily Surah complete!" : "Surah complete!",
          description: isDailySurah
            ? `You wrapped up ${combinedName}. Keep this sunnah alive in your routine!`
            : `You completed ${combinedName}. May the Qur'an stay with your heart!`,
          highlight: `Surah ${surahNumber}: ${combinedName}`,
          footnote: isDailySurah
            ? "These protective surahs guard your mornings and evenings—keep reciting them daily."
            : "Revisit this surah soon to deepen your memorisation and reflection.",
        })
      }
    }
    if (willAdvance && isNewRecitation) {
      tokenSpawner.spawn(1)
    }
    setIsPlaying(false)
    setCurrentAyah((index) => (index < totalAyahs - 1 ? index + 1 : index))
    if (willAdvance) {
      const upcomingAyah = surahData.ayahs[currentAyah + 1]
      emitNavigationNext({
        surahNumber: surahData.metadata.number,
        ayahNumber: getAyahDisplayNumber(upcomingAyah, currentAyah + 1),
      })
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
    } else {
      setTimeRemaining((previous) => (previous <= 0 ? getChallengeDuration(eggLevel) : previous))
      if (!isTimerActive) {
        setIsTimerActive(true)
      }
    }
  }, [
    activeAyah,
    awardHasanatForCurrentAyah,
    challengeStatus,
    currentAyah,
    currentChallengeTarget,
    eggLevel,
    emitNavigationNext,
    getAyahDisplayNumber,
    incrementDailyTarget,
    isTimerActive,
    spawnHasanatPopup,
    surahData.metadata.englishName,
    surahData.metadata.name,
    surahData.metadata.number,
    surahData.ayahs,
    totalAyahs,
  ])

  const handleNextAyah = useCallback(() => {
    if (totalAyahs === 0 || currentAyah >= totalAyahs - 1) {
      return
    }

    handleReciteAyah()
  }, [currentAyah, handleReciteAyah, totalAyahs])

  const handlePrevAyah = () => {
    if (currentAyah > 0) {
      setCurrentAyah(currentAyah - 1)
      setIsPlaying(false)
    }
  }

  const handleGwaniPlayPause = async () => {
    const audio = gwaniAudioRef.current
    if (!audio) {
      return
    }

    if (isGwaniPlaying) {
      audio.pause()
      return
    }

    try {
      setGwaniError(null)
      if (audio.readyState < 2) {
        setIsGwaniLoading(true)
      }
      await audio.play()
    } catch (error) {
      console.error("Failed to start Gwani Dahir audio", error)
      setIsGwaniPlaying(false)
      setIsGwaniLoading(false)
      setGwaniError("Playback was blocked. Tap play again or try another moment.")
    }
  }

  const handleGwaniProgressChange = (value: number[]) => {
    const audio = gwaniAudioRef.current
    if (!audio || !Number.isFinite(gwaniDuration) || gwaniDuration <= 0) {
      return
    }

    const [nextTime] = value
    if (!Number.isFinite(nextTime)) {
      return
    }

    const clampedTime = Math.min(Math.max(nextTime, 0), gwaniDuration)
    audio.currentTime = clampedTime
    setGwaniCurrentTime(clampedTime)
  }

  const handleSyncReaderWithGwani = () => {
    setSelectedSurah(gwaniSelectedSurah)
    setCurrentAyah(0)
    setIsPlaying(false)
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" })
    }
  }

  const handleAyahClick = (index: number) => {
    setCurrentAyah(index)
    setIsPlaying(false)
  }

  useEffect(() => {
    if (challengeStatus !== "cracked") {
      setIsEggSplashOpen(false)
      return
    }

    setIsEggSplashOpen(true)
    const timeoutId = window.setTimeout(() => {
      setIsEggSplashOpen(false)
    }, 1800)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [challengeStatus])

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

  const processChunkQueue = useCallback(async () => {
    if (isProcessingChunkRef.current || chunkQueueRef.current.length === 0) {
      return
    }

    if (!isLiveAnalysisSupported) {
      chunkQueueRef.current = []
      sessionChunksRef.current = []
      isProcessingChunkRef.current = false
      setIsProcessingLiveChunk(false)
      setLiveAnalysisError(TRANSCRIPTION_UNAVAILABLE_MESSAGE)
      setAnalysisMessage(
        "Live analysis requires server-side transcription. Add a TARTEEL_API_KEY and reload to continue.",
      )
      return
    }

    isProcessingChunkRef.current = true
    setIsProcessingLiveChunk(true)

    try {
      while (chunkQueueRef.current.length > 0) {
        const nextChunk = chunkQueueRef.current.shift()
        if (!nextChunk) {
          continue
        }

        try {
          const formData = new FormData()
          formData.append("audio", nextChunk, `live-${Date.now()}.webm`)
          formData.append("mode", "live")
          formData.append("ayahId", ayahIdRef.current)

          const response = await fetch("/api/transcribe", {
            method: "POST",
            body: formData,
          })

          if (response.status === 503) {
            chunkQueueRef.current = []
            sessionChunksRef.current = []
            shouldFinalizeRef.current = false
            setLiveAnalysisError(TRANSCRIPTION_UNAVAILABLE_MESSAGE)
            setAnalysisMessage(
              "Live analysis requires server-side transcription. Add a TARTEEL_API_KEY and reload to continue.",
            )

            if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
              try {
                mediaRecorderRef.current.stop()
              } catch (stopError) {
                console.error("Failed to stop recorder after unavailable transcription service", stopError)
              }
            }

            setIsRecording(false)
            setIsAnalysisStarted(false)
            break
          }

          if (!response.ok) {
            throw new Error(`Live analysis request failed: ${response.status}`)
          }

          const data = await response.json()
          const snippet = typeof data?.transcription === "string" ? data.transcription.trim() : ""

          if (!snippet) {
            continue
          }

          const normalizedSnippet = snippet.replace(/\s+/g, " ")
          let combinedText = ""

          setLiveTranscription((previous) => {
            const updated = `${previous} ${normalizedSnippet}`.trim().replace(/\s+/g, " ")
            combinedText = updated
            return updated
          })

          const expectedText = expectedTextRef.current

          if (expectedText) {
            const summary = createLiveSessionSummary(combinedText, expectedText, {
              analysis: { engine: "on-device" },
            })
            setLiveMistakes(summary.mistakes)

            const scores = calculateRecitationMetricScores(summary.mistakes, expectedText)
            setRecitationMetrics((metrics) =>
              metrics.map((metric) => {
                const key = metric.id as keyof typeof scores
                const nextScore = scores[key] ?? metric.score
                const trend = Math.round(nextScore - metric.score)
                return { ...metric, score: nextScore, trend }
              }),
            )
          } else {
            setLiveMistakes([])
          }

          setLiveAnalysisError(null)
        } catch (error) {
          console.error("Live analysis processing error", error)
          if (
            error instanceof Error &&
            error.message.toLowerCase().includes("503")
          ) {
            setLiveAnalysisError(TRANSCRIPTION_UNAVAILABLE_MESSAGE)
          } else {
            setLiveAnalysisError("We couldn't process the latest recitation. Please try again.")
          }
        }
      }
    } finally {
      isProcessingChunkRef.current = false
      setIsProcessingLiveChunk(false)
    }
  }, [isLiveAnalysisSupported])

  const finalizeLiveSession = useCallback(
    async (audioBlob: Blob) => {
      if (!isLiveAnalysisSupported) {
        setLiveAnalysisError(TRANSCRIPTION_UNAVAILABLE_MESSAGE)
        setAnalysisMessage(
          "Live analysis stopped because the AI transcription service is not configured on this server.",
        )
        shouldFinalizeRef.current = false
        return
      }

      if (!audioBlob || audioBlob.size === 0) {
        setAnalysisMessage("We didn't capture any audio. Start another attempt when ready.")
        return
      }

      const expectedText = expectedTextRef.current
      setIsFinalizingLiveSession(true)
      setLiveAnalysisError(null)
      setAnalysisMessage("Compiling your recitation summary…")

      try {
        const fileType = audioBlob.type || recorderMimeTypeRef.current || "audio/webm"
        const extension = fileType.includes("wav") ? "wav" : "webm"
        const file = new File([audioBlob], `recitation-${Date.now()}.${extension}`, { type: fileType })
        const formData = new FormData()
        formData.append("audio", file)
        if (expectedText) {
          formData.append("expectedText", expectedText)
        }
        formData.append("ayahId", ayahIdRef.current)

        const response = await fetch("/api/transcribe", {
          method: "POST",
          body: formData,
        })

        if (response.status === 503) {
          setLiveAnalysisError(TRANSCRIPTION_UNAVAILABLE_MESSAGE)
          setAnalysisMessage(
            "Live analysis stopped because the AI transcription service is not configured on this server.",
          )
          shouldFinalizeRef.current = false
          return
        }

        if (!response.ok) {
          throw new Error(`Final transcription failed: ${response.status}`)
        }

        const result = (await response.json()) as LiveSessionSummary
        setLiveSessionSummary(result)

        const transcriptText = result.transcription?.trim().replace(/\s+/g, " ") ?? ""
        if (transcriptText) {
          setLiveTranscription(transcriptText)
        }

        const summaryMistakes = Array.isArray(result.mistakes) ? result.mistakes : []
        if (summaryMistakes.length > 0) {
          setLiveMistakes(summaryMistakes)
        }

        if (expectedText && transcriptText) {
          if (summaryMistakes.length === 0) {
            const fallbackSummary = createLiveSessionSummary(transcriptText, expectedText, {
              analysis: { engine: "tarteel", latencyMs: result.analysis.latencyMs },
            })
            setLiveMistakes(fallbackSummary.mistakes)
            const fallbackScores = calculateRecitationMetricScores(fallbackSummary.mistakes, expectedText)
            setRecitationMetrics((metrics) =>
              metrics.map((metric) => {
                const key = metric.id as keyof typeof fallbackScores
                const nextScore = fallbackScores[key] ?? metric.score
                const trend = Math.round(nextScore - metric.score)
                return { ...metric, score: nextScore, trend }
              }),
            )
          } else {
            const scores = calculateRecitationMetricScores(summaryMistakes, expectedText)
            setRecitationMetrics((metrics) =>
              metrics.map((metric) => {
                const key = metric.id as keyof typeof scores
                const nextScore = scores[key] ?? metric.score
                const trend = Math.round(nextScore - metric.score)
                return { ...metric, score: nextScore, trend }
              }),
            )
          }
        }

        const durationSeconds = result.duration
          ? Math.round(result.duration)
          : recordingStartRef.current
            ? Math.max(0, Math.round((Date.now() - recordingStartRef.current) / 1000))
            : 0

        recordingStartRef.current = null

        setAnalysisMessage(
          `Session analysed — accuracy ${result.feedback.accuracy}% and recitation quality ${result.feedback.overallScore}%.`,
        )

        if (expectedText) {
          const surahName = surahData.metadata.englishName || surahData.metadata.name || `Surah ${surahData.metadata.number}`
          const ayahNumber = getAyahDisplayNumber(activeAyah, currentAyah)

          submitRecitationResult({
            surah: surahName,
            ayahRange: `Ayah ${ayahNumber}`,
            accuracy: result.feedback.accuracy,
            tajweedScore: result.feedback.overallScore,
            fluencyScore: result.feedback.fluencyScore,
            hasanatEarned: result.hasanatPoints,
            durationSeconds,
            transcript: transcriptText,
            expectedText,
          })
        }
      } catch (error) {
        console.error("Failed to finalise live session", error)
        setLiveAnalysisError("We couldn't generate the live session summary. Please try again.")
        setAnalysisMessage("Live analysis stopped due to an error. Try another recording.")
      } finally {
        setIsFinalizingLiveSession(false)
        sessionChunksRef.current = []
        shouldFinalizeRef.current = false
        recorderMimeTypeRef.current = null
        recordingStartRef.current = null
      }
    },
    [
      activeAyah,
      currentAyah,
      isLiveAnalysisSupported,
      getAyahDisplayNumber,
      submitRecitationResult,
      surahData.metadata.englishName,
      surahData.metadata.name,
      surahData.metadata.number,
    ],
  )

  const teardownVolumeMeter = useCallback(() => {
    liveVolumeProcessorRef.current?.disconnect()
    liveVolumeProcessorRef.current = null

    liveMeterGainRef.current?.disconnect()
    liveMeterGainRef.current = null

    if (liveAudioContextRef.current) {
      liveAudioContextRef.current.close().catch(() => undefined)
      liveAudioContextRef.current = null
    }

    setLiveVolume(0)
  }, [])

  useEffect(() => {
    return () => {
      teardownVolumeMeter()
    }
  }, [teardownVolumeMeter])

  const setupVolumeMeter = useCallback(async (stream: MediaStream) => {
    const AudioCtx =
      typeof window !== "undefined"
        ? window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
        : undefined

    if (!AudioCtx) {
      return
    }

    try {
      const context = new AudioCtx()
      liveAudioContextRef.current = context

      if (context.state === "suspended") {
        await context.resume().catch(() => undefined)
      }

      const source = context.createMediaStreamSource(stream)
      const processor = context.createScriptProcessor(1024, 1, 1)
      const gainNode = context.createGain()
      gainNode.gain.value = 0

      liveVolumeProcessorRef.current = processor
      liveMeterGainRef.current = gainNode

      processor.onaudioprocess = (event) => {
        const channel = event.inputBuffer.getChannelData(0)
        let sum = 0
        for (let i = 0; i < channel.length; i += 1) {
          const value = channel[i]
          sum += value * value
        }
        const rms = Math.sqrt(sum / channel.length)
        setLiveVolume((previous) => previous * 0.6 + rms * 0.4)
      }

      source.connect(processor)
      processor.connect(gainNode)
      gainNode.connect(context.destination)
    } catch (error) {
      console.error("Unable to initialise live volume meter", error)
    }
  }, [])

  const stopLiveRecording = useCallback(
    (options?: { collapse?: boolean; skipFinalize?: boolean }) => {
      shouldFinalizeRef.current = options?.skipFinalize ? false : true

      try {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
          mediaRecorderRef.current.stop()
        }
      } catch (error) {
        console.error("Failed to stop live recorder", error)
      }

      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop())
        mediaStreamRef.current = null
      }

      teardownVolumeMeter()
      mediaRecorderRef.current = null
      chunkQueueRef.current = []
      isProcessingChunkRef.current = false
      setIsRecording(false)
      setIsProcessingLiveChunk(false)

      if (options?.collapse !== false) {
        setIsAnalysisStarted(false)
        setLiveTranscription("")
        setLiveMistakes([])
        setLiveSessionSummary(null)
        setLiveAnalysisError(null)
        setAnalysisMessage("Review your recitation insights and resume when ready.")
      } else if (!options?.skipFinalize) {
        setAnalysisMessage("Compiling your recitation summary…")
      }
    },
    [teardownVolumeMeter],
  )

  const startLiveRecording = useCallback(async () => {
    if (isRecording) {
      return
    }

    if (!isLiveAnalysisSupported) {
      setLiveAnalysisError(TRANSCRIPTION_UNAVAILABLE_MESSAGE)
      setAnalysisMessage(
        "Live analysis requires server-side transcription. Add a TARTEEL_API_KEY and reload to continue.",
      )
      return
    }

    if (typeof window === "undefined" || typeof MediaRecorder === "undefined") {
      setLiveAnalysisError("Live analysis requires a browser that supports audio recording.")
      return
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      setLiveAnalysisError("Microphone access is not available in this browser.")
      setMicrophonePermission("denied")
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      mediaStreamRef.current = stream
      setMicrophonePermission("granted")

      await setupVolumeMeter(stream)

      const recorder = new MediaRecorder(stream)
      mediaRecorderRef.current = recorder
      chunkQueueRef.current = []
      sessionChunksRef.current = []
      shouldFinalizeRef.current = false
      recorderMimeTypeRef.current = recorder.mimeType || "audio/webm"
      setLiveTranscription("")
      setLiveMistakes([])
      setLiveAnalysisError(null)
      setLiveSessionSummary(null)
      recordingStartRef.current = Date.now()

      recorder.addEventListener("dataavailable", (event) => {
        if (!event.data || event.data.size === 0) {
          return
        }

        chunkQueueRef.current.push(event.data)
        sessionChunksRef.current.push(event.data)
        void processChunkQueue()
      })

      recorder.addEventListener("stop", () => {
        const shouldFinalize = shouldFinalizeRef.current
        chunkQueueRef.current = []
        isProcessingChunkRef.current = false

        if (shouldFinalize) {
          const mimeType = recorderMimeTypeRef.current || recorder.mimeType || "audio/webm"
          if (sessionChunksRef.current.length > 0) {
            const finalBlob = new Blob(sessionChunksRef.current, { type: mimeType })
            void finalizeLiveSession(finalBlob)
          } else {
            setAnalysisMessage("We didn't capture any audio. Start another attempt when ready.")
            shouldFinalizeRef.current = false
            recorderMimeTypeRef.current = null
          }
        } else {
          sessionChunksRef.current = []
          recorderMimeTypeRef.current = null
        }
      })

      recorder.start(2000)
      setIsRecording(true)

      if (weakestMetric) {
        setAnalysisMessage(`Focus on ${weakestMetric.label} — ${weakestMetric.description}.`)
      } else {
        setAnalysisMessage("Live analysis activated. Keep steady breath and clarity.")
      }
    } catch (error) {
      console.error("Failed to start live recording", error)
      setLiveAnalysisError("We couldn't access your microphone. Please check permissions and try again.")
      setMicrophonePermission("denied")
      stopLiveRecording({ collapse: false, skipFinalize: true })
    }
  }, [
    finalizeLiveSession,
    isLiveAnalysisSupported,
    isRecording,
    processChunkQueue,
    weakestMetric,
    stopLiveRecording,
    setupVolumeMeter,
  ])

  const handleLiveAnalysisToggle = useCallback(() => {
    if (!isLiveAnalysisSupported) {
      setLiveAnalysisError(TRANSCRIPTION_UNAVAILABLE_MESSAGE)
      setAnalysisMessage(
        "Live analysis requires server-side transcription. Add a TARTEEL_API_KEY and reload to continue.",
      )
      return
    }

    if (!isAnalysisStarted && !isRecording) {
      setIsAnalysisStarted(true)
      void startLiveRecording()
      return
    }

    if (isRecording) {
      stopLiveRecording({ collapse: false })
      return
    }

    if (isAnalysisStarted && !isRecording) {
      setIsAnalysisStarted(false)
      setLiveTranscription("")
      setLiveMistakes([])
      setLiveSessionSummary(null)
      setLiveAnalysisError(null)
      setAnalysisMessage(
        isLiveAnalysisSupported
          ? "Start the live analysis to receive recitation feedback in real time."
          : TRANSCRIPTION_UNAVAILABLE_MESSAGE,
      )
    }
  }, [isAnalysisStarted, isLiveAnalysisSupported, isRecording, startLiveRecording, stopLiveRecording])

  useEffect(() => {
    if (!isAnalysisStarted && !isRecording) {
      setAnalysisMessage(
        isLiveAnalysisSupported
          ? "Start the live analysis to receive recitation feedback in real time."
          : TRANSCRIPTION_UNAVAILABLE_MESSAGE,
      )
      setLiveAnalysisError(null)
      setLiveTranscription("")
      setLiveMistakes([])
    }
  }, [isAnalysisStarted, isLiveAnalysisSupported, isRecording])

  useEffect(() => {
    return () => {
      try {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
          mediaRecorderRef.current.stop()
        }
      } catch (error) {
        console.error("Error stopping recorder on unmount", error)
      }

      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop())
      }
    }
  }, [])

  useEffect(() => {
    const audioEl = audioRef.current
    if (!audioEl) {
      return
    }

    audioEl.pause()
    audioEl.currentTime = 0

    if (activeAudioSrc) {
      audioEl.load()
      setAudioError(null)
    }

    setIsPlaying(false)
  }, [activeAudioSrc])

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume[0] / 100
      audioRef.current.playbackRate = Number.parseFloat(playbackSpeed)
    }
  }, [volume, playbackSpeed])

  useEffect(() => {
    if (isRecording) {
      return
    }

    const timeoutId = setTimeout(() => {
      setRecitationMetrics((metrics) => metrics.map((metric) => ({ ...metric, trend: 0 })))
    }, 1500)

    return () => {
      clearTimeout(timeoutId)
    }
  }, [isRecording])

  useEffect(() => {
    if (isRecording && weakestMetric) {
      setAnalysisMessage(`Focus on ${weakestMetric.label} — ${weakestMetric.description}.`)
    }
  }, [isRecording, weakestMetric])

  useEffect(() => {
    if (dailyTargetGoal === 0) {
      return
    }

    const goalMet = dailyTargetCompleted >= dailyTargetGoal
    if (goalMet && sessionRecited > 0 && !hasDailyGoalCelebrated) {
      const goalLabel = dailyTargetGoal === 1 ? "ayah" : "ayahs"
      spawnHasanatPopup({
        label: `Daily target reached • ${dailyTargetGoal} ${goalLabel}`,
        variant: "celebration",
      })

      setCelebration((current) =>
        current ?? {
          reason: "dailyTarget",
          title: "Masha’Allah!",
          description: `You just secured today’s goal of ${dailyTargetGoal} ${goalLabel}. May Allah shower you with barakah—keep the flow going!`,
          highlight: `Completed today: ${dailyTargetCompleted} ${goalLabel}`,
          footnote: "Every ayah beyond the goal still counts toward your mastery and teacher reports.",
        },
      )
      setHasDailyGoalCelebrated(true)
    }

    if (!goalMet && hasDailyGoalCelebrated) {
      setHasDailyGoalCelebrated(false)
    }
  }, [
    dailyTargetCompleted,
    dailyTargetGoal,
    hasDailyGoalCelebrated,
    sessionRecited,
    spawnHasanatPopup,
  ])

  useEffect(() => {
    if (!celebration || prefersReducedMotion) {
      return
    }

    let isCancelled = false
    let intervalId: number | undefined
    let timeoutId: number | undefined

    const launchConfetti = async () => {
      const confetti = (await import("canvas-confetti")).default

      const fire = (particleCount: number, y: number) => {
        confetti({
          particleCount,
          spread: 85,
          origin: { x: Math.random() * 0.6 + 0.2, y },
          gravity: 1.1,
          scalar: 1.05,
        })
      }

      fire(120, 0.05)
      intervalId = window.setInterval(() => {
        if (isCancelled) {
          if (intervalId) {
            window.clearInterval(intervalId)
          }
          return
        }
        fire(70, Math.random() * 0.1 + 0.05)
      }, 320)

      timeoutId = window.setTimeout(() => {
        if (intervalId) {
          window.clearInterval(intervalId)
        }
        fire(160, 0.2)
      }, 1800)
    }

    void launchConfetti()

    return () => {
      isCancelled = true
      if (intervalId) {
        window.clearInterval(intervalId)
      }
      if (timeoutId) {
        window.clearTimeout(timeoutId)
      }
    }
  }, [celebration, prefersReducedMotion])

  const isLiveAnalysisActive = isRecording || isAnalysisStarted
  const highlightedTranscription = useMemo(() => {
    const trimmed = liveTranscription.trim()
    if (!trimmed) {
      return [] as { key: string; text: string; className: string }[]
    }

    const tokens = trimmed.split(/\s+/)
    return tokens.map((text, index) => {
      const matchingMistake = liveMistakes.find(
        (mistake) => mistake.index === index && typeof mistake.word === "string" && mistake.word.length > 0,
      )
      const className = matchingMistake
        ? matchingMistake.type === "substitution"
          ? "bg-amber-100 text-amber-900 ring-1 ring-amber-200"
          : "bg-rose-100 text-rose-900 ring-1 ring-rose-200"
        : ""

      return {
        key: `word-${index}-${text}`,
        text,
        className,
      }
    })
  }, [liveTranscription, liveMistakes])

  const GwaniStatusIcon = gwaniStatus.icon

  return (
    <div className="min-h-screen bg-gradient-cream">
      <div
        className="pointer-events-none fixed right-6 top-24 z-50 flex flex-col items-end gap-2"
        aria-live="polite"
      >
        {hasanatPopups.map((popup) => (
          <div
            key={popup.id}
            className={cn(
              "animate-hasanat-float rounded-full px-4 py-2 text-sm font-semibold text-white shadow-lg",
              popup.variant === "celebration"
                ? "bg-gradient-to-r from-amber-500 via-rose-500 to-fuchsia-500 shadow-rose-500/30"
                : "bg-emerald-500/95 shadow-emerald-500/30",
            )}
          >
            {popup.variant === "hasanat" && typeof popup.amount === "number" ? (
              <>
                +{popup.amount.toLocaleString()} hasanat
                <span className="ml-2 text-xs font-medium text-emerald-100">{popup.label}</span>
              </>
            ) : (
              <span className="flex items-center gap-2 text-xs sm:text-sm">
                <Sparkles className="h-4 w-4" aria-hidden />
                {popup.label}
              </span>
            )}
          </div>
        ))}
      </div>
      {/* Header */}
      <header className="border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Button
                asChild
                variant="ghost"
                size="sm"
                className="gap-2 px-2"
              >
                <Link href="/dashboard" className="flex items-center gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  <span className="hidden sm:inline">Back to Dashboard</span>
                  <span className="sm:hidden">Dashboard</span>
                </Link>
              </Button>
              <Link href="/dashboard" className="flex items-center space-x-3">
                <div className="w-8 h-8 gradient-maroon rounded-lg flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="font-bold text-foreground">AlFawz Reader</h1>
                </div>
              </Link>
              <div className="hidden md:flex items-center space-x-2 text-sm text-muted-foreground">
                <span>Surah {surahData.metadata.number}</span>
                <span>•</span>
                <span>{surahData.metadata.name}</span>
                <span>•</span>
                <span>{surahData.metadata.englishName}</span>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div
                data-hasanat-target="hasanat-counter"
                className="flex min-w-[128px] flex-col items-end rounded-full border border-emerald-400/40 bg-emerald-500/10 px-4 py-2 text-right text-emerald-700 shadow-sm backdrop-blur-sm dark:border-emerald-300/30 dark:bg-emerald-400/10 dark:text-emerald-100"
              >
                <span className="text-[0.6rem] font-semibold uppercase tracking-[0.35em] text-emerald-700/70 dark:text-emerald-200/70">
                  Hasanāt
                </span>
                <span className="text-lg font-semibold leading-none">
                  {stats.hasanat.toLocaleString()}
                </span>
                {prefersArabicInterface ? (
                  <span className="text-xs font-medium text-emerald-600/80 dark:text-emerald-200/80">حسنات</span>
                ) : null}
              </div>
              <Button variant="outline" size="sm" className="bg-transparent">
                <Bookmark className="w-4 h-4 mr-2" />
                Bookmark
              </Button>
              <Button variant="outline" size="sm" className="bg-transparent">
                <Share className="w-4 h-4 mr-2" />
                Share
              </Button>
              <Button variant="outline" size="sm" className="bg-transparent">
                <Settings className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {surahError && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle className="sr-only">Surah loading error</AlertTitle>
            <AlertDescription>{surahError}</AlertDescription>
          </Alert>
        )}
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Main Reader */}
          <div className="lg:col-span-3 space-y-6">
            <Card className="border-border/50 shadow-lg">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl gradient-maroon bg-clip-text text-transparent">
                      {surahData.metadata.name} - {surahData.metadata.englishName}
                    </CardTitle>
                    <p className="text-muted-foreground mt-1">
                      {surahData.metadata.numberOfAyahs ?? totalAyahs} Ayahs • {surahData.metadata.revelationType}
                    </p>
                  </div>
                  <Badge className="gradient-gold text-white border-0">
                    Ayah {Math.min(currentAyah + 1, Math.max(totalAyahs, 1))} of {Math.max(totalAyahs, 1)}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="relative space-y-8 pb-8">
                <section className="relative overflow-hidden rounded-2xl border border-amber-100 bg-gradient-to-r from-amber-50 via-white to-amber-100/70 p-5 shadow-sm">
                  <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
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
                    <div className="flex w-full flex-col gap-3 md:w-48">
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
                {/* Current Ayah Display */}
                <div className="text-center space-y-6 py-8">
                  <div
                    className={`arabic-text ${fontSize} leading-loose text-primary cursor-pointer hover:text-primary/80 transition-colors`}
                    onClick={() => handleAyahClick(currentAyah)}
                  >
                    {activeAyah?.text ?? ""}
                  </div>

                  {showTransliteration && activeAyah?.transliteration && (
                    <p className="text-lg text-muted-foreground italic">{activeAyah.transliteration}</p>
                  )}

                  {showTranslation && activeAyah?.translation && (
                    <p className="text-lg text-foreground max-w-3xl mx-auto leading-relaxed">
                      {activeAyah.translation}
                    </p>
                  )}

                  <div className="flex items-center justify-center space-x-2">
                    <Badge variant="secondary">Ayah {getAyahDisplayNumber(activeAyah, currentAyah)}</Badge>
                  </div>
                </div>

                {/* Audio Controls */}
                <div className="sticky bottom-4 left-0 right-0 z-20">
                  <div className="bg-muted/40 rounded-xl border border-border/60 p-6 space-y-4 shadow-lg backdrop-blur supports-[backdrop-filter]:bg-muted/60">
                    <div className="flex items-center justify-center space-x-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handlePrevAyah}
                        disabled={currentAyah === 0}
                        className="bg-transparent"
                      >
                        <SkipBack className="w-4 h-4" />
                      </Button>

                      <Button
                        onClick={handlePlayPause}
                        size="lg"
                        className="gradient-maroon text-white border-0 w-16 h-16 rounded-full"
                      >
                        {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-1" />}
                      </Button>

                      <div className="relative">
                        <Button
                          data-hasanat-source="next-button"
                          variant="outline"
                          size="sm"
                          onClick={handleNextAyah}
                          disabled={totalAyahs === 0 || currentAyah >= totalAyahs - 1}
                          className="bg-transparent"
                        >
                          <SkipForward className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {audioError && (
                      <Alert
                        variant="destructive"
                        className="bg-destructive/10 border-destructive/30 text-destructive"
                      >
                        <div className="flex items-start space-x-3">
                          <AlertCircle className="w-4 h-4 mt-1" />
                          <div>
                            <AlertTitle className="text-sm font-semibold">Audio unavailable</AlertTitle>
                            <AlertDescription className="text-sm text-destructive/90">
                              {audioError}
                            </AlertDescription>
                          </div>
                        </div>
                      </Alert>
                    )}

                    <div className="flex items-center space-x-4">
                      <Volume2 className="w-5 h-5 text-muted-foreground" />
                      <Slider value={volume} onValueChange={setVolume} max={100} step={1} className="flex-1" />
                      <span className="text-sm text-muted-foreground w-12">{volume[0]}%</span>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center space-x-4">
                        <Select value={playbackSpeed} onValueChange={setPlaybackSpeed}>
                          <SelectTrigger className="w-20 h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="0.5">0.5x</SelectItem>
                            <SelectItem value="0.75">0.75x</SelectItem>
                            <SelectItem value="1">1x</SelectItem>
                            <SelectItem value="1.25">1.25x</SelectItem>
                            <SelectItem value="1.5">1.5x</SelectItem>
                          </SelectContent>
                        </Select>

                        <Select
                          value={reciter}
                          onValueChange={(value) => {
                            const typedValue = value as ReciterKey
                            setReciter(typedValue)
                            setAudioError(null)
                          }}
                        >
                          <SelectTrigger className="w-32 h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="mishary">Mishary Rashid</SelectItem>
                            <SelectItem value="sudais">Abdul Rahman Al-Sudais</SelectItem>
                            <SelectItem value="husary">Mahmoud Khalil Al-Husary</SelectItem>
                            <SelectItem value="minshawi">Mohamed Siddiq El-Minshawi</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <Button
                        variant={isLiveAnalysisActive ? "default" : "outline"}
                        size="sm"
                        onClick={handleLiveAnalysisToggle}
                        disabled={!isLiveAnalysisSupported}
                        className={
                          isLiveAnalysisActive
                            ? "bg-gradient-to-r from-maroon-600 to-maroon-700 text-white border-0"
                            : "bg-transparent"
                        }
                      >
                        {isLiveAnalysisActive ? (
                          <MicOff className="w-4 h-4 mr-2" />
                        ) : (
                          <Sparkles className="w-4 h-4 mr-2 text-amber-500" />
                        )}
                        {isLiveAnalysisActive ? "Stop Live Analysis" : "Start Live Analysis"}
                      </Button>
                    </div>
                  </div>
                </div>

                <MobileRecitationClient
                  className="md:hidden"
                  isRecording={isRecording}
                  isLiveAnalysisActive={isLiveAnalysisActive}
                  onToggle={handleLiveAnalysisToggle}
                  statusMessage={analysisMessage}
                  transcription={liveTranscription}
                  mistakes={liveMistakes}
                  volumeLevel={liveVolume}
                  overlayMode={mushafOverlayMode}
                  permissionStatus={microphonePermission}
                  errorMessage={isLiveAnalysisActive ? liveAnalysisError : null}
                  isLiveAnalysisSupported={isLiveAnalysisSupported}
                  unavailableMessage={TRANSCRIPTION_UNAVAILABLE_MESSAGE}
                />

                {isLiveAnalysisActive && (
                  <div className="space-y-5 rounded-xl border border-primary/30 bg-background/80 p-6 shadow-inner">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-primary">Live Recitation Analysis</h3>
                        <p className="text-sm text-muted-foreground">
                          Real-time insights on your recitation quality.
                        </p>
                      </div>
                      <Badge
                        variant={isRecording ? "default" : "secondary"}
                        className={`text-xs flex items-center gap-1 ${isRecording ? "bg-emerald-600" : ""}`}
                      >
                        <Sparkles className="w-3.5 h-3.5" /> {isRecording ? "Live" : "Listening"}
                      </Badge>
                    </div>

                    <div className="grid gap-4 lg:grid-cols-3">
                      <div className="bg-muted/40 rounded-lg p-4 space-y-2">
                        <div className="flex items-center justify-between text-sm font-medium">
                          <span>Average score</span>
                          <span>{averageRecitationMetric}%</span>
                        </div>
                        <Progress value={averageRecitationMetric} className="h-2" />
                      </div>

                      <div className="lg:col-span-2 space-y-3">
                        {recitationMetrics.map((metric) => (
                          <div key={metric.id} className="space-y-2 rounded-lg border border-border/60 p-3">
                            <div className="flex items-center justify-between text-sm font-medium">
                              <span>{metric.label}</span>
                              <span>{metric.score}%</span>
                            </div>
                            <Progress value={metric.score} className="h-2" />
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                              <span>{metric.description}</span>
                              <span
                                className={
                                  metric.trend >= 0
                                    ? "flex items-center gap-1 text-emerald-600"
                                    : "flex items-center gap-1 text-rose-600"
                                }
                              >
                                {metric.trend >= 0 ? (
                                  <ArrowUpRight className="w-3 h-3" />
                                ) : (
                                  <ArrowDownRight className="w-3 h-3" />
                                )}
                                {Math.abs(metric.trend)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {liveAnalysisError && (
                      <Alert variant="destructive" className="border-destructive/30 bg-destructive/10 text-destructive">
                        <div className="flex items-start gap-2">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription className="text-xs leading-relaxed">{liveAnalysisError}</AlertDescription>
                        </div>
                      </Alert>
                    )}

                    <div className="grid gap-4 lg:grid-cols-2">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-foreground">Transcribed Text</span>
                          {isProcessingLiveChunk && (
                            <span className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span className="inline-flex h-2.5 w-2.5 animate-ping rounded-full bg-primary"></span>
                              Processing…
                            </span>
                          )}
                        </div>
                        {highlightedTranscription && highlightedTranscription.length > 0 ? (
                          <div className="rounded-md border bg-background/80 p-3 text-sm leading-relaxed text-foreground">
                            {highlightedTranscription.map((token, index) => (
                              <span
                                key={token.key}
                                className={`inline-block rounded px-1 py-0.5 transition-colors ${token.className} ${
                                  index < highlightedTranscription.length - 1 ? "mr-1" : ""
                                }`}
                              >
                                {token.text}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="rounded-md border bg-background/80 p-3 text-sm leading-relaxed text-muted-foreground italic">
                            No recitation captured yet. Start recording to see the live transcription.
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <span className="font-semibold text-foreground">Mistakes & Recitation alerts</span>
                        {liveMistakes.length > 0 ? (
                          <ul className="space-y-2 text-sm">
                            {liveMistakes.map((mistake) => (
                              <li
                                key={`${mistake.index}-${mistake.word || "missing"}`}
                                className={`rounded-md border p-3 ${
                                  mistake.type === "substitution"
                                    ? "border-amber-200 bg-amber-50 text-amber-800"
                                    : "border-rose-200 bg-rose-50 text-rose-700"
                                }`}
                              >
                                <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-semibold uppercase tracking-wide">
                                  <span>
                                    {mistake.type === "substitution" ? "Recitation alert" : "Transcription issue"}
                                  </span>
                                  <span className="rounded-full bg-background/70 px-2 py-0.5 text-[0.65rem] font-medium text-foreground/80">
                                    {mistake.type === "missing"
                                      ? "Missing word"
                                      : mistake.type === "extra"
                                        ? "Extra word"
                                        : "Substitution"}
                                  </span>
                                </div>
                                <div className="mt-2 text-sm font-medium">
                                  Spoken: <span className="font-semibold">{mistake.word || "—"}</span>
                                </div>
                                {mistake.correct && (
                                  <div className="text-sm text-foreground/80">
                                    Expected: <span className="font-semibold text-foreground">{mistake.correct}</span>
                                  </div>
                                )}
                                {mistake.categories && mistake.categories.length > 0 && (
                                  <div className="mt-2 flex flex-wrap gap-1 text-[10px] font-semibold uppercase text-foreground/60">
                                    {mistake.categories.map((category) => (
                                      <span
                                        key={`${mistake.index}-${category}`}
                                        className="rounded-full bg-background px-2 py-0.5"
                                      >
                                        {getMistakeCategoryLabel(category)}
                                      </span>
                                    ))}
                                  </div>
                                )}
                                <div className="mt-2 text-xs text-foreground/70">
                                  {mistake.type === "missing"
                                    ? "Recite the expected word to stay aligned with the verse."
                                    : mistake.type === "extra"
                                      ? "Remove the extra wording to match the verse exactly."
                                      : `Similarity ${(Math.round((mistake.similarity ?? 0) * 100))}% — refine pronunciation to match the text.`}
                                </div>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
                            No mistakes detected yet. Keep reciting with confidence.
                          </p>
                        )}
                      </div>
                    </div>

                    {isFinalizingLiveSession && (
                      <div className="flex items-center gap-2 rounded-md border border-blue-200 bg-blue-50 p-3 text-sm text-blue-700">
                        <Loader2 className="h-4 w-4 animate-spin" /> Generating your full recitation summary…
                      </div>
                    )}

                    {liveSessionSummary && !isFinalizingLiveSession && (
                      <div className="space-y-3 rounded-lg border border-primary/30 bg-background/80 p-4">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <p className="text-sm font-semibold text-primary">Session summary</p>
                            <p className="text-xs text-muted-foreground">
                              Overall {liveSessionSummary.feedback.overallScore}% • Accuracy {liveSessionSummary.feedback.accuracy}% • Fluency {liveSessionSummary.feedback.fluencyScore}%
                            </p>
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {getInferenceEngineLabel(liveSessionSummary.analysis.engine)}
                            </Badge>
                            <Badge variant="secondary" className="text-xs bg-maroon-100 text-maroon-700">
                              {formatInferenceLatency(liveSessionSummary.analysis.latencyMs)}
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                              +{liveSessionSummary.hasanatPoints} hasanat
                            </Badge>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {liveSessionSummary.analysis.description}
                        </p>
                        <div className="flex flex-wrap gap-2 text-[10px] font-semibold uppercase text-muted-foreground">
                          {liveSessionSummary.analysis.stack.map((layer) => (
                            <Badge key={layer} variant="secondary" className="bg-muted text-maroon-700">
                              {layer}
                            </Badge>
                          ))}
                        </div>
                        <div className="grid gap-3 md:grid-cols-2">
                          <div className="rounded-md border border-muted/50 bg-background/90 p-3 text-xs leading-relaxed">
                            <p className="font-semibold text-foreground">Expected passage</p>
                            <p className="mt-1 font-arabic text-base">{liveSessionSummary.expectedText}</p>
                          </div>
                          <div className="rounded-md border border-muted/50 bg-background/90 p-3 text-xs leading-relaxed">
                            <p className="font-semibold text-foreground">Your recitation</p>
                            <p className="mt-1 font-arabic text-base">{liveSessionSummary.transcription}</p>
                          </div>
                        </div>
                        {liveSessionSummary.feedback.feedback && (
                          <div className="rounded-md border border-amber-200 bg-amber-50/70 p-3 text-xs text-amber-900">
                            {liveSessionSummary.feedback.feedback}
                          </div>
                        )}
                        {liveSessionSummary.mistakeBreakdown.length > 0 && (
                          <div className="space-y-2">
                            <p className="text-xs font-semibold uppercase text-muted-foreground">
                              Mistake detection coverage
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {liveSessionSummary.mistakeBreakdown.map((entry) => (
                                <Badge
                                  key={entry.category}
                                  variant="outline"
                                  className="border-maroon-100 text-[11px] text-maroon-700"
                                >
                                  {entry.label}: {entry.count}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    <Alert
                      className={
                        isRecording
                          ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                          : "bg-muted border-border/60 text-muted-foreground"
                      }
                    >
                      <div className="flex items-start gap-3">
                        <Sparkles className="w-4 h-4 mt-0.5" />
                        <div>
                          <AlertTitle className="text-sm font-semibold">
                            {isRecording ? "Analyzing pronunciation" : "Ready for analysis"}
                          </AlertTitle>
                          <AlertDescription className="text-xs leading-relaxed">{analysisMessage}</AlertDescription>
                        </div>
                      </div>
                    </Alert>

                    <p className="text-xs text-muted-foreground">
                      Use the live analysis toggle above to stop recording and clear feedback when you pause.
                    </p>
                  </div>
                )}

                <div className="pt-4 border-t border-muted/60 space-y-3">
                  <div className="flex flex-wrap items-center justify-center gap-3">
                    <Badge
                      variant="secondary"
                      className={`text-xs ${dailyGoalMet ? "bg-emerald-100 text-emerald-700" : ""}`}
                    >
                      {dailyGoalMet
                        ? "Daily goal complete"
                        : `${remainingAyahs} ayah${remainingAyahs === 1 ? "" : "s"} remaining`}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground text-center">
                    Advancing with the next button logs your recitation and rewards hasanat automatically.
                  </p>
                </div>

                {/* All Ayahs List */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-lg font-semibold">All Ayahs</h3>
                    <label
                      htmlFor={allAyahsToggleId}
                      className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer"
                    >
                      <span>{showAllAyahs ? "Hide list" : "Show list"}</span>
                      <Switch id={allAyahsToggleId} checked={showAllAyahs} onCheckedChange={setShowAllAyahs} />
                    </label>
                  </div>
                  {showAllAyahs ? (
                    <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar">
                      {surahData.ayahs.length === 0 ? (
                        <p className="text-sm text-muted-foreground italic">No ayahs available for this surah.</p>
                      ) : (
                        surahData.ayahs.map((ayah, index) => (
                          <div
                            key={`${surahData.metadata.number}-${getAyahDisplayNumber(ayah, index)}`}
                            className={`p-4 rounded-lg border cursor-pointer transition-all hover:shadow-md ${
                              index === currentAyah
                                ? "border-primary bg-primary/5"
                                : "border-border/50 hover:border-primary/30"
                            }`}
                            onClick={() => handleAyahClick(index)}
                          >
                            <div className="flex items-start justify-between mb-3">
                              <Badge variant={index === currentAyah ? "default" : "secondary"} className="text-xs">
                                {getAyahDisplayNumber(ayah, index)}
                              </Badge>
                              {index === currentAyah && isPlaying && (
                                <div className="flex items-center space-x-1">
                                  <div className="w-1 h-4 bg-primary rounded animate-pulse"></div>
                                  <div className="w-1 h-6 bg-primary rounded animate-pulse delay-100"></div>
                                  <div className="w-1 h-4 bg-primary rounded animate-pulse delay-200"></div>
                                </div>
                              )}
                            </div>
                            <MushafVerse
                              ayah={ayah}
                              mistakes={index === currentAyah ? liveMistakes : []}
                              overlayMode={mushafOverlayMode}
                              fontSizeClass={fontSize}
                              isMushafEnabled={useMushafTypography}
                              weakestMetricLabel={weakestMetric?.label}
                              fontsReady={areMushafFontsReady}
                            />
                            {showTranslation && ayah.translation && (
                              <p className="text-sm text-muted-foreground leading-relaxed">{ayah.translation}</p>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">
                      Turn on the Show list toggle to browse every ayah in this surah.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-6 lg:grid-cols-2">
              <Card className="border-border/50">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg">Progress</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Surah Progress</span>
                      <span>{Math.round(((currentAyah + 1) / Math.max(totalAyahs, 1)) * 100)}%</span>
                    </div>
                    <Progress value={((currentAyah + 1) / Math.max(totalAyahs, 1)) * 100} className="h-2" />
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Today’s Goal</span>
                      <span className="text-primary font-medium">
                        {dailyTargetGoal > 0 ? `${dailyTargetGoal} Ayahs` : "No target"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Completed</span>
                      <span className="text-primary font-medium">{dailyTargetCompleted} Ayahs</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Remaining</span>
                      <span className={dailyGoalMet ? "text-emerald-600 font-medium" : "text-primary font-medium"}>
                        {remainingAyahs}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Recited this session</span>
                      <span className="text-accent font-medium">{sessionRecited}</span>
                    </div>
                  </div>

                  <div className="space-y-2 pt-2">
                    <Progress value={dailyTargetPercent} className="h-2" />
                    <p className="text-xs text-muted-foreground text-right">
                      {dailyTargetPercent}% of today’s goal
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className={cn("overflow-hidden transition-all duration-500", gwaniTheme.card)}>
                <CardHeader className="pb-0">
                  <div
                    className={cn(
                      "rounded-xl p-5 text-white shadow-inner transition-all duration-500",
                      gwaniTheme.header,
                    )}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <div
                          className={cn(
                            "inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide backdrop-blur-sm",
                            gwaniTheme.chip,
                          )}
                        >
                          <Headphones className="h-3.5 w-3.5" /> Exclusive Audio Studio
                        </div>
                        <CardTitle
                          className={cn(
                            "text-xl font-semibold transition-colors duration-500",
                            gwaniTheme.accentText,
                          )}
                        >
                          {GWANI_RECITER_NAME} Recitation
                        </CardTitle>
                        <p
                          className={cn(
                            "text-sm transition-colors duration-500",
                            gwaniTheme.secondaryText,
                          )}
                        >
                          Stream the full mushaf recorded live in Kano and follow along as you recite.
                        </p>
                      </div>
                      <Disc3
                        className={cn(
                          "h-10 w-10 transition-colors duration-500",
                          gwaniTheme.discTint,
                        )}
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-5 pt-5">
                  <div
                    className={cn(
                      "flex flex-col gap-3 rounded-xl px-4 py-3 transition-all duration-500 sm:flex-row sm:items-center sm:justify-between",
                      gwaniTheme.statusChip,
                    )}
                  >
                    <div
                      className={cn(
                        "flex h-11 w-11 items-center justify-center rounded-full transition-colors duration-500 sm:h-10 sm:w-10",
                        gwaniTheme.statusIconWrapper,
                      )}
                    >
                      <GwaniStatusIcon
                        className={cn("h-5 w-5", gwaniStatus.isAnimated && "animate-spin")}
                      />
                    </div>
                    <div className="space-y-1 sm:flex-1">
                      <p className="text-sm font-semibold">{gwaniStatus.label}</p>
                      <p
                        className={cn(
                          "text-xs leading-relaxed transition-colors duration-500",
                          gwaniTheme.statusHelperText,
                        )}
                      >
                        {gwaniStatus.description}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Choose Surah to Stream</label>
                    <Select
                      value={gwaniSelectedSurah.toString()}
                      onValueChange={(value) => {
                        const surahNumber = Number.parseInt(value)
                        if (!Number.isNaN(surahNumber)) {
                          setGwaniSelectedSurah(surahNumber)
                        }
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select Surah" />
                      </SelectTrigger>
                      <SelectContent className="max-h-64">
                        {surahList.map((surah) => (
                          <SelectItem key={`gwani-${surah.number}`} value={surah.number.toString()}>
                            {surah.number}. {surah.englishName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Currently preparing <span className="font-medium text-foreground">{gwaniSurahDetails.englishName}</span>{" "}
                      ({gwaniSurahDetails.name}).
                    </p>
                  </div>

                  <div
                    className={cn(
                      "space-y-4 rounded-xl border border-border/70 bg-muted/40 p-4 transition-colors duration-500",
                      gwaniTheme.sliderAccent,
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Button
                          onClick={handleGwaniPlayPause}
                          size="icon"
                          className={cn(
                            "h-12 w-12 rounded-full text-white shadow-lg transition-transform duration-300 hover:scale-[1.03]",
                            gwaniTheme.button,
                          )}
                        >
                          {isGwaniPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6 ml-0.5" />}
                        </Button>
                        <div>
                          <p className="text-sm font-semibold text-foreground">{gwaniSurahDetails.englishName}</p>
                          <p className="text-xs text-muted-foreground">{GWANI_RECITER_NAME}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                        <Clock3 className="h-4 w-4" />
                        {isGwaniLoading
                          ? "Buffering…"
                          : `${formatTimeDisplay(gwaniCurrentTime)} / ${formatTimeDisplay(gwaniDuration)}`}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Slider
                        value={[Number.isFinite(gwaniCurrentTime) ? gwaniCurrentTime : 0]}
                        max={Number.isFinite(gwaniDuration) && gwaniDuration > 0 ? gwaniDuration : 0}
                        min={0}
                        step={1}
                        onValueChange={handleGwaniProgressChange}
                        disabled={!Number.isFinite(gwaniDuration) || gwaniDuration <= 0}
                      />
                      <Progress
                        value={gwaniProgressPercent}
                        className={cn(
                          "h-1.5 overflow-hidden transition-colors duration-500",
                          gwaniTheme.progressAccent,
                        )}
                      />
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-3">
                        <Volume2 className="h-4 w-4 text-muted-foreground" />
                        <Slider
                          value={gwaniVolume}
                          onValueChange={setGwaniVolume}
                          min={0}
                          max={100}
                          step={1}
                          className="w-40"
                        />
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="bg-transparent hover:border-foreground/20 hover:bg-foreground/5"
                        onClick={handleSyncReaderWithGwani}
                      >
                        Sync reader to this surah
                      </Button>
                    </div>
                  </div>

                  {gwaniError && (
                    <Alert variant="destructive" className="border-destructive/30 bg-destructive/10 text-destructive">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription className="text-xs leading-relaxed">{gwaniError}</AlertDescription>
                      </div>
                    </Alert>
                  )}

                  <div className="rounded-lg border border-dashed border-border/60 bg-background/80 p-3 text-xs text-muted-foreground">
                    Streamed from the public archive in partnership with the Gwani Online Institute. Perfect for memorisation circles
                    and home revision.
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Sidebar Controls */}
          <div className="space-y-6">
            <Card className="border-border/50">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">Reader Panel</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Choose the surah and ayah you want to focus on.
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Select Surah</label>
                  <Select
                    value={selectedSurah.toString()}
                    onValueChange={(value) => {
                      const surahNumber = Number.parseInt(value)
                      if (!Number.isNaN(surahNumber)) {
                        setSelectedSurah(surahNumber)
                        setCurrentAyah(0)
                        setIsPlaying(false)
                      }
                    }}
                  >
                    <SelectTrigger className="w-full" disabled={surahList.length === 0}>
                      <SelectValue placeholder="Choose Surah" />
                    </SelectTrigger>
                    <SelectContent className="max-h-64">
                      {surahList.map((surah) => (
                        <SelectItem key={surah.number} value={surah.number.toString()}>
                          {surah.number}. {surah.englishName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Select Ayah</label>
                  <Select
                    value={totalAyahs === 0 ? undefined : ayahSelectValue}
                    onValueChange={(value) => {
                      const ayahNumber = Number.parseInt(value)
                      if (Number.isNaN(ayahNumber)) {
                        return
                      }
                      const targetIndex = surahData.ayahs.findIndex((ayah, index) => getAyahDisplayNumber(ayah, index) === ayahNumber)
                      if (targetIndex >= 0) {
                        setCurrentAyah(targetIndex)
                        setIsPlaying(false)
                      }
                    }}
                  >
                    <SelectTrigger className="w-full" disabled={totalAyahs === 0 || isSurahLoading}>
                      <SelectValue placeholder={totalAyahs === 0 ? "No ayahs available" : "Choose Ayah"} />
                    </SelectTrigger>
                    <SelectContent className="max-h-64">
                      {surahData.ayahs.map((ayah, index) => {
                        const value = getAyahDisplayNumber(ayah, index).toString()
                        return (
                          <SelectItem key={`${surahData.metadata.number}-${value}`} value={value}>
                            Ayah {value}
                          </SelectItem>
                        )
                      })}
                    </SelectContent>
                  </Select>
                  {isSurahLoading && (
                    <p className="mt-2 text-xs text-muted-foreground flex items-center gap-2">
                      <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-primary border-t-transparent"></span>
                      Loading surah details…
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Display Settings */}
            <Card className="border-border/50">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">Display Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Font Size</label>
                  <Select value={fontSize} onValueChange={setFontSize}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="text-2xl">Small</SelectItem>
                      <SelectItem value="text-3xl">Medium</SelectItem>
                      <SelectItem value="text-4xl">Large</SelectItem>
                      <SelectItem value="text-5xl">Extra Large</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showTranslation}
                      onChange={(e) => setShowTranslation(e.target.checked)}
                      className="rounded border-border"
                    />
                    <span className="text-sm">Show Translation</span>
                  </label>

                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showTransliteration}
                      onChange={(e) => setShowTransliteration(e.target.checked)}
                      className="rounded border-border"
                    />
                    <span className="text-sm">Show Transliteration</span>
                  </label>
                </div>

                <div className="space-y-4 rounded-lg border border-border/60 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium">Mushaf typography</p>
                      <p className="text-xs text-muted-foreground">
                        Render āyāt using the Madinah Mushaf outlines layered with recitation cues.
                      </p>
                    </div>
                    <Switch
                      checked={useMushafTypography && isMushafTypographySupported}
                      onCheckedChange={(checked) => setUseMushafTypography(checked && isMushafTypographySupported)}
                      disabled={!isMushafTypographySupported}
                    />
                  </div>
                  {mushafFontSupportText && (
                    <p className="text-xs text-amber-700">{mushafFontSupportText}</p>
                  )}
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Overlay mode</label>
                    <Select
                      value={mushafOverlayMode}
                      onValueChange={(value) => setMushafOverlayMode(value as MushafOverlayMode)}
                      disabled={!useMushafTypography || !isMushafTypographySupported}
                    >
                      <SelectTrigger className="mt-2" disabled={!useMushafTypography || !isMushafTypographySupported}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="tajweed">Recitation guidance</SelectItem>
                        <SelectItem value="mistakes">Pronunciation issues</SelectItem>
                        <SelectItem value="none">Hide overlays</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="border-border/50">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start bg-transparent">
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Repeat Current Ayah
                </Button>
                <Button variant="outline" className="w-full justify-start bg-transparent">
                  <Bookmark className="w-4 h-4 mr-2" />
                  Add to Favorites
                </Button>
                <Button variant="outline" className="w-full justify-start bg-transparent">
                  <Share className="w-4 h-4 mr-2" />
                  Share Progress
                </Button>
              </CardContent>
            </Card>
          </div>
      </div>
    </div>

      <Dialog open={isEggSplashOpen} onOpenChange={setIsEggSplashOpen}>
        <DialogContent className="max-w-sm border-0 bg-white/95 text-center shadow-xl">
          <DialogHeader className="space-y-3">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 shadow-inner">
              <Egg className="h-7 w-7 text-emerald-700" aria-hidden />
            </div>
            <DialogTitle className="text-2xl font-semibold text-emerald-900">Egg cracked!</DialogTitle>
            <DialogDescription className="text-sm text-emerald-700">
              You shattered the challenge shell and leveled up the Break the Egg quest.
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isCelebrationOpen}
        onOpenChange={(open) => {
          if (!open) {
            setCelebration(null)
          }
        }}
      >
        <DialogContent className="max-w-md text-center border-0 bg-white/95 backdrop-blur-md">
          <DialogHeader className="space-y-3">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-emerald-100 to-emerald-200 shadow-inner">
              <Sparkles className="h-7 w-7 text-emerald-700" />
            </div>
            <DialogTitle className="text-3xl font-semibold text-maroon-900">
              {celebration?.title ?? "Masha’Allah!"}
            </DialogTitle>
            <DialogDescription className="text-base text-maroon-700">
              {celebration?.description ?? "Keep the recitation flowing and unlock new milestones."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            {celebration?.highlight && (
              <p className="text-sm text-muted-foreground">
                <span className="font-semibold text-maroon-900">{celebration.highlight}</span>
              </p>
            )}
            {celebration?.reason === "dailyTarget" ? (
              <>
                <p className="text-sm text-muted-foreground">
                  Total recited today: <span className="font-semibold text-maroon-900">{dailyTargetCompleted}</span> ayahs
                </p>
                {celebration.footnote && (
                  <p className="text-xs text-emerald-700">{celebration.footnote}</p>
                )}
              </>
            ) : (
              celebration?.footnote && <p className="text-xs text-emerald-700">{celebration.footnote}</p>
            )}
          </div>
          <DialogFooter className="flex flex-col gap-2 sm:flex-row">
            <Button variant="outline" className="flex-1" onClick={() => setCelebration(null)}>
              Keep Reciting
            </Button>
            <Button
              className="flex-1 bg-gradient-to-r from-maroon-600 to-maroon-700 text-white border-0"
              onClick={() => setCelebration(null)}
            >
              Continue Session
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Hidden Audio Elements */}
      <audio
        ref={gwaniAudioRef}
        src={gwaniAudioSrc}
        preload="metadata"
        className="hidden"
        aria-hidden="true"
      />
      <audio
        ref={audioRef}
        src={activeAudioSrc || undefined}
        onEnded={() => setIsPlaying(false)}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onError={() => {
          setIsPlaying(false)
          setAudioError("The selected reciter's audio couldn't be loaded.")
        }}
      />
    </div>
  )
}
