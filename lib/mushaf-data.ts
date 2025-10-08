import pageVersesSource from "@/data/mushaf/page_verses.json"
import versePageSource from "@/data/mushaf/verses_pages.json"
import juzSource from "@/data/mushaf/juzs.json"
import hizbSource from "@/data/mushaf/hizbs.json"
import quranTextSource from "@/data/quran/quran-uthmani.json"
import surahMetaSource from "@/data/quran.json"

import { getSurahInfo, parseVerseKey } from "@/lib/quran-data"

export type VerseKey = `${number}:${number}`

type PageVerseMap = Record<string, VerseKey[]>
type VersePageMap = Record<VerseKey, number>
type VerseTextMap = Record<VerseKey, string>

type SurahMeta = {
  name: string
  name_translations?: { [key: string]: string }
  number_of_surah: number
}

type JuzPayload = {
  juzs: {
    juz_number: number
    verse_mapping: Record<string, string>
  }[]
}

type HizbPayload = {
  hizbs: {
    hizb_number: number
    verse_mapping: Record<string, string>
  }[]
}

export const TOTAL_MUSHAF_PAGES = 604

const pageVerseMap = pageVersesSource as unknown as PageVerseMap
const versePageMap = versePageSource as unknown as VersePageMap
const verseTextMap = quranTextSource as unknown as VerseTextMap
const juzPayload = juzSource as JuzPayload
const hizbPayload = hizbSource as HizbPayload
const surahMeta = surahMetaSource as SurahMeta[]

const surahNameLookup = new Map<string, number>()

for (const surah of surahMeta) {
  const translations = surah.name_translations ?? {}
  const candidates = [surah.name, translations.ar, translations.en]
  for (const candidate of candidates) {
    if (!candidate) continue
    const normalized = normalizeSurahName(candidate)
    if (normalized) {
      surahNameLookup.set(normalized, surah.number_of_surah)
    }
  }
  const slug = normalizeSurahName(`${surah.number_of_surah}`)
  surahNameLookup.set(slug, surah.number_of_surah)
}

const juzStartVerse = new Map<VerseKey, number>()
for (const juz of juzPayload.juzs ?? []) {
  const firstVerse = extractFirstVerseKey(juz.verse_mapping)
  if (firstVerse) {
    juzStartVerse.set(firstVerse, juz.juz_number)
  }
}

const hizbStartVerse = new Map<VerseKey, number>()
for (const hizb of hizbPayload.hizbs ?? []) {
  const firstVerse = extractFirstVerseKey(hizb.verse_mapping)
  if (firstVerse) {
    hizbStartVerse.set(firstVerse, hizb.hizb_number)
  }
}

function normalizeSurahName(name: string | undefined | null): string {
  if (!name) return ""
  return name
    .replace(/\bsurah\b/gi, "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^\p{L}\p{N}]+/gu, "")
    .toLowerCase()
}

function extractFirstVerseKey(mapping: Record<string, string>): VerseKey | null {
  const entries = Object.entries(mapping)
    .map(([surahNumber, range]) => {
      const [start] = range.split("-")
      return {
        surah: Number.parseInt(surahNumber, 10),
        ayah: Number.parseInt(start, 10),
      }
    })
    .filter((entry) => Number.isFinite(entry.surah) && Number.isFinite(entry.ayah))
    .sort((a, b) => a.surah - b.surah)

  if (entries.length === 0) {
    return null
  }
  const first = entries[0]
  return `${first.surah}:${first.ayah}` as VerseKey
}

export function resolveSurahNumber(identifier?: string | number | null): number | null {
  if (identifier == null) {
    return null
  }
  if (typeof identifier === "number" && Number.isFinite(identifier)) {
    const normalized = Math.trunc(identifier)
    return normalized >= 1 && normalized <= 114 ? normalized : null
  }
  const normalized = normalizeSurahName(String(identifier))
  if (!normalized) {
    return null
  }
  return surahNameLookup.get(normalized) ?? null
}

export function getPageVerses(pageNumber: number): VerseKey[] {
  const key = String(pageNumber)
  return pageVerseMap[key] ?? []
}

export function getPageForVerse(verseKey: VerseKey): number | null {
  return versePageMap[verseKey] ?? null
}

export function getVerseText(verseKey: VerseKey): string {
  return verseTextMap[verseKey] ?? ""
}

export function getVerseDisplayData(verseKey: VerseKey) {
  const text = getVerseText(verseKey)
  const { surahNumber, ayahNumber } = parseVerseKey(verseKey)
  const surahInfo = getSurahInfo(surahNumber)
  return {
    verseKey,
    text,
    surahNumber,
    ayahNumber,
    surahName: surahInfo?.arabicName ?? `سورة ${surahNumber}`,
    surahEnglishName: surahInfo?.englishName ?? `Surah ${surahNumber}`,
  }
}

export type PageMarker = {
  type: "juz" | "hizb"
  number: number
  verseKey: VerseKey
}

export function getPageMarkers(pageNumber: number): PageMarker[] {
  const verses = getPageVerses(pageNumber)
  const markers: PageMarker[] = []
  for (const verseKey of verses) {
    const juzNumber = juzStartVerse.get(verseKey)
    if (juzNumber) {
      markers.push({ type: "juz", number: juzNumber, verseKey })
    }
    const hizbNumber = hizbStartVerse.get(verseKey)
    if (hizbNumber) {
      markers.push({ type: "hizb", number: hizbNumber, verseKey })
    }
  }
  return markers
}

export function formatArabicNumber(value: number): string {
  return new Intl.NumberFormat("ar-EG").format(value)
}
