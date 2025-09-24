"use client"

import { Label } from "@/components/ui/label"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  BookOpen,
  Brain,
  Calendar,
  Clock,
  Star,
  RefreshCw,
  CheckCircle,
  XCircle,
  RotateCcw,
  Target,
  Zap,
  Award,
  Save,
} from "lucide-react"
import Link from "next/link"

interface MemorizationCard {
  id: string
  surah: string
  ayahNumber: number
  arabicText: string
  translation: string
  difficulty: 1 | 2 | 3 | 4 | 5
  nextReview: Date
  interval: number // days
  easeFactor: number
  reviewCount: number
  correctStreak: number
  lastReviewed?: Date
  status: "new" | "learning" | "review" | "mastered"
}

export default function MemorizationPage() {
  const [activeTab, setActiveTab] = useState("review")
  const [currentCard, setCurrentCard] = useState<MemorizationCard | null>(null)
  const [showAnswer, setShowAnswer] = useState(false)
  const [reviewSession, setReviewSession] = useState<MemorizationCard[]>([])
  const [sessionStats, setSessionStats] = useState({
    reviewed: 0,
    correct: 0,
    total: 0,
  })

  // Sample SRS data - in real app this would come from database
  const [memorizationCards] = useState<MemorizationCard[]>([
    {
      id: "1",
      surah: "Al-Fatiha",
      ayahNumber: 1,
      arabicText: "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ",
      translation: "In the name of Allah, the Entirely Merciful, the Especially Merciful.",
      difficulty: 2,
      nextReview: new Date(Date.now() - 86400000), // Due yesterday
      interval: 1,
      easeFactor: 2.5,
      reviewCount: 3,
      correctStreak: 2,
      status: "review",
    },
    {
      id: "2",
      surah: "Al-Fatiha",
      ayahNumber: 2,
      arabicText: "الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ",
      translation: "All praise is due to Allah, Lord of the worlds.",
      difficulty: 1,
      nextReview: new Date(Date.now() + 86400000), // Due tomorrow
      interval: 3,
      easeFactor: 2.8,
      reviewCount: 5,
      correctStreak: 4,
      status: "review",
    },
    {
      id: "3",
      surah: "Al-Ikhlas",
      ayahNumber: 1,
      arabicText: "قُلْ هُوَ اللَّهُ أَحَدٌ",
      translation: "Say, He is Allah, [who is] One,",
      difficulty: 3,
      nextReview: new Date(),
      interval: 0,
      easeFactor: 2.5,
      reviewCount: 0,
      correctStreak: 0,
      status: "new",
    },
  ])

  const dueCards = memorizationCards.filter((card) => card.nextReview <= new Date())
  const newCards = memorizationCards.filter((card) => card.status === "new")
  const learningCards = memorizationCards.filter((card) => card.status === "learning")
  const masteredCards = memorizationCards.filter((card) => card.status === "mastered")

  const startReviewSession = () => {
    const cardsToReview = [...dueCards, ...newCards.slice(0, 5)] // Max 5 new cards per session
    setReviewSession(cardsToReview)
    setCurrentCard(cardsToReview[0] || null)
    setSessionStats({ reviewed: 0, correct: 0, total: cardsToReview.length })
    setShowAnswer(false)
  }

  const handleCardResponse = (quality: 1 | 2 | 3 | 4 | 5) => {
    if (!currentCard) return

    // SRS Algorithm (simplified Anki algorithm)
    let newInterval = currentCard.interval
    let newEaseFactor = currentCard.easeFactor
    let newStatus = currentCard.status

    if (quality >= 3) {
      // Correct response
      if (currentCard.status === "new") {
        newInterval = 1
        newStatus = "learning"
      } else if (currentCard.status === "learning") {
        newInterval = 6
        newStatus = "review"
      } else {
        newInterval = Math.round(currentCard.interval * newEaseFactor)
      }

      newEaseFactor = newEaseFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
    } else {
      // Incorrect response
      newInterval = 1
      newStatus = "learning"
      newEaseFactor = Math.max(1.3, newEaseFactor - 0.2)
    }

    // Update session stats
    setSessionStats((prev) => ({
      ...prev,
      reviewed: prev.reviewed + 1,
      correct: prev.correct + (quality >= 3 ? 1 : 0),
    }))

    // Move to next card
    const nextIndex = reviewSession.findIndex((card) => card.id === currentCard.id) + 1
    if (nextIndex < reviewSession.length) {
      setCurrentCard(reviewSession[nextIndex])
      setShowAnswer(false)
    } else {
      // Session complete
      setCurrentCard(null)
      setReviewSession([])
    }
  }

  const getDifficultyColor = (difficulty: number) => {
    switch (difficulty) {
      case 1:
        return "bg-green-100 text-green-800"
      case 2:
        return "bg-blue-100 text-blue-800"
      case 3:
        return "bg-yellow-100 text-yellow-800"
      case 4:
        return "bg-orange-100 text-orange-800"
      case 5:
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getDifficultyLabel = (difficulty: number) => {
    const labels = ["", "Very Easy", "Easy", "Medium", "Hard", "Very Hard"]
    return labels[difficulty]
  }

  return (
    <div className="min-h-screen bg-gradient-cream">
      {/* Header */}
      <header className="border-b border-border/50 bg-background/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 gradient-maroon rounded-xl flex items-center justify-center">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">Memorization Center</h1>
                <p className="text-xs text-muted-foreground">Spaced Repetition System</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <Badge className="gradient-gold text-white border-0 px-3 py-1">
                <Star className="w-3 h-3 mr-1" />
                {masteredCards.length} Mastered
              </Badge>
              <Link href="/dashboard">
                <Button variant="outline" className="bg-transparent">
                  <BookOpen className="w-4 h-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="border-border/50 hover:shadow-lg transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Due Today</p>
                  <p className="text-2xl font-bold text-red-600">{dueCards.length}</p>
                </div>
                <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                  <Clock className="w-6 h-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 hover:shadow-lg transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">New Cards</p>
                  <p className="text-2xl font-bold text-blue-600">{newCards.length}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Zap className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 hover:shadow-lg transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Learning</p>
                  <p className="text-2xl font-bold text-orange-600">{learningCards.length}</p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                  <RefreshCw className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 hover:shadow-lg transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Mastered</p>
                  <p className="text-2xl font-bold text-green-600">{masteredCards.length}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <Award className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Review Session */}
        {currentCard ? (
          <Card className="border-border/50 shadow-lg mb-8">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl">Review Session</CardTitle>
                  <CardDescription>
                    Progress: {sessionStats.reviewed}/{sessionStats.total} •{" "}
                    {sessionStats.total > 0
                      ? Math.round((sessionStats.correct / Math.max(sessionStats.reviewed, 1)) * 100)
                      : 0}
                    % accuracy
                  </CardDescription>
                </div>
                <Badge className="gradient-gold text-white border-0">
                  {currentCard.surah} • Ayah {currentCard.ayahNumber}
                </Badge>
              </div>
              <Progress value={(sessionStats.reviewed / sessionStats.total) * 100} className="mt-4" />
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center space-y-6 py-8">
                <div className="arabic-text text-4xl lg:text-5xl leading-loose text-primary">
                  {currentCard.arabicText}
                </div>

                {showAnswer && (
                  <div className="space-y-4 animate-in fade-in duration-300">
                    <p className="text-lg text-foreground max-w-3xl mx-auto leading-relaxed">
                      {currentCard.translation}
                    </p>
                    <div className="flex items-center justify-center space-x-2">
                      <Badge variant="secondary">
                        {currentCard.surah} • Ayah {currentCard.ayahNumber}
                      </Badge>
                      <Badge className={getDifficultyColor(currentCard.difficulty)}>
                        {getDifficultyLabel(currentCard.difficulty)}
                      </Badge>
                    </div>
                  </div>
                )}
              </div>

              {!showAnswer ? (
                <div className="text-center">
                  <Button
                    onClick={() => setShowAnswer(true)}
                    size="lg"
                    className="gradient-maroon text-white border-0 px-8 py-4"
                  >
                    Show Answer
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-center text-muted-foreground">How well did you remember this ayah?</p>
                  <div className="grid grid-cols-5 gap-3">
                    <Button
                      onClick={() => handleCardResponse(1)}
                      variant="outline"
                      className="flex-col h-20 bg-red-50 border-red-200 hover:bg-red-100 text-red-700"
                    >
                      <XCircle className="w-5 h-5 mb-1" />
                      <span className="text-xs">Forgot</span>
                    </Button>
                    <Button
                      onClick={() => handleCardResponse(2)}
                      variant="outline"
                      className="flex-col h-20 bg-orange-50 border-orange-200 hover:bg-orange-100 text-orange-700"
                    >
                      <RotateCcw className="w-5 h-5 mb-1" />
                      <span className="text-xs">Hard</span>
                    </Button>
                    <Button
                      onClick={() => handleCardResponse(3)}
                      variant="outline"
                      className="flex-col h-20 bg-yellow-50 border-yellow-200 hover:bg-yellow-100 text-yellow-700"
                    >
                      <Target className="w-5 h-5 mb-1" />
                      <span className="text-xs">Good</span>
                    </Button>
                    <Button
                      onClick={() => handleCardResponse(4)}
                      variant="outline"
                      className="flex-col h-20 bg-blue-50 border-blue-200 hover:bg-blue-100 text-blue-700"
                    >
                      <CheckCircle className="w-5 h-5 mb-1" />
                      <span className="text-xs">Easy</span>
                    </Button>
                    <Button
                      onClick={() => handleCardResponse(5)}
                      variant="outline"
                      className="flex-col h-20 bg-green-50 border-green-200 hover:bg-green-100 text-green-700"
                    >
                      <Star className="w-5 h-5 mb-1" />
                      <span className="text-xs">Perfect</span>
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="review">Review</TabsTrigger>
              <TabsTrigger value="progress">Progress</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="review" className="space-y-6">
              <div className="text-center space-y-6">
                <div>
                  <h2 className="text-3xl font-bold text-foreground mb-2">Ready to Review?</h2>
                  <p className="text-lg text-muted-foreground">
                    You have {dueCards.length} cards due for review and {newCards.length} new cards to learn
                  </p>
                </div>

                <div className="flex justify-center space-x-4">
                  <Button
                    onClick={startReviewSession}
                    size="lg"
                    className="gradient-maroon text-white border-0 px-8 py-4"
                    disabled={dueCards.length === 0 && newCards.length === 0}
                  >
                    <Brain className="w-5 h-5 mr-2" />
                    Start Review Session
                  </Button>
                  <Button variant="outline" size="lg" className="px-8 py-4 bg-transparent">
                    <Calendar className="w-5 h-5 mr-2" />
                    Schedule Review
                  </Button>
                </div>

                {sessionStats.total > 0 && !currentCard && (
                  <Card className="border-border/50 max-w-md mx-auto">
                    <CardHeader>
                      <CardTitle className="text-center">Session Complete!</CardTitle>
                    </CardHeader>
                    <CardContent className="text-center space-y-4">
                      <div className="text-3xl font-bold text-primary">
                        {Math.round((sessionStats.correct / sessionStats.reviewed) * 100)}%
                      </div>
                      <p className="text-muted-foreground">
                        {sessionStats.correct} out of {sessionStats.reviewed} cards correct
                      </p>
                      <Button
                        onClick={() => setSessionStats({ reviewed: 0, correct: 0, total: 0 })}
                        className="gradient-gold text-white border-0"
                      >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Start New Session
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Upcoming Reviews */}
              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle>Upcoming Reviews</CardTitle>
                  <CardDescription>Your review schedule for the next few days</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {memorizationCards
                      .filter((card) => card.nextReview > new Date())
                      .sort((a, b) => a.nextReview.getTime() - b.nextReview.getTime())
                      .slice(0, 5)
                      .map((card) => (
                        <div
                          key={card.id}
                          className="flex items-center justify-between p-3 rounded-lg border border-border/50"
                        >
                          <div>
                            <h4 className="font-medium">
                              {card.surah} • Ayah {card.ayahNumber}
                            </h4>
                            <p className="text-sm text-muted-foreground">{card.arabicText.substring(0, 50)}...</p>
                          </div>
                          <div className="text-right">
                            <Badge variant="secondary" className="mb-1">
                              {card.nextReview.toLocaleDateString()}
                            </Badge>
                            <p className="text-xs text-muted-foreground">
                              {Math.ceil((card.nextReview.getTime() - Date.now()) / (1000 * 60 * 60 * 24))} days
                            </p>
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="progress" className="space-y-6">
              <div className="grid lg:grid-cols-2 gap-6">
                <Card className="border-border/50">
                  <CardHeader>
                    <CardTitle>Learning Progress</CardTitle>
                    <CardDescription>Your memorization journey overview</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Total Cards</span>
                        <span className="font-medium">{memorizationCards.length}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Mastered</span>
                        <span className="font-medium text-green-600">{masteredCards.length}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">In Review</span>
                        <span className="font-medium text-blue-600">
                          {memorizationCards.filter((c) => c.status === "review").length}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Learning</span>
                        <span className="font-medium text-orange-600">{learningCards.length}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">New</span>
                        <span className="font-medium text-gray-600">{newCards.length}</span>
                      </div>
                    </div>

                    <div className="pt-4">
                      <div className="flex justify-between text-sm mb-2">
                        <span>Overall Progress</span>
                        <span>
                          {Math.round(((masteredCards.length + learningCards.length) / memorizationCards.length) * 100)}
                          %
                        </span>
                      </div>
                      <Progress
                        value={((masteredCards.length + learningCards.length) / memorizationCards.length) * 100}
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-border/50">
                  <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                    <CardDescription>Your learning activity this week</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center space-x-3 p-3 rounded-lg bg-green-50">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">Mastered Al-Ikhlas</p>
                          <p className="text-xs text-muted-foreground">2 hours ago</p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3 p-3 rounded-lg bg-blue-50">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <Brain className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">Reviewed 15 cards</p>
                          <p className="text-xs text-muted-foreground">Yesterday</p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3 p-3 rounded-lg bg-orange-50">
                        <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                          <Star className="w-4 h-4 text-orange-600" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">7-day streak achieved</p>
                          <p className="text-xs text-muted-foreground">2 days ago</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="settings" className="space-y-6">
              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle>SRS Settings</CardTitle>
                  <CardDescription>Customize your spaced repetition experience</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium">New Cards Per Day</Label>
                      <div className="flex items-center space-x-4 mt-2">
                        <input
                          type="range"
                          min="1"
                          max="20"
                          defaultValue="5"
                          className="flex-1 h-2 bg-muted rounded-lg appearance-none cursor-pointer"
                        />
                        <span className="text-sm font-medium w-8">5</span>
                      </div>
                    </div>

                    <div>
                      <Label className="text-sm font-medium">Maximum Reviews Per Day</Label>
                      <div className="flex items-center space-x-4 mt-2">
                        <input
                          type="range"
                          min="10"
                          max="100"
                          defaultValue="50"
                          className="flex-1 h-2 bg-muted rounded-lg appearance-none cursor-pointer"
                        />
                        <span className="text-sm font-medium w-8">50</span>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Label className="text-sm font-medium">Review Preferences</Label>
                      <div className="space-y-2">
                        <label className="flex items-center space-x-3 cursor-pointer">
                          <input type="checkbox" defaultChecked className="rounded border-border" />
                          <span className="text-sm">Show translation during review</span>
                        </label>
                        <label className="flex items-center space-x-3 cursor-pointer">
                          <input type="checkbox" className="rounded border-border" />
                          <span className="text-sm">Auto-advance after correct answer</span>
                        </label>
                        <label className="flex items-center space-x-3 cursor-pointer">
                          <input type="checkbox" defaultChecked className="rounded border-border" />
                          <span className="text-sm">Play audio during review</span>
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-border">
                    <Button className="gradient-maroon text-white border-0">
                      <Save className="w-4 h-4 mr-2" />
                      Save Settings
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  )
}
