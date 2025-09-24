export type TeacherRole = "head" | "assistant"

export interface TeacherProfile {
  id: string
  name: string
  email: string
  role: TeacherRole
  specialization: string
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
  premiumBoost: {
    xpBonus: number
    description: string
    isActive: boolean
  }
}

interface TeacherDatabaseSchema {
  teachers: TeacherProfile[]
  dashboards: Record<string, StudentDashboardRecord>
}

const now = new Date()

const iso = (date: Date) => date.toISOString()
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
  dashboards: {},
}

database.dashboards["user_001"] = {
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
    },
    {
      id: "leader_class_002",
      name: "Omar K.",
      rank: 2,
      points: 2156,
      scope: "class",
      timeframe: "weekly",
    },
    {
      id: "leader_class_user",
      name: "You",
      rank: 12,
      points: 1247,
      scope: "class",
      timeframe: "weekly",
    },
    {
      id: "leader_global_001",
      name: "Hafiza Lina",
      rank: 32,
      points: 15890,
      scope: "global",
      timeframe: "monthly",
    },
    {
      id: "leader_global_user",
      name: "You",
      rank: 418,
      points: 1247,
      scope: "global",
      timeframe: "monthly",
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
  premiumBoost: {
    xpBonus: 120,
    description: "Earn +120 bonus XP for completing a tajweed mastery session.",
    isActive: true,
  },
}

export function getTeacherProfiles(): TeacherProfile[] {
  return [...database.teachers]
}

export function getStudentDashboardRecord(studentId: string): StudentDashboardRecord | undefined {
  const record = database.dashboards[studentId]
  if (!record) return undefined
  return JSON.parse(JSON.stringify(record)) as StudentDashboardRecord
}

export function updateDailyTarget(studentId: string, target: number): StudentDashboardRecord | undefined {
  const record = database.dashboards[studentId]
  if (!record) return undefined
  record.dailyTarget.targetAyahs = target
  record.dailyTarget.lastUpdated = iso(new Date())
  if (record.dailyTarget.completedAyahs > target) {
    record.dailyTarget.completedAyahs = target
  }
  return getStudentDashboardRecord(studentId)
}

export function recordAyahProgress(studentId: string, increment = 1): StudentDashboardRecord | undefined {
  const record = database.dashboards[studentId]
  if (!record) return undefined
  const normalizedIncrement = Number.isFinite(increment) ? Math.max(0, Math.floor(increment)) : 0
  const previousCompleted = record.dailyTarget.completedAyahs
  const nextCompleted = Math.min(
    previousCompleted + normalizedIncrement,
    record.dailyTarget.targetAyahs,
  )

  const actualIncrement = Math.max(0, nextCompleted - previousCompleted)

  record.dailyTarget.completedAyahs = nextCompleted
  record.dailyTarget.lastUpdated = iso(new Date())

  if (actualIncrement > 0) {
    const timestamp = new Date()
    record.activities.unshift({
      id: `activity_${timestamp.getTime()}`,
      type: "reading",
      surah: record.lastRead.surah || "Daily Recitation",
      ayahs: actualIncrement,
      timestamp: iso(timestamp),
    })

    if (record.activities.length > MAX_ACTIVITY_ENTRIES) {
      record.activities = record.activities.slice(0, MAX_ACTIVITY_ENTRIES)
    }

    if (record.lastRead.ayah < record.lastRead.totalAyahs) {
      record.lastRead.ayah = Math.min(
        record.lastRead.totalAyahs,
        record.lastRead.ayah + actualIncrement,
      )
    }
  }

  return getStudentDashboardRecord(studentId)
}

export function resetDailyProgress(studentId: string): StudentDashboardRecord | undefined {
  const record = database.dashboards[studentId]
  if (!record) return undefined
  record.dailyTarget.completedAyahs = 0
  record.dailyTarget.lastUpdated = iso(new Date())
  return getStudentDashboardRecord(studentId)
}

export function setPreferredHabit(studentId: string, habitId: string): StudentDashboardRecord | undefined {
  const record = database.dashboards[studentId]
  if (!record) return undefined
  record.preferredHabitId = habitId
  return getStudentDashboardRecord(studentId)
}

export function upsertGoalProgress(
  studentId: string,
  goalId: string,
  progress: number,
  status: GoalRecord["status"] = "active",
): StudentDashboardRecord | undefined {
  const record = database.dashboards[studentId]
  if (!record) return undefined
  const goal = record.goals.find((g) => g.id === goalId)
  if (!goal) return undefined
  goal.progress = Math.max(0, Math.min(100, progress))
  goal.status = status
  return getStudentDashboardRecord(studentId)
}

export function addGoal(
  studentId: string,
  goal: Omit<GoalRecord, "status"> & { status?: GoalRecord["status"] },
): StudentDashboardRecord | undefined {
  const record = database.dashboards[studentId]
  if (!record) return undefined
  record.goals.unshift({ ...goal, status: goal.status ?? "active" })
  return getStudentDashboardRecord(studentId)
}

export function getTeacherNotes(studentId: string): TeacherFeedbackNote[] {
  const record = database.dashboards[studentId]
  return record ? [...record.teacherNotes] : []
}

