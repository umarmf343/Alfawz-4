// Al-Quran Cloud API Integration
// Provides access to authentic Quranic text, translations, and audio

import localQuranText from "@/data/quran/quran-uthmani.json"
import localSurahMeta from "@/data/quran.json"

export interface Surah {
  number: number
  name: string
  englishName: string
  englishNameTranslation: string
  numberOfAyahs: number
  revelationType: "Meccan" | "Medinan"
}

export interface Ayah {
  number: number
  text: string
  numberInSurah: number
  juz: number
  manzil: number
  page: number
  ruku: number
  hizbQuarter: number
  sajda?: boolean
}

export interface Translation {
  text: string
  language: string
  translator: string
}

export interface Reciter {
  id: number
  name: string
  englishName: string
  format: string
  bitrate: string
}

export interface AudioSegment {
  url: string
  duration?: number
  segments?: { start: number; end: number; text: string }[]
}

export interface QuranEdition {
  identifier: string
  language: string
  name: string
  englishName: string
  format: "text" | "audio"
  type: "quran" | "translation" | "transliteration"
}

type LocalSurahMetadata = {
  name: string
  name_translations: Record<string, string>
  number_of_ayah: number
  number_of_surah: number
  place: string
  type: string
  recitation?: string
}

const ESTIMATED_AYAH_PER_PAGE = 10
const verseTextFallback = localQuranText as Record<string, string>
const localSurahMetadata = localSurahMeta as LocalSurahMetadata[]

const fallbackSurahContent = new Map<
  number,
  { surah: Surah; ayahs: Ayah[]; recitation?: string }
>()

const fallbackSurahList: Surah[] = []

let ayahSequenceOffset = 0
let pageSequenceOffset = 1

for (const surah of localSurahMetadata) {
  const englishTranslation = surah.name_translations?.en ?? surah.name
  const normalizedType = surah.type?.toLowerCase().includes("mak") ? "Meccan" : "Medinan"

  const normalizedSurah: Surah = {
    number: surah.number_of_surah,
    name: surah.name,
    englishName: surah.name,
    englishNameTranslation: englishTranslation,
    numberOfAyahs: surah.number_of_ayah,
    revelationType: normalizedType,
  }

  const estimatedPages = Math.max(1, Math.ceil(surah.number_of_ayah / ESTIMATED_AYAH_PER_PAGE))

  const ayahs: Ayah[] = Array.from({ length: surah.number_of_ayah }, (_, index) => {
    const ayahNumber = index + 1
    const verseKey = `${surah.number_of_surah}:${ayahNumber}`
    const text = verseTextFallback[verseKey] ?? ""

    return {
      number: ayahSequenceOffset + ayahNumber,
      text,
      numberInSurah: ayahNumber,
      juz: 0,
      manzil: 0,
      page: pageSequenceOffset + Math.floor(index / ESTIMATED_AYAH_PER_PAGE),
      ruku: 0,
      hizbQuarter: 0,
      sajda: undefined,
    }
  })

  fallbackSurahContent.set(surah.number_of_surah, {
    surah: normalizedSurah,
    ayahs,
    recitation: surah.recitation,
  })

  fallbackSurahList.push(normalizedSurah)

  ayahSequenceOffset += surah.number_of_ayah
  pageSequenceOffset += estimatedPages
}

const fallbackReciters: Reciter[] = [
  {
    id: 1,
    name: "Mishary Rashid Alafasy",
    englishName: "Mishary Rashid Alafasy",
    format: "audio",
    bitrate: "128kbps",
  },
]

const fallbackEditions: QuranEdition[] = [
  {
    identifier: "quran-uthmani",
    language: "ar",
    name: "Mushaf al-Madina",
    englishName: "Uthmani Script",
    format: "text",
    type: "quran",
  },
  {
    identifier: "en.sahih",
    language: "en",
    name: "Saheeh International",
    englishName: "Saheeh International",
    format: "text",
    type: "translation",
  },
]

class QuranCloudAPI {
  private baseUrl = "https://api.alquran.cloud/v1"
  private cache = new Map<string, any>()
  private cacheExpiry = 24 * 60 * 60 * 1000 // 24 hours

  /**
   * Get all surahs with metadata
   */
  async getSurahs(): Promise<Surah[]> {
    const cacheKey = "surahs"
    const cached = this.getFromCache(cacheKey)
    if (cached) return cached

    try {
      const response = await fetch(`${this.baseUrl}/surah`)
      const data = await response.json()

      if (data.code === 200) {
        const surahs = data.data.map((surah: any) => ({
          number: surah.number,
          name: surah.name,
          englishName: surah.englishName,
          englishNameTranslation: surah.englishNameTranslation,
          numberOfAyahs: surah.numberOfAyahs,
          revelationType: surah.revelationType,
        }))

        this.setCache(cacheKey, surahs)
        return surahs
      }
      throw new Error("Failed to fetch surahs")
    } catch (error) {
      console.error("Error fetching surahs:", error)
      this.setCache(cacheKey, fallbackSurahList)
      return fallbackSurahList
    }
  }

  /**
   * Get a specific surah with ayahs
   */
  async getSurah(surahNumber: number, edition = "quran-uthmani"): Promise<{ surah: Surah; ayahs: Ayah[] } | null> {
    const cacheKey = `surah_${surahNumber}_${edition}`
    const cached = this.getFromCache(cacheKey)
    if (cached) return cached

    try {
      const response = await fetch(`${this.baseUrl}/surah/${surahNumber}/${edition}`)
      const data = await response.json()

      if (data.code === 200) {
        const result = {
          surah: {
            number: data.data.number,
            name: data.data.name,
            englishName: data.data.englishName,
            englishNameTranslation: data.data.englishNameTranslation,
            numberOfAyahs: data.data.numberOfAyahs,
            revelationType: data.data.revelationType,
          },
          ayahs: data.data.ayahs.map((ayah: any) => ({
            number: ayah.number,
            text: ayah.text,
            numberInSurah: ayah.numberInSurah,
            juz: ayah.juz,
            manzil: ayah.manzil,
            page: ayah.page,
            ruku: ayah.ruku,
            hizbQuarter: ayah.hizbQuarter,
            sajda: ayah.sajda,
          })),
        }

        this.setCache(cacheKey, result)
        return result
      }
      throw new Error("Failed to fetch surah")
    } catch (error) {
      console.error("Error fetching surah:", error)
      const fallback = fallbackSurahContent.get(surahNumber)
      if (fallback) {
        this.setCache(cacheKey, fallback)
        return fallback
      }
      return null
    }
  }

  /**
   * Get specific ayah with translation
   */
  async getAyah(
    surahNumber: number,
    ayahNumber: number,
    editions: string[] = ["quran-uthmani", "en.sahih"],
  ): Promise<{
    arabic: Ayah
    translations: Translation[]
  } | null> {
    const cacheKey = `ayah_${surahNumber}_${ayahNumber}_${editions.join("_")}`
    const cached = this.getFromCache(cacheKey)
    if (cached) return cached

    try {
      const editionString = editions.join(",")
      const response = await fetch(`${this.baseUrl}/ayah/${surahNumber}:${ayahNumber}/${editionString}`)
      const data = await response.json()

      if (data.code === 200) {
        const ayahs = Array.isArray(data.data) ? data.data : [data.data]
        const arabicAyah = ayahs.find((a: any) => a.edition.type === "quran")
        const translationAyahs = ayahs.filter((a: any) => a.edition.type === "translation")

        const result = {
          arabic: {
            number: arabicAyah.number,
            text: arabicAyah.text,
            numberInSurah: arabicAyah.numberInSurah,
            juz: arabicAyah.juz,
            manzil: arabicAyah.manzil,
            page: arabicAyah.page,
            ruku: arabicAyah.ruku,
            hizbQuarter: arabicAyah.hizbQuarter,
            sajda: arabicAyah.sajda,
          },
          translations: translationAyahs.map((t: any) => ({
            text: t.text,
            language: t.edition.language,
            translator: t.edition.name,
          })),
        }

        this.setCache(cacheKey, result)
        return result
      }
      throw new Error("Failed to fetch ayah")
    } catch (error) {
      console.error("Error fetching ayah:", error)
      const fallbackSurah = fallbackSurahContent.get(surahNumber)
      if (!fallbackSurah) {
        return null
      }

      const ayah = fallbackSurah.ayahs[ayahNumber - 1]
      if (!ayah) {
        return null
      }

      const translations = editions
        .filter((edition) => edition !== "quran-uthmani")
        .map((edition) => ({
          text: "Translation unavailable in offline mode.",
          language: edition.split(".")[0] ?? "en",
          translator: "Offline placeholder",
        }))

      const fallbackResult = {
        arabic: ayah,
        translations,
      }

      this.setCache(cacheKey, fallbackResult)
      return fallbackResult
    }
  }

  /**
   * Get available reciters
   */
  async getReciters(): Promise<Reciter[]> {
    const cacheKey = "reciters"
    const cached = this.getFromCache(cacheKey)
    if (cached) return cached

    try {
      const response = await fetch(`${this.baseUrl}/edition/format/audio`)
      const data = await response.json()

      if (data.code === 200) {
        const reciters = data.data.map((reciter: any) => ({
          id: Number.parseInt(reciter.identifier.split(".")[1]) || 0,
          name: reciter.name,
          englishName: reciter.englishName,
          format: reciter.format,
          bitrate: reciter.identifier.includes("128") ? "128kbps" : "64kbps",
        }))

        this.setCache(cacheKey, reciters)
        return reciters
      }
      throw new Error("Failed to fetch reciters")
    } catch (error) {
      console.error("Error fetching reciters:", error)
      this.setCache(cacheKey, fallbackReciters)
      return fallbackReciters
    }
  }

  /**
   * Get audio for specific surah
   */
  async getSurahAudio(surahNumber: number, reciterEdition = "ar.alafasy"): Promise<AudioSegment[]> {
    const cacheKey = `audio_${surahNumber}_${reciterEdition}`
    const cached = this.getFromCache(cacheKey)
    if (cached) return cached

    try {
      const response = await fetch(`${this.baseUrl}/surah/${surahNumber}/${reciterEdition}`)
      const data = await response.json()

      if (data.code === 200) {
        const audioSegments = data.data.ayahs.map((ayah: any) => ({
          url: ayah.audio,
          duration: ayah.duration || undefined,
          segments: ayah.segments || undefined,
        }))

        this.setCache(cacheKey, audioSegments)
        return audioSegments
      }
      throw new Error("Failed to fetch audio")
    } catch (error) {
      console.error("Error fetching audio:", error)
      const fallback = fallbackSurahContent.get(surahNumber)
      if (fallback?.recitation) {
        const audioSegments: AudioSegment[] = [
          {
            url: fallback.recitation,
          },
        ]
        this.setCache(cacheKey, audioSegments)
        return audioSegments
      }
      return []
    }
  }

  /**
   * Get available editions (translations, transliterations)
   */
  async getEditions(): Promise<QuranEdition[]> {
    const cacheKey = "editions"
    const cached = this.getFromCache(cacheKey)
    if (cached) return cached

    try {
      const response = await fetch(`${this.baseUrl}/edition`)
      const data = await response.json()

      if (data.code === 200) {
        const editions = data.data.map((edition: any) => ({
          identifier: edition.identifier,
          language: edition.language,
          name: edition.name,
          englishName: edition.englishName,
          format: edition.format,
          type: edition.type,
        }))

        this.setCache(cacheKey, editions)
        return editions
      }
      throw new Error("Failed to fetch editions")
    } catch (error) {
      console.error("Error fetching editions:", error)
      this.setCache(cacheKey, fallbackEditions)
      return fallbackEditions
    }
  }

  /**
   * Search for ayahs containing specific text
   */
  async searchAyahs(
    query: string,
    surah?: number,
    language = "ar",
  ): Promise<
    {
      ayah: Ayah
      surah: Surah
      matches: string[]
    }[]
  > {
    const cacheKey = `search_${query}_${surah || "all"}_${language}`
    const cached = this.getFromCache(cacheKey)
    if (cached) return cached

    try {
      const searchUrl = surah
        ? `${this.baseUrl}/search/${encodeURIComponent(query)}/${surah}/${language}`
        : `${this.baseUrl}/search/${encodeURIComponent(query)}/all/${language}`

      const response = await fetch(searchUrl)
      const data = await response.json()

      if (data.code === 200) {
        const results = data.data.matches.map((match: any) => ({
          ayah: {
            number: match.number,
            text: match.text,
            numberInSurah: match.numberInSurah,
            juz: match.juz,
            manzil: match.manzil,
            page: match.page,
            ruku: match.ruku,
            hizbQuarter: match.hizbQuarter,
            sajda: match.sajda,
          },
          surah: {
            number: match.surah.number,
            name: match.surah.name,
            englishName: match.surah.englishName,
            englishNameTranslation: match.surah.englishNameTranslation,
            numberOfAyahs: match.surah.numberOfAyahs,
            revelationType: match.surah.revelationType,
          },
          matches: [query], // Simplified - API doesn't return exact matches
        }))

        this.setCache(cacheKey, results)
        return results
      }
      throw new Error("Failed to search ayahs")
    } catch (error) {
      console.error("Error searching ayahs:", error)
      const trimmedQuery = query.trim()
      if (!trimmedQuery) {
        return []
      }

      const results: {
        ayah: Ayah
        surah: Surah
        matches: string[]
      }[] = []

      for (const [key, text] of Object.entries(verseTextFallback)) {
        if (language !== "ar") {
          continue
        }

        if (!text.includes(trimmedQuery)) {
          continue
        }

        const [surahKey, ayahKey] = key.split(":")
        const surahNumberFromKey = Number.parseInt(surahKey ?? "0", 10)
        const ayahNumberFromKey = Number.parseInt(ayahKey ?? "0", 10)

        if (!Number.isFinite(surahNumberFromKey) || !Number.isFinite(ayahNumberFromKey)) {
          continue
        }

        if (surah && surah !== surahNumberFromKey) {
          continue
        }

        const fallbackSurah = fallbackSurahContent.get(surahNumberFromKey)
        const ayah = fallbackSurah?.ayahs[ayahNumberFromKey - 1]
        if (!fallbackSurah || !ayah) {
          continue
        }

        results.push({
          ayah,
          surah: fallbackSurah.surah,
          matches: [trimmedQuery],
        })
      }

      return results
    }
  }

  /**
   * Get random ayah for daily inspiration
   */
  async getRandomAyah(edition = "quran-uthmani"): Promise<{ ayah: Ayah; surah: Surah } | null> {
    try {
      // Generate random surah and ayah numbers
      const randomSurah = Math.floor(Math.random() * 114) + 1
      const surahs = await this.getSurahs()
      const surah = surahs.find((s) => s.number === randomSurah)

      if (!surah) return null

      const randomAyah = Math.floor(Math.random() * surah.numberOfAyahs) + 1
      const ayahData = await this.getAyah(randomSurah, randomAyah, [edition])

      if (!ayahData) return null

      return {
        ayah: ayahData.arabic,
        surah,
      }
    } catch (error) {
      console.error("Error fetching random ayah:", error)
      const fallbackSurahIndex = Math.floor(Math.random() * fallbackSurahList.length)
      const fallbackSurah = fallbackSurahList[fallbackSurahIndex]
      if (!fallbackSurah) {
        return null
      }

      const fallbackSurahContentEntry = fallbackSurahContent.get(fallbackSurah.number)
      if (!fallbackSurahContentEntry) {
        return null
      }

      const randomAyahIndex = Math.floor(Math.random() * fallbackSurahContentEntry.ayahs.length)
      const ayah = fallbackSurahContentEntry.ayahs[randomAyahIndex]
      if (!ayah) {
        return null
      }

      return {
        ayah,
        surah: fallbackSurahContentEntry.surah,
      }
    }
  }

  // Cache management
  private getFromCache(key: string): any {
    const cached = this.cache.get(key)
    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      return cached.data
    }
    this.cache.delete(key)
    return null
  }

  private setCache(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    })
  }

  /**
   * Clear all cached data
   */
  clearCache(): void {
    this.cache.clear()
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    }
  }
}

// Export singleton instance
export const quranAPI = new QuranCloudAPI()

export function getOfflineSurahList(): Surah[] {
  return fallbackSurahList.map((surah) => ({ ...surah }))
}

// Helper functions for common operations
export async function getPopularSurahs(): Promise<Surah[]> {
  const allSurahs = await quranAPI.getSurahs()
  // Return commonly memorized surahs
  const popularNumbers = [1, 2, 3, 36, 67, 112, 113, 114, 55, 18, 19, 20]
  return allSurahs.filter((surah) => popularNumbers.includes(surah.number))
}

export async function getSurahForMemorization(level: "beginner" | "intermediate" | "advanced"): Promise<Surah[]> {
  const allSurahs = await quranAPI.getSurahs()

  switch (level) {
    case "beginner":
      // Short surahs (Juz 30)
      return allSurahs.filter((surah) => surah.number >= 78)
    case "intermediate":
      // Medium length surahs
      return allSurahs.filter((surah) => surah.number >= 50 && surah.number < 78)
    case "advanced":
      // Longer surahs
      return allSurahs.filter((surah) => surah.number < 50)
    default:
      return allSurahs
  }
}

export function calculateArabicLetterCount(text: string): number {
  // Count Arabic letters (excluding diacritics, spaces, punctuation)
  const arabicLetterRegex = /[\u0627-\u064A]/g
  const matches = text.match(arabicLetterRegex)
  return matches ? matches.length : 0
}

export function normalizeArabicText(text: string): string {
  return text
    .replace(/[\u064B-\u0652\u0670\u0640]/g, "") // Remove diacritics and tatweel
    .replace(/\s+/g, " ")
    .trim()
}
