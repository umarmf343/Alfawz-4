import quranText from "@/data/quran-uthmani.json"
import surahMeta from "@/data/quran.json"
import surahInfoSource from "@/data/quran-assets/surah-info.json"
import enSahihTranslations from "@/data/quran-assets/translation-en-sahih.json"

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
  englishTranslation?: string
  revelationPlace: string
  type: string
  ayahCount: number
  code?: string
  ayahWordCounts?: Record<number, number>
  ayahOffsets?: Record<number, number>
}

const verseTextMap = quranText as Record<string, string>
const surahList = surahMeta as SurahMetadataSource[]
const rawSurahInfo = surahInfoSource as Record<
  string,
  {
    nameEn: string
    nameAr: string
    nameEnTrans?: string
    numAyahs: number
    code?: string
    ayahs?: Record<string, { wordCount?: number; offset?: number }>
  }
>
const translationMatrix = enSahihTranslations as string[][]

const surahMap = new Map<number, SurahInfo>(
  surahList.map((surah) => [
    surah.number_of_surah,
    {
      number: surah.number_of_surah,
      arabicName:
        rawSurahInfo[String(surah.number_of_surah)]?.nameAr ?? surah.name_translations?.ar ?? surah.name,
      englishName:
        rawSurahInfo[String(surah.number_of_surah)]?.nameEn ?? surah.name_translations?.en ?? surah.name,
      englishTranslation:
        rawSurahInfo[String(surah.number_of_surah)]?.nameEnTrans ?? surah.name_translations?.en ?? surah.name,
      revelationPlace: surah.place,
      type: surah.type,
      ayahCount: rawSurahInfo[String(surah.number_of_surah)]?.numAyahs ?? surah.number_of_ayah,
      code: rawSurahInfo[String(surah.number_of_surah)]?.code,
      ayahWordCounts: rawSurahInfo[String(surah.number_of_surah)]?.ayahs
        ? Object.fromEntries(
            Object.entries(rawSurahInfo[String(surah.number_of_surah)]!.ayahs ?? {}).map(([ayah, meta]) => [
              Number.parseInt(ayah, 10),
              meta.wordCount ?? 0,
            ]),
          )
        : undefined,
      ayahOffsets: rawSurahInfo[String(surah.number_of_surah)]?.ayahs
        ? Object.fromEntries(
            Object.entries(rawSurahInfo[String(surah.number_of_surah)]!.ayahs ?? {}).map(([ayah, meta]) => [
              Number.parseInt(ayah, 10),
              meta.offset ?? 0,
            ]),
          )
        : undefined,
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

export function getVerseTranslation(verseKey: string): string {
  const { surahNumber, ayahNumber } = parseVerseKey(verseKey)
  const surahTranslations = translationMatrix[surahNumber - 1]
  if (!surahTranslations) {
    return ""
  }
  return surahTranslations[ayahNumber - 1] ?? ""
}

export function getSurahInfo(surahNumber: number): SurahInfo | undefined {
  return surahMap.get(surahNumber)
}

export function formatVerseReference(verseKey: string): string {
  const { surahNumber, ayahNumber } = parseVerseKey(verseKey)
  const surah = getSurahInfo(surahNumber)
  return `${surah?.arabicName ?? `سورة ${surahNumber}`} • ${ayahNumber}`
}
