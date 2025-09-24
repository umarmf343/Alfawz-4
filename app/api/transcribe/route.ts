import { type NextRequest, NextResponse } from "next/server"
import OpenAI from "openai"

let openaiClient: OpenAI | null = null

function getOpenAIClient() {
  if (!openaiClient) {
    openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  }
  return openaiClient
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const audioFile = formData.get("audio") as File
    const expectedText = formData.get("expectedText") as string
    const ayahId = formData.get("ayahId") as string

    if (!audioFile) {
      return NextResponse.json({ error: "No audio file provided" }, { status: 400 })
    }

    if (!expectedText) {
      return NextResponse.json({ error: "Missing expected text" }, { status: 400 })
    }

    if (!process.env.OPENAI_API_KEY) {
      console.error("Transcription error: OPENAI_API_KEY is not configured")
      return NextResponse.json({ error: "Transcription service not configured" }, { status: 500 })
    }

    const openai = getOpenAIClient()

    // Convert File to Buffer for OpenAI API
    const arrayBuffer = await audioFile.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Create a temporary file-like object for OpenAI
    const file = new File([buffer], "audio.wav", { type: "audio/wav" })

    // Transcribe audio using OpenAI Whisper
    const transcription = await openai.audio.transcriptions.create({
      file: file,
      model: "whisper-1",
      language: "ar", // Arabic
      response_format: "verbose_json",
      timestamp_granularities: ["word"],
    })

    // Analyze transcription against expected text
    const feedback = analyzeRecitation(transcription.text, expectedText, transcription.words || [])

    // Calculate Hasanat points (Arabic letters × 10)
    const arabicLetterCount = countArabicLetters(expectedText)
    const hasanatPoints = Math.round(arabicLetterCount * 10 * (feedback.overallScore / 100))

    const result = {
      transcription: transcription.text,
      expectedText,
      feedback,
      hasanatPoints,
      arabicLetterCount,
      words: transcription.words,
      duration: transcription.duration,
      ayahId,
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error("Transcription error:", error)
    return NextResponse.json({ error: "Failed to transcribe audio" }, { status: 500 })
  }
}

function analyzeRecitation(transcribed: string, expected: string, words: any[]) {
  // Normalize Arabic text (remove diacritics for comparison)
  const normalizeArabic = (text: string) => {
    return text
      .replace(/[\u064B-\u0652\u0670\u0640]/g, "") // Remove diacritics and tatweel
      .replace(/\s+/g, " ")
      .trim()
  }

  const normalizedTranscribed = normalizeArabic(transcribed)
  const normalizedExpected = normalizeArabic(expected)

  // Calculate edit distance (Levenshtein distance)
  const editDistance = calculateEditDistance(normalizedTranscribed, normalizedExpected)
  const maxLength = Math.max(normalizedTranscribed.length, normalizedExpected.length)
  const accuracy = Math.max(0, (1 - editDistance / maxLength) * 100)

  // Analyze specific errors
  const errors = findErrors(normalizedTranscribed, normalizedExpected)

  // Calculate timing analysis
  const timingAnalysis = analyzeTimingFromWords(words, normalizedExpected)

  // Overall score calculation
  const accuracyWeight = 0.6
  const timingWeight = 0.2
  const fluencyWeight = 0.2

  const overallScore = Math.round(
    accuracy * accuracyWeight + timingAnalysis.timingScore * timingWeight + timingAnalysis.fluencyScore * fluencyWeight,
  )

  return {
    overallScore: Math.max(0, Math.min(100, overallScore)),
    accuracy: Math.round(accuracy),
    timingScore: timingAnalysis.timingScore,
    fluencyScore: timingAnalysis.fluencyScore,
    errors,
    missedWords: errors.filter((e) => e.type === "omission"),
    mispronounced: errors.filter((e) => e.type === "substitution"),
    extraWords: errors.filter((e) => e.type === "insertion"),
    feedback: generateFeedbackMessage(accuracy, timingAnalysis, errors),
  }
}

function calculateEditDistance(str1: string, str2: string): number {
  const matrix = Array(str2.length + 1)
    .fill(null)
    .map(() => Array(str1.length + 1).fill(null))

  for (let i = 0; i <= str1.length; i++) matrix[0][i] = i
  for (let j = 0; j <= str2.length; j++) matrix[j][0] = j

  for (let j = 1; j <= str2.length; j++) {
    for (let i = 1; i <= str1.length; i++) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1, // insertion
        matrix[j - 1][i] + 1, // deletion
        matrix[j - 1][i - 1] + indicator, // substitution
      )
    }
  }

  return matrix[str2.length][str1.length]
}

function findErrors(transcribed: string, expected: string) {
  const transcribedWords = transcribed.split(" ")
  const expectedWords = expected.split(" ")
  const errors = []

  // Simple word-by-word comparison
  const maxLength = Math.max(transcribedWords.length, expectedWords.length)

  for (let i = 0; i < maxLength; i++) {
    const transcribedWord = transcribedWords[i] || ""
    const expectedWord = expectedWords[i] || ""

    if (!transcribedWord && expectedWord) {
      errors.push({
        type: "omission",
        expected: expectedWord,
        position: i,
        message: `Missing word: "${expectedWord}"`,
      })
    } else if (transcribedWord && !expectedWord) {
      errors.push({
        type: "insertion",
        transcribed: transcribedWord,
        position: i,
        message: `Extra word: "${transcribedWord}"`,
      })
    } else if (transcribedWord !== expectedWord && transcribedWord && expectedWord) {
      errors.push({
        type: "substitution",
        transcribed: transcribedWord,
        expected: expectedWord,
        position: i,
        message: `"${transcribedWord}" should be "${expectedWord}"`,
      })
    }
  }

  return errors
}

function analyzeTimingFromWords(words: any[], expectedText: string) {
  if (!words || words.length === 0) {
    return { timingScore: 70, fluencyScore: 70, avgPause: 0 }
  }

  // Calculate pauses between words
  const pauses = []
  for (let i = 1; i < words.length; i++) {
    const pause = words[i].start - words[i - 1].end
    pauses.push(pause)
  }

  const avgPause = pauses.length > 0 ? pauses.reduce((a, b) => a + b, 0) / pauses.length : 0
  const longPauses = pauses.filter((p) => p > 1.0).length // Pauses longer than 1 second

  // Calculate speaking rate (words per minute)
  const totalDuration = words[words.length - 1]?.end - words[0]?.start || 1
  const wordsPerMinute = (words.length / totalDuration) * 60

  // Ideal range for Quranic recitation: 80-120 WPM
  const idealWPM = 100
  const wpmScore = Math.max(0, 100 - Math.abs(wordsPerMinute - idealWPM) * 2)

  // Timing score based on consistency
  const timingScore = Math.max(0, 100 - longPauses * 10)

  // Fluency score based on speaking rate and pause consistency
  const fluencyScore = (wpmScore + timingScore) / 2

  return {
    timingScore: Math.round(timingScore),
    fluencyScore: Math.round(fluencyScore),
    avgPause: Math.round(avgPause * 1000) / 1000, // Round to 3 decimal places
    wordsPerMinute: Math.round(wordsPerMinute),
    longPauses,
  }
}

function generateFeedbackMessage(accuracy: number, timingAnalysis: any, errors: any[]) {
  const messages = []

  if (accuracy >= 90) {
    messages.push("Excellent recitation! Your pronunciation is very accurate.")
  } else if (accuracy >= 75) {
    messages.push("Good recitation with minor pronunciation issues.")
  } else if (accuracy >= 60) {
    messages.push("Fair recitation. Focus on improving pronunciation accuracy.")
  } else {
    messages.push("Keep practicing! Work on pronunciation and accuracy.")
  }

  if (timingAnalysis.fluencyScore >= 80) {
    messages.push("Your recitation flow is smooth and natural.")
  } else if (timingAnalysis.longPauses > 3) {
    messages.push("Try to reduce long pauses between words for better flow.")
  }

  if (errors.length > 0) {
    const errorTypes = [...new Set(errors.map((e) => e.type))]
    if (errorTypes.includes("omission")) {
      messages.push("Pay attention to all words - some were missed.")
    }
    if (errorTypes.includes("substitution")) {
      messages.push("Double-check pronunciation of highlighted words.")
    }
  }

  return messages.join(" ")
}

function countArabicLetters(text: string): number {
  // Count Arabic letters (excluding spaces, punctuation, and diacritics)
  const arabicLetterRegex = /[\u0627-\u064A]/g
  const matches = text.match(arabicLetterRegex)
  return matches ? matches.length : 0
}
