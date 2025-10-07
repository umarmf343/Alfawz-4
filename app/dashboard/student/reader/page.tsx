"use client"

import { useMemo, useState } from "react"
import { BookOpen, ChevronLeft, ChevronRight, Sparkles } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

import { LiveAnalysisModal } from "./components/LiveAnalysisModal"

const SAMPLE_SESSION = {
  surah: "Al-Fātiḥah",
  verses: [
    {
      number: 1,
      arabic: "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ",
      translation: "In the name of Allah, the Entirely Merciful, the Especially Merciful.",
    },
    {
      number: 2,
      arabic: "الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ",
      translation: "All praise is due to Allah, Lord of the worlds.",
    },
    {
      number: 3,
      arabic: "الرَّحْمَٰنِ الرَّحِيمِ",
      translation: "The Entirely Merciful, the Especially Merciful.",
    },
  ],
}

export default function StudentReaderPage() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)

  const currentAyah = useMemo(
    () => SAMPLE_SESSION.verses[currentIndex] ?? SAMPLE_SESSION.verses[0],
    [currentIndex],
  )

  const verseReference = useMemo(
    () => `${SAMPLE_SESSION.surah} • āyah ${currentAyah.number}`,
    [currentAyah],
  )

  return (
    <div className="min-h-screen bg-slate-50 pb-16 pt-10 dark:bg-slate-950">
      <div className="mx-auto max-w-5xl space-y-8 px-4 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-900 dark:bg-slate-950">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                <Sparkles className="h-4 w-4" /> Tajwīd Lab
              </div>
              <h1 className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">
                Qur’an Reader & Live Analysis
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-600 dark:text-slate-300">
                Practice your recitation verse-by-verse. Click <strong>Start Live Analysis</strong> to receive instant feedback on
                pronunciation accuracy powered by Tarteel.
              </p>
            </div>
            <Badge variant="outline" className="border-emerald-500 text-emerald-600 dark:text-emerald-400">
              Beta
            </Badge>
          </div>
        </header>

        <main className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <section className="space-y-5 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-900 dark:bg-slate-950">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-500 dark:text-slate-300">
                <BookOpen className="h-4 w-4" /> {SAMPLE_SESSION.surah}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                  disabled={currentIndex === 0}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCurrentIndex((prev) => Math.min(SAMPLE_SESSION.verses.length - 1, prev + 1))
                  }
                  disabled={currentIndex === SAMPLE_SESSION.verses.length - 1}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <article className="rounded-2xl border border-slate-100 bg-slate-50/80 p-8 text-right shadow-inner dark:border-slate-900 dark:bg-slate-900">
              <p className="text-4xl leading-loose text-slate-900 dark:text-slate-100 font-quran">{currentAyah.arabic}</p>
              <Separator className="my-6" />
              <p className="text-base leading-relaxed text-slate-600 dark:text-slate-300">{currentAyah.translation}</p>
            </article>

            <Button size="lg" className="w-full" onClick={() => setIsModalOpen(true)}>
              Start Live Analysis
            </Button>
          </section>

          <aside className="space-y-4">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-900 dark:bg-slate-950">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">How live analysis works</h2>
              <ul className="mt-4 space-y-3 text-sm text-slate-600 dark:text-slate-300">
                <li className="flex items-start gap-2">
                  <span className="mt-1 h-2.5 w-2.5 rounded-full bg-emerald-500" aria-hidden />
                  Tarteel transcribes short audio bursts (~4s) from your microphone and compares them with the expected āyah.
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 h-2.5 w-2.5 rounded-full bg-emerald-500" aria-hidden />
                  Correctly recited words are underlined in green, while mispronunciations appear in red with helpful tooltips.
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 h-2.5 w-2.5 rounded-full bg-emerald-500" aria-hidden />
                  Stop the analysis at any time; audio is processed live and never stored on our servers.
                </li>
              </ul>
            </div>
          </aside>
        </main>
      </div>

      <LiveAnalysisModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        expectedVerse={currentAyah.arabic}
        verseReference={verseReference}
        options={{ chunkDurationMs: 4000 }}
      />
    </div>
  )
}

