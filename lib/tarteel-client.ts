import { Buffer } from "node:buffer"

export type TarteelTranscriptionOptions = {
  file: File
  apiKey: string
  baseUrl?: string | null
  mode?: string | null
  expectedText?: string
  ayahId?: string
  durationSeconds?: number
}

export type TarteelTranscriptionResult = {
  transcription: string
  latencyMs: number | null
  trackingId: string | null
  raw: unknown
}

export class TarteelTranscriptionError extends Error {
  readonly status: number
  readonly payload: unknown

  constructor(message: string, status: number, payload: unknown) {
    super(message)
    this.name = "TarteelTranscriptionError"
    this.status = status
    this.payload = payload
  }
}

const DEFAULT_BASE_URL = "https://api.tarteel.ai/api/v1"
const DEFAULT_TRANSCRIBE_PATH = "recitations/external-transcriptions"

const determineEndpoint = (baseUrl?: string | null) => {
  const trimmedBase = (baseUrl ?? DEFAULT_BASE_URL).replace(/\/$/, "")
  const path = process.env.TARTEEL_TRANSCRIBE_PATH?.trim()
  const trimmedPath = path && path.length > 0 ? path.replace(/^\//, "") : DEFAULT_TRANSCRIBE_PATH
  return `${trimmedBase}/${trimmedPath}`
}

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

const buildHeaders = (apiKey: string) => {
  const headers: Record<string, string> = {
    Accept: "application/json",
    "Content-Type": "application/json",
    "X-API-KEY": apiKey,
    "User-Agent": "alfawz-platform/transcription",
  }

  const orgId = process.env.TARTEEL_ORG_ID?.trim()
  if (orgId) {
    headers["X-Tarteel-Org"] = orgId
  }

  const appId = process.env.TARTEEL_APP_ID?.trim()
  if (appId) {
    headers["X-Tarteel-App"] = appId
  }

  return headers
}

const toBase64 = async (file: File) => {
  const arrayBuffer = await file.arrayBuffer()
  return Buffer.from(arrayBuffer).toString("base64")
}

const extractTranscription = (payload: unknown): string => {
  if (!payload || typeof payload !== "object") {
    return ""
  }

  const candidates: Array<unknown> = [
    (payload as Record<string, unknown>).transcription,
    (payload as Record<string, unknown>).transcript,
    (payload as Record<string, unknown>).text,
  ]

  if ("data" in payload && payload.data && typeof payload.data === "object") {
    const data = payload.data as Record<string, unknown>
    candidates.push(data.transcription, data.transcript, data.text)
  }

  if ("result" in payload && payload.result && typeof payload.result === "object") {
    const result = payload.result as Record<string, unknown>
    candidates.push(result.transcription, result.transcript, result.text)
  }

  if ("hypotheses" in payload && Array.isArray((payload as Record<string, unknown>).hypotheses)) {
    const hypotheses = (payload as Record<string, unknown>).hypotheses as Array<Record<string, unknown>>
    for (const entry of hypotheses) {
      candidates.push(entry.transcription, entry.transcript, entry.text)
    }
  }

  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim().length > 0) {
      return candidate.trim()
    }
  }

  return ""
}

const extractLatency = (payload: unknown): number | null => {
  if (!payload || typeof payload !== "object") {
    return null
  }

  const root = payload as Record<string, unknown>
  const candidates: Array<unknown> = [root.latencyMs, root.latency_ms]

  if (root.meta && typeof root.meta === "object") {
    const meta = root.meta as Record<string, unknown>
    candidates.push(meta.latencyMs, meta.latency_ms)
  }

  for (const candidate of candidates) {
    if (typeof candidate === "number" && Number.isFinite(candidate)) {
      return candidate
    }
  }

  return null
}

const extractTrackingId = (payload: unknown): string | null => {
  if (!payload || typeof payload !== "object") {
    return null
  }

  const root = payload as Record<string, unknown>
  const candidates: Array<unknown> = [
    root.recitationId,
    root.recitation_id,
    root.trackingId,
    root.tracking_id,
    root.jobId,
    root.job_id,
  ]

  if (root.data && typeof root.data === "object") {
    const data = root.data as Record<string, unknown>
    candidates.push(data.recitationId, data.recitation_id)
  }

  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim().length > 0) {
      return candidate
    }
  }

  return null
}

export const transcribeWithTarteel = async (
  options: TarteelTranscriptionOptions,
): Promise<TarteelTranscriptionResult> => {
  const endpoint = determineEndpoint(options.baseUrl)
  const headers = buildHeaders(options.apiKey)

  const payload = {
    audio: {
      filename: determineFileName(options.file),
      mimeType: options.file.type || "audio/webm",
      encoding: "base64" as const,
      data: await toBase64(options.file),
      durationSeconds: options.durationSeconds ?? null,
    },
    mode: options.mode ?? null,
    expected_text: options.expectedText ?? null,
    expectedText: options.expectedText ?? null,
    ayah_id: options.ayahId ?? null,
    metadata: {
      ayahId: options.ayahId ?? null,
      mode: options.mode ?? null,
    },
  }

  const response = await fetch(endpoint, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  })

  const responseText = await response.text()
  const contentType = response.headers.get("content-type")
  let parsed: unknown = responseText

  if (contentType?.includes("application/json")) {
    try {
      parsed = responseText ? JSON.parse(responseText) : {}
    } catch (error) {
      parsed = { error: "Failed to parse JSON response", raw: responseText }
      console.warn("Unable to parse Tarteel response as JSON", error)
    }
  }

  if (!response.ok) {
    throw new TarteelTranscriptionError(
      `Tarteel transcription failed with status ${response.status}`,
      response.status,
      parsed,
    )
  }

  return {
    transcription: extractTranscription(parsed).trim(),
    latencyMs: extractLatency(parsed),
    trackingId: extractTrackingId(parsed),
    raw: parsed,
  }
}
