"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import AppLayout from "@/components/app-layout"
import { LiveRecitationAnalyzer } from "@/components/live-recitation-analyzer"
import { PremiumGate } from "@/components/premium-gate"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { useUser } from "@/hooks/use-user"
import { cn } from "@/lib/utils"
import {
  Award,
  BarChart3,
  BookOpen,
  Brain,
  CalendarDays,
  Crown,
  Flame,
  ListChecks,
  Mic,
  Music2,
  Pen,
  ShieldCheck,
  Sparkles,
  Target,
  Timer,
  TrendingUp,
} from "lucide-react"
import { CelebrationModal } from "@/components/CelebrationModal"
import { getVersesForRange } from "@/data/surah-verses"
import surahDataset from "@/data/quran.json"

const habitIconMap = {
  BookOpen,
  Brain,
  Pen,
  Target,
}

const difficultyStyles = {
  easy: "bg-green-100 text-green-800 border-green-200",
  medium: "bg-yellow-100 text-yellow-800 border-yellow-200",
  hard: "bg-red-100 text-red-800 border-red-200",
} as const

const weekdayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

type SurahDatasetEntry = {
  name: string
  name_translations: {
    ar?: string
    en?: string
  }
  number_of_ayah: number
  number_of_surah: number
  recitation?: string
}

type SurahOption = {
  number: number
  englishName: string
  arabicName: string
  ayahCount: number
  recitation?: string
}

const SURAH_OPTIONS: SurahOption[] = (surahDataset as SurahDatasetEntry[]).map((surah) => ({
  number: surah.number_of_surah,
  englishName: surah.name_translations.en ?? surah.name,
  arabicName: surah.name_translations.ar ?? surah.name,
  ayahCount: surah.number_of_ayah,
  recitation: surah.recitation,
}))

const DEFAULT_ANALYZER_VERSES = getVersesForRange(1, 1, 3)

export default function HabitQuestPage() {
  const { habits, stats, perks, isPremium, completeHabit, dashboard } = useUser()
  const { toast } = useToast()
  const [selectedHabitId, setSelectedHabitId] = useState<string>(habits[0]?.id ?? "")
  const initialSurahAyahCount = SURAH_OPTIONS[0]?.ayahCount ?? 1
  const [questDialogOpen, setQuestDialogOpen] = useState(false)
  const [questSurahNumber, setQuestSurahNumber] = useState<number>(SURAH_OPTIONS[0]?.number ?? 1)
  const [startAyah, setStartAyah] = useState<number>(1)
  const [endAyah, setEndAyah] = useState<number>(initialSurahAyahCount > 1 ? 2 : 1)
  const [celebrationOpen, setCelebrationOpen] = useState(false)
  const [celebrationVerse, setCelebrationVerse] = useState<string | null>(null)
  const [celebrationHabitTitle, setCelebrationHabitTitle] = useState<string>("")
  const [questStepCompletion, setQuestStepCompletion] = useState<boolean[]>([])
  const [reflectionNotes, setReflectionNotes] = useState("")
  const [selfReflection, setSelfReflection] = useState<number[]>([80])
  const [isCompletingQuest, setIsCompletingQuest] = useState(false)
  const [questElapsedSeconds, setQuestElapsedSeconds] = useState(0)

  useEffect(() => {
    if (habits.length === 0) {
      return
    }
    const exists = habits.some((habit) => habit.id === selectedHabitId)
    if (!exists) {
      setSelectedHabitId(habits[0].id)
    }
  }, [habits, selectedHabitId])

  useEffect(() => {
    if (!questDialogOpen) {
      setQuestElapsedSeconds(0)
      return
    }
    const openedAt = Date.now()
    setQuestElapsedSeconds(0)
    const interval = window.setInterval(() => {
      setQuestElapsedSeconds(Math.floor((Date.now() - openedAt) / 1000))
    }, 1000)
    return () => window.clearInterval(interval)
  }, [questDialogOpen])

  const selectedHabit = useMemo(
    () => habits.find((habit) => habit.id === selectedHabitId) ?? habits[0],
    [habits, selectedHabitId],
  )
  const questSurah = useMemo(
    () => SURAH_OPTIONS.find((entry) => entry.number === questSurahNumber) ?? SURAH_OPTIONS[0],
    [questSurahNumber],
  )

  const weeklyXpTotal = useMemo(() => stats.weeklyXP.reduce((total, value) => total + value, 0), [stats.weeklyXP])
  const selectedDifficulty = selectedHabit ? difficultyStyles[selectedHabit.difficulty] : difficultyStyles.medium
  const lastCompleted = selectedHabit?.lastCompletedAt
    ? new Date(`${selectedHabit.lastCompletedAt}T00:00:00`).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      })
    : "Not yet"

  useEffect(() => {
    if (!questSurah) return
    setStartAyah(1)
    setEndAyah(questSurah.ayahCount > 1 ? Math.min(questSurah.ayahCount, 2) : 1)
  }, [questSurah])

  const questVerseRange = useMemo(() => {
    if (!questSurah) return ""
    if (endAyah <= startAyah) {
      return `${startAyah}`
    }
    return `${startAyah}-${endAyah}`
  }, [endAyah, questSurah, startAyah])

  const isQuestReady = Boolean(selectedHabit && questSurah && startAyah >= 1 && endAyah >= startAyah)

  const questVerses = useMemo(
    () => getVersesForRange(questSurahNumber, startAyah, endAyah),
    [endAyah, questSurahNumber, startAyah],
  )
  const questRecitationUrl = questSurah?.recitation
  const analyzerVerses = questVerses.length > 0 ? questVerses : DEFAULT_ANALYZER_VERSES

  const questSteps = useMemo(() => {
    if (!selectedHabit || !questSurah) {
      return []
    }
      return [
        `Listen to the guided recitation for ${questSurah.englishName} (${questVerseRange}).`,
        `Record your own recitation with the live analyzer and review the feedback.`,
        `Capture a heartfelt reflection about ${selectedHabit.title.toLowerCase()} in your notes.`,
      ]
  }, [questSurah, questVerseRange, selectedHabit])

  useEffect(() => {
    setQuestStepCompletion(questSteps.map(() => false))
    if (!questDialogOpen) {
      setReflectionNotes("")
      setSelfReflection([80])
    }
  }, [questDialogOpen, questSteps])

  const allQuestStepsComplete = questStepCompletion.length > 0 && questStepCompletion.every(Boolean)
  const questElapsedFormatted = useMemo(() => {
    const minutes = Math.floor(questElapsedSeconds / 60)
    const seconds = questElapsedSeconds % 60
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
  }, [questElapsedSeconds])

  const gameTasks = dashboard?.gamePanel?.tasks ?? []
  const relatedTask = useMemo(() => {
    if (!selectedHabit?.id) return undefined
    return gameTasks.find((task) => task.type === "habit" && task.habitId === selectedHabit.id)
  }, [gameTasks, selectedHabit?.id])
  const otherGameTasks = useMemo(
    () => gameTasks.filter((task) => task.type !== "habit"),
    [gameTasks],
  )

  const getGameTaskIcon = (type: string) => {
    switch (type) {
      case "recitation":
        return <Mic className="h-4 w-4 text-purple-600" />
      case "memorization":
        return <Brain className="h-4 w-4 text-indigo-600" />
      case "daily_target":
        return <ShieldCheck className="h-4 w-4 text-emerald-600" />
      default:
        return <Sparkles className="h-4 w-4 text-yellow-600" />
    }
  }

  const handleStartAyahChange = (value: string) => {
    if (!questSurah) return
    const parsed = Number.parseInt(value, 10)
    if (Number.isNaN(parsed)) {
      setStartAyah(1)
      setEndAyah((prev) => Math.max(1, Math.min(prev, questSurah.ayahCount)))
      return
    }
    const normalized = Math.min(Math.max(1, parsed), questSurah.ayahCount)
    setStartAyah(normalized)
    setEndAyah((prev) => {
      const clampedPrev = Math.min(Math.max(1, prev), questSurah.ayahCount)
      return Math.max(clampedPrev, normalized)
    })
  }

  const handleEndAyahChange = (value: string) => {
    if (!questSurah) return
    const parsed = Number.parseInt(value, 10)
    if (Number.isNaN(parsed)) {
      setEndAyah(questSurah.ayahCount)
      return
    }
    const normalized = Math.min(Math.max(1, parsed), questSurah.ayahCount)
    setEndAyah(Math.max(normalized, startAyah))
  }

  const handleCompleteHabit = () => {
    if (!selectedHabit) return
    setQuestDialogOpen(true)
  }

  const handleQuestConfirmation = async () => {
    if (!selectedHabit || !questSurah) return
    if (!allQuestStepsComplete) {
      toast({
        title: "Almost there!",
        description: "Tick each quest activity before claiming today’s rewards.",
      })
      return
    }
    setIsCompletingQuest(true)
    try {
      await new Promise((resolve) => setTimeout(resolve, 400))
      const result = completeHabit(selectedHabit.id)
      toast({
        title: result.success ? "Habit completed!" : "Heads up",
        description: result.success
          ? `${result.message} Logged for ${questSurah.englishName} ayah ${questVerseRange}.`
          : result.message,
      })
      if (!result.success) {
        return
      }
      const reference = `${questSurah.englishName} (${questSurah.arabicName}) • Ayah ${questVerseRange}`
      setCelebrationHabitTitle(selectedHabit.title)
      setCelebrationVerse(reference)
      setQuestDialogOpen(false)
      setCelebrationOpen(true)
      try {
        const confetti = (await import("canvas-confetti")).default
        confetti({
          particleCount: 150,
          spread: 75,
          origin: { y: 0.7 },
          scalar: 0.9,
        })
      } catch (error) {
        console.error("Failed to launch celebration", error)
      }
    } finally {
      setIsCompletingQuest(false)
    }
  }

  return (
    <>
      <AppLayout>
        <div className="p-6 space-y-8">
          <header className="space-y-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="space-y-3">
                <h1 className="text-3xl font-bold text-maroon-900">Habit Quest Arena</h1>
                <p className="text-maroon-700 max-w-2xl">
                  Transform your Qur&apos;an study routine into a daily adventure. Level up streaks, earn hasanat, and unlock new
                  challenges as you complete quests.
                </p>
                <div className="flex flex-wrap gap-2">
                  {perks.slice(0, 3).map((perk) => (
                    <Badge key={perk} variant="secondary" className="bg-maroon-100 text-maroon-800 border-maroon-200">
                      <Sparkles className="mr-1 h-3 w-3" />
                      {perk}
                    </Badge>
                  ))}
                  {!isPremium && (
                    <Link href="/billing">
                      <Badge className="cursor-pointer bg-gradient-to-r from-yellow-400 to-orange-500 text-white border-0">
                        Unlock more perks
                      </Badge>
                    </Link>
                  )}
                </div>
              </div>
              <div className="rounded-2xl border border-maroon-200 bg-white p-5 shadow-md">
                <p className="text-sm text-maroon-600">Global Habit Streak</p>
                <div className="flex items-end gap-3">
                  <span className="text-4xl font-bold text-maroon-900">{stats.streak}</span>
                  <span className="text-maroon-600">days</span>
                </div>
                <p className="mt-2 text-xs text-maroon-500">
                  Complete any quest today to keep your streak and unlock bonus hasanat.
                </p>
              </div>
            </div>
          </header>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          <Card className="border-0 bg-gradient-to-br from-orange-500 to-red-500 text-white shadow-lg">
            <CardContent className="p-6 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm uppercase tracking-wide text-white/80">Daily Streak</p>
                <Flame className="h-6 w-6" />
              </div>
              <p className="text-3xl font-bold">{stats.streak} days</p>
              <p className="text-xs text-white/70">Maintain momentum to unlock mastery quests.</p>
            </CardContent>
          </Card>
          <Card className="border-0 bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-lg">
            <CardContent className="p-6 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm uppercase tracking-wide text-white/80">Weekly XP</p>
                <BarChart3 className="h-6 w-6" />
              </div>
              <p className="text-3xl font-bold">{weeklyXpTotal} XP</p>
              <p className="text-xs text-white/70">Earn {selectedHabit?.xpReward ?? 0} XP from today&apos;s featured quest.</p>
            </CardContent>
          </Card>
          <Card className="border-0 bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-lg">
            <CardContent className="p-6 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm uppercase tracking-wide text-white/80">Hasanat Earned</p>
                <Sparkles className="h-6 w-6" />
              </div>
              <p className="text-3xl font-bold">{stats.hasanat.toLocaleString()}</p>
              <p className="text-xs text-white/70">Every verified recitation adds to your reward balance.</p>
            </CardContent>
          </Card>
          <Card className="border-0 bg-gradient-to-br from-purple-600 to-maroon-600 text-white shadow-lg">
            <CardContent className="p-6 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm uppercase tracking-wide text-white/80">Habit Level</p>
                <Award className="h-6 w-6" />
              </div>
              <p className="text-3xl font-bold">Level {stats.level}</p>
              <p className="text-xs text-white/70">{stats.xpToNext} XP until your next rank-up.</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Card className="shadow-lg">
              <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <CardTitle className="text-xl flex items-center gap-2">
                    <Target className="h-5 w-5 text-maroon-600" />
                    {selectedHabit?.title ?? "Select a habit"}
                  </CardTitle>
                  <CardDescription>{selectedHabit?.description}</CardDescription>
                </div>
                {selectedHabit && (
                  <Badge className={cn("border", selectedDifficulty)}>{selectedHabit.difficulty.toUpperCase()}</Badge>
                )}
              </CardHeader>
              <CardContent className="space-y-6">
                {selectedHabit && (
                  <>
                    <div className="space-y-4">
                      <Progress value={selectedHabit.progress} className="h-2" />
                      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <div className="rounded-lg border border-maroon-100 bg-maroon-50 p-3">
                          <p className="text-xs text-maroon-600">Current Streak</p>
                          <p className="text-lg font-semibold text-maroon-900">{selectedHabit.streak} days</p>
                        </div>
                        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3">
                          <p className="text-xs text-yellow-700">Best Streak</p>
                          <p className="text-lg font-semibold text-yellow-800">{selectedHabit.bestStreak} days</p>
                        </div>
                        <div className="rounded-lg border border-indigo-200 bg-indigo-50 p-3">
                          <p className="text-xs text-indigo-700">Habit Level</p>
                          <p className="text-lg font-semibold text-indigo-800">Level {selectedHabit.level}</p>
                        </div>
                        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
                          <p className="text-xs text-emerald-700">Total XP</p>
                          <p className="text-lg font-semibold text-emerald-800">{selectedHabit.xp} XP</p>
                        </div>
                      </div>
                    </div>
                    <div className="rounded-xl border border-dashed border-maroon-200 bg-maroon-50 p-4 flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <p className="text-sm font-medium text-maroon-900">Daily Target</p>
                        <p className="text-xs text-maroon-600">Complete {selectedHabit.dailyTarget} to earn +{selectedHabit.xpReward} XP and +{selectedHabit.hasanatReward} hasanat.</p>
                      </div>
                      <Button
                        onClick={handleCompleteHabit}
                        className="bg-gradient-to-r from-maroon-600 to-maroon-700 text-white border-0"
                      >
                        <Sparkles className="mr-2 h-4 w-4" />
                        Complete today&apos;s quest
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-6 text-sm text-maroon-600">
                      <div className="flex items-center gap-2">
                        <CalendarDays className="h-4 w-4 text-maroon-500" />
                        Last completed: {lastCompleted}
                      </div>
                      <div className="flex items-center gap-2">
                        <Crown className="h-4 w-4 text-yellow-600" />
                        Best streak: {selectedHabit.bestStreak} days
                      </div>
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-emerald-500" />
                        Rewards: +{selectedHabit.xpReward} XP / +{selectedHabit.hasanatReward} hasanat
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl">Weekly Quest Board</CardTitle>
                <CardDescription>Select a quest to view details and power-ups.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                {habits.map((habit) => {
                  const Icon = habit.icon in habitIconMap ? habitIconMap[habit.icon as keyof typeof habitIconMap] : Target
                  return (
                    <button
                      key={habit.id}
                      type="button"
                      onClick={() => setSelectedHabitId(habit.id)}
                      className={cn(
                        "relative flex h-full flex-col gap-3 rounded-xl border p-4 text-left transition-all hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-maroon-500",
                        selectedHabit?.id === habit.id
                          ? "border-maroon-300 bg-maroon-50 shadow-inner"
                          : "border-gray-200 bg-white",
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-maroon-100 text-maroon-700">
                            <Icon className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="font-semibold text-maroon-900">{habit.title}</p>
                            <p className="text-xs text-maroon-600">{habit.dailyTarget}</p>
                          </div>
                        </div>
                        <Badge className={cn("border", difficultyStyles[habit.difficulty])}>{habit.difficulty}</Badge>
                      </div>
                      <div className="space-y-2">
                        <Progress value={habit.progress} className="h-2" />
                        <div className="flex items-center justify-between text-xs text-maroon-600">
                          <span>Streak: {habit.streak}d</span>
                          <span>Level {habit.level}</span>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </CardContent>
            </Card>

            {selectedHabit && (
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="text-xl">Weekly Progress</CardTitle>
                  <CardDescription>Track completion for {selectedHabit.title} this week.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2">
                  {selectedHabit.weeklyProgress.map((progressValue, index) => (
                    <div key={weekdayLabels[index]} className="rounded-lg border border-maroon-100 bg-white p-4">
                      <div className="flex items-center justify-between text-sm text-maroon-700">
                        <span className="font-medium text-maroon-900">{weekdayLabels[index]}</span>
                        <span>{Math.round(progressValue)}%</span>
                      </div>
                      <Progress value={progressValue} className="mt-3 h-2" />
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {otherGameTasks.length > 0 && (
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="text-xl">Other live game modes</CardTitle>
                  <CardDescription>
                    Jump into recitation battles, memorization sprints, and streak challenges without leaving the platform.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {otherGameTasks.map((task) => (
                    <div
                      key={task.id}
                      className="flex flex-col gap-3 rounded-xl border border-maroon-100 bg-white p-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm font-semibold text-maroon-900">
                          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-maroon-50">
                            {getGameTaskIcon(task.type)}
                          </span>
                          {task.title}
                        </div>
                        <p className="text-sm text-maroon-600">{task.description}</p>
                        <p className="text-xs text-maroon-500">+{task.xpReward} XP • +{task.hasanatReward} hasanat</p>
                      </div>
                      <Button
                        asChild
                        className="w-full bg-gradient-to-r from-purple-600 to-maroon-700 text-white shadow-md sm:w-auto"
                      >
                        <Link href={`/games/${task.id}`}>Open live mode</Link>
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

          <div className="space-y-6">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl">Reward Track</CardTitle>
                <CardDescription>Convert consistent habits into meaningful milestones.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-lg border border-maroon-100 bg-maroon-50 p-4">
                  <p className="text-xs text-maroon-600">Hasanat balance</p>
                  <p className="text-2xl font-bold text-maroon-900">{stats.hasanat.toLocaleString()}</p>
                  <p className="text-xs text-maroon-500">Keep reciting daily to multiply your rewards.</p>
                </div>
                <div className="grid gap-3 text-sm text-maroon-600">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-maroon-500" />
                    {stats.completedHabits} quests completed all-time
                  </div>
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-yellow-500" />
                    +{selectedHabit?.hasanatReward ?? 0} hasanat ready for today&apos;s completion
                  </div>
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-emerald-500" />
                    Next badge at 25 total quests (you&apos;re {Math.max(0, 25 - stats.completedHabits)} away)
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl">Unlocked Perks</CardTitle>
                <CardDescription>Your current plan gives you access to these boosters.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {perks.map((perk) => (
                  <div key={perk} className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-3 text-sm">
                    <ShieldCheck className="h-4 w-4 text-maroon-600" />
                    <span className="text-maroon-700">{perk}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            <PremiumGate featureName="Advanced Habit Analytics" description="Unlock streak forecasts, motivation nudges, and class-wide comparisons.">
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="text-xl">Advanced Habit Analytics</CardTitle>
                  <CardDescription>Spot trends before they break your streak.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="rounded-lg border border-indigo-200 bg-indigo-50 p-4 text-sm text-indigo-900">
                    <p className="font-semibold">Projected streak</p>
                    <p className="text-xs text-indigo-700">Keep up the pace to reach a 14-day streak within 3 more completions.</p>
                  </div>
                  <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
                    <p className="font-semibold">Motivation pulse</p>
                    <p className="text-xs text-emerald-700">AI reminders adapt to your energy level and study rhythm.</p>
                  </div>
                </CardContent>
              </Card>
            </PremiumGate>
          </div>
        </div>
      </div>
    </div>
      </AppLayout>
      <Dialog open={questDialogOpen} onOpenChange={(open) => setQuestDialogOpen(open)}>
        <DialogContent className="max-w-5xl overflow-hidden p-0">
          <DialogHeader className="px-6 pt-6 pb-0">
            <DialogTitle className="flex flex-wrap items-center justify-between gap-3 text-2xl font-semibold text-maroon-900">
              <span>Live quest studio</span>
              <Badge className="flex items-center gap-2 rounded-full border-maroon-200 bg-maroon-50 text-maroon-700">
                <Timer className="h-4 w-4" />
                {questElapsedFormatted}
              </Badge>
            </DialogTitle>
            <p className="mt-2 text-sm text-maroon-600">
              Bring today&apos;s <span className="font-semibold">{selectedHabit?.title}</span> to life. Recite, reflect, and log your
              progress without leaving the quest arena.
            </p>
          </DialogHeader>
          <div className="grid gap-0 lg:grid-cols-[1.6fr_1fr]">
            <div className="space-y-6 p-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-xl border border-maroon-100 bg-maroon-50/60 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="quest-surah" className="text-sm font-semibold text-maroon-900">
                      Focus surah
                    </Label>
                    {relatedTask && (
                      <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">
                        +{relatedTask.xpReward} XP • +{relatedTask.hasanatReward} hasanat
                      </Badge>
                    )}
                  </div>
                  <Select
                    value={questSurahNumber.toString()}
                    onValueChange={(value) => {
                      const numericValue = Number.parseInt(value, 10)
                      setQuestSurahNumber(Number.isNaN(numericValue) ? SURAH_OPTIONS[0]?.number ?? 1 : numericValue)
                    }}
                  >
                    <SelectTrigger id="quest-surah" className="w-full border-maroon-200 bg-white/70">
                      <SelectValue placeholder="Select a surah" />
                    </SelectTrigger>
                    <SelectContent className="max-h-64">
                      {SURAH_OPTIONS.map((surah) => (
                        <SelectItem key={surah.number} value={surah.number.toString()}>
                          {surah.number}. {surah.englishName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="quest-start-ayah" className="text-xs uppercase tracking-wide text-maroon-600">
                        Start ayah
                      </Label>
                      <Input
                        id="quest-start-ayah"
                        type="number"
                        min={1}
                        max={questSurah?.ayahCount ?? 1}
                        value={startAyah}
                        onChange={(event) => handleStartAyahChange(event.target.value)}
                        className="border-maroon-200"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="quest-end-ayah" className="text-xs uppercase tracking-wide text-maroon-600">
                        End ayah
                      </Label>
                      <Input
                        id="quest-end-ayah"
                        type="number"
                        min={startAyah}
                        max={questSurah?.ayahCount ?? startAyah}
                        value={endAyah}
                        onChange={(event) => handleEndAyahChange(event.target.value)}
                        className="border-maroon-200"
                      />
                    </div>
                  </div>
                  <p className="text-xs text-maroon-600">
                    Logging {questSurah?.englishName} ({questSurah?.arabicName}) • Ayah {questVerseRange}.
                  </p>
                </div>
                <div className="rounded-xl border border-maroon-100 bg-white p-4 space-y-3 shadow-sm">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-maroon-900">Confidence meter</p>
                    <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
                      {selfReflection[0]}%
                    </Badge>
                  </div>
                  <Slider value={selfReflection} onValueChange={setSelfReflection} min={50} max={100} step={1} />
                  <p className="text-xs text-gray-500">
                    Rate how confident you feel about today&apos;s recitation. Aim for at least 85% before logging completion.
                  </p>
                </div>
              </div>

              <Card className="border-maroon-100 shadow-md">
                <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <CardTitle className="flex items-center gap-2 text-lg text-maroon-900">
                      <Mic className="h-5 w-5 text-maroon-600" /> Live recitation analyzer
                    </CardTitle>
                  <Badge className="bg-maroon-50 text-maroon-700 border-maroon-200">Ayah {questVerseRange}</Badge>
                </CardHeader>
                <CardContent className="space-y-4">
                  <LiveRecitationAnalyzer
                    surah={questSurah?.englishName ?? "Surah"}
                    ayahRange={questVerseRange}
                    verses={analyzerVerses}
                  />
                    <p className="text-xs text-gray-500">
                      Hit record, recite the range, then review the instant recitation feedback before moving on.
                    </p>
                </CardContent>
              </Card>

              <Card className="border-maroon-100 shadow-md">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg text-maroon-900">
                    <ListChecks className="h-5 w-5 text-maroon-600" /> Quest activities
                  </CardTitle>
                  <CardDescription className="text-sm text-maroon-600">
                    Tick each mission as you go to unlock the completion button.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    {questSteps.map((step, index) => (
                      <label key={step} className="flex items-start gap-3 rounded-lg border border-maroon-100 bg-maroon-50/60 p-3 text-sm text-maroon-900">
                        <Checkbox
                          checked={questStepCompletion[index] ?? false}
                          onCheckedChange={(checked) => {
                            setQuestStepCompletion((current) =>
                              current.map((value, valueIndex) => (valueIndex === index ? Boolean(checked) : value)),
                            )
                          }}
                        />
                        <span>{step}</span>
                      </label>
                    ))}
                  </div>
                  <div
                    className={cn(
                      "rounded-lg border p-3 text-xs",
                      allQuestStepsComplete
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                        : "border-yellow-200 bg-yellow-50 text-yellow-700",
                    )}
                  >
                    {allQuestStepsComplete
                      ? "Great work! You’re clear to log today’s quest."
                      : "Complete every activity above to enable the completion button."}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-maroon-100 shadow-md">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg text-maroon-900">
                    <Pen className="h-5 w-5 text-maroon-600" /> Reflection journal
                  </CardTitle>
                    <CardDescription className="text-sm text-maroon-600">
                      Capture what resonated from today&apos;s verses or recitation focus.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Textarea
                    value={reflectionNotes}
                    onChange={(event) => setReflectionNotes(event.target.value)}
                      placeholder="Document your feelings, recitation corrections, or du&apos;a intentions."
                    className="min-h-[120px]"
                  />
                  <p className="text-xs text-gray-500">
                    Journaling keeps progress inside the platform—no need for separate apps or notebooks.
                  </p>
                </CardContent>
              </Card>

              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setQuestDialogOpen(false)}
                  className="border-maroon-200 text-maroon-700"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleQuestConfirmation}
                  disabled={!isQuestReady || !allQuestStepsComplete || isCompletingQuest}
                  className="bg-gradient-to-r from-maroon-600 via-maroon-700 to-rose-600 text-white shadow-md"
                >
                  {isCompletingQuest ? "Granting rewards..." : "Claim today’s quest rewards"}
                </Button>
              </div>
            </div>
            <div className="space-y-5 bg-maroon-900/95 p-6 text-white">
              <div className="rounded-xl border border-white/10 bg-white/10 p-4 space-y-2">
                <p className="text-xs uppercase tracking-wide text-white/60">Quest focus</p>
                <p className="text-lg font-semibold">
                  {questSurah?.englishName} <span className="text-white/70">({questSurah?.arabicName})</span>
                </p>
                <p className="text-sm text-white/70">Ayah {questVerseRange}</p>
                {relatedTask ? (
                  <p className="text-xs text-white/60">
                    Teacher: {relatedTask.teacherId ? relatedTask.teacherId.replace("_", " ") : "Quest mentor"}
                  </p>
                ) : (
                  <p className="text-xs text-white/60">
                    Custom quest range selected. Rewards track to your personal habit streak.
                  </p>
                )}
              </div>

              {questRecitationUrl && (
                <div className="rounded-xl border border-white/10 bg-white/10 p-4 space-y-3">
                  <p className="flex items-center gap-2 text-xs uppercase tracking-wide text-white/70">
                    <Music2 className="h-4 w-4" /> Studio recitation
                  </p>
                  <audio controls className="w-full">
                    <source src={questRecitationUrl} type="audio/mpeg" />
                    Your browser does not support the audio element.
                  </audio>
                  <p className="text-xs text-white/60">
                    Listen once before recording to anchor recitation precision.
                  </p>
                </div>
              )}

              <div className="space-y-3">
                <p className="text-xs uppercase tracking-wide text-white/60">Verse meaning spotlight</p>
                {questVerses.length > 0 ? (
                  questVerses.map((verse) => (
                    <div key={verse.ayah} className="rounded-xl border border-white/10 bg-white/10 p-3 space-y-2">
                      <p className="text-xs font-semibold uppercase tracking-wide text-amber-200">Ayah {verse.ayah}</p>
                      <p className="text-lg font-semibold leading-relaxed">{verse.arabic}</p>
                      <p className="text-sm text-white/80">{verse.translation}</p>
                    </div>
                  ))
                ) : (
                  <div className="rounded-xl border border-dashed border-white/20 bg-white/5 p-4 text-sm text-white/70">
                    We&apos;re preparing verse highlights for this range. You can still use the analyzer and journal to keep the
                    activity in-app.
                  </div>
                )}
              </div>

              <div className="rounded-xl border border-white/10 bg-gradient-to-br from-emerald-400/30 via-emerald-500/20 to-teal-400/20 p-4 text-sm text-emerald-100">
                <p className="font-semibold">Immersive mode engaged</p>
                <p className="text-xs text-emerald-50/80">
                  All tools—recitation, analysis, journaling, and rewards—are housed in this quest studio so nothing breaks the
                  learning flow.
                </p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      <CelebrationModal
        open={celebrationOpen}
        onOpenChange={setCelebrationOpen}
        mode="verse"
        planTitle={celebrationHabitTitle || "Habit Quest"}
        verseReference={celebrationVerse ?? undefined}
        primaryActionLabel="Back to quests"
        onPrimaryAction={() => setCelebrationOpen(false)}
      />
    </>
  )
}

