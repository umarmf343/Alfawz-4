"use client"

import Link from "next/link"
import { useCallback, useEffect, useMemo, useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import AppLayout from "@/components/app-layout"
import { PremiumGate } from "@/components/premium-gate"
import { LiveRecitationAnalyzer } from "@/components/live-recitation-analyzer"
import { useToast } from "@/hooks/use-toast"
import { useUser } from "@/hooks/use-user"
import { StudentWelcomeAudio } from "@/components/student/StudentWelcomeAudio"
import { VoiceRecognitionWidget } from "@/components/student/VoiceRecognitionWidget"
import { getDailySurahRecommendations } from "@/lib/daily-surah"
import { trackError, trackEvent, trackStateChange } from "@/lib/analytics"
import {
  BookOpen,
  Play,
  Trophy,
  Calendar,
  Clock,
  Star,
  TrendingUp,
  Target,
  Award,
  Mic,
  HeadphonesIcon,
  Sparkles,
  CheckCircle2,
  ArrowUpRight,
  ArrowDownRight,
  AlertCircle,
  Minus,
  NotebookPen,
  UserCheck,
  Brain,
  Gamepad2,
  Flame,
  Zap,
  Shield,
} from "lucide-react"

const FALLBACK_TAJWEED_SESSION = {
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

export default function DashboardPage() {
  const {
    profile,
    stats,
    habits,
    teachers,
    dashboard,
    isLoading,
    error,
    updateDailyTarget,
    resetDailyTargetProgress,
    setFeaturedHabit,
    updateGoalProgress,
    toggleGoalCompletion,
    addGoal,
    completeRecitationAssignment,
    completeHabit,
  } = useUser()
  const { toast } = useToast()

  const trackDashboardEvent = useCallback(
    (eventName: string, payload: Record<string, unknown> = {}) => {
      trackEvent(eventName, {
        area: "student_dashboard",
        userId: profile.id,
        ...payload,
      })
    },
    [profile.id],
  )

  const trackDashboardState = useCallback(
    (scope: string, change: Record<string, unknown>) => {
      trackStateChange(scope, change, {
        area: "student_dashboard",
        userId: profile.id,
      })
    },
    [profile.id],
  )

  const getErrorMessage = useCallback((caught: unknown) => {
    if (caught instanceof Error) {
      return caught.message
    }
    if (typeof caught === "string") {
      return caught
    }
    return "An unexpected error occurred."
  }, [])
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const firstName = useMemo(() => profile.name.split(" ")[0] ?? profile.name, [profile.name])
  const studyMinutes = stats.studyMinutes
  const studyHours = Math.floor(studyMinutes / 60)
  const remainingMinutes = studyMinutes % 60
  const formattedStudyTime = `${studyHours > 0 ? `${studyHours}h ` : ""}${remainingMinutes}m`
  const levelTarget = stats.xp + stats.xpToNext
  const xpProgress = levelTarget === 0 ? 0 : Math.max(0, Math.min(100, Math.round((stats.xp / levelTarget) * 100)))
  const weeklyXpTotal = stats.weeklyXP.reduce((total, value) => total + value, 0)
  const preferredHabitId = dashboard?.preferredHabitId
  const dailyTarget = dashboard?.dailyTarget
  const activities = useMemo(() => dashboard?.activities ?? [], [dashboard?.activities])
  const goals = useMemo(() => dashboard?.goals ?? [], [dashboard?.goals])
  const leaderboardData = useMemo(() => dashboard?.leaderboard ?? [], [dashboard?.leaderboard])
  const recitationTasks = useMemo(() => dashboard?.recitationTasks ?? [], [dashboard?.recitationTasks])
  const recitationSessions = useMemo(() => dashboard?.recitationSessions ?? [], [dashboard?.recitationSessions])
  const tajweedFocus = useMemo(() => dashboard?.tajweedFocus ?? [], [dashboard?.tajweedFocus])
  const dailyTargetCompleted = dailyTarget?.completedAyahs ?? 0
  const dailyTargetGoal = dailyTarget?.targetAyahs ?? 0
  const habitCompletionTarget = dashboard?.habitCompletion.target ?? Math.max(habits.length * 4, 1)
  const habitCompletionCompleted = Math.min(
    dashboard?.habitCompletion.completed ?? stats.completedHabits,
    habitCompletionTarget,
  )
  const habitCompletionPercent = habitCompletionTarget
    ? Math.max(0, Math.min(100, Math.round((habitCompletionCompleted / habitCompletionTarget) * 100)))
    : 0
  const habitWeeklyChange = dashboard?.habitCompletion.weeklyChange ?? 0
  const habitRingRadius = 44
  const habitRingCircumference = 2 * Math.PI * habitRingRadius
  const habitRingOffset = habitRingCircumference - (habitCompletionPercent / 100) * habitRingCircumference
  const leaderboardSummary = useMemo(() => {
    return (
      leaderboardData.find(
        (entry) => entry.name === "You" && entry.scope === "class" && entry.timeframe === "weekly",
      ) ?? null
    )
  }, [leaderboardData])
  const leaderboardTrend = leaderboardSummary?.trend ?? 0
  const leaderboardPercentile = leaderboardSummary?.percentile
  const featuredHabit = useMemo(() => {
    if (!preferredHabitId) {
      return habits[0]
    }
    return habits.find((habit) => habit.id === preferredHabitId) ?? habits[0]
  }, [preferredHabitId, habits])
  const hasHabits = habits.length > 0

  const [customTarget, setCustomTarget] = useState(() => dashboard?.dailyTarget.targetAyahs ?? 10)
  const [isCelebrating, setIsCelebrating] = useState(false)
  const [leaderboardScope, setLeaderboardScope] = useState<"class" | "global">("class")
  const [leaderboardTimeframe, setLeaderboardTimeframe] = useState<"weekly" | "monthly">("weekly")
  const [goalFormOpen, setGoalFormOpen] = useState(false)
  const [newGoalTitle, setNewGoalTitle] = useState("")
  const [newGoalDeadline, setNewGoalDeadline] = useState("")
  const [hasShownCelebration, setHasShownCelebration] = useState(false)
  const [completingRecitationId, setCompletingRecitationId] = useState<string | null>(null)
  const [isGameDialogOpen, setIsGameDialogOpen] = useState(false)

  const searchParamsString = searchParams?.toString() ?? ""
  const playGamesParam = useMemo(() => searchParams?.get("playGames") === "true", [searchParams])

  const handleGameDialogChange = useCallback(
    (open: boolean) => {
      setIsGameDialogOpen(open)
      trackDashboardEvent("dashboard_game_dialog_toggled", { open })
      const params = new URLSearchParams(searchParamsString)
      if (open) {
        params.set("playGames", "true")
      } else {
        params.delete("playGames")
      }
      const query = params.toString()
      router.replace(`${pathname}${query ? `?${query}` : ""}`, { scroll: false })
    },
    [pathname, router, searchParamsString, trackDashboardEvent],
  )

  useEffect(() => {
    if (playGamesParam) {
      setIsGameDialogOpen(true)
    }
  }, [playGamesParam])

  useEffect(() => {
    if (dailyTarget) {
      setCustomTarget(dailyTargetGoal)
    }
  }, [dailyTargetGoal, dailyTarget])

  useEffect(() => {
    if (goalFormOpen && newGoalDeadline.trim().length === 0) {
      setNewGoalDeadline(new Date().toISOString().slice(0, 10))
    }
  }, [goalFormOpen, newGoalDeadline])

  const dailyTargetPercent = useMemo(() => {
    if (dailyTargetGoal === 0) return 0
    return Math.max(0, Math.min(100, Math.round((dailyTargetCompleted / dailyTargetGoal) * 100)))
  }, [dailyTargetCompleted, dailyTargetGoal])

  const formattedActivity = useMemo(() => {
    return activities.map((activity) => {
      const date = new Date(activity.timestamp)
      const diffMs = Date.now() - date.getTime()
      const diffMinutes = Math.round(diffMs / (60 * 1000))
      let label = "Just now"
      if (diffMinutes >= 60) {
        const diffHours = Math.round(diffMinutes / 60)
        if (diffHours < 24) {
          label = `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`
        } else {
          const diffDays = Math.round(diffHours / 24)
          label = `${diffDays} day${diffDays === 1 ? "" : "s"} ago`
        }
      } else if (diffMinutes > 0) {
        label = `${diffMinutes} minute${diffMinutes === 1 ? "" : "s"} ago`
      }

      return {
        ...activity,
        time: label,
      }
    })
  }, [activities])

  const upcomingGoals = useMemo(() => {
    return goals.map((goal) => {
      const deadline = new Date(goal.deadline)
      const now = new Date()
      const diffMs = deadline.getTime() - now.getTime()
      const diffDays = Math.round(diffMs / (24 * 60 * 60 * 1000))
      let label = "Due today"
      if (diffDays > 0) {
        label = `Due in ${diffDays} day${diffDays === 1 ? "" : "s"}`
      } else if (diffDays < 0) {
        label = `Overdue by ${Math.abs(diffDays)} day${diffDays === -1 ? "" : "s"}`
      }

      return {
        ...goal,
        deadlineLabel: label,
      }
    })
  }, [goals])

  const leaderboardEntries = useMemo(() => {
    return leaderboardData.filter(
      (entry) => entry.scope === leaderboardScope && entry.timeframe === leaderboardTimeframe,
    )
  }, [leaderboardData, leaderboardScope, leaderboardTimeframe])

  const gamePanel = dashboard?.gamePanel
  const gameTasks = useMemo(() => gamePanel?.tasks ?? [], [gamePanel?.tasks])
  const seasonXpPercent = useMemo(() => {
    if (!gamePanel) return 0
    const threshold = gamePanel.season.xpToNext || 1
    return Math.max(0, Math.min(100, Math.round((gamePanel.season.xp / threshold) * 100)))
  }, [gamePanel])
  const energyPercent = useMemo(() => {
    if (!gamePanel) return 0
    if (gamePanel.energy.max === 0) return 0
    return Math.max(
      0,
      Math.min(100, Math.round((gamePanel.energy.current / gamePanel.energy.max) * 100)),
    )
  }, [gamePanel])
  const gameBoosts = useMemo(() => gamePanel?.boosts ?? [], [gamePanel?.boosts])

  const pendingRecitations = useMemo(
    () => recitationTasks.filter((task) => task.status !== "reviewed"),
    [recitationTasks],
  )
  const reviewedRecitations = useMemo(
    () => recitationTasks.filter((task) => task.status === "reviewed").length,
    [recitationTasks],
  )
  const submittedRecitations = useMemo(
    () => recitationTasks.filter((task) => task.status === "submitted").length,
    [recitationTasks],
  )
  const recitationCompletionPercent = recitationTasks.length
    ? Math.round(((reviewedRecitations + submittedRecitations) / recitationTasks.length) * 100)
    : 0
  const nextRecitationTask = pendingRecitations[0] ?? recitationTasks[0]
  const lastRecitationSession = recitationSessions[0]
  const liveAnalysisSourceTask = nextRecitationTask ?? recitationTasks[0] ?? null
  const liveAnalysisSurah = liveAnalysisSourceTask?.surah ?? FALLBACK_TAJWEED_SESSION.surah
  const liveAnalysisAyahRange = liveAnalysisSourceTask?.ayahRange ?? FALLBACK_TAJWEED_SESSION.ayahRange
  const liveAnalysisVerses = liveAnalysisSourceTask?.verses?.length
    ? liveAnalysisSourceTask.verses
    : FALLBACK_TAJWEED_SESSION.verses
  const averageRecitationScore = recitationSessions.length
    ? Math.round(recitationSessions.reduce((total, session) => total + session.accuracy, 0) / recitationSessions.length)
    : 0
  const averageTajweedScore = recitationSessions.length
    ? Math.round(recitationSessions.reduce((total, session) => total + session.tajweedScore, 0) / recitationSessions.length)
    : 0
  const tajweedMasteredCount = useMemo(
    () => tajweedFocus.filter((focus) => focus.status === "mastered").length,
    [tajweedFocus],
  )
  const tajweedImprovingCount = useMemo(
    () => tajweedFocus.filter((focus) => focus.status === "improving").length,
    [tajweedFocus],
  )
  const tajweedNeedsSupportCount = useMemo(
    () => tajweedFocus.filter((focus) => focus.status === "needs_support").length,
    [tajweedFocus],
  )
  const tajweedReadiness = useMemo(() => {
    if (tajweedFocus.length === 0) return 0
    const masteredWeight = tajweedMasteredCount
    const improvingWeight = tajweedImprovingCount * 0.6
    return Math.max(
      0,
      Math.min(100, Math.round(((masteredWeight + improvingWeight) / tajweedFocus.length) * 100)),
    )
  }, [tajweedFocus.length, tajweedMasteredCount, tajweedImprovingCount])
  const nextTajweedFocus = useMemo(
    () => tajweedFocus.find((focus) => focus.status !== "mastered") ?? tajweedFocus[0] ?? null,
    [tajweedFocus],
  )

  const [dailySurahSuggestions, setDailySurahSuggestions] = useState(() => getDailySurahRecommendations(new Date()))

  useEffect(() => {
    setDailySurahSuggestions(getDailySurahRecommendations(new Date()))
    const interval = setInterval(() => {
      setDailySurahSuggestions(getDailySurahRecommendations(new Date()))
    }, 60_000)
    return () => clearInterval(interval)
  }, [])

  const dailySurahLog = dashboard?.dailySurahLog ?? []

  const { completedDailySurahSlugs, totalAvailableHasanat } = useMemo(() => {
    const todayKey = new Date().toISOString().slice(0, 10)
    const completed = new Set<string>()
    for (const entry of dailySurahLog) {
      if (entry.completedAt.slice(0, 10) === todayKey) {
        completed.add(entry.slug)
      }
    }
    let available = 0
    for (const suggestion of dailySurahSuggestions) {
      if (!completed.has(suggestion.slug)) {
        available += suggestion.estimatedHasanat
      }
    }
    return { completedDailySurahSlugs: completed, totalAvailableHasanat: available }
  }, [dailySurahLog, dailySurahSuggestions])

  const recitationStatusStyles: Record<string, string> = {
    assigned: "bg-amber-100 text-amber-700 border border-amber-200",
    submitted: "bg-maroon-100 text-maroon-700 border border-maroon-200",
    reviewed: "bg-emerald-100 text-emerald-700 border border-emerald-200",
  }

  const recitationStatusLabels: Record<string, string> = {
    assigned: "Assigned",
    submitted: "Submitted",
    reviewed: "Reviewed",
  }

  const tajweedStatusStyles: Record<string, string> = {
    needs_support: "bg-amber-100 text-amber-700 border border-amber-200",
    improving: "bg-maroon-100 text-maroon-700 border border-maroon-200",
    mastered: "bg-emerald-100 text-emerald-700 border border-emerald-200",
  }

  const tajweedStatusLabels: Record<string, string> = {
    needs_support: "Needs support",
    improving: "Improving",
    mastered: "Mastered",
  }

  const gameTaskStatusLabels: Record<string, string> = {
    locked: "Locked",
    in_progress: "In progress",
    completed: "Completed",
  }

  const gameTaskStatusStyles: Record<string, string> = {
    locked: "bg-gray-100 text-gray-600",
    in_progress: "bg-maroon-100 text-maroon-700 border border-maroon-200",
    completed: "bg-emerald-100 text-emerald-700",
  }

  const teacherMap = useMemo(() => new Map(teachers.map((teacher) => [teacher.id, teacher.name])), [teachers])

  const handleSaveTarget = useCallback(() => {
    try {
      updateDailyTarget(customTarget)
      trackDashboardState("daily_target", {
        action: "update_target",
        targetAyahs: customTarget,
        completedAyahs: dailyTargetCompleted,
      })
      toast({
        title: "Daily target updated",
        description: `Your goal is now set to ${customTarget} ayah${customTarget === 1 ? "" : "s"}.`,
      })
    } catch (caught) {
      const message = getErrorMessage(caught)
      trackError("dashboard_daily_target_update_failed", caught, {
        action: "update_target",
        targetAyahs: customTarget,
        userId: profile.id,
      })
      toast({
        title: "Could not update target",
        description: message,
        variant: "destructive",
      })
    }
  }, [customTarget, dailyTargetCompleted, getErrorMessage, profile.id, toast, trackDashboardState, updateDailyTarget])

  const handleReciteNow = useCallback(() => {
    trackDashboardEvent("dashboard_daily_target_recite_now", {
      targetAyahs: dailyTargetGoal,
      completedAyahs: dailyTargetCompleted,
    })
    router.push("/reader?source=daily-target")
  }, [dailyTargetCompleted, dailyTargetGoal, router, trackDashboardEvent])

  const dailyGoalMet = dailyTargetGoal > 0 && dailyTargetCompleted >= dailyTargetGoal
  const canCreateGoal = newGoalTitle.trim().length > 0 && newGoalDeadline.trim().length > 0

  const handleCreateGoal = useCallback(() => {
    const trimmedTitle = newGoalTitle.trim()
    const trimmedDeadline = newGoalDeadline.trim()
    if (trimmedTitle.length === 0 || trimmedDeadline.length === 0) {
      toast({
        title: "Add goal details",
        description: "Provide a title and deadline to save your goal.",
        variant: "destructive",
      })
      return
    }
    try {
      const isoDeadline = new Date(trimmedDeadline).toISOString()
      addGoal({ title: trimmedTitle, deadline: isoDeadline })
      trackDashboardEvent("dashboard_goal_created", {
        goalTitle: trimmedTitle,
        deadline: isoDeadline,
      })
      trackDashboardState("goal", {
        action: "create",
        title: trimmedTitle,
        deadline: isoDeadline,
      })
      toast({
        title: "Goal added",
        description: `We'll remind you about “${trimmedTitle}”.`,
      })
      setGoalFormOpen(false)
      setNewGoalTitle("")
      setNewGoalDeadline("")
    } catch (caught) {
      const message = getErrorMessage(caught)
      trackError("dashboard_goal_create_failed", caught, {
        title: trimmedTitle,
        deadline: trimmedDeadline,
        userId: profile.id,
      })
      toast({
        title: "Could not add goal",
        description: message,
        variant: "destructive",
      })
    }
  }, [addGoal, getErrorMessage, newGoalDeadline, newGoalTitle, profile.id, toast, trackDashboardEvent, trackDashboardState])

  const handleCompleteRecitation = useCallback(
    (taskId: string) => {
      const task = recitationTasks.find((entry) => entry.id === taskId)
      trackDashboardEvent("dashboard_recitation_mark_complete_click", {
        taskId,
        surah: task?.surah,
        ayahRange: task?.ayahRange,
      })
      setCompletingRecitationId(taskId)
      try {
        completeRecitationAssignment(taskId)
        trackDashboardState("recitation_task", {
          action: "mark_complete",
          taskId,
          surah: task?.surah,
          ayahRange: task?.ayahRange,
        })
        toast({
          title: "Recitation marked complete",
          description: task
            ? `${task.surah} • Ayah ${task.ayahRange} submitted for review.`
            : "Your recitation has been submitted for review.",
        })
      } catch (caught) {
        const message = getErrorMessage(caught)
        trackError("dashboard_recitation_completion_failed", caught, {
          taskId,
          surah: task?.surah,
          userId: profile.id,
        })
        toast({
          title: "Could not mark recitation complete",
          description: message,
          variant: "destructive",
        })
      } finally {
        setCompletingRecitationId(null)
      }
    },
    [
      completeRecitationAssignment,
      getErrorMessage,
      profile.id,
      recitationTasks,
      toast,
      trackDashboardEvent,
      trackDashboardState,
    ],
  )

  const handleGameTaskAction = useCallback(
    (task: (typeof gameTasks)[number]) => {
      if (!task || task.status === "completed") {
        return
      }
      trackDashboardEvent("dashboard_game_task_action", {
        taskId: task.id,
        taskType: task.type,
        status: task.status,
      })
      setIsGameDialogOpen(false)
      router.push(`/games/${task.id}`)
    },
    [router, trackDashboardEvent],
  )

  const handleResetDailyTarget = useCallback(() => {
    try {
      resetDailyTargetProgress()
      trackDashboardState("daily_target", {
        action: "reset_progress",
        targetAyahs: dailyTargetGoal,
      })
      trackDashboardEvent("dashboard_daily_target_reset", {
        targetAyahs: dailyTargetGoal,
        completedAyahs: dailyTargetCompleted,
      })
      toast({
        title: "Progress reset",
        description: "Your daily target progress has been cleared.",
      })
    } catch (caught) {
      const message = getErrorMessage(caught)
      trackError("dashboard_daily_target_reset_failed", caught, {
        targetAyahs: dailyTargetGoal,
        completedAyahs: dailyTargetCompleted,
        userId: profile.id,
      })
      toast({
        title: "Could not reset progress",
        description: message,
        variant: "destructive",
      })
    }
  }, [
    dailyTargetCompleted,
    dailyTargetGoal,
    getErrorMessage,
    profile.id,
    resetDailyTargetProgress,
    toast,
    trackDashboardEvent,
    trackDashboardState,
  ])

  const handleFeaturedHabitChange = useCallback(
    (habitId: string) => {
      if (!habitId) {
        return
      }
      setFeaturedHabit(habitId)
      const habit = habits.find((entry) => entry.id === habitId)
      trackDashboardState("featured_habit", {
        habitId,
        habitTitle: habit?.title,
      })
      trackDashboardEvent("dashboard_featured_habit_selected", {
        habitId,
        habitTitle: habit?.title,
      })
      toast({
        title: "Featured habit updated",
        description: habit
          ? `${habit.title} is now highlighted on your dashboard.`
          : "Your featured habit has been updated.",
      })
    },
    [habits, setFeaturedHabit, toast, trackDashboardEvent, trackDashboardState],
  )

  const handleLeaderboardScopeChange = useCallback(
    (value: string) => {
      const normalized = value === "global" ? "global" : "class"
      setLeaderboardScope(normalized)
      trackDashboardEvent("dashboard_leaderboard_scope_change", { scope: normalized })
    },
    [trackDashboardEvent],
  )

  const handleLeaderboardTimeframeChange = useCallback(
    (value: string) => {
      const normalized = value === "monthly" ? "monthly" : "weekly"
      setLeaderboardTimeframe(normalized)
      trackDashboardEvent("dashboard_leaderboard_timeframe_change", { timeframe: normalized })
    },
    [trackDashboardEvent],
  )

  const handleGoalCompletionToggle = useCallback(
    (goalId: string, completed: boolean) => {
      const goal = goals.find((entry) => entry.id === goalId)
      toggleGoalCompletion(goalId, completed)
      trackDashboardEvent("dashboard_goal_toggled", {
        goalId,
        completed,
      })
      trackDashboardState("goal", {
        action: completed ? "completed" : "reopened",
        goalId,
        progress: completed ? 100 : goal?.progress ?? 0,
      })
      toast({
        title: completed ? "Goal completed" : "Goal reopened",
        description: goal ? goal.title : undefined,
      })
    },
    [goals, toast, trackDashboardEvent, trackDashboardState, toggleGoalCompletion],
  )

  useEffect(() => {
    if (!dailyTarget) {
      return
    }
    const goalCompleted =
      dailyTarget.targetAyahs > 0 && dailyTarget.completedAyahs >= dailyTarget.targetAyahs
    if (goalCompleted && !hasShownCelebration) {
      setIsCelebrating(true)
      setHasShownCelebration(true)
    }
    if (!goalCompleted && hasShownCelebration) {
      setHasShownCelebration(false)
    }
  }, [dailyTarget?.completedAyahs, dailyTarget?.targetAyahs, dailyTarget, hasShownCelebration])

  if (isLoading || !dashboard) {
    return (
      <AppLayout>
        <div className="p-6 space-y-8">
          <div className="space-y-3">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-80" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} className="h-28 w-full rounded-2xl" />
            ))}
          </div>
          <div className="grid lg:grid-cols-3 gap-8">
            <Skeleton className="h-[520px] w-full rounded-2xl lg:col-span-2" />
            <Skeleton className="h-[520px] w-full rounded-2xl" />
          </div>
        </div>
      </AppLayout>
    )
  }

  return (
    <>
      <AppLayout>
        <div className="p-6">
          <StudentWelcomeAudio className="mb-6" />
          {/* Welcome Section */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-maroon-900 mb-2">Assalamu Alaikum, {firstName}</h2>
            <p className="text-lg text-maroon-700">Continue your journey of Qur’anic excellence</p>
            <div className="flex items-center mt-4">
              <Badge className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white border-0 px-3 py-1">
                <Star className="w-3 h-3 mr-1" />
                {stats.hasanat.toLocaleString()} Hasanat Points
              </Badge>
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <VoiceRecognitionWidget />
            </div>
          </div>

        {error && (
          <Alert className="mb-8 border-amber-200 bg-amber-50 text-amber-800">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Dashboard data may be out of date</AlertTitle>
            <AlertDescription>
              {error}. We&apos;re showing your last saved progress while we retry in the background.
            </AlertDescription>
          </Alert>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-maroon-600 to-maroon-700 text-white border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-maroon-100 text-sm">Daily Streak</p>
                  <p className="text-2xl font-bold">{stats.streak} days</p>
                </div>
                <Calendar className="w-8 h-8 text-maroon-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-600 to-green-700 text-white border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm">Ayahs Read</p>
                  <p className="text-2xl font-bold">{stats.ayahsRead.toLocaleString()}</p>
                </div>
                <BookOpen className="w-8 h-8 text-green-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-600 to-purple-700 text-white border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm">Study Time</p>
                  <p className="text-2xl font-bold">{formattedStudyTime}</p>
                </div>
                <Clock className="w-8 h-8 text-purple-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-600 to-orange-700 text-white border-0">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-start justify-between">
                <div className="space-y-1.5">
                  <p className="text-orange-100 text-sm">Leaderboard Rank</p>
                  <div className="flex items-baseline gap-2">
                    <p className="text-3xl font-bold">#{stats.rank}</p>
                    {typeof leaderboardPercentile === "number" && (
                      <span className="text-sm font-medium text-orange-100/80">
                        Top {leaderboardPercentile}%
                      </span>
                    )}
                  </div>
                </div>
                <Trophy className="w-8 h-8 text-orange-200" />
              </div>
              <div className="flex items-center justify-between text-xs text-orange-50/80">
                <div className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2 py-1">
                  {leaderboardTrend > 0 ? (
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  ) : leaderboardTrend < 0 ? (
                    <ArrowDownRight className="h-3.5 w-3.5" />
                  ) : (
                    <Minus className="h-3.5 w-3.5" />
                  )}
                  <span>
                    {leaderboardTrend === 0
                      ? "Holding steady"
                      : `${Math.abs(leaderboardTrend)} place${Math.abs(leaderboardTrend) === 1 ? "" : "s"} ${
                          leaderboardTrend > 0 ? "up" : "down"
                        }`}
                  </span>
                </div>
                <span>Weekly class standings</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-cyan-600 to-cyan-700 text-white border-0">
            <CardContent className="p-6 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-cyan-100 text-sm">Recitation Accuracy</p>
                  <p className="text-2xl font-bold">{dashboard.recitationPercentage}%</p>
                </div>
                <Mic className="w-8 h-8 text-cyan-200" />
              </div>
              <Progress value={dashboard.recitationPercentage} className="h-2 bg-cyan-800/60" />
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-rose-600 to-rose-700 text-white border-0">
            <CardContent className="p-6 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-rose-100 text-sm">Memorization Mastery</p>
                  <p className="text-2xl font-bold">{dashboard.memorizationPercentage}%</p>
                </div>
                <Star className="w-8 h-8 text-rose-200" />
              </div>
              <Progress value={dashboard.memorizationPercentage} className="h-2 bg-rose-800/60" />
            </CardContent>
          </Card>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {gamePanel && (
                <div>
                  <Button
                    className="inline-flex items-center gap-2 bg-gradient-to-r from-maroon-600 to-maroon-700 text-white hover:from-maroon-700 hover:to-maroon-800 shadow-lg px-6 py-3 rounded-full"
                    onClick={() => handleGameDialogChange(true)}
                  >
                    <Gamepad2 className="w-5 h-5" />
                    Play Games
                  </Button>
                </div>
              )}

              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="text-xl flex items-center gap-2">
                    <Target className="w-5 h-5 text-maroon-600" /> Daily Target
                  </CardTitle>
                  <CardDescription>Stay on pace for today’s recitation goal.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <p className="text-sm text-maroon-600">Today’s Goal</p>
                      <p className="text-3xl font-bold text-maroon-900">{dailyTarget?.targetAyahs ?? 0} Ayahs</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">Completed</p>
                      <p className="text-3xl font-bold text-maroon-700">{dailyTarget?.completedAyahs ?? 0}</p>
                    </div>
                  </div>
                  <div>
                    <Progress value={dailyTargetPercent} className="h-3" />
                    <div className="flex items-center justify-between text-xs text-gray-500 mt-2">
                      <span>{dailyTargetPercent}% of goal complete</span>
                      <span>
                        Updated {dailyTarget ? new Date(dailyTarget.lastUpdated).toLocaleTimeString() : ""}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <Label htmlFor="daily-target-input" className="text-sm font-medium text-maroon-900">
                      Customize daily ayah target
                    </Label>
                    <div className="flex flex-col md:flex-row md:items-center gap-3">
                      <Slider
                        value={[customTarget]}
                        min={1}
                        max={100}
                        step={1}
                        onValueChange={(value) => setCustomTarget(value[0] ?? dailyTarget?.targetAyahs ?? customTarget)}
                        className="flex-1"
                      />
                      <Input
                        id="daily-target-input"
                        type="number"
                        min={1}
                        max={100}
                        value={customTarget}
                        onChange={(event) => {
                          const nextValue = Number(event.target.value)
                          if (!Number.isNaN(nextValue)) {
                            setCustomTarget(Math.min(100, Math.max(1, nextValue)))
                          }
                        }}
                        className="w-24"
                      />
                      <Button
                        variant="outline"
                        onClick={handleSaveTarget}
                        disabled={dailyTarget ? customTarget === dailyTarget.targetAyahs : false}
                      >
                        Save Target
                      </Button>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <Button
                      onClick={handleReciteNow}
                      className="bg-gradient-to-r from-maroon-600 to-maroon-700 text-white border-0"
                    >
                      <BookOpen className="mr-2 h-4 w-4" /> Recite Now
                    </Button>
                    <Button variant="outline" onClick={handleResetDailyTarget} disabled={dailyTargetCompleted === 0}>
                      Reset Progress
                    </Button>
                    <Badge variant="secondary" className={`text-xs ${dailyGoalMet ? "bg-green-100 text-green-700" : ""}`}>
                      {dailyGoalMet
                        ? "Goal complete"
                        : `Remaining ${Math.max(dailyTargetGoal - dailyTargetCompleted, 0)}`}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-maroon-600" />
                  Level Progress
                </CardTitle>
                <CardDescription>Earn XP from daily habits to unlock advanced recitation challenges.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-maroon-600">Current Level</p>
                    <p className="text-3xl font-bold text-maroon-900">Level {stats.level}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">XP to next level</p>
                    <p className="text-lg font-semibold text-maroon-700">{stats.xpToNext} XP</p>
                  </div>
                </div>
                <div className="grid gap-6 md:grid-cols-[minmax(0,220px)_1fr] items-center">
                  <div className="flex flex-col items-center gap-3 rounded-xl border border-maroon-100 bg-maroon-50/60 p-4 text-center">
                    <span className="text-sm font-semibold text-maroon-900">Habit Completion</span>
                    <div className="relative flex items-center justify-center">
                      <svg viewBox="0 0 120 120" className="h-32 w-32">
                        <circle
                          cx="60"
                          cy="60"
                          r={habitRingRadius}
                          stroke="currentColor"
                          strokeWidth="10"
                          className="text-maroon-100"
                          fill="transparent"
                        />
                        <circle
                          cx="60"
                          cy="60"
                          r={habitRingRadius}
                          stroke="currentColor"
                          strokeWidth="10"
                          strokeLinecap="round"
                          className="text-maroon-600"
                          fill="transparent"
                          strokeDasharray={habitRingCircumference}
                          strokeDashoffset={habitRingOffset}
                          style={{ transform: "rotate(-90deg)", transformOrigin: "50% 50%" }}
                        />
                        <text x="50%" y="50%" textAnchor="middle" dominantBaseline="central" className="fill-maroon-900 text-lg font-semibold">
                          {habitCompletionPercent}%
                        </text>
                      </svg>
                    </div>
                    <p className="text-xs text-maroon-700">
                      {habitCompletionCompleted} of {habitCompletionTarget} quests completed
                    </p>
                    <Badge
                      variant="secondary"
                      className={`text-xs ${
                        habitWeeklyChange >= 0
                          ? "bg-green-100 text-green-700"
                          : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {habitWeeklyChange === 0
                        ? "No change vs last week"
                        : `${habitWeeklyChange > 0 ? "+" : ""}${habitWeeklyChange}% vs last week`}
                    </Badge>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <Progress value={xpProgress} className="h-2" />
                      <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
                        <span>{xpProgress}% of level complete</span>
                        <span>Total XP: {stats.xp.toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-xs uppercase tracking-wide text-gray-500">Weekly XP</p>
                        <p className="text-lg font-semibold text-maroon-900">{weeklyXpTotal} XP</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-wide text-gray-500">Habits Completed</p>
                        <p className="text-lg font-semibold text-maroon-900">{stats.completedHabits}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-wide text-gray-500">Hasanat Earned</p>
                        <p className="text-lg font-semibold text-maroon-900">{stats.hasanat.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-wide text-gray-500">Daily Power-Up</p>
                        <p className="text-lg font-semibold text-maroon-900">+{dashboard.premiumBoost.xpBonus} XP</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-maroon-100 bg-maroon-50 p-4">
                  <div>
                    <p className="text-sm font-medium text-maroon-900">Keep the streak alive</p>
                    <p className="text-xs text-maroon-600">
                      Complete any Habit Quest today to push your streak past {stats.streak} days.
                    </p>
                  </div>
                  <Link href="/habits">
                    <Button className="bg-gradient-to-r from-maroon-600 to-maroon-700 text-white border-0">Open Habit Quest</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                  <Mic className="w-5 h-5 text-maroon-600" />
                  Recitation Panel
                </CardTitle>
                <CardDescription>Track assignments, submissions, and teacher reviews.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="rounded-lg border border-maroon-100 bg-maroon-50/70 p-4">
                    <p className="text-xs uppercase tracking-wide text-maroon-600">Pending tasks</p>
                    <p className="text-3xl font-bold text-maroon-900">{pendingRecitations.length}</p>
                    <p className="text-xs text-maroon-600">
                      {recitationTasks.length > 0
                        ? `${recitationCompletionPercent}% of assignments submitted`
                        : "Waiting for your teacher to assign tasks"}
                    </p>
                  </div>
                  <div className="rounded-lg border border-maroon-100 bg-cream-50 p-4">
                    <p className="text-xs uppercase tracking-wide text-maroon-600">Average accuracy</p>
                    <p className="text-3xl font-bold text-maroon-800">{averageRecitationScore}%</p>
                    <p className="text-xs text-maroon-600">
                      {recitationSessions.length > 0
                        ? `Based on ${recitationSessions.length} recent submission${recitationSessions.length === 1 ? "" : "s"}`
                        : "Complete a session to unlock analytics"}
                    </p>
                  </div>
                  <div className="rounded-lg border border-green-100 bg-green-50 p-4">
                    <p className="text-xs uppercase tracking-wide text-green-600">Latest feedback</p>
                    {lastRecitationSession ? (
                      <div className="space-y-1">
                        <p className="text-sm font-semibold text-green-700">
                          {lastRecitationSession.accuracy}% accuracy
                        </p>
                        <p className="text-xs text-green-700">
                          Awarded {lastRecitationSession.hasanatEarned} hasanat
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(lastRecitationSession.submittedAt).toLocaleString()}
                        </p>
                      </div>
                    ) : (
                      <p className="text-sm text-green-700">Record a recitation to see detailed feedback.</p>
                    )}
                  </div>
                  {tajweedFocus.length > 0 && (
                    <div className="rounded-lg border border-amber-100 bg-amber-50 p-4">
                      <p className="text-xs uppercase tracking-wide text-amber-600">Tajweed readiness</p>
                      <p className="text-3xl font-bold text-amber-700">{tajweedReadiness}%</p>
                      <Progress value={tajweedReadiness} className="mt-3 h-2 bg-amber-200/60" />
                      <p className="mt-2 text-xs text-amber-600">
                        {`${tajweedMasteredCount} mastered • ${tajweedImprovingCount} improving • ${tajweedNeedsSupportCount} need support`}
                      </p>
                      <p className="mt-1 text-xs text-amber-600/80">
                        Avg tajweed score {averageTajweedScore}%
                      </p>
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  {recitationTasks.slice(0, 4).map((task) => (
                    <div
                      key={task.id}
                      className="rounded-lg border border-maroon-100 bg-white p-4 shadow-sm flex flex-col gap-3 md:flex-row md:items-center md:justify-between"
                    >
                      <div>
                        <p className="text-sm font-semibold text-maroon-900">
                          {task.surah} • Ayah {task.ayahRange}
                        </p>
                        <div className="text-xs text-gray-600 flex flex-wrap items-center gap-3">
                          <span>Due {new Date(task.dueDate).toLocaleDateString()}</span>
                          <span>Target: {task.targetAccuracy}% accuracy</span>
                          <span>Teacher: {teacherMap.get(task.teacherId) ?? "Instructor"}</span>
                        </div>
                      </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <Badge variant="secondary" className={`text-xs ${recitationStatusStyles[task.status] ?? ""}`}>
                      {recitationStatusLabels[task.status] ?? task.status}
                    </Badge>
                    {typeof task.lastScore === "number" && (
                      <div className="flex items-center gap-1 text-xs text-gray-600">
                        <UserCheck className="h-3.5 w-3.5 text-green-600" />
                        <span>{task.lastScore}%</span>
                      </div>
                    )}
                    {task.status !== "reviewed" && (
                      <Button
                        size="sm"
                        className="bg-gradient-to-r from-maroon-600 to-maroon-700 text-white border-0"
                        onClick={() => handleCompleteRecitation(task.id)}
                        disabled={completingRecitationId === task.id}
                      >
                        {completingRecitationId === task.id ? "Completing…" : "Mark Complete"}
                      </Button>
                    )}
                  </div>
                </div>
              ))}
                {recitationTasks.length === 0 && (
                  <div className="rounded-lg border border-dashed border-maroon-200 bg-maroon-50/60 p-4 text-sm text-maroon-700">
                    Your teacher hasn&apos;t assigned any recitation tasks yet. Visit the Practice Lab for a guided warm-up.
                  </div>
                )}
              </div>

              {tajweedFocus.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-maroon-900">Tajweed focus areas</h4>
                    <Badge variant="secondary" className="text-xs">
                      {tajweedFocus.length} active
                    </Badge>
                  </div>
                  {tajweedFocus.map((focus) => {
                    const progressPercent = focus.targetScore
                      ? Math.max(0, Math.min(100, Math.round((focus.currentScore / focus.targetScore) * 100)))
                      : 0
                    return (
                      <div
                        key={focus.id}
                        className="rounded-lg border border-maroon-100 bg-white p-4 shadow-sm space-y-3"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-maroon-900">{focus.rule}</p>
                            <p className="text-xs text-gray-600">{focus.focusArea}</p>
                            <p className="text-xs text-gray-500">
                              Assigned by {teacherMap.get(focus.teacherId) ?? "Instructor"}
                            </p>
                          </div>
                          <Badge
                            variant="secondary"
                            className={`text-xs ${tajweedStatusStyles[focus.status] ?? ""}`}
                          >
                            {tajweedStatusLabels[focus.status] ?? focus.status}
                          </Badge>
                        </div>
                        <div>
                          <Progress value={progressPercent} className="h-2" />
                          <div className="mt-2 flex items-center justify-between text-xs text-gray-600">
                            <span>Current {focus.currentScore}%</span>
                            <span>Target {focus.targetScore}%</span>
                          </div>
                        </div>
                        <div className="space-y-1 text-xs text-maroon-700">
                          <p>{focus.notes}</p>
                          <p className="text-gray-500">
                            Last reviewed {focus.lastReviewed ? new Date(focus.lastReviewed).toLocaleString() : "Not yet"}
                          </p>
                        </div>
                        <div className="text-xs text-gray-600">
                          <p className="font-semibold text-maroon-800">Recommended drills</p>
                          <ul className="mt-1 list-disc list-inside space-y-1">
                            {focus.recommendedExercises.map((exercise) => (
                              <li key={exercise}>{exercise}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              {nextRecitationTask && (
                <div className="rounded-lg border border-maroon-100 bg-cream-50 p-4">
                  <p className="text-xs uppercase tracking-wide text-maroon-600">Next focus</p>
                  <p className="text-sm font-medium text-maroon-900">
                    {nextRecitationTask.surah} • Ayah {nextRecitationTask.ayahRange}
                  </p>
                  <p className="text-xs text-maroon-600">
                    {nextRecitationTask.notes}
                  </p>
                  {nextTajweedFocus && (
                    <p className="mt-2 text-xs text-amber-700">
                      Tajweed spotlight: {nextTajweedFocus.rule} — target {nextTajweedFocus.targetScore}%
                    </p>
                  )}
                </div>
              )}

              <LiveRecitationAnalyzer
                surah={liveAnalysisSurah}
                ayahRange={liveAnalysisAyahRange ?? undefined}
                verses={liveAnalysisVerses}
              />

              <div className="flex flex-wrap justify-end gap-3">
                  <Button variant="outline" asChild>
                    <Link href="/teacher/assignments">View assignments</Link>
                  </Button>
                  <Button className="bg-gradient-to-r from-maroon-600 to-maroon-700 text-white border-0" asChild>
                    <Link href="/practice">Open Practice Lab</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-maroon-600" />
                  Daily Surah Rhythm
                </CardTitle>
                <CardDescription>Real-time sunnah recitations to anchor your day with light and protection.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="rounded-xl border border-maroon-100 bg-gradient-to-r from-maroon-50 via-amber-50 to-emerald-50 p-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-maroon-900">
                      Earn up to +{totalAvailableHasanat.toLocaleString()} hasanat this session
                    </p>
                    <p className="text-xs text-maroon-600">
                      Choose a recommendation below to open the recitation flow and log your completion.
                    </p>
                  </div>
                  <div className="text-xs text-gray-600">
                    Updated {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  {dailySurahSuggestions.map((suggestion) => {
                    const completed = completedDailySurahSlugs.has(suggestion.slug)
                    const completionEntry = dailySurahLog.find((entry) => entry.slug === suggestion.slug)
                    const sectionLabel = suggestion.sections.map((section) => section.englishName).join(" • ")
                    return (
                      <div
                        key={suggestion.slug}
                        className="rounded-lg border border-maroon-100 bg-white/90 p-4 shadow-sm flex flex-col gap-3"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-maroon-900">{suggestion.title}</p>
                            <p className="text-xs text-maroon-600">
                              {suggestion.reason} • {suggestion.bestTimeLabel}
                            </p>
                          </div>
                          <Badge
                            variant="secondary"
                            className={`text-xs ${completed ? "bg-emerald-100 text-emerald-700" : "bg-maroon-50 text-maroon-700"}`}
                          >
                            {completed ? "Completed today" : `+${suggestion.estimatedHasanat.toLocaleString()} hasanat`}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600">{suggestion.encouragement}</p>
                        <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
                          <span>≈ {suggestion.estimatedMinutes} minutes</span>
                          <span>{sectionLabel}</span>
                        </div>
                        <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-gray-500">
                          {completionEntry ? (
                            <span>
                              Logged {new Date(completionEntry.completedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </span>
                          ) : (
                            <span>Tap recite to add hasanat to your ledger</span>
                          )}
                          <Button
                            className={
                              completed
                                ? "border border-maroon-200 bg-white text-maroon-700"
                                : "bg-gradient-to-r from-maroon-600 to-maroon-700 text-white border-0"
                            }
                            variant={completed ? "outline" : undefined}
                            asChild
                          >
                            <Link href={`/student/daily-surahs/${suggestion.slug}`}>
                              {completed ? "Revisit & reflect" : "Recite now"}
                            </Link>
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {dailySurahSuggestions.length === 0 && (
                  <div className="rounded-lg border border-dashed border-maroon-200 bg-white/70 p-4 text-sm text-gray-600">
                    The daily scheduler is calibrating. Check back shortly for your recommended surahs.
                  </div>
                )}

                {completedDailySurahSlugs.size === dailySurahSuggestions.length && dailySurahSuggestions.length > 0 && (
                  <div className="rounded-lg border border-emerald-200 bg-emerald-50/80 p-4 text-sm text-emerald-800">
                    Masha’Allah! You’ve completed today’s highlighted surahs. Revisit any time for extra reflection.
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Continue Learning */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl">Continue Your Journey</CardTitle>
                <CardDescription>Pick up where you left off</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-gradient-to-r from-maroon-50 to-yellow-50 rounded-xl p-6 border border-maroon-100">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-maroon-900">
                        {dashboard.lastRead.surah || "Start your next recitation"}
                      </h3>
                      <p className="text-sm text-maroon-600">
                        {dashboard.lastRead.totalAyahs > 0
                          ? `Ayah ${dashboard.lastRead.ayah} of ${dashboard.lastRead.totalAyahs}`
                          : "Jump back in to resume reading"}
                      </p>
                    </div>
                    {hasHabits ? (
                      <Badge className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white border-0">
                        Level {featuredHabit?.level ?? 1}
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-xs bg-white text-maroon-700">
                        Set up your first habit
                      </Badge>
                    )}
                  </div>
                  {hasHabits ? (
                    <>
                      <div className="mb-4">
                        <Label htmlFor="featured-habit" className="text-xs uppercase tracking-wide text-maroon-700">
                          Featured habit quest
                        </Label>
                        <Select value={featuredHabit?.id ?? ""} onValueChange={handleFeaturedHabitChange}>
                          <SelectTrigger id="featured-habit" className="mt-2 bg-white">
                            <SelectValue placeholder="Choose habit" />
                          </SelectTrigger>
                          <SelectContent>
                            {habits.map((habit) => (
                              <SelectItem key={habit.id} value={habit.id}>
                                {habit.title}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <Progress value={featuredHabit?.progress ?? 0} className="mb-4" />
                      <div className="flex space-x-3">
                        <Link href="/reader" className="flex-1">
                          <Button className="w-full bg-gradient-to-r from-maroon-600 to-maroon-700 text-white border-0">
                            <Play className="w-4 h-4 mr-2" />
                            Continue Reading
                          </Button>
                        </Link>
                        <Button
                          variant="outline"
                          className="bg-white"
                          asChild
                          disabled={!featuredHabit?.id}
                        >
                          <Link href={featuredHabit?.id ? `/habits?focus=${featuredHabit.id}` : "/habits"}>
                            <Target className="w-4 h-4 mr-2" />
                            View Habit
                          </Link>
                        </Button>
                      </div>
                    </>
                  ) : (
                    <div className="rounded-lg border border-dashed border-maroon-200 bg-white/70 p-4 text-center">
                      <p className="text-sm font-medium text-maroon-800">No Habit Quests yet</p>
                      <p className="text-xs text-gray-600">
                        Create a custom routine to unlock guided next steps and streak tracking here.
                      </p>
                      <Button
                        className="mt-4 bg-gradient-to-r from-maroon-600 to-maroon-700 text-white border-0"
                        asChild
                      >
                        <Link href="/habits">Browse Habit Library</Link>
                      </Button>
                    </div>
                  )}
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <Link href="/reader/start" className="block">
                    <Card className="hover:shadow-md transition-shadow cursor-pointer">
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-r from-maroon-600 to-maroon-700 rounded-lg flex items-center justify-center">
                            <BookOpen className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <h4 className="font-medium">Start New Surah</h4>
                            <p className="text-sm text-gray-600">Begin fresh reading</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>

                  <Link href="/practice/audio" className="block">
                    <Card className="hover:shadow-md transition-shadow cursor-pointer">
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-lg flex items-center justify-center">
                            <HeadphonesIcon className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <h4 className="font-medium">Audio Sessions</h4>
                            <p className="text-sm text-gray-600">Listen & learn</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </div>
              </CardContent>
            </Card>

            <PremiumGate featureName="AI Tajweed Coach" description="Unlock instant pronunciation scoring and tajweed drills.">
              <Card className="shadow-lg relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-maroon-600/10 via-transparent to-yellow-200/20 pointer-events-none" aria-hidden="true" />
                <CardHeader>
                  <CardTitle className="text-xl flex items-center gap-2">
                    <Mic className="w-5 h-5 text-maroon-600" />
                    AI Tajweed Coach
                  </CardTitle>
                  <CardDescription>Personalized tajweed drills with real-time corrections powered by premium AI.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-maroon-600 to-maroon-700 flex items-center justify-center text-white">
                        <Sparkles className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-maroon-900">Precision feedback</p>
                        <p className="text-xs text-maroon-600">Get phoneme-level scoring after every recitation.</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center text-white">
                        <Award className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-maroon-900">Custom drills</p>
                        <p className="text-xs text-maroon-600">Focus on weak letters and memorize with confidence.</p>
                      </div>
                    </div>
                  </div>
                  <div className="rounded-xl border border-dashed border-maroon-200 bg-maroon-50/60 p-4 flex flex-col justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-maroon-900">Today’s premium boost</p>
                        <Badge
                          variant="secondary"
                          className={`text-xs ${
                            dashboard.premiumBoost.isActive
                              ? "bg-green-100 text-green-700"
                              : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          {dashboard.premiumBoost.isActive ? "Active" : "Pending upgrade"}
                        </Badge>
                      </div>
                      <p className="text-xs text-maroon-600">{dashboard.premiumBoost.description}</p>
                      <div className="flex items-center justify-between text-xs text-maroon-700">
                        <span>Available sessions today: {dashboard.premiumBoost.availableSessions}</span>
                        <span>Bonus: +{dashboard.premiumBoost.xpBonus} XP</span>
                      </div>
                    </div>
                    <Button
                      className="w-full bg-gradient-to-r from-maroon-600 to-maroon-700 text-white border-0"
                      asChild
                    >
                      <Link href={dashboard.premiumBoost.isActive ? "/practice/tajweed" : "/billing"}>
                        {dashboard.premiumBoost.isActive ? "Start Premium Session" : "Upgrade for Premium Boost"}
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </PremiumGate>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Recent Activity</CardTitle>
                <CardDescription>Your learning progress over the past week</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {formattedActivity.map((activity) => (
                    <div key={activity.id} className="flex items-center justify-between p-4 rounded-lg bg-gray-50">
                      <div className="flex items-center space-x-4">
                        <div
                          className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            activity.type === "reading"
                              ? "bg-gradient-to-r from-maroon-600 to-maroon-700"
                              : activity.type === "memorization"
                                ? "bg-gradient-to-r from-yellow-500 to-yellow-600"
                                : "bg-gradient-to-r from-maroon-500 to-maroon-600"
                          }`}
                        >
                          {activity.type === "reading" && <BookOpen className="w-5 h-5 text-white" />}
                          {activity.type === "memorization" && <Star className="w-5 h-5 text-white" />}
                          {activity.type === "recitation" && <Mic className="w-5 h-5 text-white" />}
                        </div>
                        <div>
                          <h4 className="font-medium capitalize">{activity.type}</h4>
                          <p className="text-sm text-gray-600">
                            {activity.surah}
                            {activity.ayahs && ` • ${activity.ayahs} ayahs`}
                            {activity.progress && ` • ${activity.progress}% progress`}
                            {activity.score && ` • ${activity.score}% score`}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-500">{activity.time}</p>
                      </div>
                    </div>
                  ))}
                  {formattedActivity.length === 0 && (
                    <p className="text-sm text-gray-500 text-center py-6">No activity recorded yet today.</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Goals & Progress */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Current Goals</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {upcomingGoals.map((goal) => (
                  <div key={goal.id} className="space-y-3 rounded-lg border border-maroon-100 p-3">
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex items-start gap-2">
                        <Checkbox
                          id={`goal-${goal.id}`}
                          checked={goal.status === "completed"}
                          onCheckedChange={(checked) =>
                            handleGoalCompletionToggle(goal.id, checked === true)
                          }
                        />
                        <div>
                          <Label htmlFor={`goal-${goal.id}`} className="text-sm font-medium">
                            {goal.title}
                          </Label>
                          <p className="text-xs text-gray-500">{goal.deadlineLabel}</p>
                        </div>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {goal.progress}%
                      </Badge>
                    </div>
                    <Slider
                      value={[goal.progress]}
                      step={5}
                      onValueCommit={(value) => updateGoalProgress(goal.id, value[0] ?? goal.progress)}
                    />
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Update progress</span>
                      <button
                        type="button"
                        className="text-maroon-700 hover:underline"
                        onClick={() => updateGoalProgress(goal.id, Math.min(goal.progress + 10, 100))}
                      >
                        +10%
                      </button>
                    </div>
                  </div>
                ))}
                <Button
                  variant="outline"
                  className="w-full mt-4 bg-transparent"
                  onClick={() => setGoalFormOpen(true)}
                >
                  <Target className="w-4 h-4 mr-2" />
                  Set New Goal
                </Button>
              </CardContent>
            </Card>

            {/* Achievements */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Recent Achievements</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {dashboard.achievements.map((achievement) => (
                  <div
                    key={achievement.id}
                    className="flex items-center space-x-3 p-3 rounded-lg bg-yellow-50 border border-yellow-200"
                  >
                    <div className="w-8 h-8 bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-full flex items-center justify-center">
                      <Award className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h4 className="font-medium text-sm">{achievement.name}</h4>
                      <p className="text-xs text-gray-600">{achievement.description}</p>
                      <p className="text-xs text-gray-400">Unlocked {new Date(achievement.unlockedAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))}
                {dashboard.achievements.length === 0 && (
                  <p className="text-sm text-gray-500">No achievements unlocked yet.</p>
                )}

                <Button variant="outline" className="w-full mt-4 bg-transparent" asChild>
                  <Link href="/achievements">
                    <Trophy className="w-4 h-4 mr-2" />
                    View All Achievements
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Links</CardTitle>
                <CardDescription>Access your personalized tools</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3">
                <Button variant="outline" className="w-full justify-between" asChild>
                  <Link href="/habits">
                    <span className="flex items-center gap-2">
                      <Target className="h-4 w-4" /> Goals & Habits
                    </span>
                    <ArrowUpRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button variant="outline" className="w-full justify-between" asChild>
                  <Link href="/achievements">
                    <span className="flex items-center gap-2">
                      <Award className="h-4 w-4" /> Badge Collection
                    </span>
                    <ArrowUpRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button variant="outline" className="w-full justify-between" asChild>
                  <Link href="/practice">
                    <span className="flex items-center gap-2">
                      <NotebookPen className="h-4 w-4" /> Journal & Audio Lab
                    </span>
                    <ArrowUpRight className="h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Teacher Feedback Center</CardTitle>
                <CardDescription>Latest notes and audio cues from your instructors</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {dashboard.teacherNotes.map((note) => (
                  <div key={note.id} className="p-3 rounded-lg border border-maroon-100 bg-maroon-50">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-maroon-900">{teacherMap.get(note.teacherId) ?? "Teacher"}</p>
                        <p className="text-xs text-gray-500">{new Date(note.createdAt).toLocaleString()}</p>
                      </div>
                      <Badge variant="secondary" className="text-xs capitalize">
                        {note.category}
                      </Badge>
                    </div>
                    <p className="mt-2 text-sm text-maroon-700">{note.note}</p>
                  </div>
                ))}
                {dashboard.teacherNotes.length === 0 && (
                  <p className="text-sm text-gray-500">No feedback yet. Complete a session to receive guidance.</p>
                )}
                <Button variant="outline" className="w-full mt-2" asChild>
                  <Link href="/teacher/feedback">Open Feedback Center</Link>
                </Button>
              </CardContent>
            </Card>

            {/* Leaderboard */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Community Leaderboard</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs uppercase text-gray-500">Scope</Label>
                      <Select value={leaderboardScope} onValueChange={handleLeaderboardScopeChange}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Choose scope" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="class">Class</SelectItem>
                        <SelectItem value="global">Global</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs uppercase text-gray-500">Time Range</Label>
                      <Select value={leaderboardTimeframe} onValueChange={handleLeaderboardTimeframeChange}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Choose range" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  {leaderboardEntries.map((entry) => (
                    <div
                      key={entry.id}
                      className={`flex items-center justify-between gap-4 rounded border p-3 ${
                        entry.name === "You"
                          ? "border-maroon-200 bg-maroon-50"
                          : "border-gray-100 bg-white"
                      } shadow-sm`}
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`text-sm font-medium ${
                            entry.rank === 1
                              ? "text-yellow-600"
                              : entry.rank === 2
                                ? "text-gray-500"
                                : entry.name === "You"
                                  ? "text-maroon-600"
                                  : "text-gray-600"
                          }`}
                        >
                          #{entry.rank}
                        </span>
                        <div>
                          <p className={`text-sm ${entry.name === "You" ? "font-semibold text-maroon-900" : "text-gray-700"}`}>
                            {entry.name}
                          </p>
                          {typeof entry.percentile === "number" && (
                            <p className="text-xs text-gray-500">Top {entry.percentile}%</p>
                          )}
                        </div>
                      </div>
                      <div className="space-y-1 text-right">
                        <div
                          className={`inline-flex items-center gap-1 text-xs ${
                            entry.trend && entry.trend > 0
                              ? "text-green-600"
                              : entry.trend && entry.trend < 0
                                ? "text-amber-600"
                                : "text-gray-500"
                          }`}
                        >
                          {entry.trend && entry.trend > 0 ? (
                            <ArrowUpRight className="h-3.5 w-3.5" />
                          ) : entry.trend && entry.trend < 0 ? (
                            <ArrowDownRight className="h-3.5 w-3.5" />
                          ) : (
                            <Minus className="h-3.5 w-3.5" />
                          )}
                          <span>
                            {entry.trend && entry.trend !== 0
                              ? `${entry.trend > 0 ? "+" : ""}${entry.trend}`
                              : "No change"}
                          </span>
                        </div>
                        <div className="flex items-center justify-end gap-1 text-sm text-gray-700">
                          <Star className="w-3.5 h-3.5 text-yellow-500" />
                          <span>{entry.points.toLocaleString()} XP</span>
                        </div>
                      </div>
                    </div>
                  ))}
                  {leaderboardEntries.length === 0 && (
                    <p className="text-sm text-gray-500 text-center py-4">No leaderboard data for this range.</p>
                  )}
                </div>
                <Button variant="outline" className="w-full mt-4 bg-transparent" asChild>
                  <Link href="/leaderboard">
                    <TrendingUp className="w-4 h-4 mr-2" />
                    View Full Leaderboard
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
        </div>
      </AppLayout>

      {gamePanel && (
        <Dialog open={isGameDialogOpen} onOpenChange={handleGameDialogChange}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-2xl font-semibold text-maroon-900">
                <Gamepad2 className="w-5 h-5 text-maroon-600" /> Quest Command Center
              </DialogTitle>
              <DialogDescription className="text-sm text-gray-600">
                Track daily missions, energy, and rewards from the Habit Quest arena.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-xl border border-maroon-100 bg-white p-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs uppercase text-gray-500">Season level</p>
                      <p className="text-lg font-semibold text-maroon-900">Level {gamePanel.season.level}</p>
                    </div>
                    <Zap className="w-5 h-5 text-yellow-500" />
                  </div>
                  <Progress value={seasonXpPercent} className="mt-3" />
                  <div className="mt-2 flex items-center justify-between text-xs text-gray-600">
                    <span>{gamePanel.season.xp} XP earned</span>
                    <span>{Math.max(0, gamePanel.season.xpToNext - gamePanel.season.xp)} XP to next</span>
                  </div>
                  <p className="mt-2 text-xs text-gray-500">
                    Season ends {new Date(gamePanel.season.endsOn).toLocaleDateString()}
                  </p>
                </div>
                <div className="rounded-xl border border-maroon-100 bg-white p-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs uppercase text-gray-500">Streak shield</p>
                      <p className="text-lg font-semibold text-maroon-900">{gamePanel.streak.current} days</p>
                    </div>
                    <Shield className="w-5 h-5 text-green-600" />
                  </div>
                  <p className="mt-1 text-xs text-gray-500">Best streak {gamePanel.streak.best} days</p>
                  <div className="mt-4">
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>Energy {gamePanel.energy.current}/{gamePanel.energy.max}</span>
                      <span>Last refresh {new Date(gamePanel.energy.refreshedAt).toLocaleTimeString()}</span>
                    </div>
                    <Progress value={energyPercent} className="mt-2" />
                  </div>
                </div>
                <div className="rounded-xl border border-maroon-100 bg-white p-4 shadow-sm">
                  <p className="text-xs uppercase text-gray-500">Active boosts</p>
                  <div className="mt-3 space-y-2">
                    {gameBoosts.length > 0 ? (
                      gameBoosts.slice(0, 3).map((boost) => (
                        <div
                          key={boost.id}
                          className={`rounded-md border px-3 py-2 text-xs ${
                            boost.active
                              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                              : "border-gray-200 bg-gray-50 text-gray-600"
                          }`}
                        >
                          <p className="font-semibold text-sm">{boost.name}</p>
                          <p className="mt-1 leading-tight">{boost.description}</p>
                          {boost.expiresAt && (
                            <p className="mt-1 text-[11px] text-gray-500">
                              Expires {new Date(boost.expiresAt).toLocaleTimeString()}
                            </p>
                          )}
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-gray-500">No boosts unlocked yet. Complete quests to earn them.</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {gameTasks.map((task) => {
                  const completionPercent = task.target
                    ? Math.max(0, Math.min(100, Math.round((task.progress / task.target) * 100)))
                    : 0
                  const isCompleted = task.status === "completed"
                  const icon =
                    task.type === "habit" ? (
                      <Flame className="w-5 h-5 text-orange-500" />
                    ) : task.type === "recitation" ? (
                      <Mic className="w-5 h-5 text-maroon-500" />
                    ) : task.type === "memorization" ? (
                      <Brain className="w-5 h-5 text-emerald-600" />
                    ) : (
                      <Target className="w-5 h-5 text-maroon-600" />
                    )

                  return (
                    <div key={task.id} className="rounded-lg border border-maroon-100 bg-white p-4 shadow-sm">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-lg bg-maroon-50 flex items-center justify-center">
                            {icon}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-maroon-900">{task.title}</p>
                            <p className="text-xs text-gray-600">{task.description}</p>
                            <div className="mt-1 flex flex-wrap gap-3 text-[11px] text-gray-500">
                              {task.teacherId && (
                                <span>Teacher: {teacherMap.get(task.teacherId) ?? "Instructor"}</span>
                              )}
                              {task.dueDate && <span>Due {new Date(task.dueDate).toLocaleDateString()}</span>}
                            </div>
                          </div>
                        </div>
                        <Badge variant="secondary" className={`text-xs ${gameTaskStatusStyles[task.status] ?? ""}`}>
                          {gameTaskStatusLabels[task.status] ?? task.status}
                        </Badge>
                      </div>

                      <div className="mt-3">
                        <Progress value={completionPercent} className="h-2" />
                        <div className="mt-2 flex items-center justify-between text-xs text-gray-600">
                          <span>
                            {task.progress}/{task.target} steps
                          </span>
                          <span>
                            +{task.xpReward} XP • +{task.hasanatReward} hasanat
                          </span>
                        </div>
                      </div>

                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        {isCompleted ? (
                          <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 text-xs">
                            Reward granted
                          </Badge>
                        ) : task.type === "daily_target" ? (
                          <Button
                            variant="outline"
                            size="sm"
                            className="bg-white"
                            onClick={() => handleGameTaskAction(task)}
                          >
                            <Target className="w-4 h-4 mr-2" />
                            Continue reading
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            className="bg-gradient-to-r from-maroon-600 to-maroon-700 text-white border-0"
                            onClick={() => handleGameTaskAction(task)}
                            disabled={
                              (task.type === "recitation" && completingRecitationId === task.recitationTaskId) ||
                              (task.type === "habit" && !task.habitId)
                            }
                          >
                            {task.type === "habit"
                              ? "Complete quest"
                              : task.type === "memorization"
                                ? "Review now"
                                : "Submit assignment"}
                          </Button>
                        )}
                        {!isCompleted && task.type === "recitation" && (
                          <span className="text-[11px] text-gray-500">Auto-rewards on submission</span>
                        )}
                      </div>
                    </div>
                  )
                })}
                {gameTasks.length === 0 && (
                  <div className="rounded-lg border border-dashed border-maroon-200 bg-maroon-50/60 p-4 text-sm text-maroon-700">
                    No quests are active yet. Your teacher will unlock new missions soon.
                  </div>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      <Dialog open={isCelebrating} onOpenChange={setIsCelebrating}>
      <DialogContent className="max-w-sm text-center">
        <DialogHeader className="space-y-2">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
            <CheckCircle2 className="h-7 w-7 text-green-600" />
          </div>
          <DialogTitle className="text-2xl font-semibold text-maroon-900">Masha’Allah!</DialogTitle>
          <DialogDescription className="text-sm text-gray-600">
            You completed today’s target of {dailyTarget?.targetAyahs ?? 0} ayahs. Keep the momentum going or revisit your
            habits for bonus XP.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex flex-col gap-2 sm:flex-row">
          <Button className="flex-1" onClick={() => setIsCelebrating(false)} variant="outline">
            Close
          </Button>
          <Button className="flex-1 bg-gradient-to-r from-maroon-600 to-maroon-700 text-white border-0" asChild>
            <Link href="/reader">Continue Studying</Link>
          </Button>
        </DialogFooter>
      </DialogContent>
      </Dialog>

      <Dialog open={goalFormOpen} onOpenChange={setGoalFormOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create a new goal</DialogTitle>
          <DialogDescription>Define a focused objective to align with your teacher’s plan.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="goal-title">Goal title</Label>
            <Input
              id="goal-title"
              placeholder="Memorize Surah Al-Mulk"
              value={newGoalTitle}
              onChange={(event) => setNewGoalTitle(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="goal-deadline">Deadline</Label>
            <Input
              id="goal-deadline"
              type="date"
              value={newGoalDeadline}
              min={new Date().toISOString().slice(0, 10)}
              onChange={(event) => setNewGoalDeadline(event.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setGoalFormOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleCreateGoal}
            disabled={!canCreateGoal}
            className="bg-gradient-to-r from-maroon-600 to-maroon-700 text-white border-0"
          >
            Save Goal
          </Button>
        </DialogFooter>
      </DialogContent>
      </Dialog>
    </>
  )
}
