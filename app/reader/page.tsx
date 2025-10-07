"use client"

import { useState, useRef, useEffect, useMemo, useCallback } from "react"
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
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
} from "lucide-react"
import Link from "next/link"
import { MushafVerse } from "@/components/quran/mushaf-verse"
import { MobileRecitationClient } from "@/components/recitation/mobile-recitation-client"
import { useMushafFontLoader } from "@/hooks/useMushafFontLoader"
import type { MicrophonePermissionStatus } from "@/hooks/useMicrophoneStream"
import { quranAPI, type Surah as QuranSurah, type Ayah as QuranAyah } from "@/lib/quran-api"
import {
  annotateTajweedMistakes,
  analyzeMistakes,
  calculateTajweedMetricScores,
  type LiveMistake,
  type LiveSessionSummary,
} from "@/lib/tajweed-analysis"
import type { MushafOverlayMode } from "@/lib/mushaf-fonts"

const FALLBACK_AUDIO_BASE = "https://cdn.islamic.network/quran/audio/128/ar.alafasy"

type ReaderAyah = QuranAyah & {
  translation?: string
  transliteration?: string
}

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
  "AI transcription isn't configured on this server yet. Add an OPENAI_API_KEY and refresh to enable live analysis."

type TajweedMetric = {
  id: string
  label: string
  score: number
  trend: number
  description: string
}


export default function QuranReaderPage() {
  const { dashboard, incrementDailyTarget, submitRecitationResult } = useUser()
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
  const [isRecording, setIsRecording] = useState(false)
  const [useMushafTypography, setUseMushafTypography] = useState(true)
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
  const [isCelebrationOpen, setIsCelebrationOpen] = useState(false)
  const [hasCelebrated, setHasCelebrated] = useState(false)
  const [tajweedMetrics, setTajweedMetrics] = useState<TajweedMetric[]>(() => [
    {
      id: "makharij",
      label: "Makharij",
      score: 87,
      trend: 0,
      description: "Clarity of articulation points",
    },
    {
      id: "madd",
      label: "Madd",
      score: 82,
      trend: 0,
      description: "Consistency of elongation",
    },
    {
      id: "ghunnah",
      label: "Ghunnah",
      score: 85,
      trend: 0,
      description: "Nasal resonance balance",
    },
    {
      id: "qalqalah",
      label: "Qalqalah",
      score: 79,
      trend: 0,
      description: "Echo on heavy letters",
    },
  ])
  const [analysisMessage, setAnalysisMessage] = useState(
    "Start the live analysis to receive tajweed feedback in real time.",
  )
  const [isAnalysisStarted, setIsAnalysisStarted] = useState(false)
  const [liveTranscription, setLiveTranscription] = useState("")
  const [liveMistakes, setLiveMistakes] = useState<LiveMistake[]>([])
  const [liveAnalysisError, setLiveAnalysisError] = useState<string | null>(null)
  const [isProcessingLiveChunk, setIsProcessingLiveChunk] = useState(false)
  const [isFinalizingLiveSession, setIsFinalizingLiveSession] = useState(false)
  const [liveSessionSummary, setLiveSessionSummary] = useState<LiveSessionSummary | null>(null)
  const { status: mushafFontStatus, isReady: areMushafFontsReady, error: mushafFontError } = useMushafFontLoader(
    useMushafTypography,
  )

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
    if (tajweedMetrics.length === 0) {
      return null
    }
    return tajweedMetrics.reduce((lowest, metric) => (metric.score < lowest.score ? metric : lowest), tajweedMetrics[0])
  }, [tajweedMetrics])

  const averageTajweed = useMemo(() => {
    if (tajweedMetrics.length === 0) {
      return 0
    }
    const total = tajweedMetrics.reduce((sum, metric) => sum + metric.score, 0)
    return Math.round(total / tajweedMetrics.length)
  }, [tajweedMetrics])

  const mushafFontSupportText = useMemo(() => {
    if (!useMushafTypography || mushafFontStatus === "ready") {
      return null
    }

    if (mushafFontStatus === "loading") {
      return "Loading Mushaf font assets…"
    }

    const base = "Font files not found. Run npm run fonts:mushaf and convert the TTX exports to WOFF/WOFF2."
    return mushafFontError ? `${base} ${mushafFontError}` : base
  }, [mushafFontStatus, mushafFontError, useMushafTypography])

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
  const activeAyah = surahData.ayahs[currentAyah]
  const expectedTextRef = useRef(activeAyah?.text ?? "")
  const ayahIdRef = useRef(
    `${surahData.metadata.number}:${activeAyah?.numberInSurah ?? activeAyah?.number ?? currentAyah + 1}`,
  )
  const totalAyahs = surahData.ayahs.length
  const activeAudioSrc = useMemo(() => ayahAudioUrls[currentAyah] ?? "", [ayahAudioUrls, currentAyah])
  const getAyahDisplayNumber = useCallback(
    (ayah: ReaderAyah | undefined, index: number) => ayah?.numberInSurah ?? ayah?.number ?? index + 1,
    [],
  )
  const ayahSelectValue = totalAyahs === 0 ? "" : getAyahDisplayNumber(activeAyah, currentAyah).toString()

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

  const handleNextAyah = () => {
    if (currentAyah < totalAyahs - 1) {
      setCurrentAyah(currentAyah + 1)
      setIsPlaying(false)
    }
  }

  const handlePrevAyah = () => {
    if (currentAyah > 0) {
      setCurrentAyah(currentAyah - 1)
      setIsPlaying(false)
    }
  }

  const handleAyahClick = (index: number) => {
    setCurrentAyah(index)
    setIsPlaying(false)
  }

  const handleReciteAyah = () => {
    incrementDailyTarget(1)
    setSessionRecited((count) => count + 1)
    setIsPlaying(false)
    setCurrentAyah((index) => (index < totalAyahs - 1 ? index + 1 : index))
  }

  const processChunkQueue = useCallback(async () => {
    if (isProcessingChunkRef.current || chunkQueueRef.current.length === 0) {
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
              "Live analysis requires server-side transcription. Add an OPENAI_API_KEY and reload to continue.",
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
            const annotated = annotateTajweedMistakes(analyzeMistakes(combinedText, expectedText))
            setLiveMistakes(annotated)

            const scores = calculateTajweedMetricScores(annotated, expectedText)
            setTajweedMetrics((metrics) =>
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
  }, [])

  const finalizeLiveSession = useCallback(
    async (audioBlob: Blob) => {
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

        if (expectedText && transcriptText) {
          const annotated = annotateTajweedMistakes(analyzeMistakes(transcriptText, expectedText))
          setLiveMistakes(annotated)

          const scores = calculateTajweedMetricScores(annotated, expectedText)
          setTajweedMetrics((metrics) =>
            metrics.map((metric) => {
              const key = metric.id as keyof typeof scores
              const nextScore = scores[key] ?? metric.score
              const trend = Math.round(nextScore - metric.score)
              return { ...metric, score: nextScore, trend }
            }),
          )
        }

        const durationSeconds = result.duration
          ? Math.round(result.duration)
          : recordingStartRef.current
            ? Math.max(0, Math.round((Date.now() - recordingStartRef.current) / 1000))
            : 0

        recordingStartRef.current = null

        setAnalysisMessage(
          `Session analysed — accuracy ${result.feedback.accuracy}% and tajweed precision ${result.feedback.overallScore}%.`,
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
        setAnalysisMessage("Review your tajweed insights and resume when ready.")
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
  }, [finalizeLiveSession, isRecording, processChunkQueue, weakestMetric, stopLiveRecording, setupVolumeMeter])

  const handleLiveAnalysisToggle = useCallback(() => {
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
      setAnalysisMessage("Start the live analysis to receive tajweed feedback in real time.")
    }
  }, [isAnalysisStarted, isRecording, startLiveRecording, stopLiveRecording])

  useEffect(() => {
    if (!isAnalysisStarted && !isRecording) {
      setAnalysisMessage("Start the live analysis to receive tajweed feedback in real time.")
      setLiveAnalysisError(null)
      setLiveTranscription("")
      setLiveMistakes([])
    }
  }, [isAnalysisStarted, isRecording])

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
      setTajweedMetrics((metrics) => metrics.map((metric) => ({ ...metric, trend: 0 })))
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
    if (goalMet && sessionRecited > 0 && !hasCelebrated) {
      setIsCelebrationOpen(true)
      setHasCelebrated(true)
    }
    if (!goalMet && hasCelebrated) {
      setHasCelebrated(false)
    }
  }, [dailyTargetCompleted, dailyTargetGoal, sessionRecited, hasCelebrated])

  useEffect(() => {
    if (!isCelebrationOpen) {
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
  }, [isCelebrationOpen])

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
      const hasTajweed = Boolean(matchingMistake?.tajweedRules && matchingMistake.tajweedRules.length > 0)
      const className = matchingMistake
        ? hasTajweed
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

  return (
    <div className="min-h-screen bg-gradient-cream">
      {/* Header */}
      <header className="border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
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
          <div className="lg:col-span-3">
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

              <CardContent className="space-y-8">
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
                <div className="bg-muted/30 rounded-xl p-6 space-y-4">
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

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleNextAyah}
                      disabled={currentAyah === Math.max(totalAyahs - 1, 0)}
                      className="bg-transparent"
                    >
                      <SkipForward className="w-4 h-4" />
                    </Button>
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
                />

                {isLiveAnalysisActive && (
                  <div className="space-y-5 rounded-xl border border-primary/30 bg-background/80 p-6 shadow-inner">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-primary">Live Tajweed Analysis</h3>
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
                          <span>{averageTajweed}%</span>
                        </div>
                        <Progress value={averageTajweed} className="h-2" />
                      </div>

                      <div className="lg:col-span-2 space-y-3">
                        {tajweedMetrics.map((metric) => (
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
                        <span className="font-semibold text-foreground">Mistakes & Tajweed alerts</span>
                        {liveMistakes.length > 0 ? (
                          <ul className="space-y-2 text-sm">
                            {liveMistakes.map((mistake) => (
                              <li
                                key={`${mistake.index}-${mistake.word || "missing"}`}
                                className={`rounded-md border p-3 ${
                                  mistake.tajweedRules && mistake.tajweedRules.length > 0
                                    ? "border-amber-200 bg-amber-50 text-amber-800"
                                    : "border-rose-200 bg-rose-50 text-rose-700"
                                }`}
                              >
                                <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-semibold uppercase tracking-wide">
                                  <span>
                                    {mistake.tajweedRules && mistake.tajweedRules.length > 0
                                      ? "Tajweed alert"
                                      : "Transcription issue"}
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
                                {mistake.tajweedRules && mistake.tajweedRules.length > 0 ? (
                                  <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-foreground/80">
                                    {mistake.tajweedRules.map((rule) => (
                                      <li key={rule}>{rule}</li>
                                    ))}
                                  </ul>
                                ) : (
                                  <div className="mt-2 text-xs text-foreground/70">
                                    Articulation adjustment recommended.
                                  </div>
                                )}
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
                        <Loader2 className="h-4 w-4 animate-spin" /> Generating your full tajweed summary…
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
                          <Badge variant="secondary" className="text-xs">
                            +{liveSessionSummary.hasanatPoints} hasanat
                          </Badge>
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
                    <Button
                        className="gradient-maroon text-white border-0 px-6"
                        onClick={handleReciteAyah}
                      >
                        <Activity className="w-4 h-4 mr-2" /> Mark Ayah Recited
                      </Button>
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
                      Each marked ayah updates your daily target automatically.
                    </p>
                  </div>
                </div>

                {/* All Ayahs List */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">All Ayahs</h3>
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
                </div>
              </CardContent>
            </Card>
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
                        Render āyāt using the Madinah Mushaf outlines layered with tajweed cues.
                      </p>
                    </div>
                    <Switch checked={useMushafTypography} onCheckedChange={setUseMushafTypography} />
                  </div>
                  {mushafFontSupportText && (
                    <p className="text-xs text-amber-700">{mushafFontSupportText}</p>
                  )}
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Overlay mode</label>
                    <Select
                      value={mushafOverlayMode}
                      onValueChange={(value) => setMushafOverlayMode(value as MushafOverlayMode)}
                    >
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="tajweed">Tajweed guidance</SelectItem>
                        <SelectItem value="mistakes">Pronunciation issues</SelectItem>
                        <SelectItem value="none">Hide overlays</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Progress Tracking */}
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

      <Dialog open={isCelebrationOpen} onOpenChange={setIsCelebrationOpen}>
        <DialogContent className="max-w-md text-center border-0 bg-white/95 backdrop-blur-md">
          <DialogHeader className="space-y-3">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-emerald-100 to-emerald-200 shadow-inner">
              <Sparkles className="h-7 w-7 text-emerald-700" />
            </div>
            <DialogTitle className="text-3xl font-semibold text-maroon-900">Masha’Allah!</DialogTitle>
            <DialogDescription className="text-base text-maroon-700">
              You just secured today’s goal of {dailyTargetGoal} ayahs. May Allah shower you with barakah—keep the flow going!
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Total recited today: <span className="font-semibold text-maroon-900">{dailyTargetCompleted}</span> ayahs
            </p>
            <p className="text-xs text-emerald-700">
              Every ayah beyond the goal still counts toward your mastery and teacher reports.
            </p>
          </div>
          <DialogFooter className="flex flex-col gap-2 sm:flex-row">
            <Button variant="outline" className="flex-1" onClick={() => setIsCelebrationOpen(false)}>
              Keep Reciting
            </Button>
            <Button
              className="flex-1 bg-gradient-to-r from-maroon-600 to-maroon-700 text-white border-0"
              onClick={() => setIsCelebrationOpen(false)}
            >
              Continue Session
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Hidden Audio Element */}
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
