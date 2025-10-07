import { expandVerseRange, normalizeVerseKey, validateVerseKeys } from "../verse-validator"
import { getVerseText } from "../quran-data"

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
  hasanatAwarded?: number
  timestamp: string
}

export interface DailySurahLogEntry {
  id: string
  slug: string
  surahNumber: number
  title: string
  encouragement: string
  hasanatAwarded: number
  completedAt: string
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

export type RecitationTaskStatus = "assigned" | "submitted" | "reviewed"

export interface RecitationVerseRecord {
  ayah: number
  arabic: string
  translation: string
}

export interface RecitationTaskRecord {
  id: string
  surah: string
  ayahRange: string
  dueDate: string
  status: RecitationTaskStatus
  targetAccuracy: number
  teacherId: string
  notes: string
  assignedAt: string
  focusAreas?: string[]
  verses: RecitationVerseRecord[]
  lastScore?: number
  submittedAt?: string
  reviewedAt?: string
  reviewNotes?: string
  assignmentId?: string
}

export type AssignmentStatus = "draft" | "published" | "archived"

export type AssignmentSubmissionStatus = "not_started" | "submitted" | "reviewed"

export interface AssignmentHotspotRecord {
  id: string
  title: string
  description: string
  x: number
  y: number
  width: number
  height: number
  audioUrl?: string
}

export interface TeacherAssignmentRecord {
  id: string
  teacherId: string
  title: string
  description?: string
  instructions?: string
  assignmentType: string
  surahName: string
  surahNumber: number
  ayahRange: string
  dueDate: string
  status: AssignmentStatus
  createdAt: string
  updatedAt: string
  classIds: string[]
  studentIds: string[]
  imageUrl?: string
  hotspots: AssignmentHotspotRecord[]
}

export interface AssignmentSubmissionRecord {
  id: string
  assignmentId: string
  studentId: string
  status: AssignmentSubmissionStatus
  submittedAt?: string
  reviewedAt?: string
  score?: number
  recitationTaskId?: string
  notes?: string
  updatedAt: string
}

export interface AssignmentWithStats {
  assignment: TeacherAssignmentRecord
  stats: {
    assignedStudents: number
    submitted: number
    reviewed: number
  }
  submissions: AssignmentSubmissionRecord[]
}

export interface AssignmentHotspotInput {
  title: string
  description: string
  x: number
  y: number
  width: number
  height: number
  audioUrl?: string
}

export interface CreateTeacherAssignmentInput {
  title: string
  description?: string
  instructions?: string
  assignmentType: string
  surahName: string
  surahNumber: number
  ayahRange: string
  dueAt: string
  classIds: string[]
  studentIds: string[]
  imageUrl?: string
  hotspots?: AssignmentHotspotInput[]
  status?: AssignmentStatus
}

export interface RecitationSessionRecord {
  id: string
  taskId?: string
  surah: string
  ayahRange: string
  accuracy: number
  tajweedScore: number
  fluencyScore: number
  hasanatEarned: number
  durationSeconds: number
  transcript: string
  expectedText: string
  submittedAt: string
}

export interface RecitationSubmissionInput {
  taskId?: string
  surah: string
  ayahRange: string
  accuracy: number
  tajweedScore: number
  fluencyScore: number
  hasanatEarned: number
  durationSeconds: number
  transcript: string
  expectedText: string
}

export interface RecitationReviewInput {
  taskId: string
  teacherId: string
  accuracy: number
  tajweedScore: number
  notes?: string
}

export type MemorizationTaskStatus = "new" | "due" | "learning" | "mastered"

export interface MemorizationPassageRecord {
  ayah: number
  arabic: string
  translation: string
}

export interface MemorizationTaskRecord {
  id: string
  surah: string
  ayahRange: string
  status: MemorizationTaskStatus
  teacherId: string
  interval: number
  repetitions: number
  easeFactor: number
  memorizationConfidence: number
  lastReviewed?: string
  dueDate: string
  nextReview: string
  notes?: string
  playlistId?: string
  tags?: string[]
  passages: MemorizationPassageRecord[]
}

export interface MemorizationPlaylistRecord {
  id: string
  title: string
  description: string
  ayahCount: number
  progress: number
  dueCount: number
  lastReviewed: string
  focus: string
}

export interface MemorizationSummaryRecord {
  dueToday: number
  newCount: number
  totalMastered: number
  streak: number
  recommendedDuration: number
  focusArea: string
  lastReviewedOn: string | null
  reviewHeatmap: { date: string; completed: number }[]
}

export interface MemorizationReviewInput {
  taskId: string
  quality: number
  accuracy: number
  durationSeconds: number
}

export type GamificationTaskType = "habit" | "recitation" | "memorization" | "daily_target"
export type GamificationTaskStatus = "locked" | "in_progress" | "completed"

export interface GamificationTaskRecord {
  id: string
  title: string
  description: string
  type: GamificationTaskType
  status: GamificationTaskStatus
  progress: number
  target: number
  xpReward: number
  hasanatReward: number
  habitId?: string
  recitationTaskId?: string
  memorizationTaskId?: string
  teacherId?: string
  dueDate?: string
  lastUpdated: string
}

export interface GamificationSeasonRecord {
  name: string
  level: number
  xp: number
  xpToNext: number
  endsOn: string
}

export interface GamificationEnergyRecord {
  current: number
  max: number
  refreshedAt: string
}

export interface GamificationBoostRecord {
  id: string
  name: string
  description: string
  active: boolean
  expiresAt?: string
}

export interface GamificationLeaderboardSummary {
  rank: number
  nextReward: number
  classRank: number
}

export interface GamificationPanelRecord {
  season: GamificationSeasonRecord
  energy: GamificationEnergyRecord
  streak: { current: number; best: number }
  tasks: GamificationTaskRecord[]
  boosts: GamificationBoostRecord[]
  leaderboard: GamificationLeaderboardSummary
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
  category: "tajweed" | "memorization" | "motivation" | "reminder" | "communication"
}

export interface TeacherReminderResult {
  success: boolean
  note?: TeacherFeedbackNote
  error?: string
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
  recitationTasks: RecitationTaskRecord[]
  recitationSessions: RecitationSessionRecord[]
  memorizationQueue: MemorizationTaskRecord[]
  memorizationPlaylists: MemorizationPlaylistRecord[]
  memorizationSummary: MemorizationSummaryRecord
  tajweedFocus: TajweedFocusRecord[]
  gamePanel: GamificationPanelRecord
  dailySurahLog: DailySurahLogEntry[]
}

export type TajweedFocusStatus = "needs_support" | "improving" | "mastered"

export interface TajweedFocusRecord {
  id: string
  rule: string
  focusArea: string
  status: TajweedFocusStatus
  teacherId: string
  lastReviewed: string | null
  targetScore: number
  currentScore: number
  notes: string
  recommendedExercises: string[]
}

export interface CompletedGameTaskLog {
  id: string
  taskId: string
  completedAt: string
  xpAwarded: number
  hasanatAwarded: number
  teacherId?: string
}

interface LearnerMeta {
  lastHabitActivityDate: string | null
  completedGameTasks: CompletedGameTaskLog[]
  activeMemorizationPlanId?: string
}

export interface ClassRecord {
  id: string
  name: string
  description?: string
  teacherId: string
  schedule?: string
  studentIds: string[]
}

export interface CreateMemorizationClassInput {
  name: string
  teacherId: string
  description?: string
  schedule?: string
  studentIds?: string[]
}

export interface PersonalPlanSettings {
  intention?: string
  habitCue?: string
  cadence: string
  reminderTime?: string
  checkInDays: string[]
  startDate: string
}

export interface MemorizationPlanRecord {
  id: string
  title: string
  verseKeys: string[]
  teacherId: string
  classIds: string[]
  createdAt: string
  notes?: string
  createdByStudentId?: string
  personalPlanSettings?: PersonalPlanSettings
}

export interface TeacherClassSummary {
  id: string
  name: string
  description?: string
  teacherId: string
  schedule?: string
  studentIds: string[]
  studentCount: number
}

export interface AdminClassStudentSummary {
  id: string
  name: string
  email: string
  streak: number
  memorizationProgress: number
  recitationProgress: number
}

export interface AdminClassSummary {
  class: TeacherClassSummary
  teacher: TeacherProfile
  students: AdminClassStudentSummary[]
}

export interface LearnerDirectoryEntry {
  id: string
  name: string
  email: string
  role: UserRole
}

export interface TeacherStudentSummary {
  id: string
  name: string
  email: string
  classIds: string[]
  classNames: string[]
  streak: number
  hasanat: number
  memorizationProgress: number
  recitationProgress: number
  lastActiveAt?: string | null
}

export interface TeacherRecitationTaskSummary {
  id: string
  studentId: string
  studentName: string
  studentEmail: string
  classNames: string[]
  surah: string
  ayahRange: string
  dueDate: string
  status: RecitationTaskStatus
  submittedAt?: string
  reviewedAt?: string
  lastScore?: number
  assignmentId?: string
  notes?: string
}

export interface TeacherMemorizationPlanStats {
  verseCount: number
  assignedStudents: number
  completedStudents: number
  inProgressStudents: number
  notStartedStudents: number
}

export interface TeacherMemorizationPlanSummary {
  plan: MemorizationPlanRecord
  classes: TeacherClassSummary[]
  stats: TeacherMemorizationPlanStats
}

export interface TeacherPlanProgressStudent {
  studentId: string
  studentName: string
  status: "not_started" | "in_progress" | "completed"
  classId: string
  className: string
  repetitionsDone: number
  totalRepetitions: number
  currentVerseIndex: number
  verseCount: number
  lastActivity?: string | null
}

export interface TeacherPlanProgressClassSummary {
  id: string
  name: string
  studentCount: number
  completed: number
  inProgress: number
  notStarted: number
}

export interface TeacherPlanProgress {
  plan: MemorizationPlanRecord
  classes: TeacherPlanProgressClassSummary[]
  students: TeacherPlanProgressStudent[]
}

export interface SuggestedMemorizationPlan {
  id: string
  title: string
  verseKeys: string[]
  reason: string
}

export interface CreateTeacherPlanInput {
  title: string
  verseKeys: string[]
  classIds: string[]
  notes?: string
}

export interface UpdateTeacherPlanInput {
  title?: string
  verseKeys?: string[]
  classIds?: string[]
  notes?: string
}

export interface CreatePersonalMemorizationPlanInput {
  title: string
  verseKeys: string[]
  intention?: string
  habitCue?: string
  cadence: string
  reminderTime?: string
  checkInDays?: string[]
  startDate?: string
  notes?: string
}

export interface MemorizationHistoryEntry {
  verseKey: string
  repetitions: number
  completedAt: string
}

export interface StudentMemorizationProgressRecord {
  studentId: string
  planId: string
  currentVerseIndex: number
  repetitionsDone: number
  totalRepetitions: number
  startedAt: string
  updatedAt: string
  lastRepetitionAt: string | null
  completedAt: string | null
  history: MemorizationHistoryEntry[]
}

export interface MemorizationCompletionLogEntry {
  id: string
  planId: string
  studentId: string
  completedAt: string
  verseCount: number
  totalRepetitions: number
}

export interface StudentMemorizationPlanContext {
  plan: MemorizationPlanRecord
  progress: StudentMemorizationProgressRecord
  classes: ClassRecord[]
  teacher?: TeacherProfile
  isActive: boolean
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

export interface DailySurahCompletionInput {
  slug: string
  surahNumber: number
  title: string
  encouragement: string
  hasanatAwarded: number
  ayahsRead?: number
  studyMinutes?: number
}

export interface DailySurahCompletionResult {
  success: boolean
  hasanatAwarded: number
  alreadyCompleted: boolean
}

export interface DailySurahCompletionResponse {
  result: DailySurahCompletionResult
  state?: LearnerState
}

export interface QuranReaderRecitationInput {
  verseKey: string
  surah: string
  ayahNumber: number
  pageNumber?: number
  lettersCount: number
  hasanatAwarded: number
}

export interface QuranReaderRecitationResult {
  success: boolean
  hasanatAwarded: number
  lettersCount: number
  cumulativeHasanat: number
}

export interface QuranReaderRecitationResponse {
  result: QuranReaderRecitationResult
  state?: LearnerState
}

interface TeacherDatabaseSchema {
  teachers: TeacherProfile[]
  learners: Record<string, LearnerRecord>
  classes: ClassRecord[]
  memorizationPlans: MemorizationPlanRecord[]
  studentMemorizationProgress: StudentMemorizationProgressRecord[]
  memorizationCompletions: MemorizationCompletionLogEntry[]
  assignments: TeacherAssignmentRecord[]
  assignmentSubmissions: AssignmentSubmissionRecord[]
}

const now = new Date()
const iso = (date: Date) => date.toISOString()
const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)
const yesterdayKey = yesterday.toISOString().slice(0, 10)
const LEVEL_XP_STEP = 500
const HABIT_LEVEL_STEP = 120
const MAX_ACTIVITY_ENTRIES = 50
const MAX_RECITATION_SESSIONS = 50
const MAX_MEMORIZATION_HEATMAP = 30
const MAX_TEACHER_NOTES = 20
const GAME_BASE_LEVEL_STEP = 320
const GAME_LEVEL_MULTIPLIER = 1.15
const MAX_GAMIFICATION_LOG = 100
const MEMORIZATION_REPETITION_TARGET = 20
const MAX_MEMORIZATION_COMPLETIONS = 100
const PLAN_CREATION_DAILY_LIMIT = 10

let assignmentSequence = 0
let classSequence = 0

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
  classes: [
    {
      id: "class_beginner_a",
      name: "Beginner Class A",
      description: "Foundations of Juz' Amma memorization",
      teacherId: "teacher_001",
      schedule: "Sundays & Wednesdays",
      studentIds: ["user_001"],
    },
    {
      id: "class_evening_memorization",
      name: "Evening Memorization Circle",
      description: "Community review and hifz support",
      teacherId: "teacher_002",
      schedule: "Weeknight gatherings",
      studentIds: [],
    },
  ],
  memorizationPlans: [
    {
      id: "plan_ikhlas_kursi",
      title: "Surah Al-Ikhlas & Ayat al-Kursi",
      verseKeys: ["112:1", "112:2", "112:3", "112:4", "2:255"],
      teacherId: "teacher_001",
      classIds: ["class_beginner_a"],
      createdAt: "2024-02-20T07:30:00Z",
      notes: "Center the heart on tawhid before entering the Throne verse.",
    },
  ],
  studentMemorizationProgress: [
    {
      studentId: "user_001",
      planId: "plan_ikhlas_kursi",
      currentVerseIndex: 0,
      repetitionsDone: 0,
      totalRepetitions: 0,
      startedAt: "2024-02-20T07:35:00Z",
      updatedAt: "2024-02-20T07:35:00Z",
      lastRepetitionAt: null,
      completedAt: null,
      history: [],
    },
  ],
  memorizationCompletions: [],
  assignments: [],
  assignmentSubmissions: [],
}

assignmentSequence = database.assignments.length
classSequence = database.classes.length

const planCreationTracker = new Map<string, { date: string; count: number }>()
let planSequence = 0

const rolePrefixes: Record<UserRole, string> = {
  student: "user",
  teacher: "teacher",
  parent: "parent",
  admin: "admin",
}

function generateLearnerId(prefix: string): string {
  let counter = 1
  let candidate = `${prefix}_${counter.toString().padStart(3, "0")}`
  while (database.learners[candidate]) {
    counter += 1
    candidate = `${prefix}_${counter.toString().padStart(3, "0")}`
  }
  return candidate
}

function generateClassId(name: string): string {
  const normalized = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
  const base = normalized ? `class_${normalized}` : "class_cohort"

  let candidate = base
  if (database.classes.some((classRecord) => classRecord.id === candidate)) {
    let suffix = 1
    do {
      suffix += 1
      candidate = `${base}_${suffix}`
    } while (database.classes.some((classRecord) => classRecord.id === candidate))
  }

  classSequence += 1
  const sequenceSuffix = classSequence.toString().padStart(3, "0")
  if (!candidate.endsWith(sequenceSuffix)) {
    candidate = `${candidate}_${sequenceSuffix}`
  }

  return candidate
}

function generateAssignmentId(): string {
  assignmentSequence += 1
  return `assignment_${assignmentSequence.toString().padStart(3, "0")}`
}

function createEmptyDashboardRecord(
  studentId: string,
  plan: SubscriptionPlan,
  referenceDate: Date,
): StudentDashboardRecord {
  const referenceIso = iso(referenceDate)
  const seasonEnd = new Date(referenceDate.getTime() + 14 * 24 * 60 * 60 * 1000)

  return {
    studentId,
    dailyTarget: {
      targetAyahs: 5,
      completedAyahs: 0,
      lastUpdated: referenceIso,
    },
    recitationPercentage: 0,
    memorizationPercentage: 0,
    lastRead: {
      surah: "",
      ayah: 0,
      totalAyahs: 0,
    },
    preferredHabitId: undefined,
    activities: [],
    goals: [],
    achievements: [],
    leaderboard: [],
    teacherNotes: [],
    habitCompletion: {
      completed: 0,
      target: 0,
      weeklyChange: 0,
    },
    premiumBoost: {
      xpBonus: plan === "premium" ? 15 : 0,
      description:
        plan === "premium"
          ? "Premium boost ready to be activated."
          : "Upgrade to premium to unlock additional boosts.",
      isActive: false,
      availableSessions: 0,
    },
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
        endsOn: iso(seasonEnd),
      },
      energy: {
        current: 5,
        max: 5,
        refreshedAt: referenceIso,
      },
      streak: { current: 0, best: 0 },
      tasks: [],
      boosts: [],
      leaderboard: {
        rank: 0,
        nextReward: 0,
        classRank: 0,
      },
    },
    dailySurahLog: [],
  }
}

export interface CreateLearnerInput {
  id?: string
  name: string
  email: string
  role: UserRole
  locale?: string
  plan?: SubscriptionPlan
  joinedAt?: string
}

export function createLearnerAccount(input: CreateLearnerInput): LearnerState {
  const name = input.name.trim()
  if (!name) {
    throw new Error("Name is required to create a learner account")
  }

  const email = input.email.trim()
  if (!email) {
    throw new Error("Email is required to create a learner account")
  }

  const normalizedEmail = email.toLowerCase()
  if (getLearnerIdByEmail(normalizedEmail)) {
    throw new Error("An account with this email already exists")
  }

  const role = input.role
  if (!role) {
    throw new Error("A role is required to create a learner account")
  }

  let learnerId = input.id?.trim()
  if (learnerId) {
    if (database.learners[learnerId]) {
      throw new Error("A learner with this identifier already exists")
    }
  } else {
    const prefix = rolePrefixes[role] ?? "user"
    learnerId = generateLearnerId(prefix)
  }

  const now = new Date()
  const joinDateCandidate = input.joinedAt ? new Date(input.joinedAt) : null
  const joinDate = joinDateCandidate && !Number.isNaN(joinDateCandidate.getTime()) ? joinDateCandidate : now
  const plan = input.plan ?? "free"
  const locale = input.locale ?? "en-US"

  const record: LearnerRecord = {
    profile: {
      id: learnerId,
      name,
      email: normalizedEmail,
      role,
      locale,
      plan,
      joinedAt: iso(joinDate),
    },
    stats: {
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
    },
    habits: [],
    dashboard: createEmptyDashboardRecord(learnerId, plan, now),
    meta: {
      lastHabitActivityDate: null,
      completedGameTasks: [],
    },
  }

  database.learners[learnerId] = record

  if (role === "student") {
    const defaultClass = database.classes[0]
    if (defaultClass && !defaultClass.studentIds.includes(learnerId)) {
      defaultClass.studentIds.push(learnerId)
    }
    ensureProgressRecordsForStudent(learnerId)
  }

  return cloneLearnerState(record)
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
    recitationPercentage: 91,
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
    recitationTasks: [
      {
        id: "recite_task_001",
        surah: "Al-Mulk",
        ayahRange: "1-5",
        dueDate: iso(new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000)),
        status: "assigned",
        targetAccuracy: 90,
        teacherId: "teacher_001",
        notes: "Focus on elongation rules (madd) and keep a steady pace.",
        assignedAt: iso(new Date(now.getTime() - 24 * 60 * 60 * 1000)),
        focusAreas: ["Madd Tābi'ī", "Breath control"],
        verses: [
          {
            ayah: 1,
            arabic: "تَبَارَكَ الَّذِي بِيَدِهِ الْمُلْكُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ",
            translation: "Blessed is He in whose hand is dominion, and He is over all things competent.",
          },
          {
            ayah: 2,
            arabic: "الَّذِي خَلَقَ الْمَوْتَ وَالْحَيَاةَ لِيَبْلُوَكُمْ أَيُّكُمْ أَحْسَنُ عَمَلًا وَهُوَ الْعَزِيزُ الْغَفُورُ",
            translation:
              "He who created death and life to test you [as to] which of you is best in deed - and He is the Exalted in Might, the Forgiving.",
          },
          {
            ayah: 3,
            arabic: "الَّذِي خَلَقَ سَبْعَ سَمَاوَاتٍ طِبَاقًا مَا تَرَى فِي خَلْقِ الرَّحْمَٰنِ مِن تَفَاوُتٍ فَارْجِعِ الْبَصَرَ هَلْ تَرَى مِن فُطُورٍ",
            translation:
              "[And] who created seven heavens in layers. You do not see in the creation of the Most Merciful any inconsistency. So return your vision to the sky, do you see any breaks?",
          },
          {
            ayah: 4,
            arabic: "ثُمَّ ارْجِعِ الْبَصَرَ كَرَّتَيْنِ يَنقَلِبْ إِلَيْكَ الْبَصَرُ خَاسِئًا وَهُوَ حَسِيرٌ",
            translation:
              "Then return your vision twice again. Your vision will return to you humbled while it is fatigued.",
          },
          {
            ayah: 5,
            arabic: "وَلَقَدْ زَيَّنَّا السَّمَاءَ الدُّنْيَا بِمَصَابِيحَ وَجَعَلْنَاهَا رُجُومًا لِلشَّيَاطِينِ وَأَعْتَدْنَا لَهُمْ عَذَابَ السَّعِيرِ",
            translation:
              "And We have certainly beautified the nearest heaven with stars and have made [from] them what is thrown at the devils and have prepared for them the punishment of the Blaze.",
          },
        ],
      },
      {
        id: "recite_task_002",
        surah: "Al-Mulk",
        ayahRange: "6-11",
        dueDate: iso(new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000)),
        status: "submitted",
        targetAccuracy: 88,
        teacherId: "teacher_002",
        notes: "Revise the qalqalah letters and maintain consistent breathing.",
        assignedAt: iso(new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000)),
        focusAreas: ["Qalqalah Sughra", "Breath control"],
        verses: [
          {
            ayah: 6,
            arabic: "وَلِلَّذِينَ كَفَرُوا بِرَبِّهِمْ عَذَابُ جَهَنَّمَ ۖ وَبِئْسَ الْمَصِيرُ",
            translation: "And for those who disbelieved in their Lord is the punishment of Hell, and wretched is the destination.",
          },
          {
            ayah: 7,
            arabic: "إِذَا أُلْقُوا فِيهَا سَمِعُوا لَهَا شَهِيقًا وَهِيَ تَفُورُ",
            translation: "When they are thrown into it, they hear from it a [dreadful] inhaling while it boils up.",
          },
          {
            ayah: 8,
            arabic: "تَكَادُ تَمَيَّزُ مِنَ الْغَيْظِ ۖ كُلَّمَا أُلْقِيَ فِيهَا فَوْجٌ سَأَلَهُمْ خَزَنَتُهَا أَلَمْ يَأْتِكُمْ نَذِيرٌ",
            translation:
              "It almost bursts with rage. Every time a company is thrown into it, its keepers ask them, 'Did there not come to you a warner?'",
          },
          {
            ayah: 9,
            arabic: "قَالُوا بَلَىٰ قَدْ جَاءَنَا نَذِيرٌ فَكَذَّبْنَا وَقُلْنَا مَا نَزَّلَ اللَّهُ مِن شَيْءٍ إِنْ أَنتُمْ إِلَّا فِي ضَلَالٍ كَبِيرٍ",
            translation:
              "They will say, 'Yes, a warner had come to us, but we denied and said, 'Allah has not sent down anything. You are not but in great error.''",
          },
          {
            ayah: 10,
            arabic: "وَقَالُوا لَوْ كُنَّا نَسْمَعُ أَوْ نَعْقِلُ مَا كُنَّا فِي أَصْحَابِ السَّعِيرِ",
            translation:
              "And they will say, 'If only we had been listening or reasoning, we would not be among the companions of the Blaze.'",
          },
          {
            ayah: 11,
            arabic: "فَاعْتَرَفُوا بِذَنبِهِمْ فَسُحْقًا لِأَصْحَابِ السَّعِيرِ",
            translation: "And they will admit their sin, so [it is] alienation for the companions of the Blaze.",
          },
        ],
        lastScore: 86,
        submittedAt: iso(new Date(now.getTime() - 12 * 60 * 60 * 1000)),
      },
      {
        id: "recite_task_003",
        surah: "Al-Fatiha",
        ayahRange: "1-7",
        dueDate: iso(new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000)),
        status: "reviewed",
        targetAccuracy: 95,
        teacherId: "teacher_001",
        notes: "Excellent progress. Maintain articulation of the heavy letters.",
        assignedAt: iso(new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)),
        focusAreas: ["Tafkhīm of Ra", "Makharij clarity"],
        verses: [
          {
            ayah: 1,
            arabic: "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ",
            translation: "In the name of Allah, the Entirely Merciful, the Especially Merciful.",
          },
          {
            ayah: 2,
            arabic: "الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ",
            translation: "[All] praise is [due] to Allah, Lord of the worlds -",
          },
          {
            ayah: 3,
            arabic: "الرَّحْمَٰنِ الرَّحِيمِ",
            translation: "The Entirely Merciful, the Especially Merciful,",
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
            translation: "Guide us to the straight path",
          },
          {
            ayah: 7,
            arabic:
              "صِرَاطَ الَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ الْمَغْضُوبِ عَلَيْهِمْ وَلَا الضَّالِّينَ",
            translation:
              "The path of those upon whom You have bestowed favor, not of those who have evoked [Your] anger or of those who are astray.",
          },
        ],
        lastScore: 94,
        submittedAt: iso(new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000)),
        reviewedAt: iso(new Date(now.getTime() - 24 * 60 * 60 * 1000)),
        reviewNotes: "Reviewed live during class. Accuracy goal achieved.",
      },
    ],
    recitationSessions: [
      {
        id: "recitation_session_001",
        taskId: "recite_task_003",
        surah: "Al-Fatiha",
        ayahRange: "1-7",
        accuracy: 94,
        tajweedScore: 92,
        fluencyScore: 90,
        hasanatEarned: 245,
        durationSeconds: 95,
        transcript: "الحمد لله رب العالمين الرحمن الرحيم مالك يوم الدين إياك نعبد وإياك نستعين",
        expectedText:
          "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ الرَّحْمَٰنِ الرَّحِيمِ مَالِكِ يَوْمِ الدِّينِ إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ صِرَاطَ الَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ الْمَغْضُوبِ عَلَيْهِمْ وَلَا الضَّالِّينَ",
        submittedAt: iso(new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000)),
      },
      {
        id: "recitation_session_002",
        surah: "Al-Ikhlas",
        ayahRange: "1-4",
        accuracy: 88,
        tajweedScore: 85,
        fluencyScore: 82,
        hasanatEarned: 160,
        durationSeconds: 60,
        transcript: "قل هو الله أحد الله الصمد لم يلد ولم يولد ولم يكن له كفوا أحد",
        expectedText:
          "قُلْ هُوَ اللَّهُ أَحَدٌ اللَّهُ الصَّمَدُ لَمْ يَلِدْ وَلَمْ يُولَدْ وَلَمْ يَكُن لَّهُ كُفُوًا أَحَدٌ",
        submittedAt: iso(new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000)),
      },
    ],
    memorizationQueue: [
      {
        id: "mem_task_001",
        surah: "Al-Mulk",
        ayahRange: "1-5",
        status: "due",
        teacherId: "teacher_002",
        interval: 3,
        repetitions: 4,
        easeFactor: 2.4,
        memorizationConfidence: 0.78,
        lastReviewed: iso(new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000)),
        dueDate: iso(new Date(now.getTime() - 12 * 60 * 60 * 1000)),
        nextReview: iso(new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000)),
        notes: "Focus on the transition between ayah 3 and 4.",
        playlistId: "playlist_mulk",
        tags: ["madd", "qalqalah"],
        passages: [
          {
            ayah: 1,
            arabic: "تَبَارَكَ الَّذِي بِيَدِهِ الْمُلْكُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ",
            translation: "Blessed is He in whose hand is dominion, and He is over all things competent.",
          },
          {
            ayah: 2,
            arabic:
              "الَّذِي خَلَقَ الْمَوْتَ وَالْحَيَاةَ لِيَبْلُوَكُمْ أَيُّكُمْ أَحْسَنُ عَمَلًا وَهُوَ الْعَزِيزُ الْغَفُورُ",
            translation:
              "He who created death and life to test you [as to] which of you is best in deed - and He is the Exalted in Might, the Forgiving.",
          },
        ],
      },
      {
        id: "mem_task_002",
        surah: "Al-Mulk",
        ayahRange: "6-11",
        status: "learning",
        teacherId: "teacher_002",
        interval: 2,
        repetitions: 2,
        easeFactor: 2.2,
        memorizationConfidence: 0.64,
        lastReviewed: iso(new Date(now.getTime() - 24 * 60 * 60 * 1000)),
        dueDate: iso(new Date(now.getTime() + 6 * 60 * 60 * 1000)),
        nextReview: iso(new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)),
        notes: "Revisit tajweed of the qalqalah letters.",
        playlistId: "playlist_mulk",
        passages: [
          {
            ayah: 6,
            arabic: "وَلِلَّذِينَ كَفَرُوا بِرَبِّهِمْ عَذَابُ جَهَنَّمَ ۖ وَبِئْسَ الْمَصِيرُ",
            translation: "And for those who disbelieved in their Lord is the punishment of Hell, and wretched is the destination.",
          },
          {
            ayah: 7,
            arabic: "إِذَا أُلْقُوا فِيهَا سَمِعُوا لَهَا شَهِيقًا وَهِيَ تَفُورُ",
            translation: "When they are thrown into it, they hear from it a [dreadful] inhaling while it boils up.",
          },
        ],
      },
      {
        id: "mem_task_003",
        surah: "Al-Ikhlas",
        ayahRange: "1-4",
        status: "mastered",
        teacherId: "teacher_001",
        interval: 14,
        repetitions: 6,
        easeFactor: 2.6,
        memorizationConfidence: 0.94,
        lastReviewed: iso(new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000)),
        dueDate: iso(new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)),
        nextReview: iso(new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000)),
        notes: "Maintain current retention. Excellent flow.",
        tags: ["review"],
        passages: [
          {
            ayah: 1,
            arabic: "قُلْ هُوَ اللَّهُ أَحَدٌ",
            translation: "Say, He is Allah, [who is] One,",
          },
          {
            ayah: 2,
            arabic: "اللَّهُ الصَّمَدُ",
            translation: "Allah, the Eternal Refuge.",
          },
          {
            ayah: 3,
            arabic: "لَمْ يَلِدْ وَلَمْ يُولَدْ",
            translation: "He neither begets nor is born,",
          },
          {
            ayah: 4,
            arabic: "وَلَمْ يَكُن لَّهُ كُفُوًا أَحَدٌ",
            translation: "Nor is there to Him any equivalent.",
          },
        ],
      },
    ],
    memorizationPlaylists: [
      {
        id: "playlist_mulk",
        title: "Surah Al-Mulk Mastery",
        description: "Daily review loop for Surah Al-Mulk with focus on tajweed precision.",
        ayahCount: 30,
        progress: 48,
        dueCount: 2,
        lastReviewed: iso(new Date(now.getTime() - 12 * 60 * 60 * 1000)),
        focus: "Long vowels and qalqalah",
      },
      {
        id: "playlist_juz30",
        title: "Juz Amma Refresh",
        description: "Weekly consolidation set covering the final Juz.",
        ayahCount: 564,
        progress: 72,
        dueCount: 5,
        lastReviewed: iso(new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000)),
        focus: "Consistency and flow",
      },
    ],
    memorizationSummary: {
      dueToday: 3,
      newCount: 1,
      totalMastered: 18,
      streak: 5,
      recommendedDuration: 20,
      focusArea: "Prioritise Surah Al-Mulk verses 1-11",
      lastReviewedOn: iso(new Date(now.getTime() - 12 * 60 * 60 * 1000)),
      reviewHeatmap: Array.from({ length: 7 }).map((_, index) => {
        const date = new Date(now.getTime() - index * 24 * 60 * 60 * 1000)
        return {
          date: iso(date).slice(0, 10),
          completed: Math.max(0, 3 - index),
        }
      }),
    },
    tajweedFocus: [
      {
        id: "focus_madd",
        rule: "Madd Tābi'ī",
        focusArea: "Lengthening vowels in Surah Al-Mulk 1-5",
        status: "needs_support",
        teacherId: "teacher_001",
        lastReviewed: iso(new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000)),
        targetScore: 92,
        currentScore: 78,
        notes: "Sustain the elongation for two counts on every madd letter.",
        recommendedExercises: [
          "Chant ayah 1-3 slowly with a metronome to lock timing",
          "Listen to Shaykh Husary's recitation focusing on madd",
        ],
      },
      {
        id: "focus_qalqalah",
        rule: "Qalqalah Sughra",
        focusArea: "Bounce on qalqalah letters in Surah Al-Mulk 6-11",
        status: "improving",
        teacherId: "teacher_002",
        lastReviewed: iso(new Date(now.getTime() - 24 * 60 * 60 * 1000)),
        targetScore: 90,
        currentScore: 84,
        notes: "Great progress. Keep the echo crisp without over-extending the vowel.",
        recommendedExercises: [
          "Record ayah 8 and compare waveform to teacher sample",
          "Practice tongue release drills for qalqalah letters",
        ],
      },
      {
        id: "focus_tafkheem",
        rule: "Tafkhīm of Ra",
        focusArea: "Heavy articulation on ra' in Surah Al-Fatiha",
        status: "mastered",
        teacherId: "teacher_001",
        lastReviewed: iso(new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000)),
        targetScore: 95,
        currentScore: 96,
        notes: "Consistent tafkhīm. Maintain confidence and share with peers.",
        recommendedExercises: [
          "Lead a peer recitation circle focusing on tafkhīm",
          "Review teacher's annotated audio once per week",
        ],
      },
    ],
    gamePanel: {
      season: {
        name: "Season 3: Tajweed Trials",
        level: 5,
        xp: 180,
        xpToNext: 320,
        endsOn: iso(new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000)),
      },
      energy: {
        current: 4,
        max: 5,
        refreshedAt: iso(new Date(now.getTime() - 60 * 60 * 1000)),
      },
      streak: { current: 6, best: 14 },
      boosts: [
        {
          id: "boost_xp",
          name: "XP Surge",
          description: "Earn double XP on habit quests for the next 2 hours.",
          active: true,
          expiresAt: iso(new Date(now.getTime() + 2 * 60 * 60 * 1000)),
        },
        {
          id: "boost_focus",
          name: "Focus Shield",
          description: "Daily target forgiven if you miss up to 2 ayahs today.",
          active: false,
          expiresAt: iso(new Date(now.getTime() + 24 * 60 * 60 * 1000)),
        },
      ],
      leaderboard: { rank: 12, nextReward: 350, classRank: 12 },
      tasks: [
        {
          id: "game_task_daily_habit",
          title: "Daily Quest: Tajweed Drill",
          description: "Complete the Daily Recitation Quest to earn bonus XP.",
          type: "habit",
          status: "in_progress",
          progress: 0,
          target: 1,
          xpReward: 120,
          hasanatReward: 75,
          habitId: "daily-recitation",
          teacherId: "teacher_001",
          dueDate: iso(new Date(now.getTime() + 12 * 60 * 60 * 1000)),
          lastUpdated: iso(new Date(now.getTime() - 24 * 60 * 60 * 1000)),
        },
        {
          id: "game_task_recitation_boss",
          title: "Boss Battle: Submit Recitation",
          description: "Submit the Al-Mulk assignment with at least 90% accuracy.",
          type: "recitation",
          status: "in_progress",
          progress: 0,
          target: 1,
          xpReward: 150,
          hasanatReward: 90,
          recitationTaskId: "recite_task_002",
          teacherId: "teacher_002",
          dueDate: iso(new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000)),
          lastUpdated: iso(now),
        },
        {
          id: "game_task_memorization_sprint",
          title: "Memory Sprint",
          description: "Review two SM-2 cards from your memorization queue.",
          type: "memorization",
          status: "in_progress",
          progress: 1,
          target: 2,
          xpReward: 180,
          hasanatReward: 110,
          memorizationTaskId: "mem_task_001",
          teacherId: "teacher_002",
          dueDate: iso(new Date(now.getTime() + 24 * 60 * 60 * 1000)),
          lastUpdated: iso(new Date(now.getTime() - 12 * 60 * 60 * 1000)),
        },
        {
          id: "game_task_daily_target",
          title: "Streak Shield",
          description: "Reach today’s ayah target to protect your streak shield.",
          type: "daily_target",
          status: "in_progress",
          progress: 4,
          target: 10,
          xpReward: 80,
          hasanatReward: 50,
          teacherId: "teacher_001",
          dueDate: iso(new Date(now.getTime() + 12 * 60 * 60 * 1000)),
          lastUpdated: iso(now),
        },
      ],
    },
    dailySurahLog: [],
  },
  meta: {
    lastHabitActivityDate: yesterdayKey,
    completedGameTasks: [
      {
        id: "game_log_001",
        taskId: "game_task_archive_001",
        completedAt: iso(new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000)),
        xpAwarded: 150,
        hasanatAwarded: 90,
        teacherId: "teacher_002",
      },
    ],
    activeMemorizationPlanId: "plan_ikhlas_kursi",
  },
}

ensureProgressRecordsForStudent("user_001")

function cloneLearnerState(record: LearnerRecord): LearnerState {
  return {
    profile: { ...record.profile },
    stats: { ...record.stats, weeklyXP: [...record.stats.weeklyXP] },
    habits: record.habits.map((habit) => ({ ...habit, weeklyProgress: [...habit.weeklyProgress] })),
    dashboard: JSON.parse(JSON.stringify(record.dashboard)) as StudentDashboardRecord,
  }
}

function cloneAssignmentRecord(assignment: TeacherAssignmentRecord): TeacherAssignmentRecord {
  return {
    ...assignment,
    classIds: [...assignment.classIds],
    studentIds: [...assignment.studentIds],
    hotspots: assignment.hotspots.map((hotspot) => ({ ...hotspot })),
  }
}

function cloneAssignmentSubmission(submission: AssignmentSubmissionRecord): AssignmentSubmissionRecord {
  return { ...submission }
}

function listAssignmentSubmissions(assignmentId: string): AssignmentSubmissionRecord[] {
  return database.assignmentSubmissions
    .filter((submission) => submission.assignmentId === assignmentId)
    .map((submission) => cloneAssignmentSubmission(submission))
}

function buildAssignmentWithStats(assignment: TeacherAssignmentRecord): AssignmentWithStats {
  const submissions = listAssignmentSubmissions(assignment.id)
  const submitted = submissions.filter((entry) => entry.status !== "not_started").length
  const reviewed = submissions.filter((entry) => entry.status === "reviewed").length
  return {
    assignment: cloneAssignmentRecord(assignment),
    stats: {
      assignedStudents: assignment.studentIds.length,
      submitted,
      reviewed,
    },
    submissions,
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

function cloneProgressRecord(
  record: StudentMemorizationProgressRecord,
): StudentMemorizationProgressRecord {
  return JSON.parse(JSON.stringify(record)) as StudentMemorizationProgressRecord
}

function getClassIdsForStudent(studentId: string): string[] {
  return database.classes
    .filter((classRecord) => classRecord.studentIds.includes(studentId))
    .map((classRecord) => classRecord.id)
}

function getClassRecord(classId: string): ClassRecord | undefined {
  return database.classes.find((classRecord) => classRecord.id === classId)
}

const WEEKDAY_KEYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
]

function normalizeCheckInDays(days?: string[]): string[] {
  if (!days || days.length === 0) {
    return []
  }
  const normalized = days
    .map((day) => day.trim().toLowerCase())
    .filter((day) => WEEKDAY_KEYS.includes(day))
  return Array.from(new Set(normalized))
}

function buildDefaultCheckInDays(cadence: string): string[] {
  switch (cadence) {
    case "daily":
      return [...WEEKDAY_KEYS]
    case "weekday":
      return WEEKDAY_KEYS.slice(0, 5)
    case "weekend":
      return WEEKDAY_KEYS.slice(5)
    case "alternate":
      return ["monday", "wednesday", "friday"]
    default:
      return WEEKDAY_KEYS.slice(0, 5)
  }
}

function ensurePersonalMemorizationClass(studentId: string): ClassRecord {
  const classId = `self_memorization_${studentId}`
  let classRecord = getClassRecord(classId)
  if (!classRecord) {
    classRecord = {
      id: classId,
      name: "Personal Hifz Circle",
      description: "Self-paced memorization focus created by the learner",
      teacherId: studentId,
      schedule: "Self-paced",
      studentIds: [studentId],
    }
    database.classes.push(classRecord)
    return classRecord
  }
  if (!classRecord.studentIds.includes(studentId)) {
    classRecord.studentIds.push(studentId)
  }
  return classRecord
}

function findMemorizationPlan(planId: string): MemorizationPlanRecord | undefined {
  return database.memorizationPlans.find((plan) => plan.id === planId)
}

function findProgressRecord(
  studentId: string,
  planId: string,
): StudentMemorizationProgressRecord | undefined {
  return database.studentMemorizationProgress.find(
    (record) => record.studentId === studentId && record.planId === planId,
  )
}

function studentHasAccessToPlan(studentId: string, plan: MemorizationPlanRecord): boolean {
  const studentClassIds = new Set(getClassIdsForStudent(studentId))
  return plan.classIds.some((classId) => studentClassIds.has(classId))
}

function ensureProgressRecordForPlan(
  studentId: string,
  plan: MemorizationPlanRecord,
): StudentMemorizationProgressRecord {
  const existing = findProgressRecord(studentId, plan.id)
  if (existing) {
    return existing
  }

  const nowIso = iso(new Date())
  const record: StudentMemorizationProgressRecord = {
    studentId,
    planId: plan.id,
    currentVerseIndex: 0,
    repetitionsDone: 0,
    totalRepetitions: 0,
    startedAt: nowIso,
    updatedAt: nowIso,
    lastRepetitionAt: null,
    completedAt: null,
    history: [],
  }

  database.studentMemorizationProgress.push(record)
  return record
}

function ensureProgressRecordsForStudent(studentId: string) {
  const classIds = new Set(getClassIdsForStudent(studentId))
  database.memorizationPlans.forEach((plan) => {
    if (plan.classIds.some((classId) => classIds.has(classId))) {
      ensureProgressRecordForPlan(studentId, plan)
    }
  })
}

function generatePlanId(): string {
  planSequence += 1
  let candidate = `plan_${Date.now()}_${planSequence.toString().padStart(3, "0")}`
  while (database.memorizationPlans.some((plan) => plan.id === candidate)) {
    planSequence += 1
    candidate = `plan_${Date.now()}_${planSequence.toString().padStart(3, "0")}`
  }
  return candidate
}

function cloneTeacherClassSummary(classRecord: ClassRecord): TeacherClassSummary {
  return {
    id: classRecord.id,
    name: classRecord.name,
    description: classRecord.description,
    teacherId: classRecord.teacherId,
    schedule: classRecord.schedule,
    studentIds: [...classRecord.studentIds],
    studentCount: classRecord.studentIds.length,
  }
}

function getTeacherClassRecords(teacherId: string): ClassRecord[] {
  return database.classes.filter((classRecord) => classRecord.teacherId === teacherId)
}

export function getTeacherProfile(teacherId: string): TeacherProfile | undefined {
  const teacher = database.teachers.find((candidate) => candidate.id === teacherId)
  return teacher ? { ...teacher } : undefined
}

function getPlanStudentIds(plan: MemorizationPlanRecord): string[] {
  const studentIds = new Set<string>()
  plan.classIds.forEach((classId) => {
    const classRecord = getClassRecord(classId)
    classRecord?.studentIds.forEach((studentId) => studentIds.add(studentId))
  })
  return Array.from(studentIds)
}

function prunePlanProgressRecords(planId: string, allowedStudentIds: Set<string>) {
  database.studentMemorizationProgress = database.studentMemorizationProgress.filter((record) => {
    if (record.planId !== planId) {
      return true
    }
    return allowedStudentIds.has(record.studentId)
  })
}

function assertPlanCreationLimit(teacherId: string) {
  const todayKey = new Date().toISOString().slice(0, 10)
  const entry = planCreationTracker.get(teacherId)
  if (!entry || entry.date !== todayKey) {
    planCreationTracker.set(teacherId, { date: todayKey, count: 0 })
    return
  }
  if (entry.count >= PLAN_CREATION_DAILY_LIMIT) {
    throw new Error("Daily plan creation limit reached")
  }
}

function recordPlanCreation(teacherId: string) {
  const todayKey = new Date().toISOString().slice(0, 10)
  const entry = planCreationTracker.get(teacherId)
  if (!entry || entry.date !== todayKey) {
    planCreationTracker.set(teacherId, { date: todayKey, count: 1 })
    return
  }
  entry.count += 1
}

function clonePlan(plan: MemorizationPlanRecord): MemorizationPlanRecord {
  return {
    ...plan,
    verseKeys: [...plan.verseKeys],
    classIds: [...plan.classIds],
    personalPlanSettings: plan.personalPlanSettings
      ? { ...plan.personalPlanSettings, checkInDays: [...plan.personalPlanSettings.checkInDays] }
      : undefined,
  }
}

function buildTeacherClassSummaries(classIds: string[]): TeacherClassSummary[] {
  return classIds
    .map((classId) => getClassRecord(classId))
    .filter((classRecord): classRecord is ClassRecord => Boolean(classRecord))
    .map((classRecord) => cloneTeacherClassSummary(classRecord))
}

function computePlanStats(plan: MemorizationPlanRecord): TeacherMemorizationPlanStats {
  const studentIds = getPlanStudentIds(plan)
  let completed = 0
  let inProgress = 0
  studentIds.forEach((studentId) => {
    const progress = findProgressRecord(studentId, plan.id)
    if (!progress) {
      return
    }
    if (progress.completedAt) {
      completed += 1
      return
    }
    if (progress.repetitionsDone > 0 || progress.currentVerseIndex > 0) {
      inProgress += 1
    }
  })
  const assigned = studentIds.length
  const notStarted = Math.max(0, assigned - completed - inProgress)
  return {
    verseCount: plan.verseKeys.length,
    assignedStudents: assigned,
    completedStudents: completed,
    inProgressStudents: inProgress,
    notStartedStudents: notStarted,
  }
}

function buildPlanSummary(plan: MemorizationPlanRecord): TeacherMemorizationPlanSummary {
  return {
    plan: clonePlan(plan),
    classes: buildTeacherClassSummaries(plan.classIds),
    stats: computePlanStats(plan),
  }
}

function assertTeacherOwnsClasses(teacherId: string, classIds: string[]) {
  const unauthorized = classIds.filter((classId) => {
    const classRecord = getClassRecord(classId)
    return !classRecord || classRecord.teacherId !== teacherId
  })
  if (unauthorized.length > 0) {
    throw new Error("You can only assign plans to your own classes")
  }
}

function logMemorizationCompletion(
  studentId: string,
  plan: MemorizationPlanRecord,
  progress: StudentMemorizationProgressRecord,
) {
  const entry: MemorizationCompletionLogEntry = {
    id: `mem_completion_${Date.now()}`,
    planId: plan.id,
    studentId,
    completedAt: progress.completedAt ?? iso(new Date()),
    verseCount: plan.verseKeys.length,
    totalRepetitions: progress.totalRepetitions,
  }

  database.memorizationCompletions.unshift(entry)
  if (database.memorizationCompletions.length > MAX_MEMORIZATION_COMPLETIONS) {
    database.memorizationCompletions.length = MAX_MEMORIZATION_COMPLETIONS
  }
}

function touchStudentMemorizationSummary(
  studentId: string,
  plan: MemorizationPlanRecord,
  verseKey: string,
) {
  const record = getLearnerRecord(studentId)
  if (!record) return
  const nowIso = iso(new Date())
  record.dashboard.memorizationSummary.lastReviewedOn = nowIso
  record.dashboard.memorizationSummary.focusArea = `${plan.title} • ${verseKey}`
}

function clampHabitCompletion(record: LearnerRecord) {
  const completion = record.dashboard.habitCompletion
  completion.completed = Math.min(completion.completed, completion.target)
}

type GamificationEvent =
  | { type: "habit"; habitId: string }
  | { type: "recitation"; recitationTaskId?: string; accuracy?: number }
  | { type: "memorization"; memorizationTaskId: string; accuracy?: number }
  | { type: "daily_target"; completedAyahs: number; targetAyahs: number }

function matchesGamificationTask(task: GamificationTaskRecord, event: GamificationEvent) {
  if (task.status === "locked" || task.type !== event.type) {
    return false
  }

  switch (event.type) {
    case "habit":
      return !task.habitId || task.habitId === event.habitId
    case "recitation":
      if (task.recitationTaskId && task.recitationTaskId !== event.recitationTaskId) {
        return false
      }
      return typeof event.accuracy !== "number" || event.accuracy >= 85
    case "memorization":
      if (task.memorizationTaskId && task.memorizationTaskId !== event.memorizationTaskId) {
        return false
      }
      return typeof event.accuracy !== "number" || event.accuracy >= 75
    case "daily_target":
      return true
    default:
      return false
  }
}

function awardGamificationRewards(
  record: LearnerRecord,
  xpAwarded: number,
  hasanatAwarded: number,
  streakIncrement: number,
  nowDate: Date,
) {
  if (!record.dashboard.gamePanel) {
    return
  }

  const panel = record.dashboard.gamePanel

  if (hasanatAwarded > 0) {
    record.stats.hasanat += hasanatAwarded
  }

  if (xpAwarded > 0) {
    applyLevelProgression(record.stats, xpAwarded)
    record.stats.weeklyXP[nowDate.getDay()] = Math.min(
      LEVEL_XP_STEP,
      record.stats.weeklyXP[nowDate.getDay()] + xpAwarded,
    )

    panel.season.xp += xpAwarded
    let nextThreshold = panel.season.xpToNext || GAME_BASE_LEVEL_STEP
    while (panel.season.xp >= nextThreshold) {
      panel.season.xp -= nextThreshold
      panel.season.level += 1
      nextThreshold = Math.max(GAME_BASE_LEVEL_STEP, Math.round(nextThreshold * GAME_LEVEL_MULTIPLIER))
    }
    panel.season.xpToNext = Math.max(GAME_BASE_LEVEL_STEP, nextThreshold)

    panel.leaderboard.nextReward = Math.max(0, panel.leaderboard.nextReward - xpAwarded)

    if (panel.energy.current > 0) {
      panel.energy.current = Math.max(0, panel.energy.current - 1)
      panel.energy.refreshedAt = iso(nowDate)
    }
  }

  if (streakIncrement > 0) {
    panel.streak.current += streakIncrement
    panel.streak.best = Math.max(panel.streak.best, panel.streak.current)
  }
}

function applyGamificationEvent(record: LearnerRecord, event: GamificationEvent) {
  const panel = record.dashboard.gamePanel
  if (!panel) {
    return
  }

  const nowDate = new Date()
  let totalXp = 0
  let totalHasanat = 0
  let streakGain = 0

  for (const task of panel.tasks) {
    if (task.status === "completed") {
      continue
    }

    if (task.type === "daily_target" && event.type === "daily_target") {
      const previousProgress = task.progress
      const newProgress = Math.min(task.target, event.completedAyahs)
      if (newProgress !== previousProgress) {
        task.progress = newProgress
        task.lastUpdated = iso(nowDate)
      }
      if (newProgress >= task.target && task.status !== "completed") {
        task.status = "completed"
        totalXp += task.xpReward
        totalHasanat += task.hasanatReward
        streakGain += 1
        record.meta.completedGameTasks.unshift({
          id: `game_log_${nowDate.getTime()}_${task.id}`,
          taskId: task.id,
          completedAt: iso(nowDate),
          xpAwarded: task.xpReward,
          hasanatAwarded: task.hasanatReward,
          teacherId: task.teacherId,
        })
      } else if (task.status !== "completed" && newProgress > previousProgress) {
        task.status = "in_progress"
      }
      continue
    }

    if (!matchesGamificationTask(task, event)) {
      continue
    }

    const previousProgress = task.progress
    task.progress = Math.min(task.target, task.progress + 1)
    task.lastUpdated = iso(nowDate)

    if (task.progress >= task.target) {
      task.status = "completed"
      totalXp += task.xpReward
      totalHasanat += task.hasanatReward
      streakGain += 1
      record.meta.completedGameTasks.unshift({
        id: `game_log_${nowDate.getTime()}_${task.id}`,
        taskId: task.id,
        completedAt: iso(nowDate),
        xpAwarded: task.xpReward,
        hasanatAwarded: task.hasanatReward,
        teacherId: task.teacherId,
      })
    } else if (task.progress > previousProgress) {
      task.status = "in_progress"
    }
  }

  if (record.meta.completedGameTasks.length > MAX_GAMIFICATION_LOG) {
    record.meta.completedGameTasks = record.meta.completedGameTasks.slice(0, MAX_GAMIFICATION_LOG)
  }

  if (totalXp > 0 || totalHasanat > 0 || streakGain > 0) {
    awardGamificationRewards(record, totalXp, totalHasanat, streakGain, nowDate)
  }
}

function parseAyahCount(range: string) {
  const normalized = range.replace(/\s/g, "")
  if (!normalized) return 0
  const [startPart, endPart] = normalized.split("-")
  const start = Number.parseInt(startPart, 10)
  if (!Number.isFinite(start)) {
    return 0
  }
  if (!endPart) {
    return 1
  }
  const end = Number.parseInt(endPart, 10)
  if (!Number.isFinite(end)) {
    return 1
  }
  return Math.max(1, end - start + 1)
}

function parseAyahRangeInput(range: string): { start: number; end: number } {
  const normalized = range.replace(/\s/g, "")
  if (!normalized) {
    throw new Error("Ayah range is required")
  }
  const [startPart, endPart] = normalized.split("-")
  const start = Number.parseInt(startPart ?? "", 10)
  if (!Number.isFinite(start) || start < 1) {
    throw new Error("Invalid ayah range")
  }
  const end = endPart ? Number.parseInt(endPart, 10) : start
  if (!Number.isFinite(end) || end < 1) {
    throw new Error("Invalid ayah range")
  }
  const normalizedStart = Math.min(start, end)
  const normalizedEnd = Math.max(start, end)
  return { start: normalizedStart, end: normalizedEnd }
}

function recalculateRecitationAccuracy(record: LearnerRecord) {
  const sessions = record.dashboard.recitationSessions.slice(0, 10)
  if (sessions.length === 0) {
    record.dashboard.recitationPercentage = 0
    return
  }
  const total = sessions.reduce((sum, session) => sum + session.accuracy, 0)
  record.dashboard.recitationPercentage = Math.round(total / sessions.length)
}

function recalculateMemorizationSummary(record: LearnerRecord) {
  const queue = record.dashboard.memorizationQueue
  const summary = record.dashboard.memorizationSummary
  const today = new Date()
  const todayKey = today.toISOString().slice(0, 10)

  const dueToday = queue.filter((task) => {
    const dueDate = new Date(task.dueDate)
    return dueDate.setHours(0, 0, 0, 0) <= today.setHours(0, 0, 0, 0)
  }).length

  const newCount = queue.filter((task) => task.status === "new" || task.repetitions === 0).length
  const totalMastered = queue.filter((task) => task.status === "mastered").length

  summary.dueToday = dueToday
  summary.newCount = newCount
  summary.totalMastered = totalMastered
  summary.recommendedDuration = queue.length === 0 ? 0 : Math.min(45, Math.max(10, dueToday * 5))

  if (!summary.focusArea) {
    const focusTask = queue.find((task) => task.status === "due") ?? queue[0]
    summary.focusArea = focusTask ? `${focusTask.surah} • Ayah ${focusTask.ayahRange}` : ""
  }

  const existing = summary.reviewHeatmap.find((entry) => entry.date === todayKey)
  if (!existing) {
    summary.reviewHeatmap.unshift({ date: todayKey, completed: 0 })
  }
  summary.reviewHeatmap = summary.reviewHeatmap
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .slice(0, MAX_MEMORIZATION_HEATMAP)

  const averageConfidence =
    queue.length === 0
      ? 0
      : queue.reduce((total, task) => total + task.memorizationConfidence, 0) / queue.length
  record.dashboard.memorizationPercentage = Math.round(Math.max(0, Math.min(1, averageConfidence)) * 100)
}

export function getMemorizationClasses(): ClassRecord[] {
  return database.classes.map((classRecord) => ({
    ...classRecord,
    studentIds: [...classRecord.studentIds],
  }))
}

export function listLearners(options?: { role?: UserRole }): LearnerDirectoryEntry[] {
  const entries = Object.values(database.learners).map((record) => ({
    id: record.profile.id,
    name: record.profile.name,
    email: record.profile.email,
    role: record.profile.role,
  }))

  const filtered = options?.role ? entries.filter((entry) => entry.role === options.role) : entries

  return filtered.sort((a, b) => a.name.localeCompare(b.name))
}

export function getAdminClassSummaries(): AdminClassSummary[] {
  return database.classes.map((classRecord) => {
    const classSummary = cloneTeacherClassSummary(classRecord)
    const teacherProfile = getTeacherProfile(classRecord.teacherId) ?? {
      id: classRecord.teacherId,
      name: "Unassigned Instructor",
      email: "",
      role: "assistant",
      specialization: "Memorization",
    }

    const students: AdminClassStudentSummary[] = classRecord.studentIds
      .map((studentId) => getLearnerRecord(studentId))
      .filter((record): record is LearnerRecord => Boolean(record))
      .map((record) => ({
        id: record.profile.id,
        name: record.profile.name,
        email: record.profile.email,
        streak: record.stats.streak,
        memorizationProgress: record.dashboard.memorizationPercentage,
        recitationProgress: record.dashboard.recitationPercentage,
      }))
      .sort((a, b) => a.name.localeCompare(b.name))

    return {
      class: classSummary,
      teacher: teacherProfile,
      students,
    }
  })
}

export function createMemorizationClass(
  input: CreateMemorizationClassInput,
): AdminClassSummary {
  const name = input.name.trim()
  if (!name) {
    throw new Error("Class name is required")
  }

  const teacher = getTeacherProfile(input.teacherId)
  if (!teacher) {
    throw new Error("Assigned teacher not found")
  }

  const description = input.description?.trim() || undefined
  const schedule = input.schedule?.trim() || undefined

  const providedStudentIds = Array.isArray(input.studentIds) ? input.studentIds : []
  const normalizedStudentIds = Array.from(
    new Set(providedStudentIds.map((studentId) => studentId.trim()).filter(Boolean)),
  )

  const studentRecords: LearnerRecord[] = []

  normalizedStudentIds.forEach((studentId) => {
    const learner = getLearnerRecord(studentId)
    if (!learner) {
      throw new Error(`Learner ${studentId} was not found`)
    }
    if (learner.profile.role !== "student") {
      throw new Error(`Only students can be enrolled in a class (${learner.profile.name})`)
    }
    studentRecords.push(learner)
  })

  const classId = generateClassId(name)

  const classRecord: ClassRecord = {
    id: classId,
    name,
    description,
    teacherId: teacher.id,
    schedule,
    studentIds: studentRecords.map((record) => record.profile.id),
  }

  database.classes.push(classRecord)

  const classSummary = cloneTeacherClassSummary(classRecord)

  const students: AdminClassStudentSummary[] = studentRecords.map((record) => ({
    id: record.profile.id,
    name: record.profile.name,
    email: record.profile.email,
    streak: record.stats.streak,
    memorizationProgress: record.dashboard.memorizationPercentage,
    recitationProgress: record.dashboard.recitationPercentage,
  }))

  return {
    class: classSummary,
    teacher,
    students: students.sort((a, b) => a.name.localeCompare(b.name)),
  }
}

export function listClassesForTeacher(teacherId: string): TeacherClassSummary[] {
  return getTeacherClassRecords(teacherId).map((classRecord) => cloneTeacherClassSummary(classRecord))
}

export function listStudentsForTeacher(teacherId: string): TeacherStudentSummary[] {
  const classes = getTeacherClassRecords(teacherId)
  const classMap = new Map(classes.map((classRecord) => [classRecord.id, classRecord]))

  const studentsById = new Map<string, Set<string>>()
  classes.forEach((classRecord) => {
    classRecord.studentIds.forEach((studentId) => {
      if (!studentsById.has(studentId)) {
        studentsById.set(studentId, new Set())
      }
      studentsById.get(studentId)?.add(classRecord.id)
    })
  })

  const summaries: TeacherStudentSummary[] = []

  studentsById.forEach((classIds, studentId) => {
    const learner = getLearnerRecord(studentId)
    if (!learner) {
      return
    }

    const sortedClassIds = Array.from(classIds)
    sortedClassIds.sort((a, b) => {
      const aName = classMap.get(a)?.name ?? ""
      const bName = classMap.get(b)?.name ?? ""
      return aName.localeCompare(bName)
    })

    const lastActivity = learner.dashboard.activities[0]?.timestamp ?? null

    summaries.push({
      id: learner.profile.id,
      name: learner.profile.name,
      email: learner.profile.email,
      classIds: sortedClassIds,
      classNames: sortedClassIds.map((classId) => classMap.get(classId)?.name ?? classId),
      streak: learner.stats.streak,
      hasanat: learner.stats.hasanat,
      memorizationProgress: learner.dashboard.memorizationPercentage,
      recitationProgress: learner.dashboard.recitationPercentage,
      lastActiveAt: lastActivity,
    })
  })

  summaries.sort((a, b) => a.name.localeCompare(b.name))
  return summaries
}

export function listTeacherRecitationTasks(teacherId: string): TeacherRecitationTaskSummary[] {
  const classes = getTeacherClassRecords(teacherId)
  const classMap = new Map(classes.map((classRecord) => [classRecord.id, classRecord]))
  const classIdsByStudent = new Map<string, Set<string>>()

  classes.forEach((classRecord) => {
    classRecord.studentIds.forEach((studentId) => {
      if (!classIdsByStudent.has(studentId)) {
        classIdsByStudent.set(studentId, new Set())
      }
      classIdsByStudent.get(studentId)?.add(classRecord.id)
    })
  })

  const tasks: TeacherRecitationTaskSummary[] = []

  Object.values(database.learners).forEach((learner) => {
    const relevantTasks = learner.dashboard.recitationTasks.filter((task) => task.teacherId === teacherId)
    if (relevantTasks.length === 0) {
      return
    }

    const classNames = Array.from(classIdsByStudent.get(learner.profile.id) ?? new Set<string>()).map(
      (classId) => classMap.get(classId)?.name ?? classId,
    )

    relevantTasks.forEach((task) => {
      tasks.push({
        id: task.id,
        studentId: learner.profile.id,
        studentName: learner.profile.name,
        studentEmail: learner.profile.email,
        classNames,
        surah: task.surah,
        ayahRange: task.ayahRange,
        dueDate: task.dueDate,
        status: task.status,
        submittedAt: task.submittedAt,
        reviewedAt: task.reviewedAt,
        lastScore: task.lastScore,
        assignmentId: task.assignmentId,
        notes: task.notes,
      })
    })
  })

  tasks.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
  return tasks
}

export function listTeacherMemorizationPlans(
  teacherId: string,
): TeacherMemorizationPlanSummary[] {
  return database.memorizationPlans
    .filter((plan) => plan.teacherId === teacherId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .map((plan) => buildPlanSummary(plan))
}

export function createTeacherMemorizationPlan(
  teacherId: string,
  input: CreateTeacherPlanInput,
): TeacherMemorizationPlanSummary {
  const title = input.title.trim()
  if (!title) {
    throw new Error("Plan title is required")
  }

  const classIds = Array.from(new Set(input.classIds.map((classId) => classId.trim()).filter(Boolean)))
  if (classIds.length === 0) {
    throw new Error("Select at least one class for this plan")
  }

  const normalizedKeys = input.verseKeys.map((key) => normalizeVerseKey(key))
  const validation = validateVerseKeys(normalizedKeys)
  if (validation.validKeys.length === 0) {
    throw new Error("Please choose at least one valid verse")
  }
  if (validation.issues.length > 0) {
    const invalidList = validation.issues.map((issue) => issue.key).join(", ")
    throw new Error(`Invalid verse references: ${invalidList}`)
  }

  assertPlanCreationLimit(teacherId)
  assertTeacherOwnsClasses(teacherId, classIds)

  const plan: MemorizationPlanRecord = {
    id: generatePlanId(),
    title,
    verseKeys: [...validation.validKeys],
    teacherId,
    classIds,
    createdAt: new Date().toISOString(),
    notes: input.notes ? (input.notes.trim() || undefined) : undefined,
  }

  database.memorizationPlans.unshift(plan)

  const studentIds = getPlanStudentIds(plan)
  studentIds.forEach((studentId) => {
    ensureProgressRecordForPlan(studentId, plan)
  })

  recordPlanCreation(teacherId)
  return buildPlanSummary(plan)
}

export function createPersonalMemorizationPlan(
  studentId: string,
  input: CreatePersonalMemorizationPlanInput,
): StudentMemorizationPlanContext {
  const learner = getLearnerRecord(studentId)
  if (!learner) {
    throw new Error("Learner not found")
  }

  const title = input.title.trim()
  if (!title) {
    throw new Error("Plan title is required")
  }

  const cadence = input.cadence.trim().toLowerCase()
  if (!cadence) {
    throw new Error("Select a memorization cadence")
  }

  const normalizedKeys = input.verseKeys.map((key) => normalizeVerseKey(key))
  const validation = validateVerseKeys(normalizedKeys)
  if (validation.validKeys.length === 0) {
    throw new Error("Please choose at least one valid verse")
  }
  if (validation.issues.length > 0) {
    const invalidList = validation.issues.map((issue) => issue.key).join(", ")
    throw new Error(`Invalid verse references: ${invalidList}`)
  }

  assertPlanCreationLimit(studentId)

  const classRecord = ensurePersonalMemorizationClass(studentId)
  const nowIso = iso(new Date())
  const checkInDays = normalizeCheckInDays(input.checkInDays)
  const personalPlanSettings: PersonalPlanSettings = {
    intention: input.intention?.trim() || undefined,
    habitCue: input.habitCue?.trim() || undefined,
    cadence,
    reminderTime: input.reminderTime?.trim() || undefined,
    checkInDays: checkInDays.length > 0 ? checkInDays : buildDefaultCheckInDays(cadence),
    startDate: (() => {
      if (!input.startDate) return nowIso
      const date = new Date(input.startDate)
      return Number.isNaN(date.getTime()) ? nowIso : iso(date)
    })(),
  }

  const plan: MemorizationPlanRecord = {
    id: generatePlanId(),
    title,
    verseKeys: [...validation.validKeys],
    teacherId: studentId,
    classIds: [classRecord.id],
    createdAt: nowIso,
    notes: input.notes ? input.notes.trim() || undefined : undefined,
    createdByStudentId: studentId,
    personalPlanSettings,
  }

  if (!classRecord.studentIds.includes(studentId)) {
    classRecord.studentIds.push(studentId)
  }

  database.memorizationPlans.unshift(plan)

  const progress = ensureProgressRecordForPlan(studentId, plan)
  learner.meta.activeMemorizationPlanId = plan.id

  recordPlanCreation(studentId)

  return {
    plan: clonePlan(plan),
    progress: cloneProgressRecord(progress),
    classes: [cloneTeacherClassSummary(classRecord)],
    teacher: undefined,
    isActive: true,
  }
}

export function updateTeacherMemorizationPlan(
  teacherId: string,
  planId: string,
  updates: UpdateTeacherPlanInput,
): TeacherMemorizationPlanSummary {
  const plan = findMemorizationPlan(planId)
  if (!plan) {
    throw new Error("Memorization plan not found")
  }
  if (plan.teacherId !== teacherId) {
    throw new Error("You do not have permission to modify this plan")
  }

  if (updates.title !== undefined) {
    const nextTitle = updates.title.trim()
    if (!nextTitle) {
      throw new Error("Plan title is required")
    }
    plan.title = nextTitle
  }

  if (updates.notes !== undefined) {
    const trimmed = updates.notes.trim()
    plan.notes = trimmed ? trimmed : undefined
  }

  let verseKeysChanged = false
  if (updates.verseKeys) {
    const normalizedKeys = updates.verseKeys.map((key) => normalizeVerseKey(key))
    const validation = validateVerseKeys(normalizedKeys)
    if (validation.validKeys.length === 0) {
      throw new Error("Please choose at least one valid verse")
    }
    if (validation.issues.length > 0) {
      const invalidList = validation.issues.map((issue) => issue.key).join(", ")
      throw new Error(`Invalid verse references: ${invalidList}`)
    }
    plan.verseKeys = [...validation.validKeys]
    verseKeysChanged = true
  }

  if (updates.classIds) {
    const classIds = Array.from(new Set(updates.classIds.map((id) => id.trim()).filter(Boolean)))
    assertTeacherOwnsClasses(teacherId, classIds)
    plan.classIds = classIds
  }

  const assignedStudents = getPlanStudentIds(plan)
  const allowedStudents = new Set(assignedStudents)

  assignedStudents.forEach((studentId) => {
    const progress = ensureProgressRecordForPlan(studentId, plan)
    if (verseKeysChanged) {
      const maxIndex = Math.max(plan.verseKeys.length - 1, 0)
      progress.currentVerseIndex = Math.min(progress.currentVerseIndex, maxIndex)
      progress.repetitionsDone = 0
      progress.completedAt = null
      progress.lastRepetitionAt = null
      progress.updatedAt = iso(new Date())
    }
  })

  prunePlanProgressRecords(plan.id, allowedStudents)

  return buildPlanSummary(plan)
}

export function deleteTeacherMemorizationPlan(teacherId: string, planId: string): boolean {
  const index = database.memorizationPlans.findIndex((plan) => plan.id === planId)
  if (index === -1) {
    return false
  }
  const plan = database.memorizationPlans[index]
  if (plan.teacherId !== teacherId) {
    throw new Error("You do not have permission to delete this plan")
  }

  database.memorizationPlans.splice(index, 1)
  database.studentMemorizationProgress = database.studentMemorizationProgress.filter(
    (record) => record.planId !== planId,
  )
  database.memorizationCompletions = database.memorizationCompletions.filter(
    (entry) => entry.planId !== planId,
  )

  return true
}

export function getTeacherPlanProgress(
  teacherId: string,
  planId: string,
): TeacherPlanProgress | undefined {
  const plan = findMemorizationPlan(planId)
  if (!plan || plan.teacherId !== teacherId) {
    return undefined
  }

  const classSummaries: TeacherPlanProgressClassSummary[] = buildTeacherClassSummaries(plan.classIds).map(
    (classRecord) => ({
      id: classRecord.id,
      name: classRecord.name,
      studentCount: classRecord.studentIds.length,
      completed: 0,
      inProgress: 0,
      notStarted: 0,
    }),
  )
  const classSummaryMap = new Map(classSummaries.map((summary) => [summary.id, summary]))

  const students: TeacherPlanProgressStudent[] = []
  const studentIds = getPlanStudentIds(plan)

  studentIds.forEach((studentId) => {
    const progress = ensureProgressRecordForPlan(studentId, plan)
    const learner = getLearnerRecord(studentId)
    const classRecord = plan.classIds
      .map((classId) => getClassRecord(classId))
      .find((entry) => entry?.studentIds.includes(studentId))

    const primarySummary = classRecord ? classSummaryMap.get(classRecord.id) : undefined

    let status: TeacherPlanProgressStudent["status"] = "not_started"
    const summary = primarySummary ?? (classRecord ? undefined : classSummaryMap.get(plan.classIds[0] ?? ""))

    if (progress.completedAt) {
      status = "completed"
      summary && (summary.completed += 1)
    } else if (progress.repetitionsDone > 0 || progress.currentVerseIndex > 0 || progress.totalRepetitions > 0) {
      status = "in_progress"
      summary && (summary.inProgress += 1)
    } else {
      summary && (summary.notStarted += 1)
    }

    const studentName = learner?.profile.name ?? "Student"
    const classId = classRecord?.id ?? (plan.classIds[0] ?? "")
    const className = classRecord?.name ?? (classId ? getClassRecord(classId)?.name ?? "Class" : "Class")

    students.push({
      studentId,
      studentName,
      status,
      classId,
      className,
      repetitionsDone: progress.repetitionsDone,
      totalRepetitions: progress.totalRepetitions,
      currentVerseIndex: progress.currentVerseIndex,
      verseCount: plan.verseKeys.length,
      lastActivity: progress.updatedAt,
    })
  })

  // Ensure counts for classes with no students default to zero
  classSummaries.forEach((summary) => {
    if (summary.completed + summary.inProgress + summary.notStarted === 0) {
      summary.notStarted = summary.studentCount
    }
  })

  return {
    plan: clonePlan(plan),
    classes: classSummaries,
    students,
  }
}

export function suggestMemorizationPlans(teacherId: string): SuggestedMemorizationPlan[] {
  const classes = listClassesForTeacher(teacherId)
  const suggestions: SuggestedMemorizationPlan[] = []

  const hasBeginnerClass = classes.some((classRecord) => /beginner|foundation|starter/i.test(classRecord.name))
  if (hasBeginnerClass) {
    suggestions.push({
      id: "suggest_juz_amma_starter",
      title: "Juz' Amma Starter Pack",
      verseKeys: [
        ...expandVerseRange(114, 1, 6),
        ...expandVerseRange(113, 1, 5),
        ...expandVerseRange(112, 1, 4),
      ],
      reason: "Gentle heart-softening verses for new hifz journeys.",
    })
  }

  const hasEveningOrCircle = classes.some((classRecord) => /evening|circle|advanced/i.test(classRecord.name))
  if (hasEveningOrCircle) {
    suggestions.push({
      id: "suggest_light_upon_light",
      title: "Light Upon Light Reflection",
      verseKeys: [...expandVerseRange(24, 35, 36), ...expandVerseRange(59, 22, 24)],
      reason: "Ayat that deepen contemplation for committed circles.",
    })
  }

  const hasYoungLearners = classes.some((classRecord) => /youth|junior|kids/i.test(classRecord.name))
  if (hasYoungLearners) {
    suggestions.push({
      id: "suggest_morning_fortress",
      title: "Morning Fortress Routine",
      verseKeys: [...expandVerseRange(2, 255, 255), ...expandVerseRange(18, 1, 10)],
      reason: "Core adhkar verses to anchor mornings in barakah.",
    })
  }

  if (suggestions.length === 0) {
    suggestions.push({
      id: "suggest_refresher_core",
      title: "Heart Refresher Essentials",
      verseKeys: [...expandVerseRange(36, 1, 12), ...expandVerseRange(94, 1, 8)],
      reason: "A balanced set to revisit sincerity and sabr.",
    })
  }

  return suggestions
}

function resolveAssignmentStudents(
  teacherId: string,
  classIds: string[],
  studentIds: string[],
): { classIds: string[]; studentIds: string[] } {
  const normalizedClasses = Array.from(new Set(classIds.map((id) => id.trim()).filter(Boolean)))
  if (normalizedClasses.length > 0) {
    assertTeacherOwnsClasses(teacherId, normalizedClasses)
  }

  const resolvedStudents = new Set<string>()
  normalizedClasses.forEach((classId) => {
    const classRecord = getClassRecord(classId)
    classRecord?.studentIds.forEach((studentId) => resolvedStudents.add(studentId))
  })

  const normalizedStudents = Array.from(new Set(studentIds.map((id) => id.trim()).filter(Boolean)))
  normalizedStudents.forEach((studentId) => {
    if (database.learners[studentId]) {
      resolvedStudents.add(studentId)
    }
  })

  return { classIds: normalizedClasses, studentIds: Array.from(resolvedStudents) }
}

export function createTeacherAssignment(
  teacherId: string,
  input: CreateTeacherAssignmentInput,
): AssignmentWithStats {
  const title = input.title.trim()
  if (!title) {
    throw new Error("Assignment title is required")
  }

  if (!Number.isFinite(input.surahNumber) || input.surahNumber < 1) {
    throw new Error("Please choose a valid surah")
  }

  const dueDate = new Date(input.dueAt)
  if (Number.isNaN(dueDate.getTime())) {
    throw new Error("A valid due date is required")
  }

  const status: AssignmentStatus = input.status ?? "draft"
  const { start, end } = parseAyahRangeInput(input.ayahRange)
  const verseKeys = expandVerseRange(input.surahNumber, start, end)

  const { classIds, studentIds } = resolveAssignmentStudents(teacherId, input.classIds, input.studentIds)
  if (status === "published" && studentIds.length === 0) {
    throw new Error("Select at least one student or class before publishing")
  }

  const nowDate = new Date()
  const assignmentId = generateAssignmentId()
  const hotspots = (input.hotspots ?? []).map((hotspot, index) => ({
    id: `${assignmentId}_hotspot_${index + 1}`,
    title: hotspot.title.trim() || `Hotspot ${index + 1}`,
    description: hotspot.description.trim(),
    x: Math.max(0, Math.min(100, hotspot.x)),
    y: Math.max(0, Math.min(100, hotspot.y)),
    width: Math.max(0, Math.min(100, hotspot.width)),
    height: Math.max(0, Math.min(100, hotspot.height)),
    audioUrl: hotspot.audioUrl?.trim() || undefined,
  }))

  const assignment: TeacherAssignmentRecord = {
    id: assignmentId,
    teacherId,
    title,
    description: input.description?.trim() || undefined,
    instructions: input.instructions?.trim() || undefined,
    assignmentType: input.assignmentType,
    surahName: input.surahName,
    surahNumber: input.surahNumber,
    ayahRange: `${start}-${end}`,
    dueDate: dueDate.toISOString(),
    status,
    createdAt: iso(nowDate),
    updatedAt: iso(nowDate),
    classIds,
    studentIds,
    imageUrl: input.imageUrl,
    hotspots,
  }

  database.assignments.unshift(assignment)

  if (assignment.status === "published") {
    const verseRecords: RecitationVerseRecord[] = verseKeys.map((key) => {
      const [surahPart, ayahPart] = key.split(":")
      const ayah = Number.parseInt(ayahPart ?? "", 10)
      return {
        ayah: Number.isFinite(ayah) ? ayah : 0,
        arabic: getVerseText(key),
        translation: "",
      }
    })

    const notes = assignment.instructions || assignment.description || `Complete ${assignment.surahName}`

    assignment.studentIds.forEach((studentId) => {
      const learner = getLearnerRecord(studentId)
      if (!learner) {
        return
      }

      const taskId = `${assignment.id}__${studentId}`
      const existingTask = learner.dashboard.recitationTasks.find((task) => task.id === taskId)
      if (!existingTask) {
        const task: RecitationTaskRecord = {
          id: taskId,
          surah: assignment.surahName,
          ayahRange: assignment.ayahRange,
          dueDate: assignment.dueDate,
          status: "assigned",
          targetAccuracy: 90,
          teacherId,
          notes,
          assignedAt: assignment.createdAt,
          focusAreas: undefined,
          verses: verseRecords,
          assignmentId: assignment.id,
        }
        learner.dashboard.recitationTasks.unshift(task)
      }

      const submissionId = `${assignment.id}__${studentId}`
      const submission: AssignmentSubmissionRecord = {
        id: submissionId,
        assignmentId: assignment.id,
        studentId,
        status: "not_started",
        updatedAt: iso(nowDate),
        recitationTaskId: taskId,
      }

      const existingSubmissionIndex = database.assignmentSubmissions.findIndex(
        (entry) => entry.id === submissionId,
      )
      if (existingSubmissionIndex === -1) {
        database.assignmentSubmissions.push(submission)
      } else {
        database.assignmentSubmissions[existingSubmissionIndex] = submission
      }
    })
  }

  return buildAssignmentWithStats(assignment)
}

export function listTeacherAssignments(teacherId: string): AssignmentWithStats[] {
  return database.assignments
    .filter((assignment) => assignment.teacherId === teacherId)
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    .map((assignment) => buildAssignmentWithStats(assignment))
}

export function getTeacherAssignment(
  teacherId: string,
  assignmentId: string,
): AssignmentWithStats | undefined {
  const assignment = database.assignments.find(
    (candidate) => candidate.teacherId === teacherId && candidate.id === assignmentId,
  )
  if (!assignment) {
    return undefined
  }
  return buildAssignmentWithStats(assignment)
}

export function deleteTeacherAssignment(teacherId: string, assignmentId: string): boolean {
  const index = database.assignments.findIndex(
    (assignment) => assignment.id === assignmentId && assignment.teacherId === teacherId,
  )
  if (index === -1) {
    return false
  }

  database.assignments.splice(index, 1)
  database.assignmentSubmissions = database.assignmentSubmissions.filter(
    (submission) => submission.assignmentId !== assignmentId,
  )

  Object.values(database.learners).forEach((learner) => {
    learner.dashboard.recitationTasks = learner.dashboard.recitationTasks.filter(
      (task) => task.assignmentId !== assignmentId,
    )
  })

  return true
}

export function listStudentMemorizationPlans(
  studentId: string,
): StudentMemorizationPlanContext[] {
  ensureProgressRecordsForStudent(studentId)
  const learner = getLearnerRecord(studentId)
  const activePlanId = learner?.meta.activeMemorizationPlanId
  const accessiblePlans = database.memorizationPlans.filter((plan) =>
    studentHasAccessToPlan(studentId, plan),
  )

  return accessiblePlans.map((plan) => {
    const progress = ensureProgressRecordForPlan(studentId, plan)
    const classes = plan.classIds
      .map((classId) => getClassRecord(classId))
      .filter((classRecord): classRecord is ClassRecord => Boolean(classRecord))
      .map((classRecord) => ({ ...classRecord, studentIds: [...classRecord.studentIds] }))
    const teacher = database.teachers.find((candidate) => candidate.id === plan.teacherId)

    return {
      plan: {
        ...plan,
        verseKeys: [...plan.verseKeys],
        classIds: [...plan.classIds],
      },
      progress: cloneProgressRecord(progress),
      classes,
      teacher: teacher ? { ...teacher } : undefined,
      isActive: plan.id === activePlanId,
    }
  })
}

export function getStudentActiveMemorizationPlanId(studentId: string): string | undefined {
  const learner = getLearnerRecord(studentId)
  return learner?.meta.activeMemorizationPlanId ?? undefined
}

export function setStudentActiveMemorizationPlan(
  studentId: string,
  planId: string,
): StudentMemorizationPlanContext {
  const learner = getLearnerRecord(studentId)
  if (!learner) {
    throw new Error("Learner not found")
  }

  const context = getStudentMemorizationPlanContext(studentId, planId)
  if (!context) {
    throw new Error("Memorization plan not found")
  }

  learner.meta.activeMemorizationPlanId = planId
  return context
}

export function getStudentMemorizationPlanContext(
  studentId: string,
  planId: string,
): StudentMemorizationPlanContext | undefined {
  const plan = findMemorizationPlan(planId)
  if (!plan) {
    return undefined
  }
  if (!studentHasAccessToPlan(studentId, plan)) {
    return undefined
  }

  const progress = ensureProgressRecordForPlan(studentId, plan)
  const learner = getLearnerRecord(studentId)
  const activePlanId = learner?.meta.activeMemorizationPlanId
  const classes = plan.classIds
    .map((classId) => getClassRecord(classId))
    .filter((classRecord): classRecord is ClassRecord => Boolean(classRecord))
    .map((classRecord) => ({ ...classRecord, studentIds: [...classRecord.studentIds] }))
  const teacher = database.teachers.find((candidate) => candidate.id === plan.teacherId)

  return {
    plan: {
      ...plan,
      verseKeys: [...plan.verseKeys],
      classIds: [...plan.classIds],
    },
    progress: cloneProgressRecord(progress),
    classes,
    teacher: teacher ? { ...teacher } : undefined,
    isActive: plan.id === activePlanId,
  }
}

export function recordMemorizationRepetition(
  studentId: string,
  planId: string,
): StudentMemorizationProgressRecord {
  const plan = findMemorizationPlan(planId)
  if (!plan) {
    throw new Error("Memorization plan not found")
  }
  if (plan.verseKeys.length === 0) {
    throw new Error("Memorization plan has no verses")
  }
  if (!studentHasAccessToPlan(studentId, plan)) {
    throw new Error("You are not assigned to this memorization plan")
  }

  const progress = ensureProgressRecordForPlan(studentId, plan)
  if (progress.completedAt) {
    return cloneProgressRecord(progress)
  }
  if (progress.repetitionsDone >= MEMORIZATION_REPETITION_TARGET) {
    return cloneProgressRecord(progress)
  }

  progress.repetitionsDone += 1
  progress.totalRepetitions += 1
  const nowIso = iso(new Date())
  progress.updatedAt = nowIso
  progress.lastRepetitionAt = nowIso

  const verseIndex = Math.min(progress.currentVerseIndex, plan.verseKeys.length - 1)
  const verseKey = plan.verseKeys[verseIndex]
  if (verseKey) {
    touchStudentMemorizationSummary(studentId, plan, verseKey)
  }

  return cloneProgressRecord(progress)
}

export function advanceMemorizationVerse(
  studentId: string,
  planId: string,
): StudentMemorizationProgressRecord {
  const plan = findMemorizationPlan(planId)
  if (!plan) {
    throw new Error("Memorization plan not found")
  }
  if (plan.verseKeys.length === 0) {
    throw new Error("Memorization plan has no verses")
  }
  if (!studentHasAccessToPlan(studentId, plan)) {
    throw new Error("You are not assigned to this memorization plan")
  }

  const progress = ensureProgressRecordForPlan(studentId, plan)
  if (progress.completedAt) {
    return cloneProgressRecord(progress)
  }
  if (progress.repetitionsDone < MEMORIZATION_REPETITION_TARGET) {
    throw new Error("Complete the repetitions before advancing")
  }

  const nowIso = iso(new Date())
  const verseIndex = Math.min(progress.currentVerseIndex, plan.verseKeys.length - 1)
  const verseKey = plan.verseKeys[verseIndex]

  if (verseKey) {
    progress.history.push({
      verseKey,
      repetitions: progress.repetitionsDone,
      completedAt: nowIso,
    })
    if (progress.history.length > 100) {
      progress.history = progress.history.slice(-100)
    }
  }

  progress.updatedAt = nowIso
  progress.lastRepetitionAt = nowIso

  if (progress.currentVerseIndex >= plan.verseKeys.length - 1) {
    progress.completedAt = nowIso
    logMemorizationCompletion(studentId, plan, progress)
    if (verseKey) {
      touchStudentMemorizationSummary(studentId, plan, verseKey)
    }
  } else {
    progress.currentVerseIndex += 1
    progress.repetitionsDone = 0
    const nextVerse = plan.verseKeys[progress.currentVerseIndex]
    if (nextVerse) {
      touchStudentMemorizationSummary(studentId, plan, nextVerse)
    }
  }

  return cloneProgressRecord(progress)
}

export function getMemorizationCompletions(): MemorizationCompletionLogEntry[] {
  return database.memorizationCompletions.map((entry) => ({ ...entry }))
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
  const nextCompleted = previousCompleted + normalizedIncrement
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

  applyGamificationEvent(record, {
    type: "daily_target",
    completedAyahs: record.dashboard.dailyTarget.completedAyahs,
    targetAyahs: record.dashboard.dailyTarget.targetAyahs,
  })

  return cloneLearnerState(record)
}

export function resetDailyProgress(studentId: string): LearnerState | undefined {
  const record = getLearnerRecord(studentId)
  if (!record) return undefined
  record.dashboard.dailyTarget.completedAyahs = 0
  record.dashboard.dailyTarget.lastUpdated = iso(new Date())
  if (record.dashboard.gamePanel) {
    const nowDate = new Date()
    for (const task of record.dashboard.gamePanel.tasks) {
      if (task.type === "daily_target") {
        task.progress = 0
        if (task.status === "completed") {
          task.status = "in_progress"
        }
        task.lastUpdated = iso(nowDate)
      }
    }
  }
  return cloneLearnerState(record)
}

export function recordDailySurahCompletion(
  studentId: string,
  completion: DailySurahCompletionInput,
): DailySurahCompletionResponse {
  const record = getLearnerRecord(studentId)
  if (!record) {
    return { result: { success: false, hasanatAwarded: 0, alreadyCompleted: false } }
  }

  const nowDate = new Date()
  const todayKey = iso(nowDate).slice(0, 10)
  const alreadyLogged = record.dashboard.dailySurahLog.find(
    (entry) => entry.slug === completion.slug && entry.completedAt.slice(0, 10) === todayKey,
  )

  if (alreadyLogged) {
    return {
      state: cloneLearnerState(record),
      result: { success: true, hasanatAwarded: 0, alreadyCompleted: true },
    }
  }

  record.stats.hasanat += completion.hasanatAwarded
  if (completion.ayahsRead) {
    record.stats.ayahsRead += completion.ayahsRead
  }
  if (completion.studyMinutes) {
    record.stats.studyMinutes += completion.studyMinutes
  }

  const logEntry: DailySurahLogEntry = {
    id: `daily_surah_${nowDate.getTime()}`,
    slug: completion.slug,
    surahNumber: completion.surahNumber,
    title: completion.title,
    encouragement: completion.encouragement,
    hasanatAwarded: completion.hasanatAwarded,
    completedAt: iso(nowDate),
  }

  record.dashboard.dailySurahLog.unshift(logEntry)
  if (record.dashboard.dailySurahLog.length > 30) {
    record.dashboard.dailySurahLog.length = 30
  }

  record.dashboard.activities.unshift({
    id: `activity_${nowDate.getTime()}_daily_surah`,
    type: "reading",
    surah: completion.title,
    ayahs: completion.ayahsRead,
    timestamp: iso(nowDate),
  })
  if (record.dashboard.activities.length > MAX_ACTIVITY_ENTRIES) {
    record.dashboard.activities = record.dashboard.activities.slice(0, MAX_ACTIVITY_ENTRIES)
  }

  return {
    state: cloneLearnerState(record),
    result: { success: true, hasanatAwarded: completion.hasanatAwarded, alreadyCompleted: false },
  }
}

export function recordQuranReaderRecitation(
  studentId: string,
  input: QuranReaderRecitationInput,
): QuranReaderRecitationResponse {
  const record = getLearnerRecord(studentId)
  if (!record) {
    return {
      result: { success: false, hasanatAwarded: 0, lettersCount: 0, cumulativeHasanat: 0 },
    }
  }

  const lettersCount = Math.max(0, Math.floor(input.lettersCount))
  const hasanatAwarded = Math.max(0, Math.floor(input.hasanatAwarded))

  if (lettersCount === 0 || hasanatAwarded === 0) {
    return {
      state: cloneLearnerState(record),
      result: {
        success: false,
        hasanatAwarded: 0,
        lettersCount: 0,
        cumulativeHasanat: record.stats.hasanat,
      },
    }
  }

  const nowDate = new Date()
  const nowIso = iso(nowDate)

  record.stats.hasanat += hasanatAwarded
  record.stats.ayahsRead += 1

  record.dashboard.dailyTarget.completedAyahs += 1
  record.dashboard.dailyTarget.lastUpdated = nowIso

  const activity: ActivityEntry = {
    id: `activity_${nowDate.getTime()}_${input.verseKey}`,
    type: "reading",
    surah: input.surah,
    ayahs: 1,
    hasanatAwarded,
    timestamp: nowIso,
  }
  record.dashboard.activities.unshift(activity)
  if (record.dashboard.activities.length > MAX_ACTIVITY_ENTRIES) {
    record.dashboard.activities = record.dashboard.activities.slice(0, MAX_ACTIVITY_ENTRIES)
  }

  record.dashboard.lastRead = {
    surah: input.surah,
    ayah: input.ayahNumber,
    totalAyahs: Math.max(record.dashboard.lastRead.totalAyahs, input.ayahNumber),
  }

  for (const entry of record.dashboard.leaderboard) {
    if (entry.name.toLowerCase() === "you" || entry.id.endsWith("_user")) {
      entry.points += hasanatAwarded
      if (typeof entry.trend === "number") {
        entry.trend = Math.max(0, entry.trend) + 1
      } else {
        entry.trend = 1
      }
    }
  }

  applyGamificationEvent(record, {
    type: "daily_target",
    completedAyahs: record.dashboard.dailyTarget.completedAyahs,
    targetAyahs: record.dashboard.dailyTarget.targetAyahs,
  })

  if (record.dashboard.gamePanel) {
    const panel = record.dashboard.gamePanel
    for (const task of panel.tasks) {
      if (task.type === "daily_target") {
        task.progress = Math.min(task.target, record.dashboard.dailyTarget.completedAyahs)
        task.lastUpdated = nowIso
        if (task.progress >= task.target && task.status === "locked") {
          task.status = "in_progress"
        }
      }
    }
  }

  const cumulativeHasanat = record.stats.hasanat

  return {
    state: cloneLearnerState(record),
    result: {
      success: true,
      hasanatAwarded,
      lettersCount,
      cumulativeHasanat,
    },
  }
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

export function addTeacherNote(
  studentId: string,
  teacherId: string,
  note: string,
  category: TeacherFeedbackNote["category"] = "communication",
): TeacherFeedbackNote {
  const record = getLearnerRecord(studentId)
  if (!record) {
    throw new Error("Student not found")
  }

  const trimmed = note.trim()
  if (!trimmed) {
    throw new Error("Note message is required")
  }

  const nowDate = new Date()
  const teacherNote: TeacherFeedbackNote = {
    id: `note_${nowDate.getTime()}`,
    teacherId,
    note: trimmed,
    createdAt: iso(nowDate),
    category,
  }

  record.dashboard.teacherNotes.unshift(teacherNote)
  record.dashboard.teacherNotes = record.dashboard.teacherNotes.slice(0, MAX_TEACHER_NOTES)

  return { ...teacherNote }
}

export function sendRecitationTaskReminder(
  teacherId: string,
  taskId: string,
  message: string,
): TeacherReminderResult {
  const trimmed = message.trim()
  if (!trimmed) {
    return { success: false, error: "Reminder message is required" }
  }

  let targetRecord: LearnerRecord | undefined
  let targetTask: RecitationTaskRecord | undefined

  for (const learner of Object.values(database.learners)) {
    const task = learner.dashboard.recitationTasks.find((entry) => entry.id === taskId)
    if (task) {
      targetRecord = learner
      targetTask = task
      break
    }
  }

  if (!targetRecord || !targetTask) {
    return { success: false, error: "Recitation task not found" }
  }

  if (targetTask.teacherId !== teacherId) {
    return { success: false, error: "You do not have access to this recitation task" }
  }

  let note: TeacherFeedbackNote
  try {
    note = addTeacherNote(targetRecord.profile.id, teacherId, trimmed, "reminder")
  } catch (error) {
    const messageText = error instanceof Error ? error.message : "Unable to record reminder"
    return { success: false, error: messageText }
  }

  targetTask.notes = trimmed

  return { success: true, note }
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

  applyGamificationEvent(record, { type: "habit", habitId })

  return {
    result: { success: true, message: "Great job! Habit completed for today." },
    state: cloneLearnerState(record),
  }
}

export function logRecitationSession(
  studentId: string,
  submission: RecitationSubmissionInput,
): LearnerState | undefined {
  const record = getLearnerRecord(studentId)
  if (!record) return undefined

  const timestamp = new Date()
  const session: RecitationSessionRecord = {
    id: `recitation_${timestamp.getTime()}`,
    taskId: submission.taskId,
    surah: submission.surah,
    ayahRange: submission.ayahRange,
    accuracy: Math.round(Math.max(0, Math.min(100, submission.accuracy))),
    tajweedScore: Math.round(Math.max(0, Math.min(100, submission.tajweedScore))),
    fluencyScore: Math.round(Math.max(0, Math.min(100, submission.fluencyScore))),
    hasanatEarned: Math.max(0, Math.round(submission.hasanatEarned)),
    durationSeconds: Math.max(0, Math.round(submission.durationSeconds)),
    transcript: submission.transcript,
    expectedText: submission.expectedText,
    submittedAt: iso(timestamp),
  }

  record.dashboard.recitationSessions.unshift(session)
  if (record.dashboard.recitationSessions.length > MAX_RECITATION_SESSIONS) {
    record.dashboard.recitationSessions = record.dashboard.recitationSessions.slice(0, MAX_RECITATION_SESSIONS)
  }

  const task = submission.taskId
    ? record.dashboard.recitationTasks.find((entry) => entry.id === submission.taskId)
    : undefined
  if (task) {
    task.lastScore = session.accuracy
    task.submittedAt = session.submittedAt
    if (task.status !== "reviewed") {
      task.status = "submitted"
    }
    task.reviewNotes = `Awaiting instructor review. Auto-score ${session.accuracy}% accuracy.`

    if (task.assignmentId) {
      const submission = database.assignmentSubmissions.find(
        (entry) => entry.assignmentId === task.assignmentId && entry.studentId === studentId,
      )
      if (submission) {
        submission.status = "submitted"
        submission.submittedAt = session.submittedAt
        submission.updatedAt = session.submittedAt
        submission.score = session.accuracy
        submission.recitationTaskId = task.id
      }
    }
  }

  const ayahCount = parseAyahCount(submission.ayahRange)
  if (ayahCount > 0) {
    record.stats.ayahsRead += ayahCount
  }

  record.stats.hasanat += session.hasanatEarned
  const xpGain = Math.max(10, Math.round((session.accuracy / 100) * 60))
  applyLevelProgression(record.stats, xpGain)
  const weeklyXP = [...record.stats.weeklyXP]
  weeklyXP[timestamp.getDay()] = Math.min(LEVEL_XP_STEP, weeklyXP[timestamp.getDay()] + xpGain)
  record.stats.weeklyXP = weeklyXP
  record.stats.studyMinutes += Math.max(1, Math.round(session.durationSeconds / 60))

  const lastAyahPart = submission.ayahRange.replace(/\s/g, "").split("-").pop()
  const parsedLastAyah = lastAyahPart ? Number.parseInt(lastAyahPart, 10) : undefined
  const taskTotalAyah = task?.verses[task.verses.length - 1]?.ayah
  record.dashboard.lastRead = {
    surah: submission.surah,
    ayah: Number.isFinite(parsedLastAyah) ? Number(parsedLastAyah) : record.dashboard.lastRead.ayah,
    totalAyahs: Number.isFinite(taskTotalAyah)
      ? Number(taskTotalAyah)
      : record.dashboard.lastRead.totalAyahs,
  }

  record.dashboard.activities.unshift({
    id: `activity_${timestamp.getTime()}`,
    type: "recitation",
    surah: submission.surah,
    ayahs: ayahCount || undefined,
    score: session.accuracy,
    timestamp: session.submittedAt,
  })
  if (record.dashboard.activities.length > MAX_ACTIVITY_ENTRIES) {
    record.dashboard.activities = record.dashboard.activities.slice(0, MAX_ACTIVITY_ENTRIES)
  }

  applyGamificationEvent(record, {
    type: "recitation",
    recitationTaskId: submission.taskId,
    accuracy: session.accuracy,
  })

  if (task?.focusAreas?.length) {
    const focusAreas = task.focusAreas.map((area) => area.toLowerCase())
    const scoreToStatus = (score: number, target: number): TajweedFocusStatus => {
      if (score >= target) {
        return "mastered"
      }
      if (score >= Math.max(0, target - 10)) {
        return "improving"
      }
      return "needs_support"
    }

    const createExercises = (area: string): string[] => [
      `Review instructor notes on ${area}.`,
      `Record a focused drill emphasising ${area.toLowerCase()}.`,
    ]

    record.dashboard.tajweedFocus = record.dashboard.tajweedFocus.map((focus) => {
      const matchesRule = focusAreas.includes(focus.rule.toLowerCase())
      const matchesArea = focusAreas.includes(focus.focusArea.toLowerCase())
      if (!matchesRule && !matchesArea) {
        return focus
      }
      const nextScore = Math.round((focus.currentScore + session.tajweedScore) / 2)
      const nextStatus = scoreToStatus(nextScore, focus.targetScore)
      return {
        ...focus,
        currentScore: nextScore,
        status: nextStatus,
        lastReviewed: session.submittedAt,
        teacherId: task.teacherId,
        notes: task.notes,
      }
    })

    task.focusAreas.forEach((area) => {
      const key = area.toLowerCase()
      const alreadyTracked = record.dashboard.tajweedFocus.some(
        (focus) => focus.rule.toLowerCase() === key || focus.focusArea.toLowerCase() === key,
      )
      if (alreadyTracked) {
        return
      }
      record.dashboard.tajweedFocus.push({
        id: `focus_${timestamp.getTime()}_${key.replace(/[^a-z0-9]+/g, "-")}`,
        rule: area,
        focusArea: `${area} practice`,
        status: scoreToStatus(session.tajweedScore, task.targetAccuracy),
        teacherId: task.teacherId,
        lastReviewed: session.submittedAt,
        targetScore: task.targetAccuracy,
        currentScore: session.tajweedScore,
        notes: task.notes,
        recommendedExercises: createExercises(area),
      })
    })
  }

  recalculateRecitationAccuracy(record)

  return cloneLearnerState(record)
}

export function reviewMemorizationTask(
  studentId: string,
  review: MemorizationReviewInput,
): LearnerState | undefined {
  const record = getLearnerRecord(studentId)
  if (!record) return undefined

  const task = record.dashboard.memorizationQueue.find((entry) => entry.id === review.taskId)
  if (!task) {
    return cloneLearnerState(record)
  }

  const nowDate = new Date()
  const todayKey = nowDate.toISOString().slice(0, 10)
  const summary = record.dashboard.memorizationSummary

  const quality = Math.max(0, Math.min(5, Math.round(review.quality)))
  const accuracy = Math.max(0, Math.min(100, Math.round(review.accuracy)))
  const durationSeconds = Math.max(30, Math.round(review.durationSeconds))

  if (quality >= 3) {
    task.repetitions += 1
    task.interval = Math.max(
      1,
      quality >= 4 ? Math.round(task.interval * task.easeFactor) : Math.round(task.interval * 1.2),
    )
    task.easeFactor = Math.max(1.3, Math.min(2.7, task.easeFactor + (quality - 3) * 0.05))
  } else {
    task.interval = 1
    task.easeFactor = Math.max(1.3, task.easeFactor - 0.15)
  }

  const confidenceTarget = accuracy / 100
  task.memorizationConfidence = Math.max(
    0,
    Math.min(1, task.memorizationConfidence + (confidenceTarget - task.memorizationConfidence) * 0.4),
  )

  task.status = quality >= 4 && accuracy >= 90 ? "mastered" : quality >= 3 ? "learning" : "due"
  if (task.status === "mastered") {
    task.memorizationConfidence = Math.max(task.memorizationConfidence, 0.9)
  }

  task.lastReviewed = iso(nowDate)
  const nextReviewDate = new Date(nowDate.getTime() + task.interval * 24 * 60 * 60 * 1000)
  task.dueDate = iso(nextReviewDate)
  task.nextReview = task.dueDate

  const heatmapEntry = summary.reviewHeatmap.find((entry) => entry.date === todayKey)
  if (heatmapEntry) {
    heatmapEntry.completed += 1
  } else {
    summary.reviewHeatmap.unshift({ date: todayKey, completed: 1 })
  }
  summary.reviewHeatmap = summary.reviewHeatmap.slice(0, MAX_MEMORIZATION_HEATMAP)

  if (summary.lastReviewedOn) {
    const previous = new Date(summary.lastReviewedOn)
    const diff = getDayDifference(previous.toISOString(), todayKey)
    if (diff === 1) {
      summary.streak += 1
    } else if (diff > 1) {
      summary.streak = 1
    }
  } else {
    summary.streak = Math.max(summary.streak, 1)
  }
  summary.lastReviewedOn = iso(nowDate)

  const hasanatGain = Math.max(10, Math.round((accuracy / 100) * 35))
  const xpGain = Math.max(15, Math.round((accuracy / 100) * 45))
  record.stats.hasanat += hasanatGain
  applyLevelProgression(record.stats, xpGain)
  record.stats.weeklyXP[nowDate.getDay()] = Math.min(
    LEVEL_XP_STEP,
    record.stats.weeklyXP[nowDate.getDay()] + xpGain,
  )
  record.stats.studyMinutes += Math.max(1, Math.round(durationSeconds / 60))

  record.dashboard.activities.unshift({
    id: `activity_${nowDate.getTime()}`,
    type: "memorization",
    surah: task.surah,
    progress: accuracy,
    timestamp: iso(nowDate),
  })
  if (record.dashboard.activities.length > MAX_ACTIVITY_ENTRIES) {
    record.dashboard.activities = record.dashboard.activities.slice(0, MAX_ACTIVITY_ENTRIES)
  }

  applyGamificationEvent(record, {
    type: "memorization",
    memorizationTaskId: review.taskId,
    accuracy,
  })

  recalculateMemorizationSummary(record)

  return cloneLearnerState(record)
}

export function setSubscriptionPlan(studentId: string, plan: SubscriptionPlan): LearnerState | undefined {
  const record = getLearnerRecord(studentId)
  if (!record) return undefined
  record.profile.plan = plan
  return cloneLearnerState(record)
}

export function reviewRecitationTask(
  studentId: string,
  review: RecitationReviewInput,
): LearnerState | undefined {
  const record = getLearnerRecord(studentId)
  if (!record) return undefined

  const task = record.dashboard.recitationTasks.find((entry) => entry.id === review.taskId)
  if (!task) {
    return cloneLearnerState(record)
  }

  const nowDate = new Date()
  const normalizedAccuracy = Math.max(0, Math.min(100, Math.round(review.accuracy)))
  const normalizedTajweed = Math.max(0, Math.min(100, Math.round(review.tajweedScore)))

  task.status = "reviewed"
  task.lastScore = normalizedAccuracy
  task.reviewNotes = review.notes ?? task.reviewNotes ?? "Reviewed by instructor."
  task.reviewedAt = iso(nowDate)
  if (!task.submittedAt) {
    task.submittedAt = iso(nowDate)
  }
  task.teacherId = review.teacherId

  if (task.assignmentId) {
    const submission = database.assignmentSubmissions.find(
      (entry) => entry.assignmentId === task.assignmentId && entry.studentId === studentId,
    )
    if (submission) {
      submission.status = "reviewed"
      submission.score = normalizedAccuracy
      submission.submittedAt = submission.submittedAt ?? task.submittedAt
      submission.reviewedAt = task.reviewedAt
      submission.updatedAt = iso(nowDate)
      submission.notes = review.notes ?? submission.notes
      submission.recitationTaskId = task.id
    }
  }

  const relatedSession = record.dashboard.recitationSessions.find((session) => session.taskId === task.id)
  if (relatedSession) {
    relatedSession.accuracy = normalizedAccuracy
    relatedSession.tajweedScore = normalizedTajweed
    relatedSession.fluencyScore = Math.max(
      0,
      Math.min(100, Math.round((relatedSession.fluencyScore + normalizedTajweed) / 2)),
    )
  }

  record.dashboard.activities.unshift({
    id: `activity_${nowDate.getTime()}_review`,
    type: "recitation",
    surah: task.surah,
    ayahs: parseAyahCount(task.ayahRange) || undefined,
    score: normalizedAccuracy,
    timestamp: iso(nowDate),
  })
  if (record.dashboard.activities.length > MAX_ACTIVITY_ENTRIES) {
    record.dashboard.activities = record.dashboard.activities.slice(0, MAX_ACTIVITY_ENTRIES)
  }

  const teacherNote: TeacherFeedbackNote = {
    id: `note_${nowDate.getTime()}`,
    teacherId: review.teacherId,
    note:
      review.notes ??
      `Reviewed ${task.surah} • Ayah ${task.ayahRange}. Accuracy ${normalizedAccuracy}% and tajweed ${normalizedTajweed}%.`,
    createdAt: iso(nowDate),
    category: "tajweed",
  }
  record.dashboard.teacherNotes.unshift(teacherNote)
  record.dashboard.teacherNotes = record.dashboard.teacherNotes.slice(0, MAX_TEACHER_NOTES)

  applyGamificationEvent(record, {
    type: "recitation",
    recitationTaskId: review.taskId,
    accuracy: normalizedAccuracy,
  })

  recalculateRecitationAccuracy(record)

  return cloneLearnerState(record)
}

function formatRelativeTime(timestamp: string | undefined) {
  if (!timestamp) {
    return "Inactive"
  }
  const date = new Date(timestamp)
  const diff = Date.now() - date.getTime()
  if (diff < 60 * 1000) {
    return "Just now"
  }
  const minutes = Math.round(diff / (60 * 1000))
  if (minutes < 60) {
    return `${minutes} minute${minutes === 1 ? "" : "s"} ago`
  }
  const hours = Math.round(minutes / 60)
  if (hours < 24) {
    return `${hours} hour${hours === 1 ? "" : "s"} ago`
  }
  const days = Math.round(hours / 24)
  return `${days} day${days === 1 ? "" : "s"} ago`
}

export function getCompletedGameTasks(studentId: string): CompletedGameTaskLog[] {
  const record = getLearnerRecord(studentId)
  if (!record) {
    return []
  }
  return record.meta.completedGameTasks.map((entry) => ({ ...entry }))
}

const CLASS_NAME_BY_TEACHER: Record<string, string> = {
  teacher_001: "Intermediate Class A",
  teacher_002: "Advanced Class B",
}

export interface InstructorAssignmentSummary {
  id: string
  title: string
  dueDate: string
  status: RecitationTaskStatus
  submitted: number
  total: number
  className: string
}

export interface InstructorStudentProgress {
  id: string
  name: string
  progress: number
  streak: number
  lastActive: string
  recitationAccuracy: number
}

export interface InstructorGamificationSummary {
  completedTasks: number
  pendingTasks: number
  activeBoosts: number
  averageSeasonLevel: number
}

export interface InstructorDashboardSummary {
  classStats: {
    totalStudents: number
    activeStudents: number
    completedAssignments: number
    averageProgress: number
  }
  recentAssignments: InstructorAssignmentSummary[]
  studentProgress: InstructorStudentProgress[]
  gamification: InstructorGamificationSummary
}

export function getInstructorDashboardSummary(teacherId: string): InstructorDashboardSummary {
  const learners = Object.values(database.learners)
  const totalStudents = learners.length
  const activeStudents = learners.filter((learner) => {
    const activity = learner.dashboard.activities[0]
    if (!activity) {
      return false
    }
    return Date.now() - new Date(activity.timestamp).getTime() <= 24 * 60 * 60 * 1000
  }).length

  const teacherAssignments = learners.flatMap((learner) =>
    learner.dashboard.recitationTasks.filter((task) => task.teacherId === teacherId),
  )

  const completedAssignments = teacherAssignments.filter((task) => task.status === "reviewed").length

  const averageProgress =
    learners.length === 0
      ? 0
      : Math.round(
          learners.reduce((total, learner) => total + learner.dashboard.recitationPercentage, 0) /
            learners.length,
        )

  const recentAssignments: InstructorAssignmentSummary[] = teacherAssignments
    .map((task) => {
      const total = learners.filter((learner) =>
        learner.dashboard.recitationTasks.some((entry) => entry.id === task.id),
      ).length
      const submitted = learners.filter((learner) => {
        const entry = learner.dashboard.recitationTasks.find((candidate) => candidate.id === task.id)
        if (!entry) {
          return false
        }
        return entry.status === "submitted" || entry.status === "reviewed"
      }).length
      return {
        id: task.id,
        title: `${task.surah} • ${task.ayahRange}`,
        dueDate: task.dueDate,
        status: task.status,
        submitted,
        total,
        className: CLASS_NAME_BY_TEACHER[task.teacherId] ?? "Learner Cohort",
      }
    })
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    .slice(0, 3)

  const studentProgress: InstructorStudentProgress[] = learners
    .map((learner) => ({
      id: learner.profile.id,
      name: learner.profile.name,
      progress: learner.dashboard.memorizationPercentage,
      streak: learner.stats.streak,
      lastActive: formatRelativeTime(learner.dashboard.activities[0]?.timestamp),
      recitationAccuracy: learner.dashboard.recitationPercentage,
    }))
    .sort((a, b) => b.progress - a.progress)
    .slice(0, 5)

  const completedTasks = learners.reduce(
    (total, learner) => total + learner.dashboard.gamePanel.tasks.filter((task) => task.status === "completed").length,
    0,
  )
  const pendingTasks = learners.reduce(
    (total, learner) => total + learner.dashboard.gamePanel.tasks.filter((task) => task.status !== "completed").length,
    0,
  )
  const activeBoosts = learners.reduce(
    (total, learner) => total + learner.dashboard.gamePanel.boosts.filter((boost) => boost.active).length,
    0,
  )
  const averageSeasonLevel =
    learners.length === 0
      ? 0
      : Number(
          (
            learners.reduce(
              (total, learner) => total + (learner.dashboard.gamePanel?.season.level ?? 0),
              0,
            ) / learners.length
          ).toFixed(1),
        )

  return {
    classStats: {
      totalStudents,
      activeStudents,
      completedAssignments,
      averageProgress,
    },
    recentAssignments,
    studentProgress,
    gamification: {
      completedTasks,
      pendingTasks,
      activeBoosts,
      averageSeasonLevel,
    },
  }
}

export interface AdminOverviewStats {
  totalUsers: number
  activeUsers: number
  totalRevenue: number
  monthlyRevenue: number
  totalSessions: number
  avgSessionTime: string
  completionRate: number
  subscriptionRate: number
}

export interface AdminActivityEntry {
  id: string
  type: "reading" | "memorization" | "recitation"
  user: string
  action: string
  time: string
  status: "success" | "warning" | "error" | "info"
}

export interface AdminUserGrowthPoint {
  month: string
  users: number
  revenue: number
}

export interface AdminGamificationSnapshot {
  completedTasks: number
  pendingTasks: number
  activeBoosts: number
  averageSeasonLevel: number
  averageEnergy: number
}

export interface AdminOverview {
  stats: AdminOverviewStats
  recentActivity: AdminActivityEntry[]
  userGrowth: AdminUserGrowthPoint[]
  gamification: AdminGamificationSnapshot
}

export function getAdminOverview(): AdminOverview {
  const learners = Object.values(database.learners)
  const totalUsers = learners.length
  const activeUsers = learners.filter((learner) => {
    const activity = learner.dashboard.activities[0]
    if (!activity) {
      return false
    }
    return Date.now() - new Date(activity.timestamp).getTime() <= 24 * 60 * 60 * 1000
  }).length

  const premiumUsers = learners.filter((learner) => learner.profile.plan === "premium").length
  const baseRevenue = 450000
  const monthlyRevenue = premiumUsers * baseRevenue
  const totalRevenue = monthlyRevenue * 12

  const totalSessions = learners.reduce(
    (total, learner) => total + learner.dashboard.recitationSessions.length,
    0,
  )
  const totalStudyMinutes = learners.reduce((total, learner) => total + learner.stats.studyMinutes, 0)
  const avgSessionTime =
    totalSessions === 0
      ? "0m"
      : `${Math.max(1, Math.round(totalStudyMinutes / Math.max(totalSessions, 1)))}m`

  const completionRate =
    totalUsers === 0
      ? 0
      : Math.round(
          learners.reduce((total, learner) => total + learner.dashboard.memorizationPercentage, 0) /
            totalUsers,
        )

  const subscriptionRate = totalUsers === 0 ? 0 : Math.round((premiumUsers / totalUsers) * 100)

  const recentActivity: AdminActivityEntry[] = learners
    .flatMap((learner) =>
      learner.dashboard.activities.slice(0, 5).map((activity) => ({
        id: `${learner.profile.id}_${activity.id}`,
        type: activity.type,
        user: learner.profile.name,
        action:
          activity.type === "reading"
            ? `Read ${activity.ayahs ?? "several"} ayahs from ${activity.surah}`
            : activity.type === "memorization"
              ? `Reviewed ${activity.surah} at ${activity.progress ?? 0}%`
              : `Recorded ${activity.surah} with ${activity.score ?? activity.progress ?? 0}% score`,
        timestamp: activity.timestamp,
        status: activity.type === "recitation" ? "success" : activity.type === "memorization" ? "info" : "success",
      })),
    )
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 5)
    .map((entry) => ({ ...entry, time: formatRelativeTime(entry.timestamp) }))
    .map(({ timestamp: _timestamp, ...rest }) => {
      void _timestamp
      return rest
    })

  const months = Array.from({ length: 6 }).map((_, index) => {
    const date = new Date()
    date.setMonth(date.getMonth() - (5 - index))
    const label = date.toLocaleString("en-US", { month: "short" })
    const baseUsers = totalUsers + Math.max(1, activeUsers) * index
    const revenueTrend = Math.round(monthlyRevenue * (0.75 + index * 0.05))
    return {
      month: label,
      users: baseUsers,
      revenue: revenueTrend,
    }
  })

  const gamificationCompleted = learners.reduce(
    (total, learner) => total + learner.meta.completedGameTasks.length,
    0,
  )
  const gamificationPending = learners.reduce(
    (total, learner) => total + learner.dashboard.gamePanel.tasks.filter((task) => task.status !== "completed").length,
    0,
  )
  const gamificationActiveBoosts = learners.reduce(
    (total, learner) => total + learner.dashboard.gamePanel.boosts.filter((boost) => boost.active).length,
    0,
  )
  const gamificationAverageLevel =
    learners.length === 0
      ? 0
      : Number(
          (
            learners.reduce(
              (total, learner) => total + (learner.dashboard.gamePanel?.season.level ?? 0),
              0,
            ) / learners.length
          ).toFixed(1),
        )
  const gamificationAverageEnergy =
    learners.length === 0
      ? 0
      : Number(
          (
            learners.reduce(
              (total, learner) => total + (learner.dashboard.gamePanel?.energy.current ?? 0),
              0,
            ) / learners.length
          ).toFixed(1),
        )

  return {
    stats: {
      totalUsers,
      activeUsers,
      totalRevenue,
      monthlyRevenue,
      totalSessions,
      avgSessionTime,
      completionRate,
      subscriptionRate,
    },
    recentActivity,
    userGrowth: months,
    gamification: {
      completedTasks: gamificationCompleted,
      pendingTasks: gamificationPending,
      activeBoosts: gamificationActiveBoosts,
      averageSeasonLevel: gamificationAverageLevel,
      averageEnergy: gamificationAverageEnergy,
    },
  }
}
