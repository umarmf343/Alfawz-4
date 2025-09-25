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
  recitationTasks: RecitationTaskRecord[]
  recitationSessions: RecitationSessionRecord[]
  memorizationQueue: MemorizationTaskRecord[]
  memorizationPlaylists: MemorizationPlaylistRecord[]
  memorizationSummary: MemorizationSummaryRecord
  tajweedFocus: TajweedFocusRecord[]
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
const MAX_RECITATION_SESSIONS = 50
const MAX_MEMORIZATION_HEATMAP = 30
const MAX_TEACHER_NOTES = 20

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

  recalculateRecitationAccuracy(record)

  return cloneLearnerState(record)
}
