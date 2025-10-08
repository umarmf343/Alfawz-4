"use client"

import Link from "next/link"
import dynamic from "next/dynamic"
import { useCallback, useMemo, useState } from "react"
import { BookOpen, Clock, Sparkles, Trophy } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useToast } from "@/hooks/use-toast"
import { useUser } from "@/hooks/use-user"
import type { DailySurahRecommendation } from "@/lib/daily-surah"

interface DailySurahRecitationExperienceProps {
  detail: DailySurahRecommendation
}

const QuranReader = dynamic(
  () => import("@/components/quran-reader").then((module) => module.QuranReader),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-64 items-center justify-center rounded-2xl border border-maroon-100 bg-white/80">
        <div className="space-y-2 text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-maroon-600 border-t-transparent" />
          <p className="text-sm text-maroon-700">Preparing Qur&apos;an reader…</p>
        </div>
      </div>
    ),
  },
)

export function DailySurahRecitationExperience({ detail }: DailySurahRecitationExperienceProps) {
  const { dashboard, completeDailySurahRecitation } = useUser()
  const { toast } = useToast()
  const [isCelebrating, setIsCelebrating] = useState(false)
  const [celebrationMessage, setCelebrationMessage] = useState<string | null>(null)

  const todayKey = useMemo(() => new Date().toISOString().slice(0, 10), [])
  const todaysCompletion = useMemo(() => {
    return dashboard?.dailySurahLog.find(
      (entry) => entry.slug === detail.slug && entry.completedAt.slice(0, 10) === todayKey,
    )
  }, [dashboard?.dailySurahLog, detail.slug, todayKey])

  const totalAyahs = useMemo(
    () => detail.sections.reduce((sum, section) => sum + section.ayahCount, 0),
    [detail.sections],
  )

  const primarySection = detail.sections[0]
  const initialSurahNumber = primarySection?.surahNumber ?? 1
  const initialAyahNumber = useMemo(() => {
    const firstVerseKey = primarySection?.verses[0]?.key
    if (!firstVerseKey) {
      return 1
    }
    const [, ayahPart] = firstVerseKey.split(":")
    const ayahNumber = Number.parseInt(ayahPart ?? "1", 10)
    return Number.isNaN(ayahNumber) ? 1 : ayahNumber
  }, [primarySection?.verses])

  const launchConfetti = useCallback(async () => {
    const confetti = (await import("canvas-confetti")).default
    confetti({
      particleCount: 240,
      spread: 75,
      origin: { y: 0.6 },
      scalar: 1.2,
      colors: ["#0f766e", "#10b981", "#f59e0b", "#fde68a", "#dc2626"],
    })
  }, [])

  const handleCompletion = useCallback(() => {
    const result = completeDailySurahRecitation({
      slug: detail.slug,
      surahNumber: detail.sections[0]?.surahNumber ?? 0,
      title: detail.title,
      encouragement: detail.encouragement,
      hasanatAwarded: detail.estimatedHasanat,
      ayahsRead: totalAyahs,
      studyMinutes: detail.estimatedMinutes,
    })

    if (result.alreadyCompleted) {
      toast({
        title: "Already counted",
        description: "Today's recitation is already logged. Feel free to reflect again!",
      })
      return
    }

    toast({
      title: "Masha’Allah!",
      description: `+${result.hasanatAwarded.toLocaleString()} hasanat added to your ledger.`,
    })
    setCelebrationMessage("Masha’Allah! Your nightly ledger just blossomed with light.")
    setIsCelebrating(true)
    void launchConfetti()
    window.setTimeout(() => {
      setIsCelebrating(false)
      setCelebrationMessage(null)
    }, 5000)
  }, [completeDailySurahRecitation, detail, launchConfetti, toast, totalAyahs])

  return (
    <div className="space-y-8">
      <section className="grid gap-4 sm:grid-cols-2">
        <Card className="border-maroon-100 bg-maroon-50/60">
          <CardHeader className="flex flex-row items-center gap-3 pb-2">
            <div className="rounded-lg bg-white/80 p-2 text-maroon-700">
              <Sparkles className="h-5 w-5" />
            </div>
            <CardTitle className="text-base text-maroon-900">Hasanat Potential</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-maroon-700">
            <p className="text-2xl font-semibold text-maroon-900">
              +{detail.estimatedHasanat.toLocaleString()} hasanat
            </p>
            <p className="mt-1 text-xs">
              {detail.estimatedLetters.toLocaleString()} letters • {detail.sections.length} surah{detail.sections.length === 1 ? "" : "s"}
            </p>
          </CardContent>
        </Card>

        <Card className="border-emerald-100 bg-emerald-50/70">
          <CardHeader className="flex flex-row items-center gap-3 pb-2">
            <div className="rounded-lg bg-white/80 p-2 text-emerald-700">
              <Clock className="h-5 w-5" />
            </div>
            <CardTitle className="text-base text-emerald-900">Estimated Focus Time</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-emerald-700">
            <p className="text-2xl font-semibold text-emerald-900">≈ {detail.estimatedMinutes} minutes</p>
            <p className="mt-1 text-xs">{totalAyahs} ayahs across the highlighted surahs.</p>
          </CardContent>
        </Card>
      </section>

      <section className="space-y-4">
        <div className="flex flex-col gap-3 rounded-2xl border border-maroon-100 bg-cream-50 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1 text-sm text-maroon-700">
            <p className="font-semibold text-maroon-900">
              {todaysCompletion
                ? "Alhamdulillah! Today's recitation is logged."
                : "Ready to recite? Complete to unlock today's hasanat."}
            </p>
            <p className="text-xs text-maroon-600">
              {todaysCompletion
                ? `Logged at ${new Date(todaysCompletion.completedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
                : "Recite with presence, then tap complete to shower your ledger."}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              className="bg-gradient-to-r from-maroon-600 to-maroon-700 text-white border-0"
              onClick={handleCompletion}
            >
              {todaysCompletion ? "Celebrate again" : "Mark recitation complete"}
            </Button>
            <Button variant="outline" asChild>
              <Link href={`/reader?surah=${detail.sections[0]?.surahNumber ?? 1}`}>
                <BookOpen className="mr-2 h-4 w-4" />
                Open Reader
              </Link>
            </Button>
          </div>
        </div>

        {isCelebrating && celebrationMessage && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4 text-center text-emerald-800 shadow-md">
            {celebrationMessage}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <div className="rounded-2xl border border-maroon-100 bg-white/90 p-4 shadow-sm">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1 text-sm text-maroon-700">
              <p className="font-semibold text-maroon-900">Interactive Qur&apos;an session</p>
              <p>Recite directly inside the reader below—navigate verses, play audio, and keep your hasanāt momentum going.</p>
            </div>
            <div className="flex flex-wrap gap-2 text-xs text-gray-500">
              {detail.sections.map((section) => (
                <span
                  key={section.surahNumber}
                  className="rounded-full border border-maroon-200 bg-cream-50 px-3 py-1 font-medium text-maroon-700"
                >
                  Surah {section.englishName}
                </span>
              ))}
            </div>
          </div>
        </div>
        <QuranReader initialSurah={initialSurahNumber} initialAyah={initialAyahNumber} />
      </section>

      <section className="space-y-4">
        {detail.sections.map((section) => (
          <Card key={section.surahNumber} className="border-maroon-100 bg-white/95">
            <CardHeader>
              <CardTitle className="flex flex-wrap items-center gap-3 text-maroon-900">
                <Badge className="bg-maroon-600 text-white">Surah {section.englishName}</Badge>
                <span className="text-sm text-maroon-600">{section.arabicName}</span>
                <span className="text-xs text-gray-500">{section.ayahCount} ayahs</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="rounded-xl border border-maroon-100 bg-cream-50 p-3 text-sm text-maroon-700">
                Focus intention: renew sincerity before starting and end with du’a for steadfastness.
              </div>
              <ScrollArea className="h-64 rounded-xl border border-gray-100 bg-white p-4">
                <ol className='space-y-3 text-right font-["Scheherazade"] text-lg leading-relaxed text-maroon-900'>
                  {section.verses.map((verse) => (
                    <li key={verse.key} className="space-y-1">
                      <p>{verse.text}</p>
                      <p className="text-left text-xs text-gray-500">{verse.key}</p>
                    </li>
                  ))}
                </ol>
              </ScrollArea>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="rounded-2xl border border-amber-200 bg-amber-50/80 p-4 text-sm text-amber-800">
        <div className="flex flex-wrap items-center gap-3">
          <Trophy className="h-5 w-5" />
          <div>
            <p className="font-medium text-amber-900">Virtue spotlight</p>
            <p>
              These surahs brighten your week: Al-Kahf for Friday light, Al-Mulk for nightly protection, and the Quls for
              heartfelt shielding.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
