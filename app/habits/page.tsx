"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import AppLayout from "@/components/app-layout"
import { PremiumGate } from "@/components/premium-gate"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { useUser } from "@/hooks/use-user"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import {
  Award,
  BarChart3,
  BookOpen,
  Brain,
  CalendarDays,
  Crown,
  Flame,
  Pen,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
} from "lucide-react"

const habitIconMap = {
  BookOpen,
  Brain,
  Pen,
  Target,
}

const difficultyStyles = {
  easy: "bg-green-100 text-green-800 border-green-200",
  medium: "bg-yellow-100 text-yellow-800 border-yellow-200",
  hard: "bg-red-100 text-red-800 border-red-200",
} as const

const weekdayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

export default function HabitQuestPage() {
  const { habits, stats, perks, isPremium, completeHabit } = useUser()
  const { toast } = useToast()
  const [selectedHabitId, setSelectedHabitId] = useState<string>(habits[0]?.id ?? "")

  useEffect(() => {
    if (habits.length === 0) {
      return
    }
    const exists = habits.some((habit) => habit.id === selectedHabitId)
    if (!exists) {
      setSelectedHabitId(habits[0].id)
    }
  }, [habits, selectedHabitId])

  const selectedHabit = useMemo(
    () => habits.find((habit) => habit.id === selectedHabitId) ?? habits[0],
    [habits, selectedHabitId],
  )

  const weeklyXpTotal = useMemo(() => stats.weeklyXP.reduce((total, value) => total + value, 0), [stats.weeklyXP])
  const selectedDifficulty = selectedHabit ? difficultyStyles[selectedHabit.difficulty] : difficultyStyles.medium
  const lastCompleted = selectedHabit?.lastCompletedAt
    ? new Date(`${selectedHabit.lastCompletedAt}T00:00:00`).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      })
    : "Not yet"

  const handleCompleteHabit = () => {
    if (!selectedHabit) return
    const result = completeHabit(selectedHabit.id)
    toast({
      title: result.success ? "Habit completed!" : "Heads up",
      description: result.message,
    })
  }

  return (
    <AppLayout>
      <div className="p-6 space-y-8">
        <header className="space-y-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-3">
              <h1 className="text-3xl font-bold text-maroon-900">Habit Quest Arena</h1>
              <p className="text-maroon-700 max-w-2xl">
                Transform your Qur'an study routine into a daily adventure. Level up streaks, earn hasanat, and unlock new
                challenges as you complete quests.
              </p>
              <div className="flex flex-wrap gap-2">
                {perks.slice(0, 3).map((perk) => (
                  <Badge key={perk} variant="secondary" className="bg-maroon-100 text-maroon-800 border-maroon-200">
                    <Sparkles className="mr-1 h-3 w-3" />
                    {perk}
                  </Badge>
                ))}
                {!isPremium && (
                  <Link href="/billing">
                    <Badge className="cursor-pointer bg-gradient-to-r from-yellow-400 to-orange-500 text-white border-0">
                      Unlock more perks
                    </Badge>
                  </Link>
                )}
              </div>
            </div>
            <div className="rounded-2xl border border-maroon-200 bg-white p-5 shadow-md">
              <p className="text-sm text-maroon-600">Global Habit Streak</p>
              <div className="flex items-end gap-3">
                <span className="text-4xl font-bold text-maroon-900">{stats.streak}</span>
                <span className="text-maroon-600">days</span>
              </div>
              <p className="text-xs text-maroon-500 mt-2">
                Complete any quest today to keep your streak and unlock bonus hasanat.
              </p>
            </div>
          </div>
        </header>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          <Card className="border-0 bg-gradient-to-br from-orange-500 to-red-500 text-white shadow-lg">
            <CardContent className="p-6 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm uppercase tracking-wide text-white/80">Daily Streak</p>
                <Flame className="h-6 w-6" />
              </div>
              <p className="text-3xl font-bold">{stats.streak} days</p>
              <p className="text-xs text-white/70">Maintain momentum to unlock mastery quests.</p>
            </CardContent>
          </Card>
          <Card className="border-0 bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-lg">
            <CardContent className="p-6 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm uppercase tracking-wide text-white/80">Weekly XP</p>
                <BarChart3 className="h-6 w-6" />
              </div>
              <p className="text-3xl font-bold">{weeklyXpTotal} XP</p>
              <p className="text-xs text-white/70">Earn {selectedHabit?.xpReward ?? 0} XP from today's featured quest.</p>
            </CardContent>
          </Card>
          <Card className="border-0 bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-lg">
            <CardContent className="p-6 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm uppercase tracking-wide text-white/80">Hasanat Earned</p>
                <Sparkles className="h-6 w-6" />
              </div>
              <p className="text-3xl font-bold">{stats.hasanat.toLocaleString()}</p>
              <p className="text-xs text-white/70">Every verified recitation adds to your reward balance.</p>
            </CardContent>
          </Card>
          <Card className="border-0 bg-gradient-to-br from-purple-600 to-maroon-600 text-white shadow-lg">
            <CardContent className="p-6 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm uppercase tracking-wide text-white/80">Habit Level</p>
                <Award className="h-6 w-6" />
              </div>
              <p className="text-3xl font-bold">Level {stats.level}</p>
              <p className="text-xs text-white/70">{stats.xpToNext} XP until your next rank-up.</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Card className="shadow-lg">
              <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <CardTitle className="text-xl flex items-center gap-2">
                    <Target className="h-5 w-5 text-maroon-600" />
                    {selectedHabit?.title ?? "Select a habit"}
                  </CardTitle>
                  <CardDescription>{selectedHabit?.description}</CardDescription>
                </div>
                {selectedHabit && (
                  <Badge className={cn("border", selectedDifficulty)}>{selectedHabit.difficulty.toUpperCase()}</Badge>
                )}
              </CardHeader>
              <CardContent className="space-y-6">
                {selectedHabit && (
                  <>
                    <div className="space-y-4">
                      <Progress value={selectedHabit.progress} className="h-2" />
                      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <div className="rounded-lg border border-maroon-100 bg-maroon-50 p-3">
                          <p className="text-xs text-maroon-600">Current Streak</p>
                          <p className="text-lg font-semibold text-maroon-900">{selectedHabit.streak} days</p>
                        </div>
                        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3">
                          <p className="text-xs text-yellow-700">Best Streak</p>
                          <p className="text-lg font-semibold text-yellow-800">{selectedHabit.bestStreak} days</p>
                        </div>
                        <div className="rounded-lg border border-indigo-200 bg-indigo-50 p-3">
                          <p className="text-xs text-indigo-700">Habit Level</p>
                          <p className="text-lg font-semibold text-indigo-800">Level {selectedHabit.level}</p>
                        </div>
                        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
                          <p className="text-xs text-emerald-700">Total XP</p>
                          <p className="text-lg font-semibold text-emerald-800">{selectedHabit.xp} XP</p>
                        </div>
                      </div>
                    </div>
                    <div className="rounded-xl border border-dashed border-maroon-200 bg-maroon-50 p-4 flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <p className="text-sm font-medium text-maroon-900">Daily Target</p>
                        <p className="text-xs text-maroon-600">Complete {selectedHabit.dailyTarget} to earn +{selectedHabit.xpReward} XP and +{selectedHabit.hasanatReward} hasanat.</p>
                      </div>
                      <Button
                        onClick={handleCompleteHabit}
                        className="bg-gradient-to-r from-maroon-600 to-maroon-700 text-white border-0"
                      >
                        <Sparkles className="mr-2 h-4 w-4" />
                        Complete today's quest
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-6 text-sm text-maroon-600">
                      <div className="flex items-center gap-2">
                        <CalendarDays className="h-4 w-4 text-maroon-500" />
                        Last completed: {lastCompleted}
                      </div>
                      <div className="flex items-center gap-2">
                        <Crown className="h-4 w-4 text-yellow-600" />
                        Best streak: {selectedHabit.bestStreak} days
                      </div>
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-emerald-500" />
                        Rewards: +{selectedHabit.xpReward} XP / +{selectedHabit.hasanatReward} hasanat
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl">Weekly Quest Board</CardTitle>
                <CardDescription>Select a quest to view details and power-ups.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                {habits.map((habit) => {
                  const Icon = habit.icon in habitIconMap ? habitIconMap[habit.icon as keyof typeof habitIconMap] : Target
                  return (
                    <button
                      key={habit.id}
                      type="button"
                      onClick={() => setSelectedHabitId(habit.id)}
                      className={cn(
                        "relative flex h-full flex-col gap-3 rounded-xl border p-4 text-left transition-all hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-maroon-500",
                        selectedHabit?.id === habit.id
                          ? "border-maroon-300 bg-maroon-50 shadow-inner"
                          : "border-gray-200 bg-white",
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-maroon-100 text-maroon-700">
                            <Icon className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="font-semibold text-maroon-900">{habit.title}</p>
                            <p className="text-xs text-maroon-600">{habit.dailyTarget}</p>
                          </div>
                        </div>
                        <Badge className={cn("border", difficultyStyles[habit.difficulty])}>{habit.difficulty}</Badge>
                      </div>
                      <div className="space-y-2">
                        <Progress value={habit.progress} className="h-2" />
                        <div className="flex items-center justify-between text-xs text-maroon-600">
                          <span>Streak: {habit.streak}d</span>
                          <span>Level {habit.level}</span>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </CardContent>
            </Card>

            {selectedHabit && (
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="text-xl">Weekly Progress</CardTitle>
                  <CardDescription>Track completion for {selectedHabit.title} this week.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2">
                  {selectedHabit.weeklyProgress.map((progressValue, index) => (
                    <div key={weekdayLabels[index]} className="rounded-lg border border-maroon-100 bg-white p-4">
                      <div className="flex items-center justify-between text-sm text-maroon-700">
                        <span className="font-medium text-maroon-900">{weekdayLabels[index]}</span>
                        <span>{Math.round(progressValue)}%</span>
                      </div>
                      <Progress value={progressValue} className="mt-3 h-2" />
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>

          <div className="space-y-6">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl">Reward Track</CardTitle>
                <CardDescription>Convert consistent habits into meaningful milestones.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-lg border border-maroon-100 bg-maroon-50 p-4">
                  <p className="text-xs text-maroon-600">Hasanat balance</p>
                  <p className="text-2xl font-bold text-maroon-900">{stats.hasanat.toLocaleString()}</p>
                  <p className="text-xs text-maroon-500">Keep reciting daily to multiply your rewards.</p>
                </div>
                <div className="grid gap-3 text-sm text-maroon-600">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-maroon-500" />
                    {stats.completedHabits} quests completed all-time
                  </div>
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-yellow-500" />
                    +{selectedHabit?.hasanatReward ?? 0} hasanat ready for today's completion
                  </div>
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-emerald-500" />
                    Next badge at 25 total quests (you're {Math.max(0, 25 - stats.completedHabits)} away)
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl">Unlocked Perks</CardTitle>
                <CardDescription>Your current plan gives you access to these boosters.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {perks.map((perk) => (
                  <div key={perk} className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-3 text-sm">
                    <ShieldCheck className="h-4 w-4 text-maroon-600" />
                    <span className="text-maroon-700">{perk}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            <PremiumGate featureName="Advanced Habit Analytics" description="Unlock streak forecasts, motivation nudges, and class-wide comparisons.">
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="text-xl">Advanced Habit Analytics</CardTitle>
                  <CardDescription>Spot trends before they break your streak.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="rounded-lg border border-indigo-200 bg-indigo-50 p-4 text-sm text-indigo-900">
                    <p className="font-semibold">Projected streak</p>
                    <p className="text-xs text-indigo-700">Keep up the pace to reach a 14-day streak within 3 more completions.</p>
                  </div>
                  <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
                    <p className="font-semibold">Motivation pulse</p>
                    <p className="text-xs text-emerald-700">AI reminders adapt to your energy level and study rhythm.</p>
                  </div>
                </CardContent>
              </Card>
            </PremiumGate>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}

