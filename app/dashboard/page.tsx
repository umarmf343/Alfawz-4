"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import AppLayout from "@/components/app-layout"
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
} from "lucide-react"
import Link from "next/link"

export default function DashboardPage() {
  const [userRole] = useState("student") // This would come from auth context

  const recentActivity = [
    { type: "reading", surah: "Al-Fatiha", ayahs: 7, time: "2 hours ago" },
    { type: "memorization", surah: "Al-Ikhlas", progress: 85, time: "Yesterday" },
    { type: "recitation", surah: "Al-Nas", score: 92, time: "2 days ago" },
  ]

  const upcomingGoals = [
    { title: "Complete Al-Mulk", progress: 65, deadline: "3 days" },
    { title: "Memorize 5 new Ayahs", progress: 40, deadline: "1 week" },
    { title: "Perfect Tajweed practice", progress: 80, deadline: "2 weeks" },
  ]

  return (
    <AppLayout>
      <div className="p-6">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-maroon-900 mb-2">Assalamu Alaikum, Ahmad</h2>
          <p className="text-lg text-maroon-700">Continue your journey of Qur'anic excellence</p>
          <div className="flex items-center mt-4">
            <Badge className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white border-0 px-3 py-1">
              <Star className="w-3 h-3 mr-1" />
              1,247 Hasanat Points
            </Badge>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-blue-600 to-blue-700 text-white border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm">Daily Streak</p>
                  <p className="text-2xl font-bold">7 days</p>
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
                  <p className="text-2xl font-bold">342</p>
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
                  <p className="text-2xl font-bold">2h 15m</p>
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
                  <p className="text-2xl font-bold">#12</p>
                </div>
                <Trophy className="w-8 h-8 text-orange-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
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
                      <h3 className="text-lg font-semibold text-maroon-900">Surah Al-Baqarah</h3>
                      <p className="text-sm text-maroon-600">The Cow • Ayah 156 of 286</p>
                    </div>
                    <Badge className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white border-0">
                      54% Complete
                    </Badge>
                  </div>
                  <Progress value={54} className="mb-4" />
                  <div className="flex space-x-3">
                    <Link href="/reader" className="flex-1">
                      <Button className="w-full bg-gradient-to-r from-maroon-600 to-maroon-700 text-white border-0">
                        <Play className="w-4 h-4 mr-2" />
                        Continue Reading
                      </Button>
                    </Link>
                    <Button variant="outline" className="bg-white">
                      <Mic className="w-4 h-4 mr-2" />
                      Practice
                    </Button>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
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
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Recent Activity</CardTitle>
                <CardDescription>Your learning progress over the past week</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivity.map((activity, index) => (
                    <div key={index} className="flex items-center justify-between p-4 rounded-lg bg-gray-50">
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
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between items-start">
                      <h4 className="font-medium text-sm">{goal.title}</h4>
                      <Badge variant="secondary" className="text-xs">
                        {goal.deadline}
                      </Badge>
                    </div>
                    <Progress value={goal.progress} className="h-2" />
                    <p className="text-xs text-gray-500">{goal.progress}% complete</p>
                  </div>
                ))}
                <Button variant="outline" className="w-full mt-4 bg-transparent">
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
                <div className="flex items-center space-x-3 p-3 rounded-lg bg-yellow-50 border border-yellow-200">
                  <div className="w-8 h-8 bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-full flex items-center justify-center">
                    <Award className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h4 className="font-medium text-sm">Week Warrior</h4>
                    <p className="text-xs text-gray-600">7-day reading streak</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 p-3 rounded-lg bg-maroon-50 border border-maroon-200">
                  <div className="w-8 h-8 bg-gradient-to-r from-maroon-600 to-maroon-700 rounded-full flex items-center justify-center">
                    <Star className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h4 className="font-medium text-sm">Perfect Reciter</h4>
                    <p className="text-xs text-gray-600">95%+ accuracy score</p>
                  </div>
                </div>

                <Button variant="outline" className="w-full mt-4 bg-transparent">
                  <Trophy className="w-4 h-4 mr-2" />
                  View All Achievements
                </Button>
              </CardContent>
            </Card>

            {/* Leaderboard */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Community Leaderboard</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  {[
                    { name: "Fatima A.", points: 2847, rank: 1 },
                    { name: "Omar K.", points: 2156, rank: 2 },
                    { name: "You", points: 1247, rank: 12, isUser: true },
                  ].map((user, index) => (
                    <div
                      key={index}
                      className={`flex items-center justify-between p-2 rounded ${user.isUser ? "bg-maroon-50 border border-maroon-200" : ""}`}
                    >
                      <div className="flex items-center space-x-3">
                        <span
                          className={`text-sm font-medium ${
                            user.rank === 1
                              ? "text-yellow-600"
                              : user.rank === 2
                                ? "text-gray-500"
                                : user.isUser
                                  ? "text-maroon-600"
                                  : "text-gray-600"
                          }`}
                        >
                          #{user.rank}
                        </span>
                        <span className={`text-sm ${user.isUser ? "font-medium" : ""}`}>{user.name}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Star className="w-3 h-3 text-yellow-500" />
                        <span className="text-sm">{user.points.toLocaleString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <Button variant="outline" className="w-full mt-4 bg-transparent">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  View Full Leaderboard
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
