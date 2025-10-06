"use client"

import { useState, useRef, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
  CheckCircle2,
} from "lucide-react"
import Link from "next/link"
import { quranAPI, type Surah as QuranSurah, type Ayah as QuranAyah } from "@/lib/quran-api"

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

type TajweedMetric = {
  id: string
  label: string
  score: number
  trend: number
  description: string
}

export default function QuranReaderPage() {
  const { dashboard, incrementDailyTarget } = useUser()
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

  const audioRef = useRef<HTMLAudioElement>(null)
  const activeAyah = surahData.ayahs[currentAyah]
  const totalAyahs = surahData.ayahs.length
  const activeAudioSrc = useMemo(() => ayahAudioUrls[currentAyah] ?? "", [ayahAudioUrls, currentAyah])
  const getAyahDisplayNumber = (ayah: ReaderAyah | undefined, index: number) =>
    ayah?.numberInSurah ?? ayah?.number ?? index + 1
  const ayahSelectValue = totalAyahs === 0 ? "" : getAyahDisplayNumber(activeAyah, currentAyah).toString()

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

  const toggleRecording = () => {
    setIsRecording((previous) => {
      const next = !previous
      if (next) {
        if (weakestMetric) {
          setAnalysisMessage(`Focus on ${weakestMetric.label} — ${weakestMetric.description}.`)
        } else {
          setAnalysisMessage("Live analysis activated. Keep steady breath and clarity.")
        }
      } else {
        setAnalysisMessage("Review your tajweed insights and resume when ready.")
      }
      return next
    })
    // In real app, this would start/stop audio recording for AI feedback
  }

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
    if (!isRecording) {
      setTajweedMetrics((metrics) => metrics.map((metric) => ({ ...metric, trend: 0 })))
      return
    }

    let timeoutId: ReturnType<typeof setTimeout>

    const updateMetrics = () => {
      setTajweedMetrics((metrics) =>
        metrics.map((metric) => {
          const delta = Math.floor(Math.random() * 5) - 2
          const nextScore = Math.max(60, Math.min(100, metric.score + delta))
          return { ...metric, score: nextScore, trend: delta }
        }),
      )
      timeoutId = setTimeout(updateMetrics, 2200)
    }

    updateMetrics()

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
                      variant={isRecording ? "destructive" : "outline"}
                      size="sm"
                      onClick={toggleRecording}
                      className={isRecording ? "" : "bg-transparent"}
                    >
                      {isRecording ? (
                        <MicOff className="w-4 h-4 mr-2" />
                      ) : (
                        <Sparkles className="w-4 h-4 mr-2 text-amber-500" />
                      )}
                      {isRecording ? "Stop Live Analysis" : "Start Live Analysis"}
                    </Button>
                  </div>

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
                          <div className="arabic-text text-xl leading-relaxed text-primary mb-2">{ayah.text}</div>
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

            {/* Live Tajweed Analysis */}
            <Card className="border-border/50">
              <CardHeader className="pb-4 space-y-1.5">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Live Tajweed Analysis</CardTitle>
                  <Badge
                    variant={isRecording ? "default" : "secondary"}
                    className={`text-xs flex items-center gap-1 ${isRecording ? "bg-emerald-600" : ""}`}
                  >
                    <Sparkles className="w-3.5 h-3.5" /> {isRecording ? "Live" : "Standby"}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Real-time insights on your recitation quality.
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-muted/40 rounded-lg p-4 space-y-2">
                  <div className="flex items-center justify-between text-sm font-medium">
                    <span>Average score</span>
                    <span>{averageTajweed}%</span>
                  </div>
                  <Progress value={averageTajweed} className="h-2" />
                </div>

                <div className="space-y-3">
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
                            metric.trend >= 0 ? "flex items-center gap-1 text-emerald-600" : "flex items-center gap-1 text-rose-600"
                          }
                        >
                          {metric.trend >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                          {Math.abs(metric.trend)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

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
        <DialogContent className="max-w-sm text-center">
          <DialogHeader className="space-y-2">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
              <CheckCircle2 className="h-7 w-7 text-emerald-600" />
            </div>
            <DialogTitle className="text-2xl font-semibold text-maroon-900">Masha’Allah!</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              You’ve completed today’s target of {dailyTargetGoal} ayahs. Keep reciting to deepen your mastery.
            </DialogDescription>
          </DialogHeader>
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
