export type TeacherRole = "head" | "assistant"

export interface TeacherProfile {
  id: string
  name: string
  email: string
  role: TeacherRole
  specialization: string
}

export type UserRole = "student" | "teacher" | "parent" | "admin"
export type SubscriptionPlan = "free" | "premium"
export type HabitDifficulty = "easy" | "medium" | "hard"

export interface LearnerProfile {
  id: string
  name: string
  email: string
  role: UserRole
  locale: string
  avatarUrl?: string
  plan: SubscriptionPlan
  joinedAt: string
}

export interface LearnerStats {
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

export interface HabitQuestRecord {
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

export interface DailyTargetRecord {
  targetAyahs: number
  completedAyahs: number
  lastUpdated: string
}

export interface ActivityEntry {
  id: string
  type: "reading" | "memorization" | "recitation"
  surah: string
  ayahs?: number
  progress?: number
  score?: number
  timestamp: string
}

export interface GoalRecord {
  id: string
  title: string
  deadline: string
  progress: number
  status: "active" | "completed"
}

export interface AchievementRecord {
  id: string
  name: string
  description: string
  unlockedAt: string
}

export interface LeaderboardEntry {
  id: string
  name: string
  rank: number
  points: number
  scope: "class" | "global"
  timeframe: "weekly" | "monthly"
  trend?: number
  percentile?: number
}

export interface TeacherFeedbackNote {
  id: string
  teacherId: string
  note: string
  createdAt: string
  category: "tajweed" | "memorization" | "motivation"
}

export interface StudentDashboardRecord {
  studentId: string
  dailyTarget: DailyTargetRecord
  recitationPercentage: number
  memorizationPercentage: number
  lastRead: {
    surah: string
    ayah: number
    totalAyahs: number
  }
  preferredHabitId?: string
  activities: ActivityEntry[]
  goals: GoalRecord[]
  achievements: AchievementRecord[]
  leaderboard: LeaderboardEntry[]
  teacherNotes: TeacherFeedbackNote[]
  habitCompletion: {
    completed: number
    target: number
    weeklyChange: number
  }
  premiumBoost: {
    xpBonus: number
    description: string
    isActive: boolean
    availableSessions: number
  }
}

interface LearnerMeta {
  lastHabitActivityDate: string | null
}

interface LearnerRecord {
  profile: LearnerProfile
  stats: LearnerStats
  habits: HabitQuestRecord[]
  dashboard: StudentDashboardRecord
  meta: LearnerMeta
}

export interface LearnerState {
  profile: LearnerProfile
  stats: LearnerStats
  habits: HabitQuestRecord[]
  dashboard: StudentDashboardRecord
}

export interface CompleteHabitResult {
  success: boolean
  message: string
}

export interface HabitCompletionResponse {
  result: CompleteHabitResult
  state?: LearnerState
}

interface TeacherDatabaseSchema {
  teachers: TeacherProfile[]
  learners: Record<string, LearnerRecord>
}

const now = new Date()
const iso = (date: Date) => date.toISOString()
const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)
const yesterdayKey = yesterday.toISOString().slice(0, 10)
const LEVEL_XP_STEP = 500
const HABIT_LEVEL_STEP = 120
const MAX_ACTIVITY_ENTRIES = 50

const database: TeacherDatabaseSchema = {
  teachers: [
    {
      id: "teacher_001",
      name: "Ustadh Kareem",
      email: "kareem@alfawz.example",
      role: "head",
      specialization: "Tajweed",
    },
    {
      id: "teacher_002",
      name: "Ustadha Maryam",
      email: "maryam@alfawz.example",
      role: "assistant",
      specialization: "Memorization",
    },
  ],
  learners: {},
}

database.learners["user_001"] = {
  profile: {
    id: "user_001",
    name: "Ahmad Al-Hafiz",
    email: "ahmad@example.com",
    role: "student",
    locale: "en-US",
    plan: "free",
    joinedAt: "2024-02-14T10:00:00Z",
  },
  stats: {
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
  },
  habits: [
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
  ],
  dashboard: {
    studentId: "user_001",
    dailyTarget: {
      targetAyahs: 10,
      completedAyahs: 4,
      lastUpdated: iso(now),
    },
    recitationPercentage: 72,
    memorizationPercentage: 58,
    lastRead: {
      surah: "Al-Baqarah",
      ayah: 156,
      totalAyahs: 286,
    },
    preferredHabitId: "daily-recitation",
    activities: [
      {
        id: "activity_001",
        type: "reading",
        surah: "Al-Fatiha",
        ayahs: 7,
        timestamp: iso(new Date(now.getTime() - 2 * 60 * 60 * 1000)),
      },
      {
        id: "activity_002",
        type: "memorization",
        surah: "Al-Ikhlas",
        progress: 85,
        timestamp: iso(new Date(now.getTime() - 24 * 60 * 60 * 1000)),
      },
      {
        id: "activity_003",
        type: "recitation",
        surah: "Al-Nas",
        score: 92,
        timestamp: iso(new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000)),
      },
    ],
    goals: [
      {
        id: "goal_001",
        title: "Complete Al-Mulk",
        deadline: iso(new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)),
        progress: 65,
        status: "active",
      },
      {
        id: "goal_002",
        title: "Memorize 5 new Ayahs",
        deadline: iso(new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)),
        progress: 40,
        status: "active",
      },
      {
        id: "goal_003",
        title: "Perfect Tajweed practice",
        deadline: iso(new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000)),
        progress: 80,
        status: "active",
      },
    ],
    achievements: [
      {
        id: "ach_001",
        name: "Week Warrior",
        description: "7-day reading streak",
        unlockedAt: iso(new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000)),
      },
      {
        id: "ach_002",
        name: "Perfect Reciter",
        description: "95%+ accuracy score",
        unlockedAt: iso(new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000)),
      },
    ],
    leaderboard: [
      {
        id: "leader_class_001",
        name: "Fatima A.",
        rank: 1,
        points: 2847,
        scope: "class",
        timeframe: "weekly",
        trend: 0,
        percentile: 2,
      },
      {
        id: "leader_class_002",
        name: "Omar K.",
        rank: 2,
        points: 2156,
        scope: "class",
        timeframe: "weekly",
        trend: -1,
        percentile: 5,
      },
      {
        id: "leader_class_user",
        name: "You",
        rank: 12,
        points: 1247,
        scope: "class",
        timeframe: "weekly",
        trend: 3,
        percentile: 28,
      },
      {
        id: "leader_global_001",
        name: "Hafiza Lina",
        rank: 32,
        points: 15890,
        scope: "global",
        timeframe: "monthly",
        trend: 4,
        percentile: 12,
      },
      {
        id: "leader_global_user",
        name: "You",
        rank: 418,
        points: 1247,
        scope: "global",
        timeframe: "monthly",
        trend: 12,
        percentile: 36,
      },
    ],
    teacherNotes: [
      {
        id: "note_001",
        teacherId: "teacher_001",
        note: "Great improvement on guttural letters during yesterday's recitation.",
        createdAt: iso(new Date(now.getTime() - 20 * 60 * 1000)),
        category: "tajweed",
      },
      {
        id: "note_002",
        teacherId: "teacher_002",
        note: "Continue reviewing Surah Al-Mulk before next assessment.",
        createdAt: iso(new Date(now.getTime() - 4 * 60 * 60 * 1000)),
        category: "memorization",
      },
    ],
    habitCompletion: {
      completed: 18,
      target: 24,
      weeklyChange: 8,
    },
    premiumBoost: {
      xpBonus: 120,
      description: "Earn +120 bonus XP for completing a tajweed mastery session.",
      isActive: true,
      availableSessions: 2,
    },
  },
  meta: {
    lastHabitActivityDate: yesterdayKey,
  },
}

function cloneLearnerState(record: LearnerRecord): LearnerState {
  return {
    profile: { ...record.profile },
    stats: { ...record.stats, weeklyXP: [...record.stats.weeklyXP] },
    habits: record.habits.map((habit) => ({ ...habit, weeklyProgress: [...habit.weeklyProgress] })),
    dashboard: JSON.parse(JSON.stringify(record.dashboard)) as StudentDashboardRecord,
  }
}

function getLearnerRecord(studentId: string): LearnerRecord | undefined {
  return database.learners[studentId]
}

function getDayDifference(from: string, to: string) {
  const fromDate = new Date(from)
  const toDate = new Date(to)
  const diff = toDate.setHours(0, 0, 0, 0) - fromDate.setHours(0, 0, 0, 0)
  return Math.round(diff / (24 * 60 * 60 * 1000))
}

function applyLevelProgression(stats: LearnerStats, xpGain: number) {
  stats.xp += xpGain
  let xpToNext = stats.xpToNext - xpGain
  while (xpToNext <= 0) {
    stats.level += 1
    xpToNext += LEVEL_XP_STEP
  }
  stats.xpToNext = xpToNext
}

function clampHabitCompletion(record: LearnerRecord) {
  const completion = record.dashboard.habitCompletion
  completion.completed = Math.min(completion.completed, completion.target)
}

export function getTeacherProfiles(): TeacherProfile[] {
  return database.teachers.map((teacher) => ({ ...teacher }))
}

export function getLearnerState(studentId: string): LearnerState | undefined {
  const record = getLearnerRecord(studentId)
  if (!record) return undefined
  return cloneLearnerState(record)
}

export function getLearnerProfile(studentId: string): LearnerProfile | undefined {
  const record = getLearnerRecord(studentId)
  if (!record) return undefined
  return { ...record.profile }
}

export function getLearnerStats(studentId: string): LearnerStats | undefined {
  const record = getLearnerRecord(studentId)
  if (!record) return undefined
  return { ...record.stats, weeklyXP: [...record.stats.weeklyXP] }
}

export function getLearnerHabits(studentId: string): HabitQuestRecord[] {
  const record = getLearnerRecord(studentId)
  if (!record) return []
  return record.habits.map((habit) => ({ ...habit, weeklyProgress: [...habit.weeklyProgress] }))
}

export function getStudentDashboardRecord(studentId: string): StudentDashboardRecord | undefined {
  const record = getLearnerRecord(studentId)
  if (!record) return undefined
  return JSON.parse(JSON.stringify(record.dashboard)) as StudentDashboardRecord
}

export function getLearnerIdByEmail(email: string): string | undefined {
  const normalized = email.trim().toLowerCase()
  const entry = Object.values(database.learners).find((learner) => learner.profile.email.toLowerCase() === normalized)
  return entry?.profile.id
}

export function updateDailyTarget(studentId: string, target: number): LearnerState | undefined {
  const record = getLearnerRecord(studentId)
  if (!record) return undefined
  const normalizedTarget = Number.isFinite(target) ? Math.max(0, Math.floor(target)) : record.dashboard.dailyTarget.targetAyahs
  record.dashboard.dailyTarget.targetAyahs = normalizedTarget
  if (record.dashboard.dailyTarget.completedAyahs > normalizedTarget) {
    record.dashboard.dailyTarget.completedAyahs = normalizedTarget
  }
  record.dashboard.dailyTarget.lastUpdated = iso(new Date())
  return cloneLearnerState(record)
}

export function recordAyahProgress(studentId: string, increment = 1): LearnerState | undefined {
  const record = getLearnerRecord(studentId)
  if (!record) return undefined
  const normalizedIncrement = Number.isFinite(increment) ? Math.max(0, Math.floor(increment)) : 0
  if (normalizedIncrement === 0) {
    return cloneLearnerState(record)
  }

  const previousCompleted = record.dashboard.dailyTarget.completedAyahs
  const nextCompleted = Math.min(
    previousCompleted + normalizedIncrement,
    record.dashboard.dailyTarget.targetAyahs,
  )
  const actualIncrement = Math.max(0, nextCompleted - previousCompleted)

  record.dashboard.dailyTarget.completedAyahs = nextCompleted
  record.dashboard.dailyTarget.lastUpdated = iso(new Date())

  if (actualIncrement > 0) {
    record.stats.ayahsRead += actualIncrement
    const timestamp = new Date()
    record.dashboard.activities.unshift({
      id: `activity_${timestamp.getTime()}`,
      type: "reading",
      surah: record.dashboard.lastRead.surah || "Daily Recitation",
      ayahs: actualIncrement,
      timestamp: iso(timestamp),
    })
    if (record.dashboard.activities.length > MAX_ACTIVITY_ENTRIES) {
      record.dashboard.activities = record.dashboard.activities.slice(0, MAX_ACTIVITY_ENTRIES)
    }
    if (record.dashboard.lastRead.ayah < record.dashboard.lastRead.totalAyahs) {
      record.dashboard.lastRead.ayah = Math.min(
        record.dashboard.lastRead.totalAyahs,
        record.dashboard.lastRead.ayah + actualIncrement,
      )
    }
  }

  return cloneLearnerState(record)
}

export function resetDailyProgress(studentId: string): LearnerState | undefined {
  const record = getLearnerRecord(studentId)
  if (!record) return undefined
  record.dashboard.dailyTarget.completedAyahs = 0
  record.dashboard.dailyTarget.lastUpdated = iso(new Date())
  return cloneLearnerState(record)
}

export function setPreferredHabit(studentId: string, habitId: string): LearnerState | undefined {
  const record = getLearnerRecord(studentId)
  if (!record) return undefined
  const hasHabit = record.habits.some((habit) => habit.id === habitId)
  if (!hasHabit) return cloneLearnerState(record)
  record.dashboard.preferredHabitId = habitId
  return cloneLearnerState(record)
}

export function upsertGoalProgress(
  studentId: string,
  goalId: string,
  progress: number,
  status: GoalRecord["status"] = "active",
): LearnerState | undefined {
  const record = getLearnerRecord(studentId)
  if (!record) return undefined
  const goal = record.dashboard.goals.find((entry) => entry.id === goalId)
  if (!goal) return undefined
  goal.progress = Math.max(0, Math.min(100, progress))
  goal.status = status
  return cloneLearnerState(record)
}

export function addGoal(
  studentId: string,
  goal: Omit<GoalRecord, "status"> & { status?: GoalRecord["status"] },
): LearnerState | undefined {
  const record = getLearnerRecord(studentId)
  if (!record) return undefined
  record.dashboard.goals.unshift({ ...goal, status: goal.status ?? "active" })
  return cloneLearnerState(record)
}

export function incrementHabitCompletion(studentId: string, increment = 1): LearnerState | undefined {
  const record = getLearnerRecord(studentId)
  if (!record) return undefined
  const normalizedIncrement = Number.isFinite(increment) ? Math.max(0, Math.floor(increment)) : 0
  if (normalizedIncrement === 0) {
    return cloneLearnerState(record)
  }
  record.dashboard.habitCompletion.completed = Math.min(
    record.dashboard.habitCompletion.completed + normalizedIncrement,
    record.dashboard.habitCompletion.target,
  )
  clampHabitCompletion(record)
  return cloneLearnerState(record)
}

export function getTeacherNotes(studentId: string): TeacherFeedbackNote[] {
  const record = getLearnerRecord(studentId)
  if (!record) return []
  return record.dashboard.teacherNotes.map((note) => ({ ...note }))
}

export function completeHabitQuest(studentId: string, habitId: string): HabitCompletionResponse {
  const record = getLearnerRecord(studentId)
  if (!record) {
    return { result: { success: false, message: "Learner not found." } }
  }
  const habit = record.habits.find((entry) => entry.id === habitId)
  if (!habit) {
    return { result: { success: false, message: "Habit not found." }, state: cloneLearnerState(record) }
  }

  const today = new Date()
  const todayKeyLocal = today.toISOString().slice(0, 10)
  if (habit.lastCompletedAt === todayKeyLocal) {
    return { result: { success: false, message: "You've already completed this habit today." }, state: cloneLearnerState(record) }
  }

  const previousCompletion = habit.lastCompletedAt
  let updatedStreak = habit.streak
  if (previousCompletion) {
    const diff = getDayDifference(previousCompletion, todayKeyLocal)
    if (diff === 1) {
      updatedStreak = habit.streak + 1
    } else if (diff > 1) {
      updatedStreak = 1
    }
  } else {
    updatedStreak = 1
  }

  habit.streak = updatedStreak
  habit.bestStreak = Math.max(habit.bestStreak, updatedStreak)
  habit.lastCompletedAt = todayKeyLocal
  const updatedWeeklyProgress = [...habit.weeklyProgress]
  updatedWeeklyProgress[today.getDay()] = 100
  habit.weeklyProgress = updatedWeeklyProgress

  habit.xp += habit.xpReward
  const newTotalXp = habit.xp
  habit.level = Math.floor(newTotalXp / HABIT_LEVEL_STEP) + 1
  habit.progress = Math.min(100, Math.round(((newTotalXp % HABIT_LEVEL_STEP) / HABIT_LEVEL_STEP) * 100))

  const stats = record.stats
  const meta = record.meta
  const previousHabitDay = meta.lastHabitActivityDate
  if (!previousHabitDay) {
    stats.streak = Math.max(stats.streak, 1)
  } else {
    const diff = getDayDifference(previousHabitDay, todayKeyLocal)
    if (diff === 1) {
      stats.streak += 1
    } else if (diff > 1) {
      stats.streak = 1
    }
  }

  meta.lastHabitActivityDate = todayKeyLocal

  stats.hasanat += habit.hasanatReward
  applyLevelProgression(stats, habit.xpReward)
  stats.completedHabits += 1
  const weeklyXP = [...stats.weeklyXP]
  weeklyXP[today.getDay()] = Math.min(LEVEL_XP_STEP, weeklyXP[today.getDay()] + habit.xpReward)
  stats.weeklyXP = weeklyXP

  record.dashboard.habitCompletion.completed += 1
  clampHabitCompletion(record)

  record.dashboard.activities.unshift({
    id: `activity_${today.getTime()}`,
    type: "memorization",
    surah: habit.title,
    progress: 100,
    timestamp: iso(today),
  })
  if (record.dashboard.activities.length > MAX_ACTIVITY_ENTRIES) {
    record.dashboard.activities = record.dashboard.activities.slice(0, MAX_ACTIVITY_ENTRIES)
  }

  return {
    result: { success: true, message: "Great job! Habit completed for today." },
    state: cloneLearnerState(record),
  }
}

export function setSubscriptionPlan(studentId: string, plan: SubscriptionPlan): LearnerState | undefined {
  const record = getLearnerRecord(studentId)
  if (!record) return undefined
  record.profile.plan = plan
  return cloneLearnerState(record)
}
