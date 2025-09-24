"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Trophy, Star, Target, BookOpen, Users, Zap, Crown, Award, Gift, TrendingUp } from "lucide-react"

export default function AchievementsPage() {
  const [selectedCategory, setSelectedCategory] = useState("all")

  const userStats = {
    totalHasanat: 2847,
    level: 12,
    nextLevelHasanat: 3000,
    streak: 15,
    rank: 23,
  }

  const achievements = [
    {
      id: 1,
      title: "First Steps",
      description: "Complete your first Qur'an reading session",
      category: "reading",
      hasanat: 50,
      unlocked: true,
      progress: 100,
      icon: BookOpen,
      rarity: "common",
    },
    {
      id: 2,
      title: "Consistent Reader",
      description: "Read Qur'an for 7 consecutive days",
      category: "reading",
      hasanat: 200,
      unlocked: true,
      progress: 100,
      icon: Target,
      rarity: "uncommon",
    },
    {
      id: 3,
      title: "Memorization Master",
      description: "Memorize 10 complete Surahs",
      category: "memorization",
      hasanat: 500,
      unlocked: false,
      progress: 60,
      icon: Star,
      rarity: "rare",
    },
    {
      id: 4,
      title: "Community Helper",
      description: "Help 5 fellow students with their studies",
      category: "community",
      hasanat: 300,
      unlocked: true,
      progress: 100,
      icon: Users,
      rarity: "uncommon",
    },
    {
      id: 5,
      title: "Lightning Fast",
      description: "Complete 50 SRS reviews in under 10 minutes",
      category: "speed",
      hasanat: 150,
      unlocked: false,
      progress: 32,
      icon: Zap,
      rarity: "common",
    },
    {
      id: 6,
      title: "Hafiz Champion",
      description: "Complete memorization of the entire Qur'an",
      category: "memorization",
      hasanat: 5000,
      unlocked: false,
      progress: 15,
      icon: Crown,
      rarity: "legendary",
    },
  ]

  const categories = [
    { id: "all", label: "All Achievements", icon: Trophy },
    { id: "reading", label: "Reading", icon: BookOpen },
    { id: "memorization", label: "Memorization", icon: Star },
    { id: "community", label: "Community", icon: Users },
    { id: "speed", label: "Speed", icon: Zap },
  ]

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case "common":
        return "bg-gray-100 text-gray-800 border-gray-200"
      case "uncommon":
        return "bg-green-100 text-green-800 border-green-200"
      case "rare":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "epic":
        return "bg-purple-100 text-purple-800 border-purple-200"
      case "legendary":
        return "bg-gradient-to-r from-yellow-100 to-orange-100 text-orange-800 border-orange-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const filteredAchievements =
    selectedCategory === "all"
      ? achievements
      : achievements.filter((achievement) => achievement.category === selectedCategory)

  return (
    <div className="min-h-screen bg-gradient-to-br from-cream-50 to-maroon-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-maroon-900 mb-4">Achievements & Hasanat</h1>
          <p className="text-lg text-maroon-700 max-w-2xl mx-auto">
            Track your spiritual journey and earn Hasanat points for your dedication to learning the Qur'an
          </p>
        </div>

        {/* User Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-maroon-600 to-maroon-700 text-white border-0">
            <CardContent className="p-6 text-center">
              <Trophy className="h-8 w-8 mx-auto mb-2 text-yellow-300" />
              <div className="text-2xl font-bold">{userStats.totalHasanat.toLocaleString()}</div>
              <div className="text-maroon-100">Total Hasanat</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-yellow-500 to-orange-500 text-white border-0">
            <CardContent className="p-6 text-center">
              <Star className="h-8 w-8 mx-auto mb-2" />
              <div className="text-2xl font-bold">Level {userStats.level}</div>
              <div className="text-yellow-100">Current Level</div>
              <Progress value={(userStats.totalHasanat / userStats.nextLevelHasanat) * 100} className="mt-2 h-2" />
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500 to-emerald-600 text-white border-0">
            <CardContent className="p-6 text-center">
              <Target className="h-8 w-8 mx-auto mb-2" />
              <div className="text-2xl font-bold">{userStats.streak} days</div>
              <div className="text-green-100">Current Streak</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500 to-indigo-600 text-white border-0">
            <CardContent className="p-6 text-center">
              <Award className="h-8 w-8 mx-auto mb-2" />
              <div className="text-2xl font-bold">#{userStats.rank}</div>
              <div className="text-purple-100">Global Rank</div>
            </CardContent>
          </Card>
        </div>

        {/* Achievement Categories */}
        <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="mb-8">
          <TabsList className="grid w-full grid-cols-5 bg-white/50 backdrop-blur-sm">
            {categories.map((category) => (
              <TabsTrigger
                key={category.id}
                value={category.id}
                className="flex items-center gap-2 data-[state=active]:bg-maroon-600 data-[state=active]:text-white"
              >
                <category.icon className="h-4 w-4" />
                <span className="hidden sm:inline">{category.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {/* Achievements Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAchievements.map((achievement) => {
            const IconComponent = achievement.icon
            return (
              <Card
                key={achievement.id}
                className={`relative overflow-hidden transition-all duration-300 hover:shadow-lg ${
                  achievement.unlocked
                    ? "bg-white border-maroon-200 shadow-md"
                    : "bg-gray-50 border-gray-200 opacity-75"
                }`}
              >
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div
                      className={`p-3 rounded-full ${
                        achievement.unlocked ? "bg-maroon-100 text-maroon-600" : "bg-gray-100 text-gray-400"
                      }`}
                    >
                      <IconComponent className="h-6 w-6" />
                    </div>
                    <Badge className={`${getRarityColor(achievement.rarity)} capitalize`}>{achievement.rarity}</Badge>
                  </div>
                  <CardTitle className={`text-lg ${achievement.unlocked ? "text-maroon-900" : "text-gray-500"}`}>
                    {achievement.title}
                  </CardTitle>
                  <CardDescription className="text-sm">{achievement.description}</CardDescription>
                </CardHeader>

                <CardContent>
                  <div className="space-y-4">
                    {/* Progress Bar */}
                    {!achievement.unlocked && (
                      <div>
                        <div className="flex justify-between text-sm text-gray-600 mb-1">
                          <span>Progress</span>
                          <span>{achievement.progress}%</span>
                        </div>
                        <Progress value={achievement.progress} className="h-2" />
                      </div>
                    )}

                    {/* Hasanat Reward */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Gift className="h-4 w-4 text-yellow-600" />
                        <span className="text-sm font-medium text-gray-700">
                          {achievement.hasanat.toLocaleString()} Hasanat
                        </span>
                      </div>
                      {achievement.unlocked && (
                        <Badge className="bg-green-100 text-green-800 border-green-200">Unlocked</Badge>
                      )}
                    </div>
                  </div>
                </CardContent>

                {/* Unlock Effect */}
                {achievement.unlocked && (
                  <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-yellow-400 to-transparent opacity-20" />
                )}
              </Card>
            )
          })}
        </div>

        {/* Daily Challenges */}
        <Card className="mt-8 bg-gradient-to-r from-maroon-600 to-maroon-700 text-white border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <TrendingUp className="h-6 w-6 text-yellow-300" />
              Daily Challenges
            </CardTitle>
            <CardDescription className="text-maroon-100">
              Complete these challenges to earn bonus Hasanat points
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                <div className="flex items-center gap-3 mb-2">
                  <BookOpen className="h-5 w-5 text-yellow-300" />
                  <span className="font-medium">Read 5 Pages</span>
                </div>
                <Progress value={60} className="h-2 mb-2" />
                <div className="text-sm text-maroon-100">3/5 pages • +100 Hasanat</div>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                <div className="flex items-center gap-3 mb-2">
                  <Star className="h-5 w-5 text-yellow-300" />
                  <span className="font-medium">Review 20 Cards</span>
                </div>
                <Progress value={85} className="h-2 mb-2" />
                <div className="text-sm text-maroon-100">17/20 cards • +150 Hasanat</div>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                <div className="flex items-center gap-3 mb-2">
                  <Users className="h-5 w-5 text-yellow-300" />
                  <span className="font-medium">Help a Student</span>
                </div>
                <Progress value={0} className="h-2 mb-2" />
                <div className="text-sm text-maroon-100">0/1 helped • +200 Hasanat</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
