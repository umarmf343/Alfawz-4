import quranText from "@/data/quran/quran-uthmani.json"
import surahMeta from "@/data/quran.json"

export type VerseKey = `${number}:${number}`

interface SurahMetadataSource {
  name: string
  number_of_surah: number
  number_of_ayah: number
  name_translations?: Record<string, string>
  place?: string
  type?: string
}

export interface SurahOption {
  number: number
  arabicName: string
  englishName: string
  ayahCount: number
}

export interface VerseValidationIssue {
  key: string
  reason: string
}

export interface VerseValidationResult {
  validKeys: string[]
  issues: VerseValidationIssue[]
}

const verseMap = new Map<string, string>(Object.entries(quranText as Record<string, string>))

const surahList = (surahMeta as SurahMetadataSource[]).map((surah) => ({
  number: surah.number_of_surah,
  arabicName: surah.name_translations?.ar ?? surah.name,
  englishName: surah.name_translations?.en ?? surah.name,
  ayahCount: surah.number_of_ayah,
}))

const surahMap = new Map<number, SurahOption>(surahList.map((entry) => [entry.number, entry]))

export function getSurahOptions(): SurahOption[] {
  return surahList.map((entry) => ({ ...entry }))
}

export function normalizeVerseKey(input: string): string {
  const trimmed = input.trim()
  if (!trimmed) {
    return ""
  }
  const [surahPart, ayahPart] = trimmed.split(":")
  const surahNumber = Number.parseInt(surahPart ?? "", 10)
  const ayahNumber = Number.parseInt(ayahPart ?? "", 10)
  if (!Number.isFinite(surahNumber) || !Number.isFinite(ayahNumber)) {
    return trimmed
  }
  return `${surahNumber}:${ayahNumber}`
}

export function isValidVerseKey(verseKey: string): boolean {
  const normalized = normalizeVerseKey(verseKey)
  return verseMap.has(normalized)
}

export function expandVerseRange(surahNumber: number, fromAyah: number, toAyah?: number): string[] {
  const surah = surahMap.get(surahNumber)
  if (!surah) {
    throw new Error(`Surah ${surahNumber} is not defined`)
  }
  if (!Number.isFinite(fromAyah) || fromAyah < 1) {
    throw new Error("Starting ayah must be at least 1")
  }
  const normalizedTo = Number.isFinite(toAyah) ? toAyah ?? fromAyah : fromAyah
  const start = Math.min(fromAyah, normalizedTo)
  const end = Math.max(fromAyah, normalizedTo)
  if (end > surah.ayahCount) {
    throw new Error(`Surah ${surah.arabicName} contains only ${surah.ayahCount} ayat`)
  }
  const keys: string[] = []
  for (let ayah = start; ayah <= end; ayah += 1) {
    keys.push(`${surahNumber}:${ayah}`)
  }
  return keys
}

export function parseCommaSeparatedVerseKeys(input: string): string[] {
  if (!input) {
    return []
  }
  return input
    .split(",")
    .map((segment) => normalizeVerseKey(segment))
    .filter((segment) => segment.length > 0)
}

export function validateVerseKeys(keys: string[]): VerseValidationResult {
  const issues: VerseValidationIssue[] = []
  const validKeys: string[] = []
  keys.forEach((rawKey) => {
    const normalized = normalizeVerseKey(rawKey)
    if (!normalized) {
      issues.push({ key: rawKey, reason: "Empty verse key" })
      return
    }
    if (!verseMap.has(normalized)) {
      issues.push({ key: normalized, reason: "Verse does not exist" })
      return
    }
    validKeys.push(normalized)
  })
  return { validKeys, issues }
}

export function summarizeVerseKeys(keys: string[]): { verseCount: number; surahCount: number } {
  const normalized = keys.map((key) => normalizeVerseKey(key))
  const uniqueSurahs = new Set<number>()
  normalized.forEach((key) => {
    const [surahPart] = key.split(":")
    const surahNumber = Number.parseInt(surahPart ?? "", 10)
    if (Number.isFinite(surahNumber)) {
      uniqueSurahs.add(surahNumber)
    }
  })
  return {
    verseCount: normalized.length,
    surahCount: uniqueSurahs.size,
  }
}

export function getVerseTextSafe(verseKey: string): string {
  const normalized = normalizeVerseKey(verseKey)
  return verseMap.get(normalized) ?? ""
}
