import { notFound, redirect } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getActiveSession } from "@/lib/data/auth"
import { getDailySurahDetail } from "@/lib/daily-surah"
import { DailySurahRecitationExperience } from "./recitation-experience"

interface DailySurahPageProps {
  params: { slug: string }
}

export default function DailySurahPage({ params }: DailySurahPageProps) {
  const session = getActiveSession()
  if (!session) {
    redirect("/auth/sign-in")
  }
  if (session.role !== "student") {
    redirect("/dashboard")
  }

  const detail = getDailySurahDetail(params.slug)
  if (!detail) {
    notFound()
  }

  const firstSection = detail.sections[0]
  const subtitle = firstSection
    ? `${firstSection.arabicName} • ${firstSection.ayahCount} ayahs`
    : "Guided recitation"

  return (
    <div className="min-h-screen bg-amber-50/70 py-12">
      <div className="mx-auto flex max-w-5xl flex-col gap-8 px-6">
        <header className="space-y-4 text-maroon-900">
          <Badge className="w-fit bg-maroon-700 text-white">Daily Surahs</Badge>
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold">{detail.title}</h1>
            <p className="text-sm text-maroon-700">{detail.encouragement}</p>
          </div>
        </header>

        <Card className="border-maroon-100 bg-white/90 shadow-lg">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-maroon-900">Recitation Flow</CardTitle>
            <CardDescription className="text-maroon-600">{subtitle}</CardDescription>
          </CardHeader>
          <CardContent>
            <DailySurahRecitationExperience detail={detail} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
