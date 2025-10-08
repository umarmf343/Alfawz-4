import { nanoid } from "nanoid"

export type DialectCode = "standard" | "middle_eastern" | "south_asian" | "north_african"

export type DialectDetectionSource = "user" | "locale" | "text" | "default"

export interface DialectPhoneticModel {
  code: DialectCode
  label: string
  description: string
  weight: number
  /**
   * Identifier used to differentiate custom models when we store telemetry or
   * preferences on the client. Using nanoid keeps the value opaque while being
   * safe to persist.
   */
  modelId: string
  buildSignature: (word: string) => string
  similarity: (a: string, b: string) => number
}

export interface DialectResolution {
  model: DialectPhoneticModel
  source: DialectDetectionSource
  confidence: number
  reasons: string[]
}

export interface DialectResolutionOptions {
  expectedText?: string
  transcript?: string
  localeHint?: string | null
  fallback?: DialectCode
}

const DIALECT_LABELS: Record<DialectCode, { label: string; description: string; weight: number }> = {
  standard: {
    label: "Standard Tajwīd",
    description: "Neutral Quranic pronunciation baseline used when no dialect preference is known.",
    weight: 0.35,
  },
  middle_eastern: {
    label: "Middle Eastern",
    description: "Pronunciation patterns inspired by Levantine and Gulf style recitations.",
    weight: 0.4,
  },
  south_asian: {
    label: "South Asian",
    description: "Adaptations for Indo-Pak reciters where certain consonants soften.",
    weight: 0.45,
  },
  north_african: {
    label: "North African",
    description: "Accommodates Maghrebi phonology, especially ج and ق variations.",
    weight: 0.42,
  },
}

const ARABIC_DIACRITICS = /[\u064B-\u065F\u0670\u06D6-\u06ED]/g

const BASE_PHONEME_MAP: Record<string, string> = {
  "ء": "ʔ",
  "ا": "a",
  "أ": "a",
  "إ": "i",
  "آ": "a",
  "ب": "b",
  "ت": "t",
  "ث": "th",
  "ج": "j",
  "ح": "ḥ",
  "خ": "kh",
  "د": "d",
  "ذ": "dh",
  "ر": "r",
  "ز": "z",
  "س": "s",
  "ش": "sh",
  "ص": "ṣ",
  "ض": "ḍ",
  "ط": "ṭ",
  "ظ": "ẓ",
  "ع": "ʕ",
  "غ": "gh",
  "ف": "f",
  "ق": "q",
  "ك": "k",
  "ل": "l",
  "م": "m",
  "ن": "n",
  "ه": "h",
  "و": "w",
  "ؤ": "w",
  "ي": "y",
  "ئ": "y",
  "ة": "h",
  "ى": "a",
  "ﻻ": "la",
  "ﻷ": "la",
  "ﻹ": "la",
  "ﻵ": "la",
  "ٱ": "a",
  "چ": "ch",
  "ڤ": "v",
  "پ": "p",
  "گ": "g",
}

const DIALECT_VARIANTS: Record<DialectCode, Record<string, string>> = {
  standard: {},
  middle_eastern: {
    "ج": "j",
    "ق": "q",
  },
  south_asian: {
    "ج": "z",
    "ق": "k",
    "غ": "gh",
    "ظ": "z",
    "ذ": "z",
    "ث": "s",
  },
  north_african: {
    "ج": "g",
    "ق": "g",
    "ث": "t",
    "ق\u0651": "gg",
  },
}

const SQUEEZE_REPEATED_SOUNDS = /(.)\1+/g

const memoizedModels = new Map<DialectCode, DialectPhoneticModel>()

const removeDiacritics = (word: string) => word.replace(ARABIC_DIACRITICS, "")

const normalizeWord = (word: string) =>
  removeDiacritics(word.normalize("NFC")).replace(/[\u0640\u200c\u200d]/g, "").trim()

const transliterate = (word: string, dialect: DialectCode) => {
  const normalized = normalizeWord(word)
  const variantMap = DIALECT_VARIANTS[dialect]

  return Array.from(normalized)
    .map((char) => variantMap[char] ?? BASE_PHONEME_MAP[char] ?? char)
    .join("")
    .replace(SQUEEZE_REPEATED_SOUNDS, "$1")
}

const levenshtein = (a: string, b: string): number => {
  if (a === b) return 0
  if (a.length === 0) return b.length
  if (b.length === 0) return a.length

  const matrix: number[][] = Array.from({ length: a.length + 1 }, () => Array(b.length + 1).fill(0))

  for (let i = 0; i <= a.length; i += 1) {
    matrix[i][0] = i
  }

  for (let j = 0; j <= b.length; j += 1) {
    matrix[0][j] = j
  }

  for (let i = 1; i <= a.length; i += 1) {
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      matrix[i][j] = Math.min(matrix[i - 1][j] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j - 1] + cost)
    }
  }

  return matrix[a.length][b.length]
}

const normalizeSimilarity = (distance: number, length: number) => {
  if (length === 0) return 1
  return 1 - distance / length
}

export const createDialectPhoneticModel = (dialect: DialectCode): DialectPhoneticModel => {
  const cached = memoizedModels.get(dialect)
  if (cached) {
    return cached
  }

  const meta = DIALECT_LABELS[dialect]
  const model: DialectPhoneticModel = {
    code: dialect,
    label: meta.label,
    description: meta.description,
    weight: meta.weight,
    modelId: nanoid(10),
    buildSignature: (word: string) => transliterate(word, dialect),
    similarity: (a: string, b: string) => {
      const signatureA = transliterate(a, dialect)
      const signatureB = transliterate(b, dialect)
      const maxLength = Math.max(signatureA.length, signatureB.length)
      if (!maxLength) return 1
      const distance = levenshtein(signatureA, signatureB)
      return normalizeSimilarity(distance, maxLength)
    },
  }

  memoizedModels.set(dialect, model)
  return model
}

const DIALECT_KEYWORDS: Record<DialectCode, RegExp[]> = {
  standard: [],
  middle_eastern: [/\bج\w*/u, /\bق\w*/u],
  south_asian: [/پ/u, /گ/u, /\bذ\w*/u],
  north_african: [/ڤ/u, /\bج\w*/u, /\bق\w*/u],
}

const localeToDialect = (localeHint?: string | null): DialectCode | null => {
  if (!localeHint) return null
  const normalized = localeHint.toLowerCase()
  if (/(en|ur|bn|hi|ml|ta)-(in|pk|bd)/.test(normalized)) {
    return "south_asian"
  }
  if (/ar-(ma|dz|tn|ly|mr)/.test(normalized) || /fr-(ma|dz|tn)/.test(normalized)) {
    return "north_african"
  }
  if (/ar-(eg|sa|ae|qa|bh|om|jo|ps|lb|sy|iq|kw|ye)/.test(normalized)) {
    return "middle_eastern"
  }
  return null
}

const detectFromText = (text: string): DialectCode | null => {
  const sample = text.slice(0, 160)
  for (const dialect of Object.keys(DIALECT_KEYWORDS) as DialectCode[]) {
    const patterns = DIALECT_KEYWORDS[dialect]
    if (patterns.length === 0) continue
    if (patterns.some((regex) => regex.test(sample))) {
      return dialect
    }
  }
  return null
}

export const resolveDialect = (
  input: DialectCode | "auto" | null | undefined,
  options: DialectResolutionOptions = {},
): DialectResolution => {
  const reasons: string[] = []

  if (input && input !== "auto") {
    const model = createDialectPhoneticModel(input)
    reasons.push("User preference")
    return {
      model,
      source: "user",
      confidence: 0.95,
      reasons,
    }
  }

  const localeDialect = localeToDialect(options.localeHint)
  if (localeDialect) {
    reasons.push(`Locale hint matched ${localeDialect}`)
    const model = createDialectPhoneticModel(localeDialect)
    return {
      model,
      source: "locale",
      confidence: 0.75,
      reasons,
    }
  }

  const textSource = options.transcript || options.expectedText
  if (textSource) {
    const textDialect = detectFromText(textSource)
    if (textDialect) {
      reasons.push(`Detected characters associated with ${textDialect} recitations`)
      const model = createDialectPhoneticModel(textDialect)
      return {
        model,
        source: "text",
        confidence: 0.65,
        reasons,
      }
    }
  }

  const fallbackDialect = options.fallback ?? "standard"
  const fallbackModel = createDialectPhoneticModel(fallbackDialect)
  reasons.push("Defaulted to standard Quranic phonetics")
  return {
    model: fallbackModel,
    source: "default",
    confidence: 0.5,
    reasons,
  }
}

export const combineSimilarityScores = (
  textSimilarity: number,
  phoneticSimilarity: number,
  model: DialectPhoneticModel,
): number => {
  const boundedText = Number.isFinite(textSimilarity) ? Math.max(0, Math.min(1, textSimilarity)) : 0
  const boundedPhonetic = Number.isFinite(phoneticSimilarity) ? Math.max(0, Math.min(1, phoneticSimilarity)) : 0
  const weighted = boundedText * (1 - model.weight) + boundedPhonetic * model.weight
  return Math.max(boundedText, weighted)
}

export type PhoneticComparison = {
  textSimilarity: number
  phoneticSimilarity: number
  combinedSimilarity: number
  signatureA: string
  signatureB: string
}

export const compareWords = (a: string, b: string, model: DialectPhoneticModel): PhoneticComparison => {
  const signatureA = model.buildSignature(a)
  const signatureB = model.buildSignature(b)
  const maxLength = Math.max(signatureA.length, signatureB.length)
  const phoneticSimilarity = maxLength
    ? normalizeSimilarity(levenshtein(signatureA, signatureB), maxLength)
    : 1

  const normalizedA = normalizeWord(a)
  const normalizedB = normalizeWord(b)
  const textMax = Math.max(normalizedA.length, normalizedB.length)
  const textSimilarity = textMax ? normalizeSimilarity(levenshtein(normalizedA, normalizedB), textMax) : 1

  const combinedSimilarity = combineSimilarityScores(textSimilarity, phoneticSimilarity, model)

  return { textSimilarity, phoneticSimilarity, combinedSimilarity, signatureA, signatureB }
}
