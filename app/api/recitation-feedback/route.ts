import { NextResponse } from "next/server"

import {
  getRecitationFeedbackSummary,
  saveRecitationFeedback,
  type SaveRecitationFeedbackInput,
} from "@/lib/recitation-feedback-store"

export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as SaveRecitationFeedbackInput & { isAccurate?: boolean }

    if (typeof payload.isAccurate !== "boolean") {
      return NextResponse.json({ error: "Missing isAccurate flag" }, { status: 400 })
    }

    const record = await saveRecitationFeedback({
      ayahId: payload.ayahId,
      dialect: payload.dialect,
      detectionSource: payload.detectionSource,
      isAccurate: payload.isAccurate,
      systemConfidence: Number.isFinite(payload.systemConfidence) ? payload.systemConfidence : undefined,
      notes: payload.notes?.slice(0, 2000),
      correction: payload.correction?.slice(0, 2000),
      mistakes: Array.isArray(payload.mistakes)
        ? payload.mistakes.slice(0, 50).map((mistake) => ({
            index: mistake.index,
            type: mistake.type,
            word: mistake.word,
            correct: mistake.correct,
            confidence: mistake.confidence,
            categories: mistake.categories ?? [],
          }))
        : undefined,
      expectedText: payload.expectedText,
      transcription: payload.transcription,
    })

    return NextResponse.json({ status: "ok", record })
  } catch (error) {
    console.error("Failed to store recitation feedback", error)
    return NextResponse.json({ error: "Unable to store recitation feedback" }, { status: 500 })
  }
}

export async function GET() {
  try {
    const summary = await getRecitationFeedbackSummary()
    return NextResponse.json(summary)
  } catch (error) {
    console.error("Failed to load recitation feedback summary", error)
    return NextResponse.json({ error: "Unable to load feedback summary" }, { status: 500 })
  }
}
