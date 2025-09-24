"use client"

import { createContext, useCallback, useContext, useMemo, useState } from "react"

type UserRole = "student" | "teacher" | "parent" | "admin"
type SubscriptionPlan = "free" | "premium"
type HabitDifficulty = "easy" | "medium" | "hard"

export interface UserProfile {
  id: string
  name: string
  email: string
  role: UserRole
  locale: string
  avatarUrl?: string
  plan: SubscriptionPlan
  joinedAt: string
}

export interface UserStats {
  hasanat: number
  streak: number
  ayahsRead: number
  studyMinutes: number
  rank: number
  level: number
  xp: number
  xpToNext: number
  completedHabits: number
  weeklyXP: number[]
}

export interface HabitQuest {
  id: string
  title: string
  description: string
  difficulty: HabitDifficulty
  streak: number
  bestStreak: number
  level: number
  xp: number
  progress: number
  xpReward: number
  hasanatReward: number
  dailyTarget: string
  icon: string
  lastCompletedAt?: string
  weeklyProgress: number[]
}

export interface CompleteHabitResult {
  success: boolean
  message: string
}

interface UserContextValue {
  profile: UserProfile
  stats: UserStats
  habits: HabitQuest[]
  perks: string[]
  lockedPerks: string[]
  isPremium: boolean
  completeHabit: (habitId: string) => CompleteHabitResult
  upgradeToPremium: () => void
  downgradeToFree: () => void
}

const LEVEL_XP_STEP = 500
const HABIT_LEVEL_STEP = 120

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

const initialProfile: UserProfile = {
  id: "user_001",
  name: "Ahmad Al-Hafiz",
  email: "ahmad@example.com",
  role: "student",
  locale: "en-US",
  plan: "free",
  joinedAt: "2024-02-14T10:00:00Z",
}

const initialStats: UserStats = {
  hasanat: 1247,
  streak: 7,
  ayahsRead: 342,
  studyMinutes: 135,
  rank: 12,
  level: 8,
  xp: 3400,
  xpToNext: 500,
  completedHabits: 18,
  weeklyXP: [120, 90, 160, 140, 110, 60, 0],
}

const yesterdayKey = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10)

const initialHabits: HabitQuest[] = [
  {
    id: "daily-recitation",
    title: "Daily Recitation Quest",
    description: "Recite at least 5 ayahs aloud focusing on Tajweed.",
    difficulty: "medium",
    streak: 6,
    bestStreak: 14,
    level: 3,
    xp: 240,
    progress: 40,
    xpReward: 60,
    hasanatReward: 45,
    dailyTarget: "5 ayahs",
    icon: "BookOpen",
    lastCompletedAt: yesterdayKey,
    weeklyProgress: [100, 80, 65, 100, 40, 0, 0],
  },
  {
    id: "memorization-review",
    title: "Memorization Review",
    description: "Review your latest memorized passage with the SM-2 queue.",
    difficulty: "hard",
    streak: 4,
    bestStreak: 9,
    level: 2,
    xp: 190,
    progress: 60,
    xpReward: 75,
    hasanatReward: 60,
    dailyTarget: "1 session",
    icon: "Brain",
    lastCompletedAt: yesterdayKey,
    weeklyProgress: [90, 70, 40, 80, 30, 0, 0],
  },
  {
    id: "reflection-journal",
    title: "Reflection Journal",
    description: "Write a reflection about today's recitation in your journal.",
    difficulty: "easy",
    streak: 3,
    bestStreak: 8,
    level: 2,
    xp: 130,
    progress: 10,
    xpReward: 40,
    hasanatReward: 30,
    dailyTarget: "1 entry",
    icon: "Pen",
    lastCompletedAt: yesterdayKey,
    weeklyProgress: [70, 40, 20, 60, 10, 0, 0],
  },
]

const UserContext = createContext<UserContextValue | undefined>(undefined)

function getDayDifference(from: string, to: string) {
  const fromDate = new Date(from)
  const toDate = new Date(to)
  const diff = toDate.setHours(0, 0, 0, 0) - fromDate.setHours(0, 0, 0, 0)
  return Math.round(diff / (24 * 60 * 60 * 1000))
}

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<UserProfile>(initialProfile)
  const [stats, setStats] = useState<UserStats>(initialStats)
  const [habits, setHabits] = useState<HabitQuest[]>(initialHabits)
  const [lastActivityDate, setLastActivityDate] = useState<string | null>(yesterdayKey)

  const isPremium = profile.plan === "premium"

  const perks = useMemo(() => perksByPlan[profile.plan], [profile.plan])
  const lockedPerks = useMemo(
    () => perksByPlan.premium.filter((perk) => !perksByPlan[profile.plan].includes(perk)),
    [profile.plan],
  )

  const completeHabit = useCallback(
    (habitId: string): CompleteHabitResult => {
      const today = new Date()
      const todayKey = today.toISOString().slice(0, 10)
      const todayIndex = today.getDay()

      let result: CompleteHabitResult = { success: false, message: "Habit not found." }
      let xpGain = 0
      let hasanatGain = 0

      setHabits((previousHabits) =>
        previousHabits.map((habit) => {
          if (habit.id !== habitId) {
            return habit
          }

          if (habit.lastCompletedAt === todayKey) {
            result = { success: false, message: "You've already completed this habit today." }
            return habit
          }

          const previousCompletion = habit.lastCompletedAt
          let updatedStreak = habit.streak
          if (previousCompletion) {
            const diff = getDayDifference(previousCompletion, todayKey)
            if (diff === 1) {
              updatedStreak = habit.streak + 1
            } else if (diff > 1) {
              updatedStreak = 1
            }
          } else {
            updatedStreak = 1
          }

          xpGain = habit.xpReward
          hasanatGain = habit.hasanatReward
          const newTotalXp = habit.xp + habit.xpReward
          const nextLevel = Math.floor(newTotalXp / HABIT_LEVEL_STEP) + 1
          const progressTowardsLevel = ((newTotalXp % HABIT_LEVEL_STEP) / HABIT_LEVEL_STEP) * 100

          const updatedWeeklyProgress = [...habit.weeklyProgress]
          updatedWeeklyProgress[todayIndex] = 100

          result = { success: true, message: "Great job! Habit completed for today." }

          return {
            ...habit,
            xp: newTotalXp,
            level: nextLevel,
            progress: Math.min(100, progressTowardsLevel),
            streak: updatedStreak,
            bestStreak: Math.max(habit.bestStreak, updatedStreak),
            lastCompletedAt: todayKey,
            weeklyProgress: updatedWeeklyProgress,
          }
        }),
      )

      if (!result.success) {
        return result
      }

      const diffFromLast = lastActivityDate ? getDayDifference(lastActivityDate, todayKey) : null
      const updatedTodayIndex = new Date(todayKey).getDay()

      setStats((previousStats) => {
        let streak = previousStats.streak
        if (diffFromLast === null) {
          streak = Math.max(previousStats.streak, 1)
        } else if (diffFromLast === 0) {
          streak = previousStats.streak
        } else if (diffFromLast === 1) {
          streak = previousStats.streak + 1
        } else if (diffFromLast > 1) {
          streak = 1
        }

        let xpToNext = previousStats.xpToNext - xpGain
        let level = previousStats.level
        while (xpToNext <= 0) {
          level += 1
          xpToNext += LEVEL_XP_STEP
        }

        const weeklyXP = [...previousStats.weeklyXP]
        weeklyXP[updatedTodayIndex] = Math.min(weeklyXP[updatedTodayIndex] + xpGain, LEVEL_XP_STEP)

        return {
          ...previousStats,
          streak,
          xp: previousStats.xp + xpGain,
          xpToNext,
          level,
          hasanat: previousStats.hasanat + hasanatGain,
          completedHabits: previousStats.completedHabits + 1,
          weeklyXP,
        }
      })

      setLastActivityDate(todayKey)

      return result
    },
    [lastActivityDate],
  )

  const upgradeToPremium = useCallback(() => {
    setProfile((previous) => ({ ...previous, plan: "premium" }))
  }, [])

  const downgradeToFree = useCallback(() => {
    setProfile((previous) => ({ ...previous, plan: "free" }))
  }, [])

  const value = useMemo(
    () => ({
      profile,
      stats,
      habits,
      perks,
      lockedPerks,
      isPremium,
      completeHabit,
      upgradeToPremium,
      downgradeToFree,
    }),
    [profile, stats, habits, perks, lockedPerks, isPremium, completeHabit, upgradeToPremium, downgradeToFree],
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
