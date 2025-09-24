"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Brain, Clock, CheckCircle, RotateCcw, Eye, EyeOff, Star } from "lucide-react"
import type { SRSCard, ReviewResult } from "@/lib/srs-algorithm"

interface SRSStudySessionProps {
  cards: SRSCard[]
  onSessionComplete: (results: { card: SRSCard; result: ReviewResult }[]) => void
  dailyTarget?: number
}

export function SRSStudySession({ cards, onSessionComplete, dailyTarget = 10 }: SRSStudySessionProps) {
  const [currentCardIndex, setCurrentCardIndex] = useState(0)
  const [showAnswer, setShowAnswer] = useState(false)
  const [sessionResults, setSessionResults] = useState<{ card: SRSCard; result: ReviewResult }[]>([])
  const [startTime, setStartTime] = useState<Date>(new Date())
  const [cardStartTime, setCardStartTime] = useState<Date>(new Date())
  const [isSessionComplete, setIsSessionComplete] = useState(false)

  const currentCard = cards[currentCardIndex]
  const progress = ((currentCardIndex + (showAnswer ? 0.5 : 0)) / cards.length) * 100

  useEffect(() => {
    setCardStartTime(new Date())
  }, [currentCardIndex])

  const handleReveal = () => {
    setShowAnswer(true)
  }

  const handleQualityResponse = (quality: number) => {
    if (!currentCard) return

    const responseTime = (new Date().getTime() - cardStartTime.getTime()) / 1000
    const accuracy = quality >= 3 ? 85 + (quality - 3) * 5 : quality * 20 // Simplified accuracy calculation

    const result: ReviewResult = {
      quality,
      responseTime,
      accuracy,
      wasCorrect: quality >= 3,
    }

    const newResults = [...sessionResults, { card: currentCard, result }]
    setSessionResults(newResults)

    // Move to next card or complete session
    if (currentCardIndex < cards.length - 1) {
      setCurrentCardIndex(currentCardIndex + 1)
      setShowAnswer(false)
    } else {
      setIsSessionComplete(true)
      onSessionComplete(newResults)
    }
  }

  const getQualityLabel = (quality: number): string => {
    const labels = [
      "Complete blackout",
      "Incorrect, but familiar",
      "Incorrect, but close",
      "Correct with difficulty",
      "Correct with hesitation",
      "Perfect recall",
    ]
    return labels[quality] || "Unknown"
  }

  const getQualityColor = (quality: number): string => {
    if (quality >= 5) return "bg-green-600 hover:bg-green-700"
    if (quality >= 4) return "bg-blue-600 hover:bg-blue-700"
    if (quality >= 3) return "bg-yellow-600 hover:bg-yellow-700"
    if (quality >= 2) return "bg-orange-600 hover:bg-orange-700"
    return "bg-red-600 hover:bg-red-700"
  }

  if (isSessionComplete) {
    const sessionStats = calculateSessionStats(sessionResults)

    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Card className="border-border/50">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-maroon-800 flex items-center justify-center">
              <CheckCircle className="w-8 h-8 mr-3 text-green-600" />
              Session Complete!
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Session Statistics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-maroon-700">{sessionStats.totalCards}</div>
                <div className="text-sm text-gray-600">Cards Reviewed</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">{sessionStats.correctCards}</div>
                <div className="text-sm text-gray-600">Correct</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">{sessionStats.averageAccuracy}%</div>
                <div className="text-sm text-gray-600">Accuracy</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600">{sessionStats.totalHasanat}</div>
                <div className="text-sm text-gray-600">Hasanat Earned</div>
              </div>
            </div>

            {/* Performance Breakdown */}
            <div className="space-y-3">
              <h4 className="font-semibold text-maroon-800">Performance Breakdown:</h4>
              <div className="grid grid-cols-3 gap-2">
                {[5, 4, 3, 2, 1, 0].map((quality) => {
                  const count = sessionStats.qualityDistribution[quality] || 0
                  const percentage = (count / sessionStats.totalCards) * 100
                  return (
                    <div key={quality} className="text-center">
                      <div
                        className={`w-full h-2 rounded ${getQualityColor(quality)} opacity-70`}
                        style={{ height: `${Math.max(4, percentage)}px` }}
                      />
                      <div className="text-xs mt-1">
                        Q{quality}: {count}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Next Review Schedule */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-semibold text-blue-800 mb-2">Next Review Schedule:</h4>
              <div className="text-sm text-blue-700">
                <div>• {sessionStats.reviewTomorrow} cards due tomorrow</div>
                <div>• {sessionStats.reviewThisWeek} cards due this week</div>
                <div>• Average interval increased to {sessionStats.averageNewInterval} days</div>
              </div>
            </div>

            <div className="flex justify-center space-x-4">
              <Button onClick={() => window.location.reload()} className="bg-maroon-600 hover:bg-maroon-700 text-white">
                <RotateCcw className="w-4 h-4 mr-2" />
                Start New Session
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!currentCard) {
    return (
      <div className="text-center py-12">
        <Brain className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-600">No cards available for review</h3>
        <p className="text-gray-500 mt-2">Great job! You're all caught up with your reviews.</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Progress Header */}
      <Card className="border-border/50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-4">
              <Badge variant="outline" className="bg-maroon-50 text-maroon-700 border-maroon-200">
                Card {currentCardIndex + 1} of {cards.length}
              </Badge>
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                <Clock className="w-3 h-3 mr-1" />
                {Math.floor((new Date().getTime() - startTime.getTime()) / 60000)}m
              </Badge>
            </div>
            <div className="text-sm text-gray-600">Target: {dailyTarget} cards</div>
          </div>
          <Progress value={progress} className="h-2" />
        </CardContent>
      </Card>

      {/* Study Card */}
      <Card className="border-border/50 min-h-96">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg text-maroon-800">Memorization Review</CardTitle>
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                <Star className="w-3 h-3 mr-1" />
                Confidence: {Math.round(currentCard.memorizationConfidence * 100)}%
              </Badge>
              <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                Rep: {currentCard.repetitions}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Question/Prompt */}
          <div className="text-center">
            <div className="text-lg font-medium text-gray-700 mb-4">Recite the following ayah:</div>

            {!showAnswer ? (
              <div className="space-y-6">
                <div className="bg-gray-100 p-8 rounded-lg">
                  <div className="text-6xl text-gray-300">
                    <EyeOff className="w-16 h-16 mx-auto" />
                  </div>
                  <p className="text-gray-500 mt-4">Try to recall the ayah from memory</p>
                </div>

                <Button
                  onClick={handleReveal}
                  className="bg-maroon-600 hover:bg-maroon-700 text-white px-8 py-3"
                  size="lg"
                >
                  <Eye className="w-5 h-5 mr-2" />
                  Reveal Answer
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Arabic Text */}
                <div className="bg-cream-50 p-6 rounded-lg border-2 border-maroon-100">
                  <div className="text-right text-3xl leading-relaxed font-arabic text-maroon-800">
                    {currentCard.content}
                  </div>
                </div>

                {/* Quality Assessment */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-maroon-800 text-center">How well did you recall this ayah?</h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {[5, 4, 3, 2, 1, 0].map((quality) => (
                      <Button
                        key={quality}
                        onClick={() => handleQualityResponse(quality)}
                        className={`${getQualityColor(quality)} text-white p-4 h-auto text-left`}
                        variant="default"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="text-2xl font-bold">Q{quality}</div>
                          <div>
                            <div className="font-medium">{getQualityLabel(quality)}</div>
                            <div className="text-xs opacity-90">
                              {quality >= 3 ? "Will increase interval" : "Will reset progress"}
                            </div>
                          </div>
                        </div>
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Card Info */}
      <Card className="border-border/50">
        <CardContent className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-lg font-semibold text-maroon-700">{currentCard.easeFactor.toFixed(1)}</div>
              <div className="text-xs text-gray-600">Ease Factor</div>
            </div>
            <div>
              <div className="text-lg font-semibold text-blue-700">{currentCard.interval}d</div>
              <div className="text-xs text-gray-600">Current Interval</div>
            </div>
            <div>
              <div className="text-lg font-semibold text-green-700">{currentCard.repetitions}</div>
              <div className="text-xs text-gray-600">Repetitions</div>
            </div>
            <div>
              <div className="text-lg font-semibold text-purple-700">{currentCard.difficulty}/5</div>
              <div className="text-xs text-gray-600">Difficulty</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function calculateSessionStats(results: { card: SRSCard; result: ReviewResult }[]) {
  const totalCards = results.length
  const correctCards = results.filter((r) => r.result.wasCorrect).length
  const averageAccuracy = Math.round(results.reduce((sum, r) => sum + r.result.accuracy, 0) / totalCards)

  // Calculate Hasanat (simplified)
  const totalHasanat = results.reduce((sum, r) => {
    const arabicLetters = r.card.content.match(/[\u0627-\u064A]/g)?.length || 0
    return sum + Math.round(arabicLetters * 10 * (r.result.accuracy / 100))
  }, 0)

  // Quality distribution
  const qualityDistribution: { [key: number]: number } = {}
  results.forEach((r) => {
    qualityDistribution[r.result.quality] = (qualityDistribution[r.result.quality] || 0) + 1
  })

  // Simulate next review schedule (would be calculated by SRS algorithm)
  const reviewTomorrow = results.filter((r) => r.result.quality >= 3).length
  const reviewThisWeek = Math.round(totalCards * 0.7)
  const averageNewInterval = Math.round(
    results.reduce((sum, r) => {
      // Simulate new interval calculation
      const baseInterval = r.card.interval
      const multiplier = r.result.quality >= 3 ? r.card.easeFactor : 0.5
      return sum + Math.max(1, Math.round(baseInterval * multiplier))
    }, 0) / totalCards,
  )

  return {
    totalCards,
    correctCards,
    averageAccuracy,
    totalHasanat,
    qualityDistribution,
    reviewTomorrow,
    reviewThisWeek,
    averageNewInterval,
  }
}
