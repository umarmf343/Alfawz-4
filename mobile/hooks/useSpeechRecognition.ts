import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import Voice, {
  type SpeechErrorEvent,
  type SpeechPartialResultsEvent,
  type SpeechResultsEvent,
  type SpeechVolumeChangeEvent,
} from "@react-native-voice/voice"
import { Platform } from "react-native"

export type SpeechRecognitionStatus = "idle" | "starting" | "listening" | "stopping" | "error"

export interface UseSpeechRecognitionOptions {
  /** Automatically begin listening when the hook mounts. */
  autoStart?: boolean
  /** Locale string passed to the underlying recogniser. Defaults to Modern Standard Arabic. */
  locale?: string
  /** Called whenever the recogniser reports a new partial transcript. */
  onPartialResult?: (transcript: string) => void
  /** Called when the recogniser yields a final transcript block. */
  onFinalResult?: (transcript: string) => void
  /** Called when a recognition error occurs. */
  onError?: (payload: { code: string; message: string }) => void
  /** If true, restart recognition automatically when a session ends. */
  continuous?: boolean
  /** Options forwarded to the underlying native recogniser. */
  engineOptions?: Record<string, unknown>
}

const DEFAULT_LOCALE = "ar-SA"

const isNativePlatform = Platform.OS !== "web"

export function useSpeechRecognition({
  autoStart = false,
  locale = DEFAULT_LOCALE,
  onPartialResult,
  onFinalResult,
  onError,
  continuous = false,
  engineOptions,
}: UseSpeechRecognitionOptions = {}) {
  const [status, setStatus] = useState<SpeechRecognitionStatus>("idle")
  const [error, setError] = useState<string | null>(null)
  const [partialTranscript, setPartialTranscript] = useState("")
  const [finalTranscripts, setFinalTranscripts] = useState<string[]>([])
  const [volume, setVolume] = useState(0)
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null)
  const pendingRestartRef = useRef(false)
  const mergedEngineOptions = useMemo(() => engineOptions ?? {}, [engineOptions])

  const aggregatedTranscript = useMemo(
    () => finalTranscripts.filter(Boolean).join(" ").trim(),
    [finalTranscripts],
  )

  const reset = useCallback(() => {
    setError(null)
    setPartialTranscript("")
    setFinalTranscripts([])
    setStatus("idle")
    setVolume(0)
  }, [])

  const assignHandlers = useCallback(() => {
    Voice.onSpeechStart = () => {
      setStatus("listening")
      setError(null)
    }

    Voice.onSpeechResults = (event: SpeechResultsEvent) => {
      const transcript = (event.value ?? []).join(" ").trim()
      if (!transcript) return
      setFinalTranscripts((current) => [...current, transcript])
      setPartialTranscript("")
      onFinalResult?.(transcript)
      if (continuous) {
        pendingRestartRef.current = true
      }
    }

    Voice.onSpeechPartialResults = (event: SpeechPartialResultsEvent) => {
      const transcript = (event.value ?? []).join(" ").trim()
      setPartialTranscript(transcript)
      if (transcript) {
        onPartialResult?.(transcript)
      }
    }

    Voice.onSpeechError = (event: SpeechErrorEvent) => {
      const payload = event.error
      const message = payload?.message ?? "Speech recognition failed"
      const code = payload?.code ?? "unknown"
      setError(message)
      setStatus("error")
      onError?.({ code, message })
    }

    Voice.onSpeechVolumeChanged = (event: SpeechVolumeChangeEvent) => {
      setVolume(event.value)
    }
  }, [continuous, onError, onFinalResult, onPartialResult])

  const clearHandlers = useCallback(() => {
    Voice.onSpeechStart = undefined
    Voice.onSpeechResults = undefined
    Voice.onSpeechPartialResults = undefined
    Voice.onSpeechError = undefined
    Voice.onSpeechVolumeChanged = undefined
  }, [])

  const start = useCallback(
    async (startLocale?: string, options?: Record<string, unknown>) => {
      if (!isNativePlatform) {
        setError("Speech recognition is only available on native mobile builds.")
        return
      }
      if (status === "starting" || status === "listening") return
      setStatus("starting")
      setError(null)
      try {
        await Voice.start(startLocale ?? locale, {
          EXTRA_PARTIAL_RESULTS: true,
          ...mergedEngineOptions,
          ...options,
        })
      } catch (caught) {
        const message = caught instanceof Error ? caught.message : "Unable to start speech recognition"
        setError(message)
        setStatus("error")
      }
    },
    [locale, mergedEngineOptions, status],
  )

  const stop = useCallback(async () => {
    if (!isNativePlatform) return
    if (status !== "listening") return
    setStatus("stopping")
    try {
      await Voice.stop()
      setStatus("idle")
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "Unable to stop speech recognition"
      setError(message)
      setStatus("error")
    }
  }, [status])

  const cancel = useCallback(async () => {
    if (!isNativePlatform) return
    try {
      await Voice.cancel()
      reset()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to cancel speech recognition")
    }
  }, [reset])

  useEffect(() => {
    if (!isNativePlatform) {
      setIsAvailable(false)
      return
    }

    assignHandlers()
    Voice.isAvailable()
      .then((available) => setIsAvailable(available))
      .catch(() => setIsAvailable(null))

    return () => {
      clearHandlers()
      Voice.destroy().catch(() => undefined)
    }
  }, [assignHandlers, clearHandlers])

  useEffect(() => {
    if (!continuous) return
    if (pendingRestartRef.current && status === "idle") {
      pendingRestartRef.current = false
      start()
    }
  }, [continuous, start, status])

  useEffect(() => {
    if (!autoStart) return
    start()
    return () => {
      cancel()
    }
  }, [autoStart, cancel, start])

  return {
    status,
    error,
    partialTranscript,
    finalTranscripts,
    aggregatedTranscript,
    volume,
    isListening: status === "listening",
    isAvailable,
    start,
    stop,
    cancel,
    reset,
  }
}
