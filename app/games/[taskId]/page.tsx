"use client"

import { useCallback, useMemo, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import {
  ArrowLeft,
  Award,
  Brain,
  CheckCircle2,
  ChevronRight,
  Gamepad2,
  ListChecks,
  Mic,
  BookOpen,
  Sparkles,
  Timer,
  Trophy,
} from "lucide-react"

import AppLayout from "@/components/app-layout"
import { LiveRecitationAnalyzer } from "@/components/live-recitation-analyzer"
import { SRSStudySession } from "@/components/srs-study-session"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Slider } from "@/components/ui/slider"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { useUser } from "@/hooks/use-user"
import type {
  GamificationTaskRecord,
  GamificationTaskType,
  MemorizationReviewInput,
} from "@/lib/data/teacher-database"
import type { SRSCard } from "@/lib/srs-algorithm"

const FALLBACK_RECITATION_SESSION = {
  surah: "Al-Fatiha",
  ayahRange: "1-3",
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
  ],
} as const

const DAILY_QURAN_WORDS = [
  {
    word: "رَحْمَة",
    transliteration: "rahmah",
    meaning: "mercy, compassion",
    context: "Allah's encompassing mercy that comforts and protects believers.",
  },
  {
    word: "هُدًى",
    transliteration: "hudā",
    meaning: "guidance",
    context: "The divine direction that keeps one firm on the straight path.",
  },
  {
    word: "نُور",
    transliteration: "nūr",
    meaning: "light",
    context: "A spiritual illumination that removes doubt and fear.",
  },
  {
    word: "سَكِينَة",
    transliteration: "sakīnah",
    meaning: "tranquility, serenity",
    context: "The calmness Allah sends into hearts during moments of difficulty.",
  },
  {
    word: "فَلَاح",
    transliteration: "falāḥ",
    meaning: "everlasting success",
    context: "True prosperity granted to those who remain mindful of Allah.",
  },
] as const

const DAILY_VERSE_MEANINGS = [
  {
    reference: "Surah Al-Baqarah 2:286",
    excerpt: "لَا يُكَلِّفُ اللَّهُ نَفْسًا إِلَّا وُسْعَهَا",
    translation: "Allah does not burden a soul beyond what it can bear.",
    insight: "Trust that every challenge carries the strength to overcome it.",
  },
  {
    reference: "Surah Ash-Sharh 94:5",
    excerpt: "فَإِنَّ مَعَ الْعُسْرِ يُسْرًا",
    translation: "Indeed, with hardship comes ease.",
    insight: "Ease accompanies hardship, not just after it—keep looking for it.",
  },
  {
    reference: "Surah Al-Ikhlas 112:1",
    excerpt: "قُلْ هُوَ اللَّهُ أَحَدٌ",
    translation: "Say, He is Allah, the One.",
    insight: "Affirming Allah's oneness centers the heart with purpose and clarity.",
  },
  {
    reference: "Surah Maryam 19:96",
    excerpt: "إِنَّ الَّذِينَ آمَنُوا وَعَمِلُوا الصَّالِحَاتِ سَيَجْعَلُ لَهُمُ الرَّحْمَٰنُ وُدًّا",
    translation: "Indeed, those who believe and do righteous deeds—the Most Merciful will appoint for them affection.",
    insight: "Righteous actions open hearts to love and divine gentleness.",
  },
  {
    reference: "Surah Al-Ankabut 29:69",
    excerpt: "وَالَّذِينَ جَاهَدُوا فِينَا لَنَهْدِيَنَّهُمْ سُبُلَنَا",
    translation: "As for those who strive in Us, We will surely guide them to Our paths.",
    insight: "Every sincere effort is met with Allah's personalized guidance.",
  },
] as const

function getDayOfYear(date = new Date()): number {
  const startOfYear = new Date(date.getFullYear(), 0, 0)
  const diff = date.getTime() - startOfYear.getTime()
  const oneDay = 1000 * 60 * 60 * 24
  return Math.floor(diff / oneDay)
}

function normalizeTaskId(raw: string | string[] | undefined): string | null {
  if (!raw) return null
  return Array.isArray(raw) ? raw[0] ?? null : raw
}

type HabitQuestGameProps = {
  task: GamificationTaskRecord
  onComplete: () => Promise<void>
  isCompleting: boolean
  steps: string[]
  habitTitle: string
}

function HabitQuestGame({ task, onComplete, isCompleting, steps, habitTitle }: HabitQuestGameProps) {
  const [completedSteps, setCompletedSteps] = useState<boolean[]>(() => steps.map(() => false))
  const allStepsComplete = completedSteps.every(Boolean)
  const [wordRevealed, setWordRevealed] = useState(false)
  const [verseRevealed, setVerseRevealed] = useState(false)
  const [celebrationMessage, setCelebrationMessage] = useState<string | null>(null)
  const dayOfYear = useMemo(() => getDayOfYear(), [])
  const wordOfDay = useMemo(
    () => DAILY_QURAN_WORDS[dayOfYear % DAILY_QURAN_WORDS.length],
    [dayOfYear],
  )
  const verseOfDay = useMemo(
    () => DAILY_VERSE_MEANINGS[dayOfYear % DAILY_VERSE_MEANINGS.length],
    [dayOfYear],
  )

  const triggerCelebration = useCallback(async () => {
    const confetti = (await import("canvas-confetti")).default
    confetti({
      particleCount: 120,
      spread: 90,
      origin: { y: 0.7 },
      ticks: 180,
    })
    confetti({
      particleCount: 80,
      spread: 120,
      origin: { y: 0.6 },
      scalar: 0.9,
      startVelocity: 45,
      ticks: 200,
    })
  }, [])

  const handleRevealWord = useCallback(async () => {
    if (wordRevealed) return
    setWordRevealed(true)
    setCelebrationMessage("Maasha Allah! You unlocked today's Qur'an word.")
    await triggerCelebration()
  }, [triggerCelebration, wordRevealed])

  const handleRevealVerse = useCallback(async () => {
    if (verseRevealed) return
    setVerseRevealed(true)
    setCelebrationMessage("Maasha Allah! You uncovered today's ayah meaning.")
    await triggerCelebration()
  }, [triggerCelebration, verseRevealed])

  return (
    <Card className="border-maroon-100 shadow-lg">
      <CardHeader>
        <Badge variant="outline" className="bg-maroon-50 text-maroon-700 border-maroon-200 w-fit mb-2">
          Daily Quest
        </Badge>
        <CardTitle className="text-2xl text-maroon-900">{task.title}</CardTitle>
        <CardDescription className="text-gray-600">
          Follow the guided routine to complete <span className="font-semibold text-maroon-700">{habitTitle}</span> and earn
          +{task.xpReward} XP, +{task.hasanatReward} hasanat.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="rounded-lg border border-maroon-100 bg-maroon-50/60 p-4">
          <h3 className="text-sm font-semibold text-maroon-800 mb-3 flex items-center gap-2">
            <ListChecks className="h-4 w-4" /> Quest checklist
          </h3>
          <div className="space-y-3">
            {steps.map((step, index) => (
              <label key={step} className="flex items-start gap-3 text-sm text-maroon-900">
                <Checkbox
                  checked={completedSteps[index]}
                  onCheckedChange={(checked) => {
                    setCompletedSteps((current) => current.map((value, valueIndex) => (valueIndex === index ? Boolean(checked) : value)))
                  }}
                />
                <span>{step}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-lg border border-dashed border-maroon-200 bg-white p-4 space-y-4">
            <h4 className="text-sm font-semibold text-maroon-800 flex items-center gap-2">
              <BookOpen className="h-4 w-4" /> Qur&apos;an word of the day
            </h4>
            <div className="rounded-md border border-maroon-100 bg-maroon-50/60 p-3">
              <p className="text-xs uppercase text-maroon-600">Arabic</p>
              <p className="text-2xl font-bold text-maroon-900">{wordOfDay.word}</p>
              <p className="text-sm text-maroon-700 italic">{wordOfDay.transliteration}</p>
            </div>
            {wordRevealed ? (
              <div className="space-y-2 text-sm text-maroon-800">
                <p>
                  <span className="font-semibold">Meaning:</span> {wordOfDay.meaning}
                </p>
                <p className="text-maroon-600">{wordOfDay.context}</p>
              </div>
            ) : (
              <Button variant="outline" onClick={handleRevealWord} className="border-maroon-200 text-maroon-700">
                Reveal meaning
              </Button>
            )}
          </div>
          <div className="rounded-lg border border-dashed border-maroon-200 bg-white p-4 space-y-4">
            <div>
              <p className="text-xs uppercase text-gray-500">Mindful tempo</p>
              <Slider defaultValue={[70]} min={40} max={120} step={5} className="mt-2" />
              <p className="text-xs text-gray-500 mt-1">Adjust the slider to keep a consistent, calm pace.</p>
            </div>
            <div>
              <p className="text-xs uppercase text-gray-500">Breath count</p>
              <Input type="number" min={1} defaultValue={5} className="w-24" />
              <p className="text-xs text-gray-500 mt-1">Record how many deep breaths you took between ayahs.</p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-dashed border-maroon-200 bg-white p-4 space-y-4">
          <h4 className="text-sm font-semibold text-maroon-800 flex items-center gap-2">
            <Sparkles className="h-4 w-4" /> Verse meaning spotlight
          </h4>
          <div className="rounded-md border border-maroon-100 bg-maroon-50/60 p-3">
            <p className="text-xs uppercase text-maroon-600">{verseOfDay.reference}</p>
            <p className="text-maroon-900 font-semibold">{verseOfDay.excerpt}</p>
          </div>
          {verseRevealed ? (
            <div className="space-y-2 text-sm text-maroon-800">
              <p>
                <span className="font-semibold">Meaning:</span> {verseOfDay.translation}
              </p>
              <p className="text-maroon-600">{verseOfDay.insight}</p>
            </div>
          ) : (
            <Button onClick={handleRevealVerse} className="bg-gradient-to-r from-maroon-600 to-maroon-700 text-white border-0 w-fit">
              Unlock today&apos;s meaning
            </Button>
          )}
        </div>

        {celebrationMessage && (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800 flex items-center gap-3">
            <Sparkles className="h-5 w-5 text-emerald-500" />
            <div>
              <p className="font-semibold">{celebrationMessage}</p>
              <p className="text-xs text-emerald-600">Let the meaning settle in your heart before moving on.</p>
            </div>
          </div>
        )}

        <Button
          onClick={onComplete}
          disabled={!allStepsComplete || isCompleting}
          className="bg-gradient-to-r from-maroon-600 to-maroon-700 text-white border-0"
        >
          {isCompleting ? "Granting rewards..." : allStepsComplete ? "Complete quest" : "Finish checklist to complete"}
        </Button>
      </CardContent>
    </Card>
  )
}

type RecitationGameProps = {
  task: GamificationTaskRecord
  onSubmit: () => Promise<void>
  isSubmitting: boolean
  verses: { ayah: number; arabic: string; translation?: string }[]
  surah: string
  ayahRange: string
  targetAccuracy: number
}

function RecitationBossGame({ task, onSubmit, isSubmitting, verses, surah, ayahRange, targetAccuracy }: RecitationGameProps) {
  const [practiceNotes, setPracticeNotes] = useState("")
  const [selfScore, setSelfScore] = useState([targetAccuracy])

  return (
    <div className="space-y-6">
      <Card className="border-maroon-100 shadow-lg">
        <CardHeader>
          <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 w-fit mb-2">
            Boss Battle
          </Badge>
          <CardTitle className="text-2xl text-maroon-900">{task.title}</CardTitle>
          <CardDescription className="text-gray-600">
            Submit a recitation of <span className="font-semibold text-maroon-700">Surah {surah} ({ayahRange})</span> at {targetAccuracy}%
            accuracy or higher to claim +{task.xpReward} XP and +{task.hasanatReward} hasanat.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-lg border border-dashed border-maroon-200 bg-white">
              <LiveRecitationAnalyzer
                surah={surah}
                ayahRange={ayahRange}
                verses={verses.length > 0 ? verses : FALLBACK_RECITATION_SESSION.verses}
              />
            </div>
            <div className="rounded-lg border border-dashed border-maroon-200 bg-white p-4 space-y-4">
              <div>
                <p className="text-xs uppercase text-gray-500">Self-evaluated accuracy</p>
                <Slider value={selfScore} onValueChange={setSelfScore} min={70} max={100} step={1} />
                <p className="text-xs text-gray-500 mt-1">Aim for at least {targetAccuracy}% accuracy to secure full rewards.</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="practice-notes" className="text-sm text-maroon-800 flex items-center gap-2">
                  <Mic className="h-4 w-4" /> Practice notes
                </Label>
                <Textarea
                  id="practice-notes"
                  value={practiceNotes}
                  onChange={(event) => setPracticeNotes(event.target.value)}
                  placeholder="Note recitation tips, tricky transitions, or breath reminders."
                  className="min-h-[140px]"
                />
              </div>
              <div className="rounded-md bg-maroon-50/60 border border-maroon-100 p-3 text-sm text-maroon-800 space-y-1">
                <p className="font-semibold flex items-center gap-2">
                  <Sparkles className="h-4 w-4" /> Boss tips
                </p>
                <p>• Warm up with Qalqalah drills.</p>
                <p>• Maintain a steady tempo, especially across verse transitions.</p>
                <p>• Highlight makhārij mistakes in your notes to review later.</p>
              </div>
            </div>
          </div>

          <Button
            onClick={onSubmit}
            disabled={isSubmitting}
            className="bg-gradient-to-r from-purple-600 to-maroon-700 text-white border-0"
          >
            {isSubmitting ? "Submitting recitation..." : "Submit recitation"}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

type MemorizationGameProps = {
  task: GamificationTaskRecord
  cards: SRSCard[]
  onSessionComplete: (
    results: { card: SRSCard; result: { quality: number; accuracy: number; responseTime: number; wasCorrect: boolean } }[],
  ) => void
  isComplete: boolean
}

function MemorizationSprintGame({ task, cards, onSessionComplete, isComplete }: MemorizationGameProps) {
  return (
    <div className="space-y-6">
      <Card className="border-maroon-100 shadow-lg">
        <CardHeader>
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 w-fit mb-2">
            Memory Sprint
          </Badge>
          <CardTitle className="text-2xl text-maroon-900">{task.title}</CardTitle>
          <CardDescription className="text-gray-600">
            Review your memorization queue to earn +{task.xpReward} XP and +{task.hasanatReward} hasanat.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SRSStudySession cards={cards} onSessionComplete={onSessionComplete} />
        </CardContent>
      </Card>
      {isComplete && (
        <Card className="border-emerald-200 bg-emerald-50">
          <CardContent className="py-6 text-center space-y-2">
            <CheckCircle2 className="h-10 w-10 text-emerald-600 mx-auto" />
            <p className="font-semibold text-emerald-700">Review logged! Rewards have been added to your profile.</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

type DailyTargetGameProps = {
  task: GamificationTaskRecord
  completed: number
  target: number
  onLogAyah: () => void
  isLogging: boolean
}

function DailyTargetGame({ task, completed, target, onLogAyah, isLogging }: DailyTargetGameProps) {
  const percent = target > 0 ? Math.min(100, Math.round((completed / target) * 100)) : 0

  return (
    <div className="space-y-6">
      <Card className="border-maroon-100 shadow-lg">
        <CardHeader>
          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 w-fit mb-2">
            Streak Shield
          </Badge>
          <CardTitle className="text-2xl text-maroon-900">{task.title}</CardTitle>
          <CardDescription className="text-gray-600">
            Reach your daily target to fortify the streak shield and earn +{task.xpReward} XP with +{task.hasanatReward} hasanat.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="rounded-lg border border-maroon-100 bg-white p-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-sm text-gray-500">Ayahs completed today</p>
                <p className="text-3xl font-bold text-maroon-800">{completed}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Daily goal</p>
                <p className="text-3xl font-bold text-maroon-800">{target}</p>
              </div>
            </div>
            <Progress value={percent} className="h-3 mt-4" />
            <p className="text-xs text-gray-500 mt-2">Complete {Math.max(target - completed, 0)} more ayahs to secure the streak.</p>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <Button
              onClick={onLogAyah}
              disabled={isLogging}
              className="bg-gradient-to-r from-amber-500 to-maroon-600 text-white border-0"
            >
              {isLogging ? "Updating progress..." : "Log another ayah"}
            </Button>
            <p className="text-xs text-gray-500">
              Each ayah you log immediately contributes to today&apos;s streak shield progress.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function createHabitSteps(task: GamificationTaskRecord, habitTitle: string): string[] {
  if (task.type !== "habit") return []
  const normalizedTitle = habitTitle.toLowerCase()
  if (normalizedTitle.includes("recitation")) {
    return [
      "Warm up with three deep breaths while reciting basmala.",
      "Recite today&apos;s assigned ayahs aloud focusing on recitation cues.",
      "Record a quick audio snippet and listen back for clarity.",
      "Study today&apos;s Qur&apos;an word and verse meaning before logging completion.",
    ]
  }
  if (normalizedTitle.includes("memorization")) {
    return [
      "Review the last ayah from memory without looking.",
      "Listen to a reciter and shadow the articulation.",
      "Recite independently while tracking mistakes.",
      "Anchor the session by learning today&apos;s featured word and ayah meaning.",
    ]
  }
  return [
    "Review teacher instructions and set your intention.",
    "Complete the practical activity for this habit.",
    "Learn today&apos;s highlighted word and ayah meaning to cement the lesson.",
  ]
}

function buildSrsCards(
  taskId: string,
  passages: { ayah: number; arabic: string; translation?: string }[] | undefined,
  easeFactor: number,
  interval: number,
  repetitions: number,
  confidence: number,
  dueDate?: string,
  lastReviewed?: string | null,
): SRSCard[] {
  const parsedDueDate = dueDate ? new Date(dueDate) : new Date()
  const parsedLastReviewed = lastReviewed ? new Date(lastReviewed) : null

  if (!passages || passages.length === 0) {
    return [
      {
        id: `${taskId}_fallback`,
        userId: "learner",
        ayahId: `${taskId}_1`,
        surahId: taskId,
        content: FALLBACK_RECITATION_SESSION.verses[0]?.arabic ?? "",
        easeFactor,
        interval,
        repetitions,
        dueDate: parsedDueDate,
        lastReviewed: parsedLastReviewed,
        createdAt: parsedLastReviewed ?? new Date(),
        difficulty: 3,
        memorizationConfidence: confidence,
        reviewHistory: [],
      },
    ]
  }

  return passages.map((passage) => ({
    id: `${taskId}_${passage.ayah}`,
    userId: "learner",
    ayahId: `${taskId}:${passage.ayah}`,
    surahId: taskId,
    content: passage.arabic,
    easeFactor,
    interval,
    repetitions,
    dueDate: parsedDueDate,
    lastReviewed: parsedLastReviewed,
    createdAt: parsedLastReviewed ?? new Date(),
    difficulty: 3,
    memorizationConfidence: confidence,
    reviewHistory: [],
  }))
}

function GameSummary({
  task,
  type,
}: {
  task: GamificationTaskRecord
  type: GamificationTaskType
}) {
  return (
    <Card className="border-maroon-100">
      <CardHeader className="space-y-2">
        <Badge variant="outline" className="bg-white text-maroon-700 border-maroon-200 w-fit">
          Rewards
        </Badge>
        <CardTitle className="text-xl text-maroon-900 flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-500" /> Mission rewards
        </CardTitle>
        <CardDescription className="text-gray-600">
          Complete this {type.replace("_", " ")} quest to earn XP and hasanat boosts.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg bg-maroon-50/70 border border-maroon-100 p-3 text-center">
            <p className="text-xs uppercase text-maroon-700">XP Reward</p>
            <p className="text-2xl font-bold text-maroon-900">+{task.xpReward}</p>
          </div>
          <div className="rounded-lg bg-yellow-50 border border-yellow-100 p-3 text-center">
            <p className="text-xs uppercase text-yellow-700">Hasanat</p>
            <p className="text-2xl font-bold text-yellow-600">+{task.hasanatReward}</p>
          </div>
        </div>
        <div className="rounded-lg border border-dashed border-maroon-200 bg-white p-3 text-sm text-gray-600 space-y-2">
          <p className="font-semibold text-maroon-800 flex items-center gap-2">
            <Award className="h-4 w-4 text-maroon-600" /> Streak bonus
          </p>
          <p>Earn a 1.2x multiplier when you complete all daily quests before Maghrib.</p>
        </div>
      </CardContent>
    </Card>
  )
}

export default function GameDetailPage() {
  const params = useParams()
  const { toast } = useToast()
  const taskId = normalizeTaskId(params?.taskId)
  const {
    profile,
    dashboard,
    habits,
    completeHabit,
    completeRecitationAssignment,
    reviewMemorizationTask,
    incrementDailyTarget,
  } = useUser()

  const task = useMemo(() => {
    if (!taskId) return null
    return dashboard?.gamePanel.tasks.find((entry) => entry.id === taskId) ?? null
  }, [dashboard?.gamePanel.tasks, taskId])

  const recitationTask = useMemo(() => {
    if (!task || !task.recitationTaskId) return null
    return dashboard?.recitationTasks.find((entry) => entry.id === task.recitationTaskId) ?? null
  }, [dashboard?.recitationTasks, task])

  const memorizationTask = useMemo(() => {
    if (!task || !task.memorizationTaskId) return null
    return dashboard?.memorizationQueue.find((entry) => entry.id === task.memorizationTaskId) ?? null
  }, [dashboard?.memorizationQueue, task])

  const habit = useMemo(() => {
    if (!task || !task.habitId) return null
    return habits.find((entry) => entry.id === task.habitId) ?? null
  }, [habits, task])

  const [isCompleting, setIsCompleting] = useState(false)
  const [isSubmittingRecitation, setIsSubmittingRecitation] = useState(false)
  const [isMemorizationComplete, setIsMemorizationComplete] = useState(false)
  const [isLoggingAyah, setIsLoggingAyah] = useState(false)

  const handleCompletionToast = (message: string) => {
    toast({
      title: "Quest complete",
      description: message,
    })
  }

  const handleHabitCompletion = async () => {
    if (!task || !task.habitId) return
    try {
      setIsCompleting(true)
      completeHabit(task.habitId)
      handleCompletionToast("Your habit quest has been logged. XP and hasanat were added to your profile.")
    } finally {
      setIsCompleting(false)
    }
  }

  const handleRecitationSubmit = async () => {
    if (!task || !task.recitationTaskId) return
    try {
      setIsSubmittingRecitation(true)
      completeRecitationAssignment(task.recitationTaskId)
      handleCompletionToast("Recitation submitted successfully. Your teacher will see the update.")
    } finally {
      setIsSubmittingRecitation(false)
    }
  }

  const handleMemorizationSessionComplete = (
    results: {
      card: SRSCard
      result: { quality: number; accuracy: number; responseTime: number; wasCorrect: boolean }
    }[],
  ) => {
    if (!task || !memorizationTask) return
    if (results.length === 0) {
      toast({
        title: "Session incomplete",
        description: "Review at least one card to claim rewards.",
      })
      return
    }

    const aggregate = results.reduce(
      (accumulator, entry) => {
        return {
          quality: accumulator.quality + entry.result.quality,
          accuracy: accumulator.accuracy + entry.result.accuracy,
          duration: accumulator.duration + entry.result.responseTime,
        }
      },
      { quality: 0, accuracy: 0, duration: 0 },
    )

    const review: MemorizationReviewInput = {
      taskId: memorizationTask.id,
      quality: aggregate.quality / results.length,
      accuracy: aggregate.accuracy / results.length,
      durationSeconds: Math.max(60, Math.round(aggregate.duration)),
    }

    reviewMemorizationTask(review)
    setIsMemorizationComplete(true)
    handleCompletionToast("Memorization review logged. Keep up the strong retention!")
  }

  const handleDailyTargetProgress = () => {
    if (!task) return
    try {
      setIsLoggingAyah(true)
      incrementDailyTarget(1)
      toast({
        title: "Progress updated",
        description: "One ayah added to today&apos;s streak shield progress.",
      })
    } finally {
      setIsLoggingAyah(false)
    }
  }

  if (!task) {
    return (
      <AppLayout>
        <div className="p-6 space-y-6">
          <Button asChild variant="ghost" className="w-fit">
            <Link href="/games">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to quests
            </Link>
          </Button>
          <Card className="border-dashed border-maroon-200 bg-maroon-50/60">
            <CardContent className="py-12 text-center space-y-3">
              <Gamepad2 className="h-10 w-10 text-maroon-400 mx-auto" />
              <p className="font-semibold text-maroon-800">Quest not found</p>
              <p className="text-sm text-maroon-700">This mission may have expired or been reassigned by your teacher.</p>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    )
  }

  const questSubtitle = `Mission difficulty: ${task.target} steps • Status: ${task.status.replace("_", " ")}`
  const dailyTarget = dashboard?.dailyTarget

  let questContent: React.ReactNode = null

  if (task.type === "habit") {
    const steps = createHabitSteps(task, habit?.title ?? "Habit quest")
    questContent = (
      <HabitQuestGame
        task={task}
        habitTitle={habit?.title ?? "Daily habit"}
        steps={steps}
        onComplete={async () => handleHabitCompletion()}
        isCompleting={isCompleting}
      />
    )
  } else if (task.type === "recitation") {
    questContent = (
      <RecitationBossGame
        task={task}
        onSubmit={async () => handleRecitationSubmit()}
        isSubmitting={isSubmittingRecitation}
        verses={recitationTask?.verses ?? FALLBACK_RECITATION_SESSION.verses}
        surah={recitationTask?.surah ?? FALLBACK_RECITATION_SESSION.surah}
        ayahRange={recitationTask?.ayahRange ?? FALLBACK_RECITATION_SESSION.ayahRange}
        targetAccuracy={recitationTask?.targetAccuracy ?? 90}
      />
    )
  } else if (task.type === "memorization") {
    const cards = buildSrsCards(
      memorizationTask?.id ?? task.id,
      memorizationTask?.passages,
      memorizationTask?.easeFactor ?? 2.3,
      memorizationTask?.interval ?? 1,
      memorizationTask?.repetitions ?? 0,
      memorizationTask?.memorizationConfidence ?? 0.6,
      memorizationTask?.dueDate,
      memorizationTask?.lastReviewed ?? null,
    )
    questContent = (
      <MemorizationSprintGame
        task={task}
        cards={cards}
        onSessionComplete={handleMemorizationSessionComplete}
        isComplete={isMemorizationComplete}
      />
    )
  } else {
    questContent = (
      <DailyTargetGame
        task={task}
        completed={dailyTarget?.completedAyahs ?? 0}
        target={dailyTarget?.targetAyahs ?? task.target}
        onLogAyah={handleDailyTargetProgress}
        isLogging={isLoggingAyah}
      />
    )
  }

  return (
    <AppLayout>
      <div className="p-6 space-y-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-3">
            <Button asChild variant="ghost" className="w-fit pl-0">
              <Link href="/games">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Quest Command Center
              </Link>
            </Button>
            <div className="space-y-2">
              <Badge className="bg-gradient-to-r from-maroon-600 to-maroon-700 text-white border-0 w-fit">
                Mission {task.type.replace("_", " ").toUpperCase()}
              </Badge>
              <h1 className="text-3xl font-bold text-maroon-900">{task.title}</h1>
              <p className="text-maroon-700">{task.description}</p>
              <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-gray-500">
                <Timer className="h-3 w-3" /> {questSubtitle}
              </div>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Card className="border border-maroon-100">
              <CardContent className="py-4 px-5">
                <p className="text-xs uppercase text-gray-500">Learner</p>
                <p className="text-sm font-semibold text-maroon-900">{profile.name}</p>
              </CardContent>
            </Card>
            <Card className="border border-maroon-100">
              <CardContent className="py-4 px-5">
                <p className="text-xs uppercase text-gray-500">Current streak</p>
                <p className="text-sm font-semibold text-maroon-900">{dashboard?.gamePanel.streak.current ?? 0} days</p>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
          {questContent}
          <div className="space-y-6">
            <GameSummary task={task} type={task.type} />
            <Card className="border-maroon-100">
              <CardHeader>
                <CardTitle className="text-lg text-maroon-900 flex items-center gap-2">
                  <Brain className="h-4 w-4 text-maroon-600" /> Strategy tips
                </CardTitle>
                <CardDescription className="text-gray-600">
                  Use these quick wins to maximize XP and focus in today&apos;s quest.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-gray-600">
                <div className="flex items-start gap-2">
                  <ChevronRight className="h-4 w-4 text-maroon-500 mt-0.5" />
                  Maintain wudhu and posture to elevate your recitation presence.
                </div>
                <div className="flex items-start gap-2">
                  <ChevronRight className="h-4 w-4 text-maroon-500 mt-0.5" />
                  Record a 30-second clip and listen back for recitation consistency.
                </div>
                <div className="flex items-start gap-2">
                  <ChevronRight className="h-4 w-4 text-maroon-500 mt-0.5" />
                  Share a highlight with your teacher to unlock feedback boosts.
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
