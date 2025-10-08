"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { AppLayout } from "@/components/app-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { RecordingInterface } from "@/components/recording-interface"
import { calculateHasanatForText } from "@/lib/hasanat"
import { useUser } from "@/hooks/use-user"
import {
  Award,
  BookOpen,
  Calendar,
  Clock,
  Target,
  TrendingUp,
  UserCheck,
} from "lucide-react"

interface PracticeTranscriptionResult {
  transcription?: string
  expectedText?: string
  feedback?: {
    overallScore?: number
    accuracy?: number
    fluencyScore?: number
  }
  hasanatPoints?: number
  duration?: number
}

const fallbackTask = {
  id: "sample_recitation",
  surah: "Al-Fatiha",
  ayahRange: "1-7",
  dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
  status: "assigned" as const,
  targetAccuracy: 85,
  teacherId: "teacher_001",
  notes: "Warm up with Bismillah and aim for smooth transitions between verses.",
  verses: [
    {
      ayah: 1,
      arabic: "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ",
      translation: "In the name of Allah, the Entirely Merciful, the Especially Merciful.",
    },
    {
      ayah: 2,
      arabic: "الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ",
      translation: "All praise is due to Allah, Lord of the worlds.",
    },
    {
      ayah: 3,
      arabic: "الرَّحْمَٰنِ الرَّحِيمِ",
      translation: "The Entirely Merciful, the Especially Merciful.",
    },
    {
      ayah: 4,
      arabic: "مَالِكِ يَوْمِ الدِّينِ",
      translation: "Sovereign of the Day of Recompense.",
    },
    {
      ayah: 5,
      arabic: "إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ",
      translation: "It is You we worship and You we ask for help.",
    },
    {
      ayah: 6,
      arabic: "اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ",
      translation: "Guide us to the straight path.",
    },
    {
      ayah: 7,
      arabic: "صِرَاطَ الَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ الْمَغْضُوبِ عَلَيْهِمْ وَلَا الضَّالِّينَ",
      translation:
        "The path of those upon whom You have bestowed favor, not of those who have evoked [Your] anger or of those who are astray.",
    },
  ],
}

export default function PracticePage() {
  const { dashboard, submitRecitationResult, isLoading, teachers } = useUser()

  const recitationTasks = useMemo(() => dashboard?.recitationTasks ?? [], [dashboard])
  const recitationSessions = useMemo(() => dashboard?.recitationSessions ?? [], [dashboard])

  const pendingTasks = useMemo(
    () => recitationTasks.filter((task) => task.status !== "reviewed"),
    [recitationTasks],
  )

  const [currentTaskId, setCurrentTaskId] = useState<string | null>(null)
  const [isSingleVerseMode, setIsSingleVerseMode] = useState(false)
  const [currentVerseIndex, setCurrentVerseIndex] = useState(0)
  const [verseHasanatEarned, setVerseHasanatEarned] = useState(0)
  const [countedVerses, setCountedVerses] = useState<boolean[]>([])

  useEffect(() => {
    if (recitationTasks.length === 0) {
      setCurrentTaskId(null)
      return
    }

    const currentTaskStillPending = currentTaskId
      ? recitationTasks.some((task) => task.id === currentTaskId && task.status !== "reviewed")
      : false

    if (currentTaskStillPending) {
      return
    }

    const nextTask = pendingTasks[0] ?? recitationTasks[0]
    setCurrentTaskId(nextTask?.id ?? null)
  }, [recitationTasks, pendingTasks, currentTaskId])

  const currentTask = recitationTasks.find((task) => task.id === currentTaskId)
  const activeTask = currentTask ?? (recitationTasks[0] ?? fallbackTask)

  const expectedText = useMemo(
    () => activeTask.verses.map((verse) => verse.arabic).join(" "),
    [activeTask],
  )

  const teacherMap = useMemo(
    () => new Map(teachers.map((teacher) => [teacher.id, teacher.name])),
    [teachers],
  )

  const totalTasks = recitationTasks.length
  const completedTasks = recitationTasks.filter((task) => task.status === "reviewed").length
  const submittedTasks = recitationTasks.filter((task) => task.status === "submitted").length
  const assignmentsProgress = totalTasks > 0 ? Math.round(((completedTasks + submittedTasks) / totalTasks) * 100) : 0

  const totalSessions = recitationSessions.length
  const averageAccuracy = totalSessions
    ? Math.round(recitationSessions.reduce((sum, session) => sum + session.accuracy, 0) / totalSessions)
    : 0
  const totalHasanat = recitationSessions.reduce((sum, session) => sum + session.hasanatEarned, 0)
  const latestSession = recitationSessions[0]

  const verseCount = activeTask.verses.length
  const currentVerse = activeTask.verses[currentVerseIndex] ?? activeTask.verses[0]
  const countedTotal = countedVerses.filter(Boolean).length
  const verseProgress = verseCount > 0 ? Math.round((countedTotal / verseCount) * 100) : 0
  const hasCurrentVerseCounted = countedVerses[currentVerseIndex] ?? false
  const isLastVerse = currentVerseIndex >= verseCount - 1

  const handleTranscriptionComplete = useCallback(
    (result: PracticeTranscriptionResult) => {
      submitRecitationResult({
        taskId: currentTask?.id,
        surah: activeTask.surah,
        ayahRange: activeTask.ayahRange,
        accuracy: result.feedback?.overallScore ?? 0,
        tajweedScore: result.feedback?.accuracy ?? 0,
        fluencyScore: result.feedback?.fluencyScore ?? 0,
        hasanatEarned: result.hasanatPoints ?? 0,
        durationSeconds: typeof result.duration === "number" ? result.duration : 0,
        transcript: result.transcription ?? "",
        expectedText: result.expectedText ?? expectedText,
      })
    },
    [submitRecitationResult, currentTask?.id, activeTask.surah, activeTask.ayahRange, expectedText],
  )

  useEffect(() => {
    setCurrentVerseIndex(0)
    setVerseHasanatEarned(0)
    setCountedVerses(new Array(activeTask.verses.length).fill(false))
  }, [activeTask.id, activeTask.verses.length])

  const calculateVerseHasanat = useCallback((text: string) => calculateHasanatForText(text), [])

  const handlePreviousVerse = useCallback(() => {
    setCurrentVerseIndex((prev) => (prev > 0 ? prev - 1 : prev))
  }, [])

  const handleNextVerse = useCallback(() => {
    if (!currentVerse) return

    setCountedVerses((prev) => {
      const next = [...prev]
      if (!next[currentVerseIndex]) {
        next[currentVerseIndex] = true
        const hasanatForVerse = calculateVerseHasanat(currentVerse.arabic)
        setVerseHasanatEarned((total) => total + hasanatForVerse)
      }
      return next
    })

    setCurrentVerseIndex((prev) => {
      if (prev >= verseCount - 1) {
        return prev
      }
      return prev + 1
    })
  }, [calculateVerseHasanat, currentVerse, currentVerseIndex, verseCount])

  const isUsingFallback = recitationTasks.length === 0

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-maroon-800">Recitation Practice Lab</h1>
            <p className="text-gray-600">
              Record your recitation, receive instant AI feedback, and sync the results with your teacher&apos;s dashboard.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href="/dashboard">Back to Dashboard</Link>
            </Button>
          </div>
        </div>

        {isLoading && (
          <div className="mb-6 text-sm text-gray-500">
            Loading the latest assignments from your teachers…
          </div>
        )}

        {/* Practice Session Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Target className="h-8 w-8 text-maroon-600" />
                <div>
                  <p className="text-sm text-gray-600">Assignments</p>
                  <p className="text-xl font-bold text-maroon-800">
                    {totalTasks > 0 ? `${totalTasks - pendingTasks.length}/${totalTasks}` : "0"}
                  </p>
                  <p className="text-xs text-gray-500">Pending: {pendingTasks.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <TrendingUp className="h-8 w-8 text-green-600" />
                <div>
                  <p className="text-sm text-gray-600">Average Accuracy</p>
                  <p className="text-xl font-bold text-green-700">{averageAccuracy}%</p>
                  <p className="text-xs text-gray-500">Based on {totalSessions} session{totalSessions === 1 ? "" : "s"}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Award className="h-8 w-8 text-amber-600" />
                <div>
                  <p className="text-sm text-gray-600">Hasanat Earned</p>
                  <p className="text-xl font-bold text-amber-700">{totalHasanat}</p>
                  <p className="text-xs text-gray-500">From recent recordings</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <BookOpen className="h-8 w-8 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-600">Current Focus</p>
                  <Badge variant="secondary" className="mt-1">
                    {activeTask.surah} • Ayah {activeTask.ayahRange}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Session Progress */}
        <Card className="mb-8">
          <CardContent className="p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-lg font-semibold text-maroon-800">Recitation Assignment Progress</h3>
                <p className="text-sm text-gray-600">
                  {totalTasks > 0
                    ? `${completedTasks + submittedTasks} of ${totalTasks} tasks submitted`
                    : "Submit recordings to unlock detailed analytics."}
                </p>
              </div>
              <Badge variant="secondary" className="bg-maroon-100 text-maroon-700">
                {assignmentsProgress}% complete
              </Badge>
            </div>
            <Progress value={assignmentsProgress} className="h-3" />
            {latestSession && (
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-maroon-600" />
                  Last session scored {latestSession.accuracy}% accuracy
                </div>
                <div className="flex items-center gap-2">
                  <UserCheck className="h-4 w-4 text-green-600" />
                  {latestSession.hasanatEarned} hasanat awarded
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Current Task */}
        <Card className="mb-8">
          <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="flex flex-col">
              <span className="text-xl">Current Recitation Assignment</span>
              <span className="text-sm font-normal text-gray-600">
                {activeTask.surah} • Ayah {activeTask.ayahRange}
              </span>
            </CardTitle>
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant="outline" className="text-sm">
                Target Accuracy: {activeTask.targetAccuracy}%
              </Badge>
              <div className="flex items-center gap-1 text-sm text-gray-500">
                <Calendar className="h-4 w-4 text-maroon-600" />
                Due {new Date(activeTask.dueDate).toLocaleDateString()}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="rounded-lg border border-maroon-100 bg-maroon-50 p-4 text-sm text-maroon-800">
              {activeTask.notes}
            </div>
            <div className="space-y-3">
              <p className="text-sm font-semibold text-gray-700">
                Assigned by {teacherMap.get(activeTask.teacherId) ?? "Your instructor"}
              </p>
              <div className="space-y-4 rounded-lg border border-maroon-100/60 bg-white/70 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-maroon-800">Single-verse recitation mode</p>
                    <p className="text-xs text-gray-600">
                      Focus on one ayah at a time and tally hasanat as you progress.
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Label htmlFor="single-verse-mode" className="text-sm text-gray-700">
                      {isSingleVerseMode ? "On" : "Off"}
                    </Label>
                    <Switch
                      id="single-verse-mode"
                      checked={isSingleVerseMode}
                      onCheckedChange={setIsSingleVerseMode}
                    />
                  </div>
                </div>

                {isSingleVerseMode ? (
                  <div className="space-y-5">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div className="text-sm font-semibold text-maroon-700">
                        Verse {currentVerseIndex + 1} of {verseCount}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-600">
                        <Badge variant="secondary" className="bg-amber-100 text-amber-700">
                          Session hasanat: {verseHasanatEarned}
                        </Badge>
                        <Badge variant="outline" className="border-maroon-200 text-maroon-700">
                          {verseProgress}% complete
                        </Badge>
                      </div>
                    </div>

                    <div className="overflow-hidden rounded-xl border border-maroon-100 bg-cream-50/80 p-6 shadow-inner">
                      <div
                        key={currentVerse?.ayah}
                        className="space-y-4 animate-in fade-in-0 slide-in-from-bottom-2 duration-300"
                      >
                        <div className="text-right text-3xl font-arabic leading-relaxed text-maroon-900" dir="rtl">
                          {currentVerse?.arabic}
                        </div>
                        <p className="text-sm text-gray-700">{currentVerse?.translation}</p>
                        <p className="text-xs text-gray-500">
                          Surah {activeTask.surah} • Ayah {currentVerse?.ayah}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Progress value={verseProgress} className="h-2" />
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <Button
                          variant="outline"
                          onClick={handlePreviousVerse}
                          disabled={currentVerseIndex === 0}
                        >
                          Previous ayah
                        </Button>
                        <div className="text-sm text-gray-600">
                          {hasCurrentVerseCounted
                            ? "Hasanat counted for this ayah."
                            : `+${calculateVerseHasanat(currentVerse?.arabic ?? "0")} hasanat when you proceed.`}
                        </div>
                        <Button
                          className="bg-maroon-600 text-white hover:bg-maroon-700"
                          onClick={handleNextVerse}
                          disabled={isLastVerse && hasCurrentVerseCounted}
                        >
                          {isLastVerse ? (hasCurrentVerseCounted ? "Completed" : "Complete recitation") : "Next ayah"}
                        </Button>
                      </div>
                      {isLastVerse && hasCurrentVerseCounted && (
                        <p className="text-sm font-medium text-green-700">
                          Masha’Allah! You have recited all assigned verses and earned {verseHasanatEarned} hasanat this round.
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {activeTask.verses.map((verse) => (
                      <div key={verse.ayah} className="rounded-lg border border-maroon-100 bg-cream-50 p-4">
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>Ayah {verse.ayah}</span>
                          <span>{activeTask.surah}</span>
                        </div>
                        <div className="mt-2 text-right text-2xl font-arabic text-maroon-900">{verse.arabic}</div>
                        <div className="mt-3 text-sm text-gray-600">{verse.translation}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recording Interface */}
        <div className="mb-8">
          <RecordingInterface
            expectedText={expectedText}
            ayahId={activeTask.id}
            onTranscriptionComplete={handleTranscriptionComplete}
          />
          {isUsingFallback && (
            <p className="mt-3 text-sm text-gray-500">
              No teacher assignments were found, so a sample Surah Al-Fatiha practice is loaded for you. Results from
              this demo won&apos;t sync with the teacher database until an official task is assigned.
            </p>
          )}
        </div>

        {/* Navigation */}
        <div className="flex flex-wrap justify-center gap-4">
          {pendingTasks.length > 0 && (
            <Button
              variant="outline"
              onClick={() => {
                const currentIndex = pendingTasks.findIndex((task) => task.id === currentTaskId)
                const nextTask = pendingTasks[(currentIndex + 1) % pendingTasks.length]
                setCurrentTaskId(nextTask?.id ?? null)
              }}
            >
              Switch Pending Assignment
            </Button>
          )}
          <Button className="bg-maroon-600 hover:bg-maroon-700 text-white" asChild>
            <Link href="/leaderboard">View Recitation Leaderboard</Link>
          </Button>
        </div>
      </div>
    </AppLayout>
  )
}
