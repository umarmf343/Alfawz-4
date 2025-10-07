import OpenAI from "openai"
import { NextResponse } from "next/server"
import { createLiveSessionSummary } from "@/lib/tajweed-analysis"

const DEFAULT_MODEL = process.env.WHISPER_MODEL ?? "whisper-1"
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

const determineFileName = (file: File) => {
  if (file.name && file.name !== "blob") {
    return file.name
  }

  const extensionFromType = file.type?.split("/")[1]
  if (extensionFromType) {
    return `chunk.${extensionFromType}`
  }

  return "chunk.wav"
}

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

    const client = new OpenAI({
      apiKey,
      baseURL: process.env.OPENAI_BASE_URL ?? undefined,
    })

    const audioBuffer = await audioFile.arrayBuffer()
    const normalizedFile = new File([new Uint8Array(audioBuffer)], determineFileName(audioFile), {
      type: audioFile.type || "audio/wav",
    })

    const payload = await client.audio.transcriptions.create({
      file: normalizedFile,
      model: DEFAULT_MODEL,
      language: "ar",
      temperature: 0,
      response_format: "json",
    })

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

    const status = error instanceof OpenAI.APIError ? error.status ?? 500 : 500
    if (error instanceof OpenAI.APIError) {
      return NextResponse.json(
        {
          error: "Whisper API call failed",
          details: error.error,
        },
        { status },
      )
    }

    return NextResponse.json(
      { error: "Failed to transcribe audio" },
      { status },
    )
  }
}

