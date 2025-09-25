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
} from "@/lib/data/teacher-database"
import { getActiveSession } from "@/lib/data/auth"

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
  const [dashboard, setDashboard] = useState<StudentDashboardRecord | null>(
    initialState?.dashboard ?? createFallbackDashboardRecord(defaultLearnerId),
  )
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const applyLearnerState = useCallback((state: LearnerState) => {
    setProfile(state.profile)
    setStats(state.stats)
    setHabits(state.habits)
    setDashboard(state.dashboard)
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
          setDashboard(createFallbackDashboardRecord(studentId))
          setError("Learner record not found")
        }
      } catch (caught) {
        if (cancelled) {
          return
        }
        const message = caught instanceof Error ? caught.message : "Failed to load dashboard data"
        setError(message)
        setDashboard((current) => current ?? createFallbackDashboardRecord(studentId))
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
      upgradeToPremium,
      downgradeToFree,
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
      upgradeToPremium,
      downgradeToFree,
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
