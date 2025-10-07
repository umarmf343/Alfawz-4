import { getAllVerseEntries, type QuranVerseEntry, type VerseKey } from "@/lib/quran-data"

const ARABIC_DIACRITICS_REGEX = /[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED]/gu
const TATWEEL_REGEX = /\u0640/gu
const NON_ALPHANUMERIC_REGEX = /[^\p{Letter}\p{Number}]+/gu

export interface VerseMatch {
  key: VerseKey
  surahNumber: number
  ayahNumber: number
  text: string
  similarity: number
}

interface RecognizableVerse extends QuranVerseEntry {
  normalized: string
}

let cachedVerseIndex: RecognizableVerse[] | null = null

export function normalizeArabicText(text: string): string {
  return text
    .normalize("NFC")
    .replace(ARABIC_DIACRITICS_REGEX, "")
    .replace(TATWEEL_REGEX, "")
    .replace(NON_ALPHANUMERIC_REGEX, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase()
}

export function ensureVerseIndex(): RecognizableVerse[] {
  if (!cachedVerseIndex) {
    const entries = getAllVerseEntries()
    cachedVerseIndex = entries.map((entry) => ({
      ...entry,
      normalized: normalizeArabicText(entry.text),
    }))
  }
  return cachedVerseIndex
}

export interface FindVerseMatchesOptions {
  limit?: number
  threshold?: number
}

export function findBestVerseMatches(
  transcript: string,
  { limit = 5, threshold = 0.6 }: FindVerseMatchesOptions = {},
): VerseMatch[] {
  const normalizedTranscript = normalizeArabicText(transcript)
  if (!normalizedTranscript) {
    return []
  }

  const index = ensureVerseIndex()

  const scoredMatches = index.map((entry) => ({
    key: entry.key,
    surahNumber: entry.surahNumber,
    ayahNumber: entry.ayahNumber,
    text: entry.text,
    similarity: computeSimilarity(normalizedTranscript, entry.normalized),
  }))

  scoredMatches.sort((a, b) => b.similarity - a.similarity)

  const strongMatches = scoredMatches.filter((match) => match.similarity >= threshold).slice(0, limit)
  if (strongMatches.length > 0) {
    return strongMatches
  }

  return scoredMatches.slice(0, Math.min(limit, 3))
}

function computeSimilarity(a: string, b: string): number {
  if (a === b) {
    return 1
  }
  if (!a || !b) {
    return 0
  }
  const distance = levenshteinDistance(a, b)
  const maxLength = Math.max(a.length, b.length)
  if (maxLength === 0) {
    return 1
  }
  return 1 - distance / maxLength
}

function levenshteinDistance(a: string, b: string): number {
  const rows = a.length + 1
  const cols = b.length + 1
  const matrix: number[][] = Array.from({ length: rows }, () => Array(cols).fill(0))

  for (let i = 0; i < rows; i += 1) {
    matrix[i][0] = i
  }

  for (let j = 0; j < cols; j += 1) {
    matrix[0][j] = j
  }

  for (let i = 1; i < rows; i += 1) {
    for (let j = 1; j < cols; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost,
      )
    }
  }

  return matrix[rows - 1][cols - 1]
}
