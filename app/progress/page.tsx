"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  BookOpen,
  TrendingUp,
  Calendar,
  Clock,
  Star,
  Target,
  BarChart3,
  Activity,
  Zap,
  CheckCircle,
  Brain,
} from "lucide-react"
import Link from "next/link"

export default function ProgressPage() {
  const [activeTab, setActiveTab] = useState("overview")
  const [timeRange, setTimeRange] = useState("week")

  const progressData = {
    overall: {
      totalAyahs: 6236,
      readAyahs: 1247,
      memorizedAyahs: 156,
      currentStreak: 12,
      longestStreak: 28,
      studyTime: 145, // hours
      accuracy: 87,
    },
    weekly: {
      readingGoal: 50,
      readingProgress: 38,
      memorizationGoal: 5,
      memorizationProgress: 7,
      studyTimeGoal: 10, // hours
      studyTimeProgress: 8.5,
    },
    achievements: [
      {
        id: 1,
        title: "First Steps",
        description: "Complete your first reading session",
        icon: BookOpen,
        earned: true,
        earnedDate: "2025-01-01",
      },
      {
        id: 2,
        title: "Week Warrior",
        description: "Maintain a 7-day reading streak",
        icon: Calendar,
        earned: true,
        earnedDate: "2025-01-08",
      },
      {
        id: 3,
        title: "Memory Master",
        description: "Memorize 100 ayahs",
        icon: Brain,
        earned: true,
        earnedDate: "2025-01-15",
      },
      {
        id: 4,
        title: "Perfect Reciter",
        description: "Achieve 95%+ accuracy in recitation",
        icon: Star,
        earned: false,
        progress: 87,
      },
      {
        id: 5,
        title: "Dedicated Student",
        description: "Study for 100 hours total",
        icon: Clock,
        earned: false,
        progress: 145,
        target: 100,
      },
    ],
    recentActivity: [
      {
        type: "reading",
        surah: "Al-Baqarah",
        ayahs: 15,
        time: "2 hours ago",
        accuracy: 92,
      },
      {
        type: "memorization",
        surah: "Al-Mulk",
        ayahs: 3,
        time: "5 hours ago",
        accuracy: 88,
      },
      {
        type: "review",
        surah: "Al-Fatiha",
        ayahs: 7,
        time: "Yesterday",
        accuracy: 95,
      },
      {
        type: "assignment",
        title: "Tajweed Practice",
        score: 85,
        time: "2 days ago",
      },
    ],
    surahProgress: [
      { name: "Al-Fatiha", total: 7, read: 7, memorized: 7, progress: 100 },
      { name: "Al-Baqarah", total: 286, read: 156, memorized: 12, progress: 55 },
      { name: "Al-Imran", total: 200, read: 89, memorized: 0, progress: 45 },
      { name: "An-Nisa", total: 176, read: 45, memorized: 0, progress: 26 },
      { name: "Al-Maidah", total: 120, read: 23, memorized: 0, progress: 19 },
    ],
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "reading":
        return BookOpen
      case "memorization":
        return Brain
      case "review":
        return CheckCircle
      case "assignment":
        return Target
      default:
        return Activity
    }
  }

  const getActivityColor = (type: string) => {
    switch (type) {
      case "reading":
        return "bg-blue-100 text-blue-800"
      case "memorization":
        return "bg-green-100 text-green-800"
      case "review":
        return "bg-purple-100 text-purple-800"
      case "assignment":
        return "bg-orange-100 text-orange-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="min-h-screen bg-gradient-cream">
      {/* Header */}
      <header className="border-b border-border/50 bg-background/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 gradient-maroon rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">Progress Tracking</h1>
                <p className="text-xs text-muted-foreground">Monitor your Qur'anic journey</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Button
                  variant={timeRange === "week" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTimeRange("week")}
                  className={timeRange === "week" ? "gradient-maroon text-white border-0" : "bg-transparent"}
                >
                  Week
                </Button>
                <Button
                  variant={timeRange === "month" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTimeRange("month")}
                  className={timeRange === "month" ? "gradient-maroon text-white border-0" : "bg-transparent"}
                >
                  Month
                </Button>
                <Button
                  variant={timeRange === "year" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTimeRange("year")}
                  className={timeRange === "year" ? "gradient-maroon text-white border-0" : "bg-transparent"}
                >
                  Year
                </Button>
              </div>
              <Link href="/dashboard">
                <Button variant="outline" className="bg-transparent">
                  <BookOpen className="w-4 h-4 mr-2" />
                  Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overall Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="border-border/50 hover:shadow-lg transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Ayahs Read</p>
                  <p className="text-2xl font-bold text-primary">{progressData.overall.readAyahs.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">of {progressData.overall.totalAyahs.toLocaleString()}</p>
                </div>
                <div className="w-12 h-12 gradient-maroon rounded-xl flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 hover:shadow-lg transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Memorized</p>
                  <p className="text-2xl font-bold text-primary">{progressData.overall.memorizedAyahs}</p>
                  <p className="text-xs text-muted-foreground">ayahs</p>
                </div>
                <div className="w-12 h-12 gradient-gold rounded-xl flex items-center justify-center">
                  <Brain className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 hover:shadow-lg transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Current Streak</p>
                  <p className="text-2xl font-bold text-primary">{progressData.overall.currentStreak}</p>
                  <p className="text-xs text-muted-foreground">days</p>
                </div>
                <div className="w-12 h-12 gradient-maroon rounded-xl flex items-center justify-center">
                  <Zap className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 hover:shadow-lg transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Study Time</p>
                  <p className="text-2xl font-bold text-primary">{progressData.overall.studyTime}h</p>
                  <p className="text-xs text-muted-foreground">total</p>
                </div>
                <div className="w-12 h-12 gradient-gold rounded-xl flex items-center justify-center">
                  <Clock className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="goals">Goals</TabsTrigger>
            <TabsTrigger value="achievements">Achievements</TabsTrigger>
            <TabsTrigger value="detailed">Detailed</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Progress Chart */}
              <div className="lg:col-span-2">
                <Card className="border-border/50 shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-xl">Reading Progress</CardTitle>
                    <CardDescription>Your Qur'an reading journey over time</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64 bg-gradient-to-br from-primary/10 to-accent/10 rounded-lg flex items-center justify-center">
                      <div className="text-center space-y-2">
                        <BarChart3 className="w-12 h-12 text-primary mx-auto" />
                        <p className="text-muted-foreground">Progress chart visualization</p>
                        <p className="text-sm text-muted-foreground">
                          {Math.round((progressData.overall.readAyahs / progressData.overall.totalAyahs) * 100)}%
                          complete
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Activity */}
              <div>
                <Card className="border-border/50">
                  <CardHeader>
                    <CardTitle className="text-lg">Recent Activity</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {progressData.recentActivity.map((activity, index) => {
                      const IconComponent = getActivityIcon(activity.type)
                      return (
                        <div key={index} className="flex items-center space-x-3 p-3 rounded-lg bg-muted/30">
                          <div className="w-8 h-8 gradient-maroon rounded-full flex items-center justify-center">
                            <IconComponent className="w-4 h-4 text-white" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <h4 className="font-medium text-sm capitalize">{activity.type}</h4>
                              <Badge className={`text-xs ${getActivityColor(activity.type)}`}>
                                {activity.accuracy
                                  ? `${activity.accuracy}%`
                                  : activity.score
                                    ? `${activity.score}%`
                                    : ""}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {activity.surah || activity.title} • {activity.time}
                            </p>
                          </div>
                        </div>
                      )
                    })}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="goals" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle className="text-xl">Weekly Goals</CardTitle>
                  <CardDescription>Track your progress towards weekly targets</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium">Reading Goal</span>
                        <span className="text-sm text-muted-foreground">
                          {progressData.weekly.readingProgress}/{progressData.weekly.readingGoal} ayahs
                        </span>
                      </div>
                      <Progress value={(progressData.weekly.readingProgress / progressData.weekly.readingGoal) * 100} />
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium">Memorization Goal</span>
                        <span className="text-sm text-muted-foreground">
                          {progressData.weekly.memorizationProgress}/{progressData.weekly.memorizationGoal} ayahs
                        </span>
                      </div>
                      <Progress
                        value={(progressData.weekly.memorizationProgress / progressData.weekly.memorizationGoal) * 100}
                      />
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium">Study Time Goal</span>
                        <span className="text-sm text-muted-foreground">
                          {progressData.weekly.studyTimeProgress}/{progressData.weekly.studyTimeGoal} hours
                        </span>
                      </div>
                      <Progress
                        value={(progressData.weekly.studyTimeProgress / progressData.weekly.studyTimeGoal) * 100}
                      />
                    </div>
                  </div>

                  <Button className="w-full gradient-maroon text-white border-0">
                    <Target className="w-4 h-4 mr-2" />
                    Update Goals
                  </Button>
                </CardContent>
              </Card>

              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle className="text-xl">Surah Progress</CardTitle>
                  <CardDescription>Your progress through different Surahs</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {progressData.surahProgress.map((surah, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">{surah.name}</span>
                          <div className="flex items-center space-x-2">
                            <Badge variant="secondary" className="text-xs">
                              {surah.memorized} memorized
                            </Badge>
                            <span className="text-xs text-muted-foreground">{surah.progress}%</span>
                          </div>
                        </div>
                        <Progress value={surah.progress} />
                        <p className="text-xs text-muted-foreground">
                          {surah.read}/{surah.total} ayahs read
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="achievements" className="space-y-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {progressData.achievements.map((achievement) => {
                const IconComponent = achievement.icon
                return (
                  <Card
                    key={achievement.id}
                    className={`border-border/50 transition-all duration-300 ${
                      achievement.earned
                        ? "bg-gradient-to-br from-accent/10 to-primary/10 border-primary/20"
                        : "hover:shadow-md"
                    }`}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start space-x-4">
                        <div
                          className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                            achievement.earned ? "gradient-gold" : "bg-muted"
                          }`}
                        >
                          <IconComponent
                            className={`w-6 h-6 ${achievement.earned ? "text-white" : "text-muted-foreground"}`}
                          />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h4 className="font-semibold">{achievement.title}</h4>
                            {achievement.earned && <CheckCircle className="w-4 h-4 text-green-600" />}
                          </div>
                          <p className="text-sm text-muted-foreground mb-3">{achievement.description}</p>
                          {achievement.earned ? (
                            <Badge className="gradient-gold text-white border-0 text-xs">
                              Earned {achievement.earnedDate}
                            </Badge>
                          ) : achievement.progress !== undefined ? (
                            <div className="space-y-2">
                              <Progress
                                value={
                                  achievement.target
                                    ? (achievement.progress / achievement.target) * 100
                                    : achievement.progress
                                }
                              />
                              <p className="text-xs text-muted-foreground">
                                {achievement.target
                                  ? `${achievement.progress}/${achievement.target}`
                                  : `${achievement.progress}%`}
                              </p>
                            </div>
                          ) : (
                            <Badge variant="secondary" className="text-xs">
                              In Progress
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </TabsContent>

          <TabsContent value="detailed" className="space-y-6">
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="text-xl">Detailed Statistics</CardTitle>
                <CardDescription>Comprehensive view of your learning metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-semibold text-primary">Reading Stats</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Total Ayahs</span>
                        <span className="font-medium">{progressData.overall.readAyahs.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Completion Rate</span>
                        <span className="font-medium">
                          {Math.round((progressData.overall.readAyahs / progressData.overall.totalAyahs) * 100)}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Average Accuracy</span>
                        <span className="font-medium">{progressData.overall.accuracy}%</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-semibold text-primary">Memorization Stats</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Memorized Ayahs</span>
                        <span className="font-medium">{progressData.overall.memorizedAyahs}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Retention Rate</span>
                        <span className="font-medium">94%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Review Accuracy</span>
                        <span className="font-medium">91%</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-semibold text-primary">Time Stats</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Total Study Time</span>
                        <span className="font-medium">{progressData.overall.studyTime}h</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Current Streak</span>
                        <span className="font-medium">{progressData.overall.currentStreak} days</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Longest Streak</span>
                        <span className="font-medium">{progressData.overall.longestStreak} days</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
