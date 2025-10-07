import { NextResponse } from "next/server"
import { createLiveSessionSummary } from "@/lib/tajweed-analysis"

const DEFAULT_MODEL = process.env.WHISPER_MODEL ?? "whisper-1"
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024

export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get("content-type")
    if (!contentType || !contentType.includes("multipart/form-data")) {
      return NextResponse.json({ error: "Expected multipart/form-data" }, { status: 400 })
    }

    const formData = await request.formData()
    const audioFile = formData.get("audio")
    const mode = typeof formData.get("mode") === "string" ? String(formData.get("mode")) : null
    const expectedTextRaw = formData.get("expectedText")
    const expectedText = typeof expectedTextRaw === "string" ? expectedTextRaw : ""
    const ayahIdRaw = formData.get("ayahId")
    const ayahId = typeof ayahIdRaw === "string" ? ayahIdRaw : undefined
    const durationRaw = formData.get("durationSeconds") ?? formData.get("duration")
    const durationSeconds =
      typeof durationRaw === "string" && durationRaw.trim().length > 0
        ? Number.parseFloat(durationRaw)
        : undefined

    if (!audioFile || !(audioFile instanceof File)) {
      return NextResponse.json({ error: "Missing audio file" }, { status: 400 })
    }

    if (audioFile.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json({ error: "Audio chunk too large" }, { status: 413 })
    }

    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        {
          error:
            "OpenAI API key is not configured. Set OPENAI_API_KEY in your environment to enable server-side Whisper.",
        },
        { status: 503 },
      )
    }

    const openAIForm = new FormData()
    openAIForm.append("model", DEFAULT_MODEL)
    openAIForm.append("language", "ar")
    openAIForm.append("temperature", "0")
    openAIForm.append("response_format", "json")
    openAIForm.append("file", audioFile, audioFile.name || "chunk.wav")

    const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      body: openAIForm,
    })

    if (!response.ok) {
      const errorPayload = await response.text()
      return NextResponse.json(
        {
          error: "Whisper API call failed",
          details: errorPayload,
        },
        { status: 502 },
      )
    }

    const payload = (await response.json()) as { text?: string; segments?: Array<{ text: string }> }
    const text =
      payload.text ??
      payload.segments?.map((segment) => segment.text).join(" ") ??
      ""

    const transcription = text.trim()

    if (mode === "live") {
      return NextResponse.json({ transcription })
    }

    if (expectedText.trim().length > 0) {
      const summary = createLiveSessionSummary(transcription, expectedText, {
        durationSeconds: Number.isFinite(durationSeconds) ? durationSeconds : undefined,
        ayahId,
      })

      return NextResponse.json(summary)
    }

    return NextResponse.json({ transcription })
  } catch (error) {
    console.error("/api/transcribe error", error)
    return NextResponse.json(
      { error: "Failed to transcribe audio" },
      { status: 500 },
    )
  }
}

