import { promises as fs } from "fs"
import path from "path"
import { nanoid } from "nanoid"

import type { DialectCode } from "./phonetics"
import type { LiveMistake, MistakeCategory } from "./recitation-analysis"

const FEEDBACK_FILE_PATH = path.join(process.cwd(), "data", "recitation-feedback.json")

export type RecitationFeedbackRecord = {
  id: string
  createdAt: string
  ayahId?: string
  dialect?: DialectCode
  detectionSource?: string
  isAccurate: boolean
  systemConfidence?: number
  notes?: string
  correction?: string
  mistakes?: {
    index: number
    type: LiveMistake["type"]
    word?: string
    correct?: string
    confidence: number
    categories: MistakeCategory[]
  }[]
  expectedText?: string
  transcription?: string
}

export type RecitationFeedbackSummary = {
  total: number
  accuracyBreakdown: {
    accurate: number
    flagged: number
  }
  averageConfidence: number
  byDialect: Record<string, { total: number; averageConfidence: number }>
}

const ensureFeedbackFile = async () => {
  try {
    await fs.access(FEEDBACK_FILE_PATH)
  } catch (error) {
    await fs.mkdir(path.dirname(FEEDBACK_FILE_PATH), { recursive: true })
    await fs.writeFile(FEEDBACK_FILE_PATH, "[]", "utf8")
  }
}

const readFeedback = async (): Promise<RecitationFeedbackRecord[]> => {
  await ensureFeedbackFile()
  const contents = await fs.readFile(FEEDBACK_FILE_PATH, "utf8")
  try {
    const parsed = JSON.parse(contents) as RecitationFeedbackRecord[]
    if (Array.isArray(parsed)) {
      return parsed
    }
    return []
  } catch (error) {
    console.warn("Failed to parse recitation feedback store. Reinitialising.", error)
    await fs.writeFile(FEEDBACK_FILE_PATH, "[]", "utf8")
    return []
  }
}

const writeFeedback = async (records: RecitationFeedbackRecord[]) => {
  await fs.writeFile(FEEDBACK_FILE_PATH, JSON.stringify(records, null, 2), "utf8")
}

export type SaveRecitationFeedbackInput = {
  ayahId?: string
  dialect?: DialectCode
  detectionSource?: string
  isAccurate: boolean
  systemConfidence?: number
  notes?: string
  correction?: string
  mistakes?: {
    index: number
    type: LiveMistake["type"]
    word?: string
    correct?: string
    confidence: number
    categories: MistakeCategory[]
  }[]
  expectedText?: string
  transcription?: string
}

export const saveRecitationFeedback = async (
  input: SaveRecitationFeedbackInput,
): Promise<RecitationFeedbackRecord> => {
  const record: RecitationFeedbackRecord = {
    id: nanoid(12),
    createdAt: new Date().toISOString(),
    ...input,
  }

  const existing = await readFeedback()
  existing.push(record)
  await writeFeedback(existing)

  return record
}

export const getRecitationFeedbackSummary = async (): Promise<RecitationFeedbackSummary> => {
  const records = await readFeedback()
  if (records.length === 0) {
    return {
      total: 0,
      accuracyBreakdown: { accurate: 0, flagged: 0 },
      averageConfidence: 0,
      byDialect: {},
    }
  }

  const accurate = records.filter((record) => record.isAccurate).length
  const flagged = records.length - accurate
  const averageConfidence =
    records.reduce((sum, record) => sum + (record.systemConfidence ?? 0), 0) / records.length

  const byDialect = records.reduce<Record<string, { total: number; averageConfidence: number }>>((acc, record) => {
    const key = record.dialect ?? "unknown"
    if (!acc[key]) {
      acc[key] = { total: 0, averageConfidence: 0 }
    }
    const bucket = acc[key]
    bucket.total += 1
    bucket.averageConfidence += record.systemConfidence ?? 0
    return acc
  }, {})

  Object.keys(byDialect).forEach((key) => {
    const bucket = byDialect[key]
    bucket.averageConfidence = bucket.total > 0 ? bucket.averageConfidence / bucket.total : 0
  })

  return {
    total: records.length,
    accuracyBreakdown: { accurate, flagged },
    averageConfidence,
    byDialect,
  }
}
