"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useMicrophoneStream } from "@/hooks/useMicrophoneStream"

export type LiveRecitationStatus =
  | "idle"
  | "requesting-permission"
  | "permission-denied"
  | "listening"
  | "processing"
  | "error"

export interface WordFeedback {
  expected: string
  detected?: string
  status: "correct" | "incorrect" | "missing"
  similarity: number
}

export interface ExtraWordFeedback {
  word: string
}

export interface LiveRecitationResult {
  text: string
  receivedAt: number
}

export interface UseLiveRecitationOptions {
  /**
   * Duration for each recorded audio chunk in milliseconds.
   * Whisper performs best with 3-5 second segments for near real-time feedback.
   */
  chunkDurationMs?: number
  /**
   * Optional override to provide a custom transcription implementation, e.g. client-side Whisper.
   */
  transcribe?: (audio: Blob) => Promise<string>
}

interface AlignmentResult {
  feedback: WordFeedback[]
  extras: ExtraWordFeedback[]
}

const DEFAULT_CHUNK_DURATION = 4000

const TRANSCRIPTION_UNAVAILABLE_MESSAGE =
  "AI transcription isn't configured on this server yet. Add an OPENAI_API_KEY to enable live recitation feedback."

/**
 * Align transcribed words with expected verse using a Levenshtein-based dynamic programming approach.
 */
function alignWords(expectedVerse: string, detectedText: string): AlignmentResult {
  const expectedWords = splitWords(expectedVerse)
  const detectedWords = splitWords(detectedText)

  const m = expectedWords.length
  const n = detectedWords.length

  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0))
  const action: ("match" | "delete" | "insert")[][] = Array.from({ length: m + 1 }, () =>
    Array(n + 1).fill("match" as const),
  )
  const substitutionCost: number[][] = Array.from({ length: m }, () => Array(n).fill(0))

  for (let i = 0; i <= m; i += 1) {
    dp[i][0] = i
    if (i > 0) {
      action[i][0] = "delete"
    }
  }
  for (let j = 0; j <= n; j += 1) {
    dp[0][j] = j
    if (j > 0) {
      action[0][j] = "insert"
    }
  }

  for (let i = 1; i <= m; i += 1) {
    for (let j = 1; j <= n; j += 1) {
      const expectedWord = expectedWords[i - 1]
      const detectedWord = detectedWords[j - 1]
      const cost = normalizedEditDistance(expectedWord, detectedWord)
      substitutionCost[i - 1][j - 1] = cost

      let minCost = dp[i - 1][j - 1] + cost
      let chosen: "match" | "delete" | "insert" = "match"

      const deleteCost = dp[i - 1][j] + 1
      if (deleteCost < minCost) {
        minCost = deleteCost
        chosen = "delete"
      }

      const insertCost = dp[i][j - 1] + 1
      if (insertCost < minCost) {
        minCost = insertCost
        chosen = "insert"
      }

      dp[i][j] = minCost
      action[i][j] = chosen
    }
  }

  const feedback: WordFeedback[] = []
  const extras: ExtraWordFeedback[] = []

  let i = m
  let j = n

  while (i > 0 || j > 0) {
    const currentAction = action[i][j]
    if (i > 0 && j > 0 && currentAction === "match") {
      const similarity = 1 - substitutionCost[i - 1][j - 1]
      const status = similarity >= 0.75 ? "correct" : "incorrect"
      feedback.unshift({
        expected: expectedWords[i - 1],
        detected: detectedWords[j - 1],
        status,
        similarity,
      })
      i -= 1
      j -= 1
    } else if (i > 0 && (j === 0 || currentAction === "delete")) {
      feedback.unshift({
        expected: expectedWords[i - 1],
        status: "missing",
        similarity: 0,
      })
      i -= 1
    } else if (j > 0) {
      extras.unshift({ word: detectedWords[j - 1] })
      j -= 1
    } else {
      break
    }
  }

  return { feedback, extras }
}

function splitWords(text: string): string[] {
  return text
    .trim()
    .split(/\s+/)
    .filter(Boolean)
}

function normalizedEditDistance(a: string, b: string): number {
  if (a === b) {
    return 0
  }
  const normalizedA = normalizeForComparison(a)
  const normalizedB = normalizeForComparison(b)
  if (!normalizedA && !normalizedB) {
    return 0
  }
  if (!normalizedA || !normalizedB) {
    return 1
  }
  const distance = levenshtein(normalizedA, normalizedB)
  const maxLength = Math.max(normalizedA.length, normalizedB.length)
  if (maxLength === 0) {
    return 0
  }
  return distance / maxLength
}

function normalizeForComparison(word: string): string {
  return word
    .normalize("NFC")
    .replace(/[\u0640\u200c\u200d]/g, "") // remove tatweel & zero-width joiners
    .replace(/[^\p{Letter}\p{Mark}\p{Number}]+/gu, "")
    .toLowerCase()
}

function levenshtein(a: string, b: string): number {
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

function convertTo16kWav(blob: Blob): Promise<Blob> {
  return new Promise(async (resolve, reject) => {
    try {
      if (typeof window === "undefined") {
        throw new Error("Audio processing is only available in the browser")
      }

      const AudioCtx = (window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext)

      if (!AudioCtx) {
        throw new Error("AudioContext API is not supported in this browser")
      }

      const arrayBuffer = await blob.arrayBuffer()
      const audioContext = new AudioCtx()
      const decoded = await audioContext.decodeAudioData(arrayBuffer)

      const offlineContext = new OfflineAudioContext(
        decoded.numberOfChannels,
        Math.ceil(decoded.duration * 16000),
        16000,
      )

      const source = offlineContext.createBufferSource()
      source.buffer = decoded
      source.connect(offlineContext.destination)
      source.start(0)

      const renderedBuffer = await offlineContext.startRendering()
      const wavArrayBuffer = audioBufferToWav(renderedBuffer)
      audioContext.close().catch(() => undefined)

      resolve(new Blob([wavArrayBuffer], { type: "audio/wav" }))
    } catch (error) {
      reject(error)
    }
  })
}

function audioBufferToWav(buffer: AudioBuffer): ArrayBuffer {
  const numChannels = buffer.numberOfChannels
  const sampleRate = buffer.sampleRate
  const length = buffer.length * numChannels * 2 + 44
  const arrayBuffer = new ArrayBuffer(length)
  const view = new DataView(arrayBuffer)

  let offset = 0
  // RIFF identifier
  writeString(view, offset, "RIFF")
  offset += 4
  // file length
  view.setUint32(offset, 36 + buffer.length * numChannels * 2, true)
  offset += 4
  // RIFF type
  writeString(view, offset, "WAVE")
  offset += 4
  // format chunk identifier
  writeString(view, offset, "fmt ")
  offset += 4
  // format chunk length
  view.setUint32(offset, 16, true)
  offset += 4
  // sample format (raw)
  view.setUint16(offset, 1, true)
  offset += 2
  // channel count
  view.setUint16(offset, numChannels, true)
  offset += 2
  // sample rate
  view.setUint32(offset, sampleRate, true)
  offset += 4
  // byte rate (sample rate * block align)
  view.setUint32(offset, sampleRate * numChannels * 2, true)
  offset += 4
  // block align (channel count * bytes per sample)
  view.setUint16(offset, numChannels * 2, true)
  offset += 2
  // bits per sample
  view.setUint16(offset, 16, true)
  offset += 2
  // data chunk identifier
  writeString(view, offset, "data")
  offset += 4
  // data chunk length
  view.setUint32(offset, buffer.length * numChannels * 2, true)
  offset += 4

  const interleaved = interleave(buffer)
  const pcmData = floatTo16BitPCM(interleaved)
  for (let i = 0; i < pcmData.length; i += 1) {
    view.setInt16(offset, pcmData[i], true)
    offset += 2
  }

  return arrayBuffer
}

function writeString(view: DataView, offset: number, str: string) {
  for (let i = 0; i < str.length; i += 1) {
    view.setUint8(offset + i, str.charCodeAt(i))
  }
}

function interleave(buffer: AudioBuffer): Float32Array {
  if (buffer.numberOfChannels === 1) {
    return buffer.getChannelData(0)
  }

  const length = buffer.length * buffer.numberOfChannels
  const result = new Float32Array(length)
  let index = 0

  const channelData = Array.from({ length: buffer.numberOfChannels }, (_, channel) =>
    buffer.getChannelData(channel),
  )

  for (let i = 0; i < buffer.length; i += 1) {
    for (let channel = 0; channel < buffer.numberOfChannels; channel += 1) {
      result[index] = channelData[channel][i]
      index += 1
    }
  }

  return result
}

function floatTo16BitPCM(input: Float32Array): Int16Array {
  const output = new Int16Array(input.length)
  for (let i = 0; i < input.length; i += 1) {
    const s = Math.max(-1, Math.min(1, input[i]))
    output[i] = s < 0 ? s * 0x8000 : s * 0x7fff
  }
  return output
}

export function useLiveRecitation(
  expectedVerse: string,
  options: UseLiveRecitationOptions = {},
) {
  const { chunkDurationMs = DEFAULT_CHUNK_DURATION, transcribe } = options

  const [status, setStatus] = useState<LiveRecitationStatus>("idle")
  const [permission, setPermission] = useState<PermissionState | "unknown">("unknown")
  const [error, setError] = useState<string | null>(null)
  const [results, setResults] = useState<LiveRecitationResult[]>([])
  const [feedback, setFeedback] = useState<WordFeedback[]>([])
  const [extras, setExtras] = useState<ExtraWordFeedback[]>([])

  const queueRef = useRef<Promise<void>>(Promise.resolve())
  const mountedRef = useRef<boolean>(false)
  const microphoneActiveRef = useRef(false)

  const expectedVerseMemo = useMemo(() => expectedVerse, [expectedVerse])

  const performTranscription = useCallback(
    async (audioBlob: Blob) => {
      if (transcribe) {
        return transcribe(audioBlob)
      }

      const formData = new FormData()
      formData.append("audio", audioBlob, "chunk.wav")

      const response = await fetch("/api/transcribe", {
        method: "POST",
        body: formData,
      })

      if (response.status === 503) {
        throw new Error(TRANSCRIPTION_UNAVAILABLE_MESSAGE)
      }

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}))
        throw new Error(payload.error ?? "Failed to transcribe audio chunk")
      }

      const payload = (await response.json()) as { text?: string; transcription?: string }
      const transcription = payload.transcription ?? payload.text
      if (!transcription) {
        throw new Error("No transcription returned from server")
      }
      return transcription
    },
    [transcribe],
  )

  const processChunk = useCallback(
    async (blob: Blob) => {
      if (!mountedRef.current) return
      try {
        setStatus("processing")
        const wavBlob = await convertTo16kWav(blob)
        const transcription = await performTranscription(wavBlob)
        const timestamp = Date.now()
        setResults((prev) => [...prev, { text: transcription, receivedAt: timestamp }])
        const alignment = alignWords(expectedVerseMemo, transcription)
        setFeedback(alignment.feedback)
        setExtras(alignment.extras)
        setStatus(microphoneActiveRef.current ? "listening" : "idle")
        setError(null)
      } catch (err) {
        console.error("Live recitation chunk processing failed", err)
        setStatus("error")
        if (err instanceof Error && err.message === TRANSCRIPTION_UNAVAILABLE_MESSAGE) {
          setError(TRANSCRIPTION_UNAVAILABLE_MESSAGE)
        } else {
          setError(err instanceof Error ? err.message : "Unknown transcription error")
        }
      }
    },
    [performTranscription, expectedVerseMemo],
  )

  const enqueueChunk = useCallback(
    (blob: Blob) => {
      queueRef.current = queueRef.current.then(() => processChunk(blob))
    },
    [processChunk],
  )

  const {
    start: startMicrophone,
    stop: stopMicrophone,
    status: microphoneStatus,
    permission: microphonePermission,
    error: microphoneError,
    isSupported: microphoneSupported,
  } = useMicrophoneStream({
    chunkDurationMs,
    audioConstraints: {
      channelCount: 1,
      sampleRate: 44100,
      noiseSuppression: true,
      echoCancellation: true,
    },
    onChunk: enqueueChunk,
  })

  useEffect(() => {
    microphoneActiveRef.current = microphoneStatus === "recording"
    if (microphoneStatus === "recording") {
      setStatus((prev) => (prev === "processing" ? prev : "listening"))
    } else if (microphoneStatus === "requesting-permission") {
      setStatus("requesting-permission")
    } else if (microphoneStatus === "error") {
      setStatus("error")
    } else if (microphoneStatus === "idle") {
      setStatus((prev) => {
        if (prev === "processing" || prev === "error" || prev === "permission-denied") {
          return prev
        }
        return "idle"
      })
    }
  }, [microphoneStatus])

  useEffect(() => {
    if (microphonePermission === "granted") {
      setPermission("granted")
    } else if (microphonePermission === "denied") {
      setPermission("denied")
      setStatus((prev) => {
        if (prev === "processing" || prev === "error") {
          return prev
        }
        return "permission-denied"
      })
    } else {
      setPermission("unknown")
    }
  }, [microphonePermission])

  useEffect(() => {
    if (microphoneError) {
      setError(microphoneError)
      setStatus("error")
    }
  }, [microphoneError])

  const start = useCallback(async () => {
    if (typeof window === "undefined") {
      return
    }
    if (!microphoneSupported) {
      setError("Microphone is not supported in this browser")
      setStatus("error")
      return
    }

    queueRef.current = Promise.resolve()
    setError(null)
    setStatus("requesting-permission")

    try {
      await startMicrophone()
    } catch (err) {
      console.error("Unable to access microphone", err)
      const message =
        err instanceof Error && err.name === "NotAllowedError"
          ? "Microphone permission denied. Please enable access to continue."
          : err instanceof Error
            ? err.message
            : "Unable to access the microphone"
      setPermission("denied")
      setStatus("permission-denied")
      setError(message)
    }
  }, [microphoneSupported, startMicrophone])

  const stop = useCallback(() => {
    void stopMicrophone()
  }, [stopMicrophone])

  const reset = useCallback(() => {
    setResults([])
    setFeedback([])
    setExtras([])
    setError(null)
    setStatus("idle")
    queueRef.current = Promise.resolve()
  }, [])

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      void stopMicrophone()
    }
  }, [stopMicrophone])

  useEffect(() => {
    reset()
  }, [expectedVerseMemo, reset])

  return {
    start,
    stop,
    reset,
    status,
    permission,
    error,
    results,
    feedback,
    extras,
    isRecording: status === "listening" || status === "processing",
  }
}

