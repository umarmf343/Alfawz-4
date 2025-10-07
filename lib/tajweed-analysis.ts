const ARABIC_LETTER_REGEX = /\p{Script=Arabic}/gu

export type MistakeCategory =
  | "missed_word"
  | "incorrect_word"
  | "extra_word"
  | "harakat"
  | "pronunciation"
  | "tajweed"

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
    label: "Extra word",
    description: "Words or sounds added beyond the written ayah.",
  },
  harakat: {
    label: "Fatha / Damma / Kasra",
    description: "Short vowel markings that were misapplied or omitted.",
  },
  pronunciation: {
    label: "Pronunciation",
    description: "Articulation differences such as makhārij or heavy letter treatment.",
  },
  tajweed: {
    label: "Tajweed",
    description: "Rule-based deviations such as madd, ghunnah, or qalqalah cues.",
  },
}

const MISTAKE_CATEGORY_ORDER: MistakeCategory[] = [
  "missed_word",
  "incorrect_word",
  "extra_word",
  "harakat",
  "pronunciation",
  "tajweed",
]

export type LiveMistake = {
  index: number
  type: "missing" | "extra" | "substitution"
  word?: string
  correct?: string
  normalizedWord?: string
  normalizedCorrect?: string
  tajweedError?: string
  tajweedRules?: string[]
  categories: MistakeCategory[]
}

export type TajweedMetricScores = {
  makharij: number
  madd: number
  ghunnah: number
  qalqalah: number
}

export type LiveAnalysisProfile = {
  engine: "nvidia" | "on-device"
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

type Token = { raw: string; sanitized: string }

type MutableCategoryCount = Partial<Record<MistakeCategory, number>>

const MAKHRAJ_GROUPS: Record<string, string[]> = {
  throat: ["ء", "ه", "ع", "ح", "غ", "خ"],
  tongueTip: ["ت", "د", "ط", "ث", "ذ", "ظ", "ص", "ز", "س", "ن", "ر", "ل"],
  tongueMiddle: ["ج", "ش", "ي"],
  tongueBack: ["ق", "ك"],
  lips: ["ب", "م", "ف", "و"],
  nasal: ["ن", "م"],
}

const HEAVY_LETTERS = new Set(["ص", "ض", "ط", "ظ", "ق", "غ", "خ"])
const QALQALAH_LETTERS = new Set(["ق", "ط", "ب", "ج", "د"])
const MADD_LETTERS = new Set(["ا", "و", "ي", "ى", "آ"])

export const removeDiacritics = (text: string) => text.replace(/[\u064B-\u0652\u0670\u0640]/g, "")

const sanitizeWord = (word: string) =>
  removeDiacritics(word)
    .replace(/[.,،!?؛:()\[\]{}«»\-]/g, "")
    .trim()

const normalizeForHarakatComparison = (word: string) =>
  word
    .replace(/[.,،!?؛:()\[\]{}«»\-]/g, "")
    .replace(/\s+/g, "")
    .trim()

const tokenizeWords = (text: string): Token[] =>
  (text.match(/\S+/g) ?? [])
    .map((raw) => ({ raw, sanitized: sanitizeWord(raw) }))
    .filter((token) => token.sanitized.length > 0)

const getMakhrajGroup = (letter: string) =>
  Object.entries(MAKHRAJ_GROUPS).find(([, letters]) => letters.includes(letter))?.[0] ?? null

const findFirstLetterDifference = (spoken: string, correct: string) => {
  const spokenLetters = Array.from(spoken)
  const correctLetters = Array.from(correct)

  for (let index = 0; index < Math.max(spokenLetters.length, correctLetters.length); index += 1) {
    const spokenLetter = spokenLetters[index]
    const correctLetter = correctLetters[index]

    if (!spokenLetter || !correctLetter) {
      if (!spokenLetter && correctLetter) {
        return { spokenLetter: "", correctLetter }
      }

      if (spokenLetter && !correctLetter) {
        return { spokenLetter, correctLetter: "" }
      }

      continue
    }

    if (spokenLetter !== correctLetter) {
      return { spokenLetter, correctLetter }
    }
  }

  return null
}

const needsMadd = (word: string) => {
  const normalized = removeDiacritics(word)
  if (!normalized) {
    return false
  }

  return Array.from(normalized).some((letter, index, array) => {
    if (!MADD_LETTERS.has(letter)) {
      return false
    }

    const previous = array[index - 1]
    return Boolean(previous)
  })
}

const detectGhunnahRequirement = (word: string) => /\u0646\u0651|\u0645\u0651/.test(word)

export const analyzeMistakes = (transcribedText: string, correctText: string): LiveMistake[] => {
  if (!transcribedText || !correctText) {
    return []
  }

  const transcribedWords = tokenizeWords(transcribedText)
  const correctWords = tokenizeWords(correctText)
  const mistakes: LiveMistake[] = []
  const maxLength = Math.max(transcribedWords.length, correctWords.length)

  for (let index = 0; index < maxLength; index += 1) {
    const spoken = transcribedWords[index]
    const expected = correctWords[index]

    if (!spoken && expected) {
      mistakes.push({
        index,
        type: "missing",
        correct: expected.raw,
        normalizedCorrect: expected.sanitized,
        categories: ["missed_word"],
      })
      continue
    }

    if (spoken && !expected) {
      mistakes.push({
        index,
        type: "extra",
        word: spoken.raw,
        normalizedWord: spoken.sanitized,
        categories: ["extra_word"],
      })
      continue
    }

    if (!spoken || !expected) {
      continue
    }

    const harakatSpoken = normalizeForHarakatComparison(spoken.raw)
    const harakatExpected = normalizeForHarakatComparison(expected.raw)
    const harakatBaseMatch =
      removeDiacritics(harakatSpoken) === removeDiacritics(harakatExpected)
    const harakatMismatch =
      harakatBaseMatch && harakatSpoken !== harakatExpected

    if (harakatMismatch) {
      mistakes.push({
        index,
        type: "substitution",
        word: spoken.raw,
        correct: expected.raw,
        normalizedWord: spoken.sanitized,
        normalizedCorrect: expected.sanitized,
        categories: ["incorrect_word", "harakat"],
      })
      continue
    }

    if (spoken.sanitized && expected.sanitized && spoken.sanitized !== expected.sanitized) {
      mistakes.push({
        index,
        type: "substitution",
        word: spoken.raw,
        correct: expected.raw,
        normalizedWord: spoken.sanitized,
        normalizedCorrect: expected.sanitized,
        categories: ["incorrect_word", "pronunciation"],
      })
    }
  }

  return mistakes
}

export const annotateTajweedMistakes = (mistakes: LiveMistake[]): LiveMistake[] => {
  return mistakes.map((mistake) => {
    const detectedRules: string[] = []
    const spoken = mistake.word ?? ""
    const correct = mistake.correct ?? ""
    const normalizedSpoken = mistake.normalizedWord ?? (spoken ? sanitizeWord(spoken) : "")
    const normalizedCorrect = mistake.normalizedCorrect ?? (correct ? sanitizeWord(correct) : "")
    const categories = new Set<MistakeCategory>(mistake.categories)

    if (mistake.type === "missing" && correct) {
      if (needsMadd(correct)) {
        detectedRules.push("Madd: Maintain elongation on the long vowel that was skipped.")
        categories.add("tajweed")
      }
      if (detectGhunnahRequirement(correct)) {
        detectedRules.push("Ghunnah: Sustain nasalization on مّ or نّ in the omitted word.")
        categories.add("tajweed")
      }
    }

    if (mistake.type === "substitution" && normalizedCorrect) {
      const difference = findFirstLetterDifference(normalizedSpoken, normalizedCorrect)
      if (difference?.correctLetter) {
        const correctGroup = getMakhrajGroup(difference.correctLetter)
        const spokenGroup = difference.spokenLetter ? getMakhrajGroup(difference.spokenLetter) : null

        if (correctGroup && correctGroup !== spokenGroup) {
          detectedRules.push(
            `Makhraj: Articulate the letter from the ${correctGroup.replace(/([A-Z])/g, " $1").toLowerCase()} area.`,
          )
          categories.add("pronunciation")
          categories.add("tajweed")
        }

        if (HEAVY_LETTERS.has(difference.correctLetter)) {
          detectedRules.push(`Tafkhim: Keep the letter "${difference.correctLetter}" heavy during pronunciation.`)
          categories.add("pronunciation")
          categories.add("tajweed")
        }

        if (QALQALAH_LETTERS.has(difference.correctLetter)) {
          detectedRules.push(`Qalqalah: Add the echo/bounce when pronouncing "${difference.correctLetter}".`)
          categories.add("tajweed")
        }
      }

      if (needsMadd(correct) && normalizedSpoken.length < normalizedCorrect.length) {
        detectedRules.push("Madd: Preserve the required elongation for long vowels.")
        categories.add("tajweed")
      }

      if (detectGhunnahRequirement(correct) && !detectGhunnahRequirement(spoken)) {
        detectedRules.push("Ghunnah: Maintain the nasal sound on doubled م or ن.")
        categories.add("tajweed")
      }
    }

    if (mistake.type === "extra" && normalizedSpoken) {
      const firstExtraLetter = Array.from(normalizedSpoken)[0]
      if (firstExtraLetter && HEAVY_LETTERS.has(firstExtraLetter)) {
        detectedRules.push("Tafkhim: Ensure added letters do not introduce unnecessary heavy sounds.")
        categories.add("pronunciation")
        categories.add("tajweed")
      }
    }

    return {
      ...mistake,
      tajweedRules: detectedRules,
      tajweedError: detectedRules.length > 0 ? detectedRules.join(" ") : undefined,
      categories: Array.from(categories),
    }
  })
}

export const calculateTajweedMetricScores = (
  mistakes: LiveMistake[],
  expectedText: string,
): TajweedMetricScores => {
  if (!expectedText) {
    return {
      makharij: 100,
      madd: 100,
      ghunnah: 100,
      qalqalah: 100,
    }
  }

  const totalWords = Math.max(1, tokenizeWords(expectedText).length)

  const issueCounters = {
    makharij: 0,
    madd: 0,
    ghunnah: 0,
    qalqalah: 0,
  }

  mistakes.forEach((mistake) => {
    const rules = mistake.tajweedRules ?? []
    const counted = {
      makharij: false,
      madd: false,
      ghunnah: false,
      qalqalah: false,
    }

    rules.forEach((rule) => {
      const normalizedRule = rule.toLowerCase()
      if (!counted.makharij && (normalizedRule.includes("makhraj") || normalizedRule.includes("tafkhim"))) {
        issueCounters.makharij += 1
        counted.makharij = true
      }
      if (!counted.madd && normalizedRule.includes("madd")) {
        issueCounters.madd += 1
        counted.madd = true
      }
      if (!counted.ghunnah && normalizedRule.includes("ghunnah")) {
        issueCounters.ghunnah += 1
        counted.ghunnah = true
      }
      if (!counted.qalqalah && normalizedRule.includes("qalqalah")) {
        issueCounters.qalqalah += 1
        counted.qalqalah = true
      }
    })

    if (rules.length === 0 && mistake.type === "substitution") {
      issueCounters.makharij += 0.5
    }
    if (mistake.type === "missing") {
      issueCounters.madd += 0.5
    }
  })

  const scoreFromIssues = (issues: number) => {
    const penalty = (issues / totalWords) * 100
    return Math.max(45, Math.round(100 - penalty))
  }

  return {
    makharij: scoreFromIssues(issueCounters.makharij),
    madd: scoreFromIssues(issueCounters.madd),
    ghunnah: scoreFromIssues(issueCounters.ghunnah),
    qalqalah: scoreFromIssues(issueCounters.qalqalah),
  }
}

const buildErrorMessage = (mistake: LiveMistake) => {
  if (mistake.tajweedError) {
    return mistake.tajweedError
  }

  if (mistake.type === "missing") {
    return "Expected word was not articulated in the recitation."
  }

  if (mistake.type === "extra") {
    return "An extra word or sound was detected beyond the written ayah."
  }

  if (mistake.type === "substitution") {
    return "Pronunciation differed from the expected articulation."
  }

  return "Pronunciation issue detected in this segment."
}

const countArabicLetters = (text: string) => Array.from(text).filter((char) => ARABIC_LETTER_REGEX.test(char)).length

const clampScore = (value: number) => Math.max(0, Math.min(100, Math.round(value)))

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

  const mistakes = annotateTajweedMistakes(analyzeMistakes(trimmedTranscription, trimmedExpected))
  const metrics = calculateTajweedMetricScores(mistakes, trimmedExpected)
  const expectedTokens = tokenizeWords(trimmedExpected)
  const totalExpected = expectedTokens.length || 1
  const mistakeCount = mistakes.length

  const accuracy = clampScore(((totalExpected - mistakeCount) / totalExpected) * 100)
  const fluencyPenalty = mistakes.filter((mistake) => mistake.type !== "missing").length * 3
  const fluencyScore = clampScore(accuracy - fluencyPenalty)
  const timingPenalty = mistakes.filter((mistake) => mistake.type === "missing").length * 4
  const timingScore = clampScore(accuracy - timingPenalty)
  const tajweedAverage = clampScore(
    (metrics.makharij + metrics.madd + metrics.ghunnah + metrics.qalqalah) / 4,
  )
  const overallScore = clampScore((tajweedAverage + accuracy + fluencyScore + timingScore) / 4)

  const qualitativeFeedback = (() => {
    if (!trimmedTranscription) {
      return "We could not capture any recitation in this session."
    }
    if (overallScore >= 90) {
      return "Excellent tajweed consistency with only minor articulation touches to refine."
    }
    if (overallScore >= 75) {
      return "Strong recitation overall. Review the highlighted tajweed cues for even greater precision."
    }
    if (overallScore >= 60) {
      return "Good effort. Focus on the tajweed notes below to steady articulation and elongation."
    }
    return "Let's revisit the verse slowly and pay attention to each tajweed correction highlighted."
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

  const analysisEngine = options.analysis?.engine ?? "nvidia"
  const defaultStack =
    analysisEngine === "nvidia"
      ? ["NVIDIA TensorRT streaming", "CUDA-optimised Whisper", "GPU-powered tajwīd scoring"]
      : ["Browser speech APIs", "Device microphone", "Client-side tajwīd heuristics"]

  const analysis: LiveAnalysisProfile = {
    engine: analysisEngine,
    latencyMs: options.analysis?.latencyMs ?? null,
    description:
      options.analysis?.description ??
      (analysisEngine === "nvidia"
        ? "GPU-accelerated inference tuned for <200ms latency with tajwīd-aware scoring."
        : "On-device recognition using browser speech services for rapid feedback."),
    stack: options.analysis?.stack ?? defaultStack,
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
