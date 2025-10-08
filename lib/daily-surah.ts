import { getSurahInfo, getVerseText } from "@/lib/quran-data"

export interface DailySurahSection {
  surahNumber: number
  arabicName: string
  englishName: string
  ayahCount: number
  verses: { key: string; text: string }[]
}

export interface DailySurahRecommendation {
  slug: string
  title: string
  encouragement: string
  reason: string
  bestTimeLabel: string
  estimatedHasanat: number
  estimatedLetters: number
  estimatedMinutes: number
  sections: DailySurahSection[]
}

const LETTER_HASANAT_MULTIPLIER = 10

const BASE_RECOMMENDATIONS = {
  kahf: {
    slug: "surah-al-kahf",
    title: "Friday Light • Surah Al-Kahf",
    encouragement:
      "It's Friday—reciting Surah Al-Kahf brings a light between this week and the next. Seek the protection of its stories today.",
    reason: "Beloved Sunnah for Fridays",
    bestTimeLabel: "Friday daylight",
    surahs: [18],
  },
  mulk: {
    slug: "surah-al-mulk",
    title: "Night Protection • Surah Al-Mulk",
    encouragement:
      "Before resting, recite Surah Al-Mulk. Its intercession protects the believer until the morning, in shaa Allah.",
    reason: "Prophetic nighttime routine",
    bestTimeLabel: "After Isha",
    surahs: [67],
  },
  quls: {
    slug: "evening-protection-quls",
    title: "Evening Shield • Three Quls",
    encouragement:
      "Wrap up the day with Surah Al-Ikhlas, Al-Falaq, and An-Nas for protection and serenity.",
    reason: "Nightly protection trio",
    bestTimeLabel: "After Maghrib",
    surahs: [112, 113, 114],
  },
  yasin: {
    slug: "morning-surah-yasin",
    title: "Morning Barakah • Surah Yasin",
    encouragement:
      "Begin your day with Surah Yasin to soften the heart and invite barakah into every step.",
    reason: "Daybreak devotion",
    bestTimeLabel: "Early morning",
    surahs: [36],
  },
  waqiah: {
    slug: "sustenance-surah-waqiah",
    title: "Sustenance Reminder • Surah Al-Waqiah",
    encouragement:
      "An afternoon recitation of Surah Al-Waqiah is a timeless reminder that provision flows from Allah alone.",
    reason: "Afternoon reflection",
    bestTimeLabel: "Afternoon",
    surahs: [56],
  },
} as const

type RecommendationKey = keyof typeof BASE_RECOMMENDATIONS

function getVersesForSurah(surahNumber: number): DailySurahSection {
  const surahInfo = getSurahInfo(surahNumber)
  const ayahCount = surahInfo?.ayahCount ?? 0
  const verses: { key: string; text: string }[] = []

  for (let ayah = 1; ayah <= ayahCount; ayah += 1) {
    const key = `${surahNumber}:${ayah}`
    verses.push({ key, text: getVerseText(key) })
  }

  return {
    surahNumber,
    arabicName: surahInfo?.arabicName ?? `سورة ${surahNumber}`,
    englishName: surahInfo?.englishName ?? `Surah ${surahNumber}`,
    ayahCount,
    verses,
  }
}

function countArabicLetters(text: string): number {
  const matches = text.match(/[\u0621-\u064A]/g)
  return matches ? matches.length : 0
}

function buildRecommendation(key: RecommendationKey): DailySurahRecommendation {
  const config = BASE_RECOMMENDATIONS[key]
  const sections = config.surahs.map(getVersesForSurah)
  const totalLetters = sections.reduce((sum, section) => {
    const sectionLetters = section.verses.reduce((count, verse) => count + countArabicLetters(verse.text), 0)
    return sum + sectionLetters
  }, 0)
  const totalAyahs = sections.reduce((sum, section) => sum + section.ayahCount, 0)
  const estimatedMinutes = Math.max(5, Math.round(totalAyahs * 0.75))

  return {
    slug: config.slug,
    title: config.title,
    encouragement: config.encouragement,
    reason: config.reason,
    bestTimeLabel: config.bestTimeLabel,
    estimatedHasanat: totalLetters * LETTER_HASANAT_MULTIPLIER,
    estimatedLetters: totalLetters,
    estimatedMinutes,
    sections,
  }
}

export function getDailySurahRecommendations(now: Date = new Date()): DailySurahRecommendation[] {
  const day = now.getDay()
  const hour = now.getHours()
  const recommendations: DailySurahRecommendation[] = []

  if (day === 5) {
    recommendations.push(buildRecommendation("kahf"))
  }

  if (hour >= 18) {
    recommendations.push(buildRecommendation("quls"))
    recommendations.push(buildRecommendation("waqiah"))
  } else if (hour < 10) {
    recommendations.push(buildRecommendation("yasin"))
  } else {
    recommendations.push(buildRecommendation("waqiah"))
  }

  if (recommendations.length === 0) {
    recommendations.push(buildRecommendation("yasin"))
  }

  return recommendations
}

export function getDailySurahDetail(slug: string, now: Date = new Date()): DailySurahRecommendation | null {
  const recommendationKeys = Object.keys(BASE_RECOMMENDATIONS) as RecommendationKey[]
  const key = recommendationKeys.find((candidate) => BASE_RECOMMENDATIONS[candidate].slug === slug)
  if (!key) {
    return null
  }

  const recommendation = buildRecommendation(key)

  if (key === "kahf") {
    return recommendation
  }

  if (key === "mulk" || key === "quls") {
    return recommendation
  }

  if (key === "yasin" && now.getHours() >= 10) {
    return buildRecommendation("waqiah")
  }

  return recommendation
}
