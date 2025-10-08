import { NextResponse } from "next/server"
import { createLiveSessionSummary } from "@/lib/recitation-analysis"
import { TarteelTranscriptionError, transcribeWithTarteel } from "@/lib/tarteel-client"

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

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
    const dialectRaw = formData.get("dialect")
    const dialect = typeof dialectRaw === "string" && dialectRaw.trim().length > 0 ? dialectRaw.trim() : undefined
    const allowedDialects = new Set(["auto", "standard", "middle_eastern", "south_asian", "north_african"])
    const normalizedDialect = dialect && allowedDialects.has(dialect) ? (dialect as "auto" | string) : undefined
    const localeRaw = formData.get("locale") ?? formData.get("localeHint")
    const localeHint = typeof localeRaw === "string" && localeRaw.trim().length > 0 ? localeRaw : null
    const substitutionThresholdRaw = formData.get("substitutionThreshold")
    const substitutionThreshold =
      typeof substitutionThresholdRaw === "string" && substitutionThresholdRaw.trim().length > 0
        ? Number.parseFloat(substitutionThresholdRaw)
        : undefined
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

    const tarteelApiKey = process.env.TARTEEL_API_KEY?.trim()
    if (!tarteelApiKey) {
      return NextResponse.json(
        {
          error:
            "Tarteel API key is not configured. Set TARTEEL_API_KEY in your environment to enable recitation transcription.",
        },
        { status: 503 },
      )
    }

    const inferenceStartedAt = Date.now()
    const baseUrl = process.env.TARTEEL_API_BASE_URL?.trim() ?? null
    const { transcription, latencyMs } = await transcribeWithTarteel({
      file: audioFile,
      apiKey: tarteelApiKey,
      baseUrl,
      mode,
      expectedText,
      ayahId,
      durationSeconds,
    })

    const inferenceLatencyMs = Number.isFinite(latencyMs) ? latencyMs : Date.now() - inferenceStartedAt

    if (mode === "live") {
      return NextResponse.json({ transcription, latencyMs: inferenceLatencyMs })
    }

    if (expectedText.trim().length > 0) {
      const summary = createLiveSessionSummary(transcription, expectedText, {
        durationSeconds: Number.isFinite(durationSeconds) ? durationSeconds : undefined,
        ayahId,
        analysis: {
          engine: "tarteel",
          latencyMs: Number.isFinite(inferenceLatencyMs) ? Number(inferenceLatencyMs) : null,
          description: "Cloud-hosted Tarteel transcription with streamlined word-level feedback.",
          stack: ["Tarteel speech recognition", "Word alignment", "Recitation feedback heuristics"],
        },
        dialect: normalizedDialect,
        localeHint,
        substitutionThreshold,
      })

      return NextResponse.json(summary)
    }

    return NextResponse.json({ transcription })
  } catch (error) {
    console.error("/api/transcribe error", error)

    if (error instanceof TarteelTranscriptionError) {
      return NextResponse.json(
        {
          error: "Tarteel API call failed",
          details: error.payload,
        },
        { status: error.status },
      )
    }

    return NextResponse.json(
      { error: "Failed to transcribe audio" },
      { status: 500 },
    )
  }
}

