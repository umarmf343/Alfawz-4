"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Trophy, Crown, Medal, Star, TrendingUp, Users, Zap } from "lucide-react"

export default function LeaderboardPage() {
  const [timeframe, setTimeframe] = useState("weekly")
  const [category, setCategory] = useState("hasanat")

  const leaderboardData = {
    weekly: {
      hasanat: [
        {
          rank: 1,
          name: "Ahmad Al-Hafiz",
          avatar: "/placeholder.svg?height=40&width=40",
          hasanat: 1250,
          level: 15,
          streak: 12,
          badge: "crown",
        },
        {
          rank: 2,
          name: "Fatima Zahra",
          avatar: "/placeholder.svg?height=40&width=40",
          hasanat: 1180,
          level: 14,
          streak: 10,
          badge: "gold",
        },
        {
          rank: 3,
          name: "Omar Ibn Khattab",
          avatar: "/placeholder.svg?height=40&width=40",
          hasanat: 1050,
          level: 13,
          streak: 8,
          badge: "silver",
        },
        {
          rank: 4,
          name: "Aisha Siddiq",
          avatar: "/placeholder.svg?height=40&width=40",
          hasanat: 980,
          level: 12,
          streak: 15,
          badge: "bronze",
        },
        {
          rank: 5,
          name: "Ali Hassan",
          avatar: "/placeholder.svg?height=40&width=40",
          hasanat: 920,
          level: 11,
          streak: 6,
          badge: null,
        },
        {
          rank: 6,
          name: "Khadija Bint Khuwaylid",
          avatar: "/placeholder.svg?height=40&width=40",
          hasanat: 850,
          level: 10,
          streak: 9,
          badge: null,
        },
        {
          rank: 7,
          name: "Bilal Ibn Rabah",
          avatar: "/placeholder.svg?height=40&width=40",
          hasanat: 780,
          level: 9,
          streak: 4,
          badge: null,
        },
        {
          rank: 8,
          name: "Safiya Umm Habiba",
          avatar: "/placeholder.svg?height=40&width=40",
          hasanat: 720,
          level: 8,
          streak: 7,
          badge: null,
        },
      ],
      memorization: [
        {
          rank: 1,
          name: "Ahmad Al-Hafiz",
          avatar: "/placeholder.svg?height=40&width=40",
          verses: 450,
          surahs: 25,
          accuracy: 98,
          badge: "crown",
        },
        {
          rank: 2,
          name: "Fatima Zahra",
          avatar: "/placeholder.svg?height=40&width=40",
          verses: 420,
          surahs: 23,
          accuracy: 96,
          badge: "gold",
        },
        {
          rank: 3,
          name: "Omar Ibn Khattab",
          avatar: "/placeholder.svg?height=40&width=40",
          verses: 380,
          surahs: 21,
          accuracy: 94,
          badge: "silver",
        },
      ],
      reading: [
        {
          rank: 1,
          name: "Aisha Siddiq",
          avatar: "/placeholder.svg?height=40&width=40",
          pages: 120,
          hours: 45,
          sessions: 28,
          badge: "crown",
        },
        {
          rank: 2,
          name: "Ali Hassan",
          avatar: "/placeholder.svg?height=40&width=40",
          pages: 110,
          hours: 42,
          sessions: 25,
          badge: "gold",
        },
        {
          rank: 3,
          name: "Khadija Bint Khuwaylid",
          avatar: "/placeholder.svg?height=40&width=40",
          pages: 95,
          hours: 38,
          sessions: 22,
          badge: "silver",
        },
      ],
    },
  }

  const currentUser = {
    rank: 23,
    name: "You",
    hasanat: 847,
    level: 7,
    streak: 5,
  }

  const getBadgeIcon = (badge: string | null, rank: number) => {
    switch (badge) {
      case "crown":
        return <Crown className="h-5 w-5 text-yellow-500" />
      case "gold":
        return <Trophy className="h-5 w-5 text-yellow-500" />
      case "silver":
        return <Medal className="h-5 w-5 text-gray-400" />
      case "bronze":
        return <Medal className="h-5 w-5 text-amber-600" />
      default:
        return <span className="text-lg font-bold text-maroon-600">#{rank}</span>
    }
  }

  const getRankColor = (rank: number) => {
    if (rank === 1) return "bg-gradient-to-r from-yellow-400 to-yellow-600 text-white"
    if (rank === 2) return "bg-gradient-to-r from-gray-300 to-gray-500 text-white"
    if (rank === 3) return "bg-gradient-to-r from-amber-400 to-amber-600 text-white"
    return "bg-maroon-50 text-maroon-700"
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-cream-50 to-maroon-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-maroon-900 mb-4">Community Leaderboard</h1>
          <p className="text-lg text-maroon-700 max-w-2xl mx-auto">
            See how you rank among fellow students in your Qur'an learning journey
          </p>
        </div>

        {/* Your Rank Card */}
        <Card className="mb-8 bg-gradient-to-r from-maroon-600 to-maroon-700 text-white border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="bg-white/20 backdrop-blur-sm rounded-full p-3">
                  <Users className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">Your Current Rank</h3>
                  <p className="text-maroon-100">Keep learning to climb higher!</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-yellow-300">#{currentUser.rank}</div>
                <div className="text-sm text-maroon-100">{currentUser.hasanat} Hasanat</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <Tabs value={timeframe} onValueChange={setTimeframe} className="flex-1">
            <TabsList className="grid w-full grid-cols-3 bg-white/50 backdrop-blur-sm">
              <TabsTrigger value="weekly" className="data-[state=active]:bg-maroon-600 data-[state=active]:text-white">
                This Week
              </TabsTrigger>
              <TabsTrigger value="monthly" className="data-[state=active]:bg-maroon-600 data-[state=active]:text-white">
                This Month
              </TabsTrigger>
              <TabsTrigger value="alltime" className="data-[state=active]:bg-maroon-600 data-[state=active]:text-white">
                All Time
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <Tabs value={category} onValueChange={setCategory} className="flex-1">
            <TabsList className="grid w-full grid-cols-3 bg-white/50 backdrop-blur-sm">
              <TabsTrigger value="hasanat" className="data-[state=active]:bg-maroon-600 data-[state=active]:text-white">
                <Star className="h-4 w-4 mr-2" />
                Hasanat
              </TabsTrigger>
              <TabsTrigger
                value="memorization"
                className="data-[state=active]:bg-maroon-600 data-[state=active]:text-white"
              >
                <Trophy className="h-4 w-4 mr-2" />
                Memory
              </TabsTrigger>
              <TabsTrigger value="reading" className="data-[state=active]:bg-maroon-600 data-[state=active]:text-white">
                <TrendingUp className="h-4 w-4 mr-2" />
                Reading
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Leaderboard */}
        <div className="space-y-4">
          {leaderboardData.weekly[category as keyof typeof leaderboardData.weekly].map((user, index) => (
            <Card
              key={user.rank}
              className={`transition-all duration-300 hover:shadow-lg ${
                user.rank <= 3 ? "ring-2 ring-yellow-200 shadow-lg" : ""
              }`}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {/* Rank Badge */}
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center ${getRankColor(user.rank)}`}
                    >
                      {getBadgeIcon(user.badge, user.rank)}
                    </div>

                    {/* User Info */}
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.name} />
                        <AvatarFallback>
                          {user.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-semibold text-maroon-900">{user.name}</h3>
                        <div className="flex items-center gap-2 text-sm text-maroon-600">
                          {category === "hasanat" && (
                            <>
                              <span>Level {(user as any).level}</span>
                              <span>•</span>
                              <span>{(user as any).streak} day streak</span>
                            </>
                          )}
                          {category === "memorization" && (
                            <>
                              <span>{(user as any).surahs} Surahs</span>
                              <span>•</span>
                              <span>{(user as any).accuracy}% accuracy</span>
                            </>
                          )}
                          {category === "reading" && (
                            <>
                              <span>{(user as any).sessions} sessions</span>
                              <span>•</span>
                              <span>{(user as any).hours}h total</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="text-right">
                    <div className="text-2xl font-bold text-maroon-900">
                      {category === "hasanat" && `${(user as any).hasanat}`}
                      {category === "memorization" && `${(user as any).verses}`}
                      {category === "reading" && `${(user as any).pages}`}
                    </div>
                    <div className="text-sm text-maroon-600">
                      {category === "hasanat" && "Hasanat"}
                      {category === "memorization" && "Verses"}
                      {category === "reading" && "Pages"}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Motivation Card */}
        <Card className="mt-8 bg-gradient-to-r from-green-500 to-emerald-600 text-white border-0">
          <CardContent className="p-6 text-center">
            <Zap className="h-12 w-12 mx-auto mb-4 text-yellow-300" />
            <h3 className="text-xl font-bold mb-2">Keep Going!</h3>
            <p className="text-green-100 mb-4">
              You're making great progress. Stay consistent and you'll climb the leaderboard!
            </p>
            <Button className="bg-white text-green-600 hover:bg-green-50">Start Today's Session</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
