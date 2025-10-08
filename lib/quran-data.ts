import quranText from "@/data/quran/quran-uthmani.json"
import surahMeta from "@/data/quran.json"

export type VerseKey = `${number}:${number}`

type SurahMetadataSource = {
  name: string
  name_translations: {
    ar: string
    en: string
    [key: string]: string
  }
  number_of_ayah: number
  number_of_surah: number
  place: string
  type: string
}

export interface SurahInfo {
  number: number
  arabicName: string
  englishName: string
  revelationPlace: string
  type: string
  ayahCount: number
}

const verseTextMap = quranText as Record<string, string>
const surahList = surahMeta as SurahMetadataSource[]
const verseEntries = Object.entries(verseTextMap) as [VerseKey, string][]

const surahMap = new Map<number, SurahInfo>(
  surahList.map((surah) => [
    surah.number_of_surah,
    {
      number: surah.number_of_surah,
      arabicName: surah.name_translations?.ar ?? surah.name,
      englishName: surah.name_translations?.en ?? surah.name,
      revelationPlace: surah.place,
      type: surah.type,
      ayahCount: surah.number_of_ayah,
    },
  ]),
)

export function parseVerseKey(verseKey: string): { surahNumber: number; ayahNumber: number } {
  const [surahPart, ayahPart] = verseKey.split(":")
  const surahNumber = Number.parseInt(surahPart, 10)
  const ayahNumber = Number.parseInt(ayahPart, 10)
  if (Number.isNaN(surahNumber) || Number.isNaN(ayahNumber)) {
    throw new Error(`Invalid verse key: ${verseKey}`)
  }
  return { surahNumber, ayahNumber }
}

export function getVerseText(verseKey: string): string {
  return verseTextMap[verseKey] ?? ""
}

export function getSurahInfo(surahNumber: number): SurahInfo | undefined {
  return surahMap.get(surahNumber)
}

export function formatVerseReference(verseKey: string): string {
  const { surahNumber, ayahNumber } = parseVerseKey(verseKey)
  const surah = getSurahInfo(surahNumber)
  return `${surah?.arabicName ?? `سورة ${surahNumber}`} • ${ayahNumber}`
}

export interface QuranVerseEntry {
  key: VerseKey
  surahNumber: number
  ayahNumber: number
  text: string
}

let cachedVerseEntries: QuranVerseEntry[] | null = null

export function getAllVerseEntries(): QuranVerseEntry[] {
  if (!cachedVerseEntries) {
    cachedVerseEntries = verseEntries.map(([key, text]) => {
      const { surahNumber, ayahNumber } = parseVerseKey(key)
      return {
        key,
        surahNumber,
        ayahNumber,
        text,
      }
    })
  }
  return cachedVerseEntries
}
