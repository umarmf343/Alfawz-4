"use client"

import { useMemo } from "react"
import { BookOpenCheck } from "lucide-react"

import { QuranBookViewer } from "@/components/QuranBookViewer"
import { LiveTajweedAnalyzer } from "@/components/live-tajweed-analyzer"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { QuranReaderProvider, useQuranReader } from "@/hooks/use-quran-reader"
import { formatVerseReference } from "@/lib/quran-data"

const TOTAL_PAGES = 604

function LiveAnalysisPanel() {
  const { currentVerse } = useQuranReader()

  const verseRecords = useMemo(() => {
    if (!currentVerse) return []
    return [
      {
        ayah: currentVerse.ayahNumber,
        arabic: currentVerse.text,
        translation: "",
      },
    ]
  }, [currentVerse])

  if (!currentVerse) {
    return (
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg text-slate-700">
            <BookOpenCheck className="h-5 w-5 text-amber-600" aria-hidden />
            Ready for live tajwīd analysis
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-slate-600">
          اختر آية من المصحف لبدء التحليل الفوري لأدائك في التجويد. سيتم تمييز الآية المختارة باللون الذهبي داخل صفحات
          المصحف.
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-amber-100 bg-white/80 shadow-xl shadow-amber-100/30">
      <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle className="flex items-center gap-2 text-lg text-slate-800">
            <BookOpenCheck className="h-5 w-5 text-amber-600" aria-hidden />
            Live Tajwīd Analyzer
          </CardTitle>
          <p className="text-sm text-slate-500">Recite clearly to receive instant pronunciation feedback.</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <Badge variant="secondary" className="bg-amber-100 text-amber-800">
            صفحة {currentVerse.pageNumber}
            {currentVerse.pageNumber % 2 === 1 && currentVerse.pageNumber + 1 <= TOTAL_PAGES
              ? ` – ${currentVerse.pageNumber + 1}`
              : ""}
          </Badge>
          <Badge variant="outline" className="border-amber-300 text-amber-700">
            {formatVerseReference(currentVerse.verseKey)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <section className="space-y-2" dir="rtl">
          <p className="text-sm font-semibold text-emerald-700">النص المختار</p>
          <p className="rounded-2xl border border-amber-100 bg-amber-50/60 p-4 text-2xl leading-[2.5] text-slate-900 font-[family:var(--font-tajawal)]">
            {currentVerse.text}
          </p>
        </section>

        <Separator />

        <LiveTajweedAnalyzer
          surah={currentVerse.englishName ?? currentVerse.surahName}
          ayahRange={`Ayah ${currentVerse.ayahNumber}`}
          verses={verseRecords}
        />
      </CardContent>
    </Card>
  )
}

export default function StudentQuranReaderPage() {
  return (
    <QuranReaderProvider>
      <main className="flex flex-col gap-12 pb-16 pt-6">
        <QuranBookViewer />
        <section className="mx-auto w-full max-w-5xl px-4">
          <LiveAnalysisPanel />
        </section>
      </main>
    </QuranReaderProvider>
  )
}
