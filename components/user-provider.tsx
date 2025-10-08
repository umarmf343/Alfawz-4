"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"

import {
  getTeacherProfiles,
  getLearnerState,
  updateDailyTarget as persistDailyTarget,
  recordAyahProgress as persistAyahProgress,
  resetDailyProgress as persistResetDailyProgress,
  setPreferredHabit as persistPreferredHabit,
  upsertGoalProgress as persistGoalProgress,
  addGoal as persistAddGoal,
  completeHabitQuest as persistCompleteHabitQuest,
  logRecitationSession as persistRecitationSession,
  setSubscriptionPlan as persistSubscriptionPlan,
  reviewMemorizationTask as persistMemorizationReview,
  reviewRecitationTask as persistRecitationReview,
  type GoalRecord,
  type TeacherProfile,
  type StudentDashboardRecord,
  type LearnerProfile,
  type LearnerStats,
  type HabitQuestRecord,
  type LearnerState,
  type CompleteHabitResult as PersistHabitResult,
  type SubscriptionPlan,
  type RecitationSubmissionInput,
  type MemorizationReviewInput,
  recordDailySurahCompletion as persistDailySurahCompletion,
  type DailySurahCompletionInput,
  type DailySurahCompletionResult,
  recordQuranReaderRecitation as persistQuranReaderRecitation,
  type QuranReaderRecitationInput,
  type QuranReaderRecitationResult,
} from "@/lib/data/teacher-database"
import { getActiveSession, signOut as clearActiveSession } from "@/lib/data/auth"

export type UserProfile = LearnerProfile
export type UserStats = LearnerStats
export type HabitQuest = HabitQuestRecord
export type CompleteHabitResult = PersistHabitResult

interface UserContextValue {
  profile: UserProfile
  stats: UserStats
  habits: HabitQuest[]
  teachers: TeacherProfile[]
  perks: string[]
  lockedPerks: string[]
  isPremium: boolean
  dashboard: StudentDashboardRecord | null
  isLoading: boolean
  error: string | null
  completeHabit: (habitId: string) => CompleteHabitResult
  updateDailyTarget: (target: number) => void
  incrementDailyTarget: (increment?: number) => void
  resetDailyTargetProgress: () => void
  setFeaturedHabit: (habitId: string) => void
  updateGoalProgress: (goalId: string, progress: number) => void
  toggleGoalCompletion: (goalId: string, completed: boolean) => void
  addGoal: (goal: { title: string; deadline: string }) => void
  upgradeToPremium: () => void
  downgradeToFree: () => void
  submitRecitationResult: (submission: RecitationSubmissionInput) => void
  completeRecitationAssignment: (taskId: string) => void
  reviewMemorizationTask: (review: MemorizationReviewInput) => void
  completeDailySurahRecitation: (completion: DailySurahCompletionInput) => DailySurahCompletionResult
  recordQuranReaderProgress: (recitation: QuranReaderRecitationInput) => QuranReaderRecitationResult
  signOut: () => void
}

const perksByPlan: Record<SubscriptionPlan, string[]> = {
  free: [
    "Daily habit quests",
    "Core Qur'an reader",
    "Weekly progress snapshots",
    "Basic leaderboard placement",
  ],
  premium: [
    "Daily habit quests",
    "Core Qur'an reader",
    "Weekly progress snapshots",
    "Basic leaderboard placement",
    "AI-powered Tajweed feedback",
    "Advanced habit insights & coaching",
    "Premium memorization playlists",
    "Unlimited class analytics",
  ],
}

const UserContext = createContext<UserContextValue | undefined>(undefined)

function createEmptyStats(): UserStats {
  return {
    hasanat: 0,
    streak: 0,
    ayahsRead: 0,
    studyMinutes: 0,
    rank: 0,
    level: 1,
    xp: 0,
    xpToNext: 500,
    completedHabits: 0,
    weeklyXP: Array.from({ length: 7 }, () => 0),
  }
}

function createFallbackDashboardRecord(studentId: string): StudentDashboardRecord {
  return {
    studentId,
    dailyTarget: {
      targetAyahs: 10,
      completedAyahs: 0,
      lastUpdated: new Date().toISOString(),
    },
    recitationPercentage: 0,
    memorizationPercentage: 0,
    lastRead: { surah: "", ayah: 0, totalAyahs: 0 },
    preferredHabitId: undefined,
    activities: [],
    goals: [],
    achievements: [],
    leaderboard: [],
    teacherNotes: [],
    habitCompletion: { completed: 0, target: 0, weeklyChange: 0 },
    premiumBoost: { xpBonus: 0, description: "", isActive: false, availableSessions: 0 },
    recitationTasks: [],
    recitationSessions: [],
    memorizationQueue: [],
    memorizationPlaylists: [],
    memorizationSummary: {
      dueToday: 0,
      newCount: 0,
      totalMastered: 0,
      streak: 0,
      recommendedDuration: 0,
      focusArea: "",
      lastReviewedOn: null,
      reviewHeatmap: [],
    },
    tajweedFocus: [],
    gamePanel: {
      season: {
        name: "Season 1",
        level: 1,
        xp: 0,
        xpToNext: 200,
        endsOn: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      },
      energy: { current: 5, max: 5, refreshedAt: new Date().toISOString() },
      streak: { current: 0, best: 0 },
      tasks: [],
      boosts: [],
      leaderboard: { rank: 0, nextReward: 0, classRank: 0 },
    },
    dailySurahLog: [],
  }
}

const containsRestrictedKeyword = (value?: string | null) => {
  if (!value) {
    return false
  }

  const normalized = value.toLowerCase()
  return normalized.includes("mulk") || normalized.includes("fatiha")
}

const containsTafkhimKeyword = (value?: string | null) => {
  if (!value) {
    return false
  }

  return value.toLowerCase().includes("tafkh")
}

function sanitizeDashboardRecord(record: StudentDashboardRecord): StudentDashboardRecord {
  const sanitizedRecitationTasks = record.recitationTasks.filter((task) => {
    if (containsRestrictedKeyword(task.surah) || containsRestrictedKeyword(task.notes)) {
      return false
    }

    const hasRestrictedFocus = (task.focusAreas ?? []).some(
      (area) => containsRestrictedKeyword(area) || containsTafkhimKeyword(area),
    )

    return !hasRestrictedFocus
  })

  const sanitizedTajweedFocus = record.tajweedFocus.filter(
    (focus) =>
      !containsRestrictedKeyword(focus.rule) &&
      !containsRestrictedKeyword(focus.focusArea) &&
      !containsRestrictedKeyword(focus.notes) &&
      !containsTafkhimKeyword(focus.rule) &&
      !containsTafkhimKeyword(focus.focusArea),
  )

  const sanitizedMemorizationSummary = {
    ...record.memorizationSummary,
    focusArea: containsRestrictedKeyword(record.memorizationSummary.focusArea)
      ? ""
      : record.memorizationSummary.focusArea,
  }

  const sanitizedGamePanel = {
    ...record.gamePanel,
    tasks: record.gamePanel.tasks.filter(
      (task) => !containsRestrictedKeyword(task.title) && !containsRestrictedKeyword(task.description),
    ),
  }

  return {
    ...record,
    activities: record.activities.filter((activity) => !containsRestrictedKeyword(activity.surah)),
    goals: record.goals.filter((goal) => !containsRestrictedKeyword(goal.title)),
    teacherNotes: record.teacherNotes.filter((note) => !containsRestrictedKeyword(note.note)),
    recitationTasks: sanitizedRecitationTasks,
    recitationSessions: record.recitationSessions.filter(
      (session) => !containsRestrictedKeyword(session.surah),
    ),
    memorizationQueue: record.memorizationQueue.filter(
      (task) => !containsRestrictedKeyword(task.surah) && !containsRestrictedKeyword(task.notes),
    ),
    memorizationPlaylists: record.memorizationPlaylists.filter(
      (playlist) =>
        !containsRestrictedKeyword(playlist.title) &&
        !containsRestrictedKeyword(playlist.description) &&
        !containsRestrictedKeyword(playlist.focus),
    ),
    memorizationSummary: sanitizedMemorizationSummary,
    tajweedFocus: sanitizedTajweedFocus,
    gamePanel: sanitizedGamePanel,
    dailySurahLog: record.dailySurahLog.filter(
      (entry) =>
        !containsRestrictedKeyword(entry.title) && !containsRestrictedKeyword(entry.encouragement),
    ),
  }
}

export function UserProvider({ children }: { children: React.ReactNode }) {
  const session = getActiveSession()
  const defaultLearnerId = session?.userId ?? "user_001"
  const initialState = getLearnerState(defaultLearnerId)
  const fallbackProfile: UserProfile = initialState?.profile ?? {
    id: defaultLearnerId,
    name: session?.email ?? "Alfawz Learner",
    email: session?.email ?? "learner@example.com",
    role: session?.role ?? "student",
    locale: "en-US",
    plan: "free",
    joinedAt: new Date().toISOString(),
  }

  const [studentId] = useState(defaultLearnerId)
  const [profile, setProfile] = useState<UserProfile>(fallbackProfile)
  const [stats, setStats] = useState<UserStats>(initialState?.stats ?? createEmptyStats())
  const [habits, setHabits] = useState<HabitQuest[]>(initialState?.habits ?? [])
  const [teachers, setTeachers] = useState<TeacherProfile[]>([])
  const fallbackDashboardRecord = sanitizeDashboardRecord(createFallbackDashboardRecord(defaultLearnerId))
  const initialDashboardRecord = initialState?.dashboard
    ? sanitizeDashboardRecord(initialState.dashboard)
    : fallbackDashboardRecord
  const [dashboard, setDashboard] = useState<StudentDashboardRecord | null>(
    initialDashboardRecord,
  )
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const applyLearnerState = useCallback((state: LearnerState) => {
    setProfile(state.profile)
    setStats(state.stats)
    setHabits(state.habits)
    setDashboard(sanitizeDashboardRecord(state.dashboard))
  }, [])

  useEffect(() => {
    let cancelled = false

    async function initialize() {
      setIsLoading(true)
      try {
        const [teacherProfiles, learnerState] = await Promise.all([
          Promise.resolve(getTeacherProfiles()),
          Promise.resolve(getLearnerState(studentId)),
        ])
        if (cancelled) {
          return
        }
        setTeachers(teacherProfiles)
        if (learnerState) {
          applyLearnerState(learnerState)
          setError(null)
        } else {
          setDashboard(sanitizeDashboardRecord(createFallbackDashboardRecord(studentId)))
          setError("Learner record not found")
        }
      } catch (caught) {
        if (cancelled) {
          return
        }
        const message = caught instanceof Error ? caught.message : "Failed to load dashboard data"
        setError(message)
        setDashboard((current) => current ?? sanitizeDashboardRecord(createFallbackDashboardRecord(studentId)))
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    void initialize()

    return () => {
      cancelled = true
    }
  }, [applyLearnerState, studentId])

  const isPremium = profile.plan === "premium"

  const perks = useMemo(() => perksByPlan[profile.plan], [profile.plan])
  const lockedPerks = useMemo(
    () => perksByPlan.premium.filter((perk) => !perksByPlan[profile.plan].includes(perk)),
    [profile.plan],
  )

  const completeHabit = useCallback(
    (habitId: string): CompleteHabitResult => {
      const response = persistCompleteHabitQuest(studentId, habitId)
      if (response.state) {
        applyLearnerState(response.state)
      }
      return response.result
    },
    [applyLearnerState, studentId],
  )

  const updateDailyTarget = useCallback(
    (target: number) => {
      const state = persistDailyTarget(studentId, target)
      if (state) {
        applyLearnerState(state)
      }
    },
    [applyLearnerState, studentId],
  )

  const incrementDailyTarget = useCallback(
    (increment = 1) => {
      const state = persistAyahProgress(studentId, increment)
      if (state) {
        applyLearnerState(state)
      }
    },
    [applyLearnerState, studentId],
  )

  const resetDailyTargetProgress = useCallback(() => {
    const state = persistResetDailyProgress(studentId)
    if (state) {
      applyLearnerState(state)
    }
  }, [applyLearnerState, studentId])

  const setFeaturedHabit = useCallback(
    (habitId: string) => {
      const state = persistPreferredHabit(studentId, habitId)
      if (state) {
        applyLearnerState(state)
      }
    },
    [applyLearnerState, studentId],
  )

  const updateGoalProgress = useCallback(
    (goalId: string, progress: number) => {
      const state = persistGoalProgress(studentId, goalId, progress)
      if (state) {
        applyLearnerState(state)
      }
    },
    [applyLearnerState, studentId],
  )

  const toggleGoalCompletion = useCallback(
    (goalId: string, completed: boolean) => {
      const existing = dashboard?.goals.find((goal) => goal.id === goalId)
      const nextProgress = completed ? 100 : existing?.progress ?? 0
      const nextStatus = completed ? "completed" : existing?.status ?? "active"
      const state = persistGoalProgress(studentId, goalId, nextProgress, nextStatus)
      if (state) {
        applyLearnerState(state)
      }
    },
    [applyLearnerState, dashboard?.goals, studentId],
  )

  const addGoal = useCallback(
    (goal: { title: string; deadline: string }) => {
      const newGoal: GoalRecord = {
        id: `goal_${Date.now()}`,
        title: goal.title,
        deadline: goal.deadline,
        progress: 0,
        status: "active",
      }
      const state = persistAddGoal(studentId, newGoal)
      if (state) {
        applyLearnerState(state)
      }
    },
    [applyLearnerState, studentId],
  )

  const submitRecitationResult = useCallback(
    (submission: RecitationSubmissionInput) => {
      const state = persistRecitationSession(studentId, submission)
      if (state) {
        applyLearnerState(state)
      }
    },
    [applyLearnerState, studentId],
  )

  const reviewMemorizationTask = useCallback(
    (review: MemorizationReviewInput) => {
      const state = persistMemorizationReview(studentId, review)
      if (state) {
        applyLearnerState(state)
      }
    },
    [applyLearnerState, studentId],
  )

  const completeDailySurahRecitation = useCallback(
    (completion: DailySurahCompletionInput) => {
      const response = persistDailySurahCompletion(studentId, completion)
      if (response.state) {
        applyLearnerState(response.state)
      }
      return response.result
    },
    [applyLearnerState, studentId],
  )

  const recordQuranReaderProgress = useCallback(
    (recitation: QuranReaderRecitationInput) => {
      const response = persistQuranReaderRecitation(studentId, recitation)
      if (response.state) {
        applyLearnerState(response.state)
      }
      return response.result
    },
    [applyLearnerState, studentId],
  )

  const handleSignOut = useCallback(() => {
    clearActiveSession()
    setProfile({
      id: studentId,
      name: "Guest Learner",
      email: "guest@alfawz.app",
      role: "student",
      locale: "en-US",
      plan: "free",
      joinedAt: new Date().toISOString(),
    })
    setStats(createEmptyStats())
    setHabits([])
    setDashboard(sanitizeDashboardRecord(createFallbackDashboardRecord(studentId)))
    setTeachers([])
    setError(null)
  }, [studentId])

  const completeRecitationAssignment = useCallback(
    (taskId: string) => {
      const task = dashboard?.recitationTasks.find((entry) => entry.id === taskId)
      if (!task) {
        return
      }

      const verses = task.verses?.map((verse) => verse.arabic).join(" ") ?? ""
      const verseRange = task.ayahRange.replace(/\s/g, "")
      const [startAyah, endAyah] = verseRange.split("-")
      const parsedStart = Number.parseInt(startAyah ?? "", 10)
      const parsedEnd = Number.parseInt(endAyah ?? "", 10)
      const verseCount = task.verses?.length
        ? task.verses.length
        : Number.isFinite(parsedStart) && Number.isFinite(parsedEnd)
          ? Math.max(1, parsedEnd - parsedStart + 1)
          : 3
      const accuracyTarget = Math.max(task.targetAccuracy, 94)
      const tajweedScore = Math.max(80, Math.min(100, accuracyTarget - 2))
      const fluencyScore = Math.max(80, Math.min(100, Math.round((accuracyTarget + tajweedScore) / 2)))
      const hasanatEarned = Math.max(120, Math.round(accuracyTarget * 2.5))
      const durationSeconds = Math.max(90, verseCount * 45)

      const sessionState = persistRecitationSession(studentId, {
        taskId: task.id,
        surah: task.surah,
        ayahRange: task.ayahRange,
        accuracy: accuracyTarget,
        tajweedScore,
        fluencyScore,
        hasanatEarned,
        durationSeconds,
        transcript: verses,
        expectedText: verses,
      })
      if (sessionState) {
        applyLearnerState(sessionState)
      }

      if (task.teacherId) {
        const reviewState = persistRecitationReview(studentId, {
          taskId: task.id,
          teacherId: task.teacherId,
          accuracy: accuracyTarget,
          tajweedScore,
          notes: task.notes,
        })
        if (reviewState) {
          applyLearnerState(reviewState)
        }
      }
    },
    [applyLearnerState, dashboard?.recitationTasks, studentId],
  )

  const upgradeToPremium = useCallback(() => {
    const state = persistSubscriptionPlan(studentId, "premium")
    if (state) {
      applyLearnerState(state)
    } else {
      setProfile((previous) => ({ ...previous, plan: "premium" }))
    }
  }, [applyLearnerState, studentId])

  const downgradeToFree = useCallback(() => {
    const state = persistSubscriptionPlan(studentId, "free")
    if (state) {
      applyLearnerState(state)
    } else {
      setProfile((previous) => ({ ...previous, plan: "free" }))
    }
  }, [applyLearnerState, studentId])

  const value = useMemo(
    () => ({
      profile,
      stats,
      habits,
      teachers,
      perks,
      lockedPerks,
      isPremium,
      dashboard,
      isLoading,
      error,
      completeHabit,
      updateDailyTarget,
      incrementDailyTarget,
      resetDailyTargetProgress,
      setFeaturedHabit,
      updateGoalProgress,
      toggleGoalCompletion,
      addGoal,
      submitRecitationResult,
      completeRecitationAssignment,
      reviewMemorizationTask,
      completeDailySurahRecitation,
      recordQuranReaderProgress,
      upgradeToPremium,
      downgradeToFree,
      signOut: handleSignOut,
    }),
    [
      profile,
      stats,
      habits,
      teachers,
      perks,
      lockedPerks,
      isPremium,
      dashboard,
      isLoading,
      error,
      completeHabit,
      updateDailyTarget,
      incrementDailyTarget,
      resetDailyTargetProgress,
      setFeaturedHabit,
      updateGoalProgress,
      toggleGoalCompletion,
      addGoal,
      submitRecitationResult,
      completeRecitationAssignment,
      reviewMemorizationTask,
      completeDailySurahRecitation,
      recordQuranReaderProgress,
      upgradeToPremium,
      downgradeToFree,
      handleSignOut,
    ],
  )

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>
}

export function useUserContext() {
  const context = useContext(UserContext)
  if (!context) {
    throw new Error("useUserContext must be used within a UserProvider")
  }
  return context
}
