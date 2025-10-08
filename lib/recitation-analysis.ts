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

type AlignmentEntry =
  | { type: "match"; expected: string; detected: string; similarity: number }
  | { type: "missing"; expected: string }
  | { type: "extra"; detected: string }

export type LiveMistake = {
  index: number
  type: "missing" | "extra" | "substitution"
  word?: string
  correct?: string
  similarity?: number
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
    }[]
  }
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

const normalizeForComparison = (word: string): string =>
  word
    .normalize("NFC")
    .replace(/[\u0640\u200c\u200d]/g, "")
    .replace(/[^\p{Letter}\p{Mark}\p{Number}]+/gu, "")
    .toLowerCase()

const normalizeForScoring = (word: string): string =>
  word
    .normalize("NFC")
    .replace(/[\u0640\u200c\u200d]/g, "")
    .replace(/[\u064B-\u065F\u0670]/g, "")
    .replace(/[^\p{Letter}\p{Mark}\p{Number}]+/gu, "")
    .toLowerCase()

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
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost,
      )
    }
  }

  return matrix[a.length][b.length]
}

const wordSimilarity = (a: string, b: string): number => {
  const normalizedA = normalizeForComparison(a)
  const normalizedB = normalizeForComparison(b)
  if (!normalizedA && !normalizedB) {
    return 1
  }
  if (!normalizedA || !normalizedB) {
    return 0
  }

  const distance = levenshtein(normalizedA, normalizedB)
  const maxLength = Math.max(normalizedA.length, normalizedB.length)
  if (maxLength === 0) {
    return 1
  }

  return 1 - distance / maxLength
}

const tokenize = (text: string): Token[] =>
  splitWords(text).map((word) => ({ raw: word, normalized: normalizeForScoring(word) }))

const alignWords = (expected: string, detected: string): AlignmentEntry[] => {
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
      const substitutionPenalty = 1 - wordSimilarity(expectedWords[i - 1].raw, detectedWords[j - 1].raw)
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
      const similarity = wordSimilarity(expectedWord.raw, detectedWord.raw)
      result.unshift({
        type: similarity >= 0.75 ? "match" : "match",
        expected: expectedWord.raw,
        detected: detectedWord.raw,
        similarity,
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

const collectMistakes = (alignment: AlignmentEntry[]): LiveMistake[] => {
  const mistakes: LiveMistake[] = []
  let expectedIndex = 0

  alignment.forEach((entry) => {
    if (entry.type === "match") {
      if (entry.similarity < 0.75) {
        mistakes.push({
          index: expectedIndex,
          type: "substitution",
          word: entry.detected,
          correct: entry.expected,
          similarity: entry.similarity,
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
        categories: ["missed_word"],
      })
      expectedIndex += 1
      return
    }

    mistakes.push({
      index: expectedIndex,
      type: "extra",
      word: entry.detected,
      categories: ["extra_word"],
    })
  })

  return mistakes
}

export const createLiveSessionSummary = (
  transcription: string,
  expectedText: string,
  options: {
    durationSeconds?: number
    ayahId?: string
    analysis?: Partial<LiveAnalysisProfile>
  } = {},
): LiveSessionSummary => {
  const trimmedTranscription = transcription.trim()
  const trimmedExpected = expectedText.trim()
  const alignment = alignWords(trimmedExpected, trimmedTranscription)
  const mistakes = collectMistakes(alignment)

  const expectedTokens = splitWords(trimmedExpected)
  const totalExpected = expectedTokens.length || 1
  const correctCount = alignment.filter(
    (entry) => entry.type === "match" && (entry as AlignmentEntry & { similarity: number }).similarity >= 0.75,
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

  const analysisEngine = options.analysis?.engine ?? "on-device"
  const analysis: LiveAnalysisProfile = {
    engine: analysisEngine,
    latencyMs: options.analysis?.latencyMs ?? null,
    description:
      options.analysis?.description ??
      (analysisEngine === "tarteel"
        ? "Tarteel transcription with simplified word-level alignment."
        : analysisEngine === "nvidia"
          ? "GPU-accelerated transcription with lightweight word alignment."
          : "Client-side speech recognition paired with lightweight word alignment."),
    stack:
      options.analysis?.stack ??
      (analysisEngine === "tarteel"
        ? ["Tarteel speech recognition", "Word-level alignment", "Recitation feedback heuristics"]
        : ["Browser speech recognition", "Word-level alignment", "Recitation feedback heuristics"]),
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
