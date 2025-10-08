import {
  compareWords,
  resolveDialect,
  type DialectCode,
  type DialectDetectionSource,
  type DialectPhoneticModel,
} from "./phonetics"

const ARABIC_LETTER_REGEX = /\p{Script=Arabic}/gu

export type MistakeCategory = "missed_word" | "incorrect_word" | "extra_word"

export const MISTAKE_CATEGORY_META: Record<
  MistakeCategory,
  { label: string; description: string }
> = {
  missed_word: {
    label: "Missed words",
    description: "Expected ayah tokens that were not recited during the session.",
  },
  incorrect_word: {
    label: "Incorrect words",
    description: "Spoken tokens that differ from the Mushaf text.",
  },
  extra_word: {
    label: "Extra words",
    description: "Words or sounds added beyond the written ayah.",
  },
}

const MISTAKE_CATEGORY_ORDER: MistakeCategory[] = [
  "missed_word",
  "incorrect_word",
  "extra_word",
]

type Token = { raw: string; normalized: string }

type MutableCategoryCount = Partial<Record<MistakeCategory, number>>

type MatchAlignmentEntry = {
  type: "match"
  expected: string
  detected: string
  similarity: number
  textSimilarity: number
  phoneticSimilarity: number
}

type MissingAlignmentEntry = { type: "missing"; expected: string }

type ExtraAlignmentEntry = { type: "extra"; detected: string }

type AlignmentEntry = MatchAlignmentEntry | MissingAlignmentEntry | ExtraAlignmentEntry

export type LiveMistake = {
  index: number
  type: "missing" | "extra" | "substitution"
  word?: string
  correct?: string
  similarity?: number
  similarityBreakdown?: {
    combined: number
    text: number
    phonetic: number
  }
  confidence: number
  categories: MistakeCategory[]
  /**
   * Legacy field retained for compatibility with components that expect tajwīd
   * hints. The simplified engine no longer emits rule-specific guidance.
   */
  tajweedRules?: string[]
}

export type LiveAnalysisProfile = {
  engine: "tarteel" | "nvidia" | "on-device"
  latencyMs: number | null
  description: string
  stack: string[]
}

export type MistakeBreakdownEntry = {
  category: MistakeCategory
  label: string
  description: string
  count: number
}

export type AlignmentConfidenceType = "match" | "missing" | "extra" | "substitution"

export type AlignmentConfidenceEntry = {
  index: number
  type: AlignmentConfidenceType
  confidence: number
  expected?: string
  detected?: string
}

export type MistakeConfidenceEntry = {
  index: number
  type: LiveMistake["type"]
  confidence: number
}

export type ConfidenceBreakdown = {
  overall: number
  mistakes: MistakeConfidenceEntry[]
  alignment: AlignmentConfidenceEntry[]
}

export type DialectInsight = {
  code: DialectCode
  label: string
  description: string
  source: DialectDetectionSource
  weight: number
  detectionConfidence: number
  reasons: string[]
}

export type LiveSessionSummary = {
  transcription: string
  expectedText: string
  mistakes: LiveMistake[]
  mistakeBreakdown: MistakeBreakdownEntry[]
  analysis: LiveAnalysisProfile
  feedback: {
    overallScore: number
    accuracy: number
    timingScore: number
    fluencyScore: number
    feedback: string
    errors: {
      type: string
      message: string
      expected?: string
      transcribed?: string
      categories: MistakeCategory[]
      confidence: number
    }[]
  }
  confidence: ConfidenceBreakdown
  dialect: DialectInsight
  hasanatPoints: number
  arabicLetterCount: number
  words?: { start: number; end: number; word: string }[]
  duration?: number
  ayahId?: string
}

const splitWords = (text: string): string[] =>
  text
    .normalize("NFC")
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 0)

const normalizeForScoring = (word: string): string =>
  word
    .normalize("NFC")
    .replace(/[\u0640\u200c\u200d]/g, "")
    .replace(/[\u064B-\u065F\u0670]/g, "")
    .replace(/[^\p{Letter}\p{Mark}\p{Number}]+/gu, "")
    .toLowerCase()

type AlignmentContext = {
  model: DialectPhoneticModel
  substitutionThreshold: number
}

const DEFAULT_SUBSTITUTION_THRESHOLD = 0.75

const tokenize = (text: string): Token[] =>
  splitWords(text).map((word) => ({ raw: word, normalized: normalizeForScoring(word) }))

const alignWords = (expected: string, detected: string, context: AlignmentContext): AlignmentEntry[] => {
  const expectedWords = tokenize(expected)
  const detectedWords = tokenize(detected)

  const m = expectedWords.length
  const n = detectedWords.length

  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0))
  const actions: ("match" | "delete" | "insert")[][] = Array.from({ length: m + 1 }, () =>
    Array(n + 1).fill("match" as const),
  )

  for (let i = 0; i <= m; i += 1) {
    dp[i][0] = i
    if (i > 0) {
      actions[i][0] = "delete"
    }
  }

  for (let j = 0; j <= n; j += 1) {
    dp[0][j] = j
    if (j > 0) {
      actions[0][j] = "insert"
    }
  }

  for (let i = 1; i <= m; i += 1) {
    for (let j = 1; j <= n; j += 1) {
      const comparison = compareWords(expectedWords[i - 1].raw, detectedWords[j - 1].raw, context.model)
      const substitutionPenalty = 1 - comparison.combinedSimilarity
      let best = dp[i - 1][j - 1] + substitutionPenalty
      let choice: "match" | "delete" | "insert" = "match"

      const deleteCost = dp[i - 1][j] + 1
      if (deleteCost < best) {
        best = deleteCost
        choice = "delete"
      }

      const insertCost = dp[i][j - 1] + 1
      if (insertCost < best) {
        best = insertCost
        choice = "insert"
      }

      dp[i][j] = best
      actions[i][j] = choice
    }
  }

  const result: AlignmentEntry[] = []
  let i = m
  let j = n

  while (i > 0 || j > 0) {
    const action = actions[i][j]
    if (i > 0 && j > 0 && action === "match") {
      const expectedWord = expectedWords[i - 1]
      const detectedWord = detectedWords[j - 1]
      const comparison = compareWords(expectedWord.raw, detectedWord.raw, context.model)
      result.unshift({
        type: "match",
        expected: expectedWord.raw,
        detected: detectedWord.raw,
        similarity: comparison.combinedSimilarity,
        textSimilarity: comparison.textSimilarity,
        phoneticSimilarity: comparison.phoneticSimilarity,
      })
      i -= 1
      j -= 1
    } else if (i > 0 && (j === 0 || action === "delete")) {
      result.unshift({ type: "missing", expected: expectedWords[i - 1].raw })
      i -= 1
    } else if (j > 0) {
      result.unshift({ type: "extra", detected: detectedWords[j - 1].raw })
      j -= 1
    } else {
      break
    }
  }

  return result
}

const clampScore = (value: number) => Math.max(0, Math.min(100, Math.round(value)))

const buildErrorMessage = (mistake: LiveMistake) => {
  if (mistake.type === "missing") {
    return "Expected word was not articulated in the recitation."
  }
  if (mistake.type === "extra") {
    return "An extra word or sound was detected beyond the written ayah."
  }
  return "Pronunciation differed from the expected wording."
}

const countArabicLetters = (text: string) => Array.from(text).filter((char) => ARABIC_LETTER_REGEX.test(char)).length

const calculateMistakeConfidence = (
  entry: MatchAlignmentEntry | null,
  type: LiveMistake["type"],
  context: AlignmentContext,
): number => {
  if (type === "substitution") {
    const similarity = entry?.similarity ?? 0
    const phoneticSimilarity = entry?.phoneticSimilarity ?? 0
    const divergence = 1 - similarity
    const base = 55 + divergence * 45
    const phoneticPenalty = phoneticSimilarity * 35 * (1 - context.model.weight * 0.5)
    const adjusted = base - phoneticPenalty + context.model.weight * 10
    return clampScore(adjusted)
  }

  if (type === "missing") {
    const base = 70 + context.model.weight * 20
    return clampScore(base)
  }

  if (type === "extra") {
    const base = 68 + (1 - context.model.weight) * 15
    return clampScore(base)
  }

  return clampScore(60)
}

const collectMistakes = (alignment: AlignmentEntry[], context: AlignmentContext): LiveMistake[] => {
  const mistakes: LiveMistake[] = []
  let expectedIndex = 0

  alignment.forEach((entry) => {
    if (entry.type === "match") {
      if (entry.similarity < context.substitutionThreshold) {
        mistakes.push({
          index: expectedIndex,
          type: "substitution",
          word: entry.detected,
          correct: entry.expected,
          similarity: entry.similarity,
          similarityBreakdown: {
            combined: entry.similarity,
            text: entry.textSimilarity,
            phonetic: entry.phoneticSimilarity,
          },
          confidence: calculateMistakeConfidence(entry, "substitution", context),
          categories: ["incorrect_word"],
        })
      }
      expectedIndex += 1
      return
    }

    if (entry.type === "missing") {
      mistakes.push({
        index: expectedIndex,
        type: "missing",
        correct: entry.expected,
        confidence: calculateMistakeConfidence(null, "missing", context),
        categories: ["missed_word"],
      })
      expectedIndex += 1
      return
    }

    mistakes.push({
      index: expectedIndex,
      type: "extra",
      word: entry.detected,
      confidence: calculateMistakeConfidence(null, "extra", context),
      categories: ["extra_word"],
    })
  })

  return mistakes
}

const buildAlignmentConfidence = (
  alignment: AlignmentEntry[],
  context: AlignmentContext,
): AlignmentConfidenceEntry[] =>
  alignment.map((entry, index) => {
    if (entry.type === "match") {
      const isSubstitution = entry.similarity < context.substitutionThreshold
      if (isSubstitution) {
        return {
          index,
          type: "substitution" as const,
          confidence: calculateMistakeConfidence(entry, "substitution", context),
          expected: entry.expected,
          detected: entry.detected,
        }
      }

      return {
        index,
        type: "match" as const,
        confidence: clampScore(entry.similarity * 100),
        expected: entry.expected,
        detected: entry.detected,
      }
    }

    if (entry.type === "missing") {
      return {
        index,
        type: "missing" as const,
        confidence: calculateMistakeConfidence(null, "missing", context),
        expected: entry.expected,
      }
    }

    return {
      index,
      type: "extra" as const,
      confidence: calculateMistakeConfidence(null, "extra", context),
      detected: entry.detected,
    }
  })

export const createLiveSessionSummary = (
  transcription: string,
  expectedText: string,
  options: {
    durationSeconds?: number
    ayahId?: string
    analysis?: Partial<LiveAnalysisProfile>
    dialect?: DialectCode | "auto"
    localeHint?: string | null
    substitutionThreshold?: number
  } = {},
): LiveSessionSummary => {
  const trimmedTranscription = transcription.trim()
  const trimmedExpected = expectedText.trim()
  const dialectResolution = resolveDialect(options.dialect ?? "auto", {
    expectedText: trimmedExpected,
    transcript: trimmedTranscription,
    localeHint: options.localeHint ?? null,
    fallback: "standard",
  })
  const substitutionThreshold = Number.isFinite(options.substitutionThreshold)
    ? Math.max(0.5, Math.min(0.95, Number(options.substitutionThreshold)))
    : DEFAULT_SUBSTITUTION_THRESHOLD

  const alignmentContext: AlignmentContext = {
    model: dialectResolution.model,
    substitutionThreshold,
  }

  const alignment = alignWords(trimmedExpected, trimmedTranscription, alignmentContext)
  const mistakes = collectMistakes(alignment, alignmentContext)
  const alignmentConfidence = buildAlignmentConfidence(alignment, alignmentContext)
  const mistakeConfidenceEntries = mistakes.map((mistake) => ({
    index: mistake.index,
    type: mistake.type,
    confidence: mistake.confidence,
  }))

  const expectedTokens = splitWords(trimmedExpected)
  const totalExpected = expectedTokens.length || 1
  const correctCount = alignment.filter(
    (entry) => entry.type === "match" && (entry as MatchAlignmentEntry).similarity >= substitutionThreshold,
  ).length
  const accuracy = clampScore((correctCount / totalExpected) * 100)

  const missingCount = mistakes.filter((mistake) => mistake.type === "missing").length
  const extraCount = mistakes.filter((mistake) => mistake.type === "extra").length
  const substitutionCount = mistakes.filter((mistake) => mistake.type === "substitution").length

  const timingScore = clampScore(accuracy - missingCount * 10)
  const fluencyScore = clampScore(accuracy - substitutionCount * 5 - extraCount * 4)
  const overallScore = clampScore((accuracy + timingScore + fluencyScore) / 3)

  const qualitativeFeedback = (() => {
    if (!trimmedTranscription) {
      return "We could not capture any recitation in this session."
    }
    if (overallScore >= 90) {
      return "Beautiful recitation. Keep up the precise pacing and clarity."
    }
    if (overallScore >= 75) {
      return "Strong recitation overall. Review the highlighted words to polish them further."
    }
    if (overallScore >= 60) {
      return "Good effort. Focus on the flagged words to steady your recitation."
    }
    return "Let's revisit the verse slowly and pay attention to each highlighted mistake."
  })()

  const errors = mistakes.map((mistake) => ({
    type: mistake.type,
    message: buildErrorMessage(mistake),
    expected: mistake.correct,
    transcribed: mistake.word,
    categories: mistake.categories,
    confidence: mistake.confidence,
  }))

  const categoryCounts = mistakes.reduce<MutableCategoryCount>((acc, mistake) => {
    mistake.categories.forEach((category) => {
      acc[category] = (acc[category] ?? 0) + 1
    })
    return acc
  }, {})

  const mistakeBreakdown: MistakeBreakdownEntry[] = MISTAKE_CATEGORY_ORDER.map((category) => ({
    category,
    label: MISTAKE_CATEGORY_META[category].label,
    description: MISTAKE_CATEGORY_META[category].description,
    count: categoryCounts[category] ?? 0,
  })).filter((entry) => entry.count > 0)

  const alignmentConfidenceAverage =
    alignmentConfidence.length > 0
      ? alignmentConfidence.reduce((sum, entry) => sum + entry.confidence, 0) / alignmentConfidence.length
      : 100

  const mistakeConfidenceAverage =
    mistakeConfidenceEntries.length > 0
      ? mistakeConfidenceEntries.reduce((sum, entry) => sum + entry.confidence, 0) / mistakeConfidenceEntries.length
      : alignmentConfidenceAverage

  const overallConfidenceScore = clampScore(alignmentConfidenceAverage * 0.6 + mistakeConfidenceAverage * 0.4)

  const confidence: ConfidenceBreakdown = {
    overall: overallConfidenceScore,
    mistakes: mistakeConfidenceEntries,
    alignment: alignmentConfidence,
  }

  const dialectInsight: DialectInsight = {
    code: dialectResolution.model.code,
    label: dialectResolution.model.label,
    description: dialectResolution.model.description,
    source: dialectResolution.source,
    weight: dialectResolution.model.weight,
    detectionConfidence: clampScore(dialectResolution.confidence * 100),
    reasons: dialectResolution.reasons,
  }

  const analysisEngine = options.analysis?.engine ?? "on-device"
  const baseStack =
    options.analysis?.stack ??
    (analysisEngine === "tarteel"
      ? ["Tarteel speech recognition", "Word-level alignment", "Recitation feedback heuristics"]
      : ["Browser speech recognition", "Word-level alignment", "Recitation feedback heuristics"])
  const stackWithDialect = baseStack.includes("Dialect-adaptive phonetic alignment")
    ? baseStack
    : [...baseStack, "Dialect-adaptive phonetic alignment"]

  const baseDescription =
    options.analysis?.description ??
    (analysisEngine === "tarteel"
      ? "Tarteel transcription with simplified word-level alignment."
      : analysisEngine === "nvidia"
        ? "GPU-accelerated transcription with lightweight word alignment."
        : "Client-side speech recognition paired with lightweight word alignment.")

  const descriptionWithDialect = baseDescription.includes(dialectResolution.model.label)
    ? baseDescription
    : `${baseDescription} Dialect model: ${dialectResolution.model.label}.`

  const analysis: LiveAnalysisProfile = {
    engine: analysisEngine,
    latencyMs: options.analysis?.latencyMs ?? null,
    description: descriptionWithDialect,
    stack: stackWithDialect,
  }

  const hasanatPoints = Math.max(5, Math.round((accuracy / 100) * totalExpected * 4))
  const arabicLetterCount = countArabicLetters(trimmedExpected || trimmedTranscription)
  const words = Array.from(trimmedTranscription.matchAll(/\S+/g)).map((match) => ({
    word: match[0],
    start: match.index ?? 0,
    end: (match.index ?? 0) + match[0].length,
  }))

  return {
    transcription: trimmedTranscription,
    expectedText: trimmedExpected,
    mistakes,
    mistakeBreakdown,
    analysis,
    feedback: {
      overallScore,
      accuracy,
      timingScore,
      fluencyScore,
      feedback: qualitativeFeedback,
      errors,
    },
    confidence,
    dialect: dialectInsight,
    hasanatPoints,
    arabicLetterCount,
    words,
    duration: options.durationSeconds,
    ayahId: options.ayahId,
  }
}

export const calculateRecitationMetricScores = (
  mistakes: LiveMistake[],
  expectedText: string,
): { accuracy: number; completeness: number; flow: number; extras: number } => {
  const totalWords = Math.max(1, splitWords(expectedText).length)
  const missing = mistakes.filter((mistake) => mistake.type === "missing").length
  const extras = mistakes.filter((mistake) => mistake.type === "extra").length
  const substitutions = mistakes.filter((mistake) => mistake.type === "substitution").length

  const accuracy = clampScore(((totalWords - substitutions) / totalWords) * 100)
  const completeness = clampScore(((totalWords - missing) / totalWords) * 100)
  const flowPenalty = substitutions * 6 + extras * 5
  const flow = clampScore(100 - flowPenalty)
  const extraDiscipline = clampScore(100 - extras * (100 / totalWords))

  return {
    accuracy,
    completeness,
    flow,
    extras: extraDiscipline,
  }
}

export const calculateTajweedMetricScores = calculateRecitationMetricScores
