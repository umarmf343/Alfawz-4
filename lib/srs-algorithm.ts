// SM-2 Algorithm Implementation for Quranic Memorization
// Based on SuperMemo SM-2 algorithm with adaptations for Arabic text memorization

export interface SRSCard {
  id: string
  userId: string
  ayahId: string
  surahId: string
  content: string
  easeFactor: number // 1.3 to 2.5+
  interval: number // Days until next review
  repetitions: number // Number of successful reviews
  dueDate: Date
  lastReviewed: Date | null
  createdAt: Date
  difficulty: number // 0-5 scale
  memorizationConfidence: number // 0-1 scale
  reviewHistory: ReviewRecord[]
}

export interface ReviewRecord {
  date: Date
  quality: number // 0-5 quality of response
  responseTime: number // Seconds taken to respond
  accuracy: number // 0-100 percentage
  easeFactor: number
  interval: number
  wasCorrect: boolean
}

export interface ReviewResult {
  quality: number // 0-5 scale
  responseTime: number
  accuracy: number
  wasCorrect: boolean
}

export class SRSAlgorithm {
  // SM-2 Algorithm constants
  private static readonly MIN_EASE_FACTOR = 1.3
  private static readonly DEFAULT_EASE_FACTOR = 2.5
  private static readonly EASE_FACTOR_MODIFIER = 0.1
  private static readonly MIN_INTERVAL = 1
  private static readonly QUALITY_THRESHOLD = 3 // Below this triggers repetition

  /**
   * Calculate next review parameters based on SM-2 algorithm
   */
  static calculateNextReview(card: SRSCard, result: ReviewResult): Partial<SRSCard> {
    const { quality, responseTime, accuracy, wasCorrect } = result

    let newEaseFactor = card.easeFactor
    let newInterval = card.interval
    let newRepetitions = card.repetitions

    // Update ease factor based on quality (SM-2 formula)
    if (quality >= 3) {
      newEaseFactor = Math.max(
        this.MIN_EASE_FACTOR,
        newEaseFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)),
      )
    } else {
      newEaseFactor = Math.max(this.MIN_EASE_FACTOR, newEaseFactor - 0.2)
    }

    // Calculate new interval based on SM-2 algorithm
    if (quality < this.QUALITY_THRESHOLD) {
      // Failed review - reset to beginning
      newRepetitions = 0
      newInterval = 1
    } else {
      // Successful review
      newRepetitions += 1

      if (newRepetitions === 1) {
        newInterval = 1
      } else if (newRepetitions === 2) {
        newInterval = 6
      } else {
        newInterval = Math.round(card.interval * newEaseFactor)
      }
    }

    // Apply Arabic-specific adjustments
    newInterval = this.applyArabicMemorizationAdjustments(newInterval, card, result)

    // Calculate new due date
    const newDueDate = new Date()
    newDueDate.setDate(newDueDate.getDate() + newInterval)

    // Update memorization confidence
    const newConfidence = this.calculateMemorizationConfidence(card, result)

    // Create review record
    const reviewRecord: ReviewRecord = {
      date: new Date(),
      quality,
      responseTime,
      accuracy,
      easeFactor: newEaseFactor,
      interval: newInterval,
      wasCorrect,
    }

    return {
      easeFactor: newEaseFactor,
      interval: newInterval,
      repetitions: newRepetitions,
      dueDate: newDueDate,
      lastReviewed: new Date(),
      memorizationConfidence: newConfidence,
      reviewHistory: [...card.reviewHistory, reviewRecord],
    }
  }

  /**
   * Apply Arabic-specific adjustments to interval calculation
   */
  private static applyArabicMemorizationAdjustments(baseInterval: number, card: SRSCard, result: ReviewResult): number {
    let adjustedInterval = baseInterval

    // Adjust based on ayah length (longer ayahs need more frequent review)
    const ayahLength = card.content.length
    if (ayahLength > 200) {
      adjustedInterval = Math.max(1, Math.round(adjustedInterval * 0.8))
    } else if (ayahLength < 50) {
      adjustedInterval = Math.round(adjustedInterval * 1.2)
    }

    // Adjust based on response time (slower responses need more frequent review)
    const avgResponseTime = this.calculateAverageResponseTime(card.reviewHistory)
    if (result.responseTime > avgResponseTime * 1.5) {
      adjustedInterval = Math.max(1, Math.round(adjustedInterval * 0.9))
    }

    // Adjust based on historical accuracy
    const avgAccuracy = this.calculateAverageAccuracy(card.reviewHistory)
    if (avgAccuracy < 80) {
      adjustedInterval = Math.max(1, Math.round(adjustedInterval * 0.85))
    }

    // Apply difficulty modifier
    const difficultyModifier = 1 - card.difficulty * 0.1
    adjustedInterval = Math.max(1, Math.round(adjustedInterval * difficultyModifier))

    return Math.max(this.MIN_INTERVAL, adjustedInterval)
  }

  /**
   * Calculate memorization confidence based on performance
   */
  private static calculateMemorizationConfidence(card: SRSCard, result: ReviewResult): number {
    const recentReviews = card.reviewHistory.slice(-5) // Last 5 reviews
    const recentAccuracies = recentReviews.map((r) => r.accuracy / 100)

    // Weight recent performance more heavily
    const weights = [0.4, 0.3, 0.15, 0.1, 0.05] // Most recent first
    let weightedConfidence = (result.accuracy / 100) * weights[0]

    recentAccuracies.forEach((accuracy, index) => {
      if (index < weights.length - 1) {
        weightedConfidence += accuracy * weights[index + 1]
      }
    })

    // Factor in consistency (lower variance = higher confidence)
    const variance = this.calculateVariance(recentAccuracies)
    const consistencyBonus = Math.max(0, 0.1 - variance)

    return Math.min(1, Math.max(0, weightedConfidence + consistencyBonus))
  }

  /**
   * Get cards due for review
   */
  static getDueCards(cards: SRSCard[], limit = 20): SRSCard[] {
    const now = new Date()
    return cards
      .filter((card) => card.dueDate <= now)
      .sort((a, b) => {
        // Prioritize by due date, then by difficulty
        const dateDiff = a.dueDate.getTime() - b.dueDate.getTime()
        if (dateDiff !== 0) return dateDiff
        return b.difficulty - a.difficulty // Higher difficulty first
      })
      .slice(0, limit)
  }

  /**
   * Get optimal study schedule for a user
   */
  static generateStudySchedule(
    cards: SRSCard[],
    dailyTarget = 10,
    daysAhead = 7,
  ): { date: Date; cards: SRSCard[]; newCards: number; reviewCards: number }[] {
    const schedule = []
    const now = new Date()

    for (let i = 0; i < daysAhead; i++) {
      const targetDate = new Date(now)
      targetDate.setDate(now.getDate() + i)
      targetDate.setHours(0, 0, 0, 0)

      const nextDay = new Date(targetDate)
      nextDay.setDate(targetDate.getDate() + 1)

      // Get cards due on this date
      const dueCards = cards.filter((card) => {
        const cardDue = new Date(card.dueDate)
        cardDue.setHours(0, 0, 0, 0)
        return cardDue.getTime() === targetDate.getTime()
      })

      // Separate new cards from review cards
      const reviewCards = dueCards.filter((card) => card.repetitions > 0)
      const newCards = dueCards.filter((card) => card.repetitions === 0)

      // Limit to daily target
      const totalCards = [...reviewCards, ...newCards].slice(0, dailyTarget)

      schedule.push({
        date: targetDate,
        cards: totalCards,
        newCards: Math.min(newCards.length, dailyTarget - reviewCards.length),
        reviewCards: reviewCards.length,
      })
    }

    return schedule
  }

  /**
   * Calculate study statistics
   */
  static calculateStudyStats(cards: SRSCard[]): {
    totalCards: number
    dueToday: number
    overdue: number
    averageConfidence: number
    masteredCards: number
    strugglingCards: number
    streakDays: number
  } {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    const dueToday = cards.filter((card) => {
      const cardDue = new Date(card.dueDate)
      cardDue.setHours(0, 0, 0, 0)
      return cardDue.getTime() === today.getTime()
    }).length

    const overdue = cards.filter((card) => card.dueDate < today).length

    const averageConfidence =
      cards.length > 0 ? cards.reduce((sum, card) => sum + card.memorizationConfidence, 0) / cards.length : 0

    const masteredCards = cards.filter((card) => card.memorizationConfidence >= 0.9 && card.repetitions >= 5).length

    const strugglingCards = cards.filter((card) => card.memorizationConfidence < 0.5 && card.repetitions >= 3).length

    // Calculate streak (simplified - would need user activity data in real app)
    const streakDays = this.calculateStreakDays(cards)

    return {
      totalCards: cards.length,
      dueToday,
      overdue,
      averageConfidence: Math.round(averageConfidence * 100) / 100,
      masteredCards,
      strugglingCards,
      streakDays,
    }
  }

  /**
   * Suggest optimal review quality based on performance
   */
  static suggestReviewQuality(responseTime: number, accuracy: number, expectedTime = 10): number {
    let quality = 3 // Default

    // Base quality on accuracy
    if (accuracy >= 95) quality = 5
    else if (accuracy >= 85) quality = 4
    else if (accuracy >= 70) quality = 3
    else if (accuracy >= 50) quality = 2
    else if (accuracy >= 25) quality = 1
    else quality = 0

    // Adjust based on response time
    if (responseTime <= expectedTime * 0.5) {
      quality = Math.min(5, quality + 1) // Quick and accurate
    } else if (responseTime > expectedTime * 2) {
      quality = Math.max(0, quality - 1) // Too slow
    }

    return quality
  }

  // Helper methods
  private static calculateAverageResponseTime(history: ReviewRecord[]): number {
    if (history.length === 0) return 10 // Default 10 seconds
    return history.reduce((sum, record) => sum + record.responseTime, 0) / history.length
  }

  private static calculateAverageAccuracy(history: ReviewRecord[]): number {
    if (history.length === 0) return 100
    return history.reduce((sum, record) => sum + record.accuracy, 0) / history.length
  }

  private static calculateVariance(values: number[]): number {
    if (values.length === 0) return 0
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length
    const squaredDiffs = values.map((val) => Math.pow(val - mean, 2))
    return squaredDiffs.reduce((sum, diff) => sum + diff, 0) / values.length
  }

  private static calculateStreakDays(cards: SRSCard[]): number {
    // Simplified streak calculation
    // In a real app, this would check user's daily activity
    const recentActivity = cards
      .filter((card) => card.lastReviewed)
      .map((card) => card.lastReviewed!)
      .sort((a, b) => b.getTime() - a.getTime())

    if (recentActivity.length === 0) return 0

    let streak = 0
    const now = new Date()
    const checkDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    for (let i = 0; i < 30; i++) {
      // Check last 30 days
      const hasActivity = recentActivity.some((date) => {
        const activityDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())
        return activityDate.getTime() === checkDate.getTime()
      })

      if (hasActivity) {
        streak++
      } else if (streak > 0) {
        break // Streak broken
      }

      checkDate.setDate(checkDate.getDate() - 1)
    }

    return streak
  }
}

/**
 * Factory function to create new SRS cards
 */
export function createSRSCard(
  userId: string,
  ayahId: string,
  surahId: string,
  content: string,
  difficulty = 3,
): SRSCard {
  return {
    id: `srs_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    userId,
    ayahId,
    surahId,
    content,
    easeFactor: SRSAlgorithm["DEFAULT_EASE_FACTOR"],
    interval: 1,
    repetitions: 0,
    dueDate: new Date(), // Due immediately for new cards
    lastReviewed: null,
    createdAt: new Date(),
    difficulty,
    memorizationConfidence: 0,
    reviewHistory: [],
  }
}
