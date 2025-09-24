"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
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
import AppLayout from "@/components/app-layout"
import { PremiumGate } from "@/components/premium-gate"
import { useUser } from "@/hooks/use-user"
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
} from "lucide-react"

export default function DashboardPage() {
  const {
    profile,
    stats,
    habits,
    teachers,
    dashboard,
    updateDailyTarget,
    incrementDailyTarget,
    resetDailyTargetProgress,
    setFeaturedHabit,
    updateGoalProgress,
    toggleGoalCompletion,
    addGoal,
  } = useUser()

  const firstName = useMemo(() => profile.name.split(" ")[0] ?? profile.name, [profile.name])
  const studyMinutes = stats.studyMinutes
  const studyHours = Math.floor(studyMinutes / 60)
  const remainingMinutes = studyMinutes % 60
  const formattedStudyTime = `${studyHours > 0 ? `${studyHours}h ` : ""}${remainingMinutes}m`
  const levelTarget = stats.xp + stats.xpToNext
  const xpProgress = levelTarget === 0 ? 0 : Math.max(0, Math.min(100, Math.round((stats.xp / levelTarget) * 100)))
  const weeklyXpTotal = stats.weeklyXP.reduce((total, value) => total + value, 0)
  const featuredHabit = useMemo(() => {
    return habits.find((habit) => habit.id === dashboard.preferredHabitId) ?? habits[0]
  }, [dashboard.preferredHabitId, habits])

  const [customTarget, setCustomTarget] = useState(dashboard.dailyTarget.targetAyahs)
  const [isCelebrating, setIsCelebrating] = useState(false)
  const [leaderboardScope, setLeaderboardScope] = useState<"class" | "global">("class")
  const [leaderboardTimeframe, setLeaderboardTimeframe] = useState<"weekly" | "monthly">("weekly")
  const [goalFormOpen, setGoalFormOpen] = useState(false)
  const [newGoalTitle, setNewGoalTitle] = useState("")
  const [newGoalDeadline, setNewGoalDeadline] = useState("")
  const [hasShownCelebration, setHasShownCelebration] = useState(false)

  useEffect(() => {
    setCustomTarget(dashboard.dailyTarget.targetAyahs)
  }, [dashboard.dailyTarget.targetAyahs])

  useEffect(() => {
    if (goalFormOpen && newGoalDeadline.trim().length === 0) {
      setNewGoalDeadline(new Date().toISOString().slice(0, 10))
    }
  }, [goalFormOpen, newGoalDeadline])

  const dailyTargetPercent = useMemo(() => {
    if (dashboard.dailyTarget.targetAyahs === 0) return 0
    return Math.max(
      0,
      Math.min(100, Math.round((dashboard.dailyTarget.completedAyahs / dashboard.dailyTarget.targetAyahs) * 100)),
    )
  }, [dashboard.dailyTarget.completedAyahs, dashboard.dailyTarget.targetAyahs])

  const formattedActivity = useMemo(() => {
    return dashboard.activities.map((activity) => {
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
  }, [dashboard.activities])

  const upcomingGoals = useMemo(() => {
    return dashboard.goals.map((goal) => {
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
  }, [dashboard.goals])

  const leaderboardEntries = useMemo(() => {
    return dashboard.leaderboard.filter(
      (entry) => entry.scope === leaderboardScope && entry.timeframe === leaderboardTimeframe,
    )
  }, [dashboard.leaderboard, leaderboardScope, leaderboardTimeframe])

  const teacherMap = useMemo(() => new Map(teachers.map((teacher) => [teacher.id, teacher.name])), [teachers])

  const handleSaveTarget = () => {
    updateDailyTarget(customTarget)
  }

  const handleNextAyah = () => {
    incrementDailyTarget(1)
  }

  const dailyGoalMet = dashboard.dailyTarget.completedAyahs >= dashboard.dailyTarget.targetAyahs
  const canCreateGoal = newGoalTitle.trim().length > 0 && newGoalDeadline.trim().length > 0

  const handleCreateGoal = () => {
    if (!canCreateGoal) return
    const isoDeadline = new Date(newGoalDeadline).toISOString()
    addGoal({ title: newGoalTitle.trim(), deadline: isoDeadline })
    setGoalFormOpen(false)
    setNewGoalTitle("")
    setNewGoalDeadline("")
  }

  useEffect(() => {
    const goalCompleted =
      dashboard.dailyTarget.targetAyahs > 0 &&
      dashboard.dailyTarget.completedAyahs >= dashboard.dailyTarget.targetAyahs
    if (goalCompleted && !hasShownCelebration) {
      setIsCelebrating(true)
      setHasShownCelebration(true)
    }
    if (!goalCompleted && hasShownCelebration) {
      setHasShownCelebration(false)
    }
  }, [
    dashboard.dailyTarget.completedAyahs,
    dashboard.dailyTarget.targetAyahs,
    hasShownCelebration,
  ])

  return (
    <>
      <AppLayout>
      <div className="p-6">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-maroon-900 mb-2">Assalamu Alaikum, {firstName}</h2>
          <p className="text-lg text-maroon-700">Continue your journey of Qur'anic excellence</p>
          <div className="flex items-center mt-4">
            <Badge className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white border-0 px-3 py-1">
              <Star className="w-3 h-3 mr-1" />
              {stats.hasanat.toLocaleString()} Hasanat Points
            </Badge>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-blue-600 to-blue-700 text-white border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm">Daily Streak</p>
                  <p className="text-2xl font-bold">{stats.streak} days</p>
                </div>
                <Calendar className="w-8 h-8 text-blue-200" />
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
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm">Rank</p>
                  <p className="text-2xl font-bold">#{stats.rank}</p>
                </div>
                <Trophy className="w-8 h-8 text-orange-200" />
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
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                  <Target className="w-5 h-5 text-maroon-600" /> Daily Target
                </CardTitle>
                <CardDescription>Stay on pace for today's recitation goal.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="text-sm text-maroon-600">Today's Goal</p>
                    <p className="text-3xl font-bold text-maroon-900">{dashboard.dailyTarget.targetAyahs} Ayahs</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Completed</p>
                    <p className="text-3xl font-bold text-maroon-700">{dashboard.dailyTarget.completedAyahs}</p>
                  </div>
                </div>
                <div>
                  <Progress value={dailyTargetPercent} className="h-3" />
                  <div className="flex items-center justify-between text-xs text-gray-500 mt-2">
                    <span>{dailyTargetPercent}% of goal complete</span>
                    <span>Updated {new Date(dashboard.dailyTarget.lastUpdated).toLocaleTimeString()}</span>
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
                      onValueChange={(value) => setCustomTarget(value[0] ?? dashboard.dailyTarget.targetAyahs)}
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
                      disabled={customTarget === dashboard.dailyTarget.targetAyahs}
                    >
                      Save Target
                    </Button>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <Button
                    onClick={handleNextAyah}
                    className="bg-gradient-to-r from-maroon-600 to-maroon-700 text-white border-0"
                    disabled={dailyGoalMet}
                  >
                    Next Ayah
                  </Button>
                  <Button variant="outline" onClick={resetDailyTargetProgress} disabled={dashboard.dailyTarget.completedAyahs === 0}>
                    Reset Progress
                  </Button>
                  <Badge variant="secondary" className={`text-xs ${dailyGoalMet ? "bg-green-100 text-green-700" : ""}`}>
                    {dailyGoalMet ? "Goal complete" : `Remaining ${Math.max(dashboard.dailyTarget.targetAyahs - dashboard.dailyTarget.completedAyahs, 0)}`}
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
                <Progress value={xpProgress} className="h-2" />
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
                    <Badge className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white border-0">
                      Level {featuredHabit?.level ?? 1}
                    </Badge>
                  </div>
                  <div className="mb-4">
                    <Label htmlFor="featured-habit" className="text-xs uppercase tracking-wide text-maroon-700">
                      Featured habit quest
                    </Label>
                    <Select
                      value={featuredHabit?.id ?? ""}
                      onValueChange={(value) => {
                        if (value) setFeaturedHabit(value)
                      }}
                    >
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
                    <Button variant="outline" className="bg-white" asChild>
                      <Link href={`/habits?focus=${featuredHabit?.id ?? ""}`}>
                        <Target className="w-4 h-4 mr-2" />
                        View Habit
                      </Link>
                    </Button>
                  </div>
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
                  <div className="rounded-xl border border-dashed border-maroon-200 bg-maroon-50/60 p-4 flex flex-col justify-between">
                    <div>
                      <p className="text-sm font-medium text-maroon-900">Today's premium boost</p>
                      <p className="text-xs text-maroon-600">{dashboard.premiumBoost.description}</p>
                    </div>
                    <Button className="mt-4 w-full bg-gradient-to-r from-maroon-600 to-maroon-700 text-white border-0" asChild>
                      <Link href="/practice/tajweed">Start Premium Session</Link>
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
                                : "bg-gradient-to-r from-blue-500 to-blue-600"
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
                {upcomingGoals.map((goal, index) => (
                  <div key={goal.id} className="space-y-3 rounded-lg border border-maroon-100 p-3">
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex items-start gap-2">
                        <Checkbox
                          id={`goal-${goal.id}`}
                          checked={goal.status === "completed"}
                          onCheckedChange={(checked) =>
                            toggleGoalCompletion(goal.id, checked === true)
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
                    <Select
                      value={leaderboardScope}
                      onValueChange={(value) => setLeaderboardScope(value as "class" | "global")}
                    >
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
                    <Select
                      value={leaderboardTimeframe}
                      onValueChange={(value) => setLeaderboardTimeframe(value as "weekly" | "monthly")}
                    >
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
                      className={`flex items-center justify-between p-2 rounded ${
                        entry.name === "You" ? "bg-maroon-50 border border-maroon-200" : ""
                      }`}
                    >
                      <div className="flex items-center space-x-3">
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
                        <span className={`text-sm ${entry.name === "You" ? "font-medium" : ""}`}>{entry.name}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Star className="w-3 h-3 text-yellow-500" />
                        <span className="text-sm">{entry.points.toLocaleString()}</span>
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

      <Dialog open={isCelebrating} onOpenChange={setIsCelebrating}>
      <DialogContent className="max-w-sm text-center">
        <DialogHeader className="space-y-2">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
            <CheckCircle2 className="h-7 w-7 text-green-600" />
          </div>
          <DialogTitle className="text-2xl font-semibold text-maroon-900">Masha'Allah!</DialogTitle>
          <DialogDescription className="text-sm text-gray-600">
            You completed today's target of {dashboard.dailyTarget.targetAyahs} ayahs. Keep the momentum going or revisit
            your habits for bonus XP.
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
          <DialogDescription>Define a focused objective to align with your teacher's plan.</DialogDescription>
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
