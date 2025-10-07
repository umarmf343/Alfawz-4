"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"

export type MicrophonePermission = "unknown" | "granted" | "denied"
export type MicrophoneStatus =
  | "idle"
  | "requesting-permission"
  | "recording"
  | "stopping"
  | "error"

export interface UseMicrophoneStreamOptions {
  /** Preferred duration for each MediaRecorder chunk in milliseconds. */
  chunkDurationMs?: number
  /** Additional audio track constraints. */
  audioConstraints?: MediaTrackConstraints
  /** Desired MIME type. The hook will gracefully fall back if unsupported. */
  preferredMimeType?: string
  /** Invoked every time the MediaRecorder emits a Blob. */
  onChunk?: (chunk: Blob) => void
  /** Invoked when the recorder stops, either manually or due to an error. */
  onStop?: (info: { error?: string }) => void
  /** Invoked once the recorder has started capturing audio. */
  onStart?: () => void
  /** Automatically start recording when the hook initialises. */
  autoStart?: boolean
}

const DEFAULT_CONSTRAINTS: MediaTrackConstraints = {
  channelCount: 1,
  sampleRate: 44100,
  echoCancellation: true,
  noiseSuppression: true,
  autoGainControl: true,
}

const MIME_TYPE_CANDIDATES = [
  "audio/webm;codecs=opus",
  "audio/ogg;codecs=opus",
  "audio/webm",
  "audio/ogg",
]

function pickMimeType(preferred?: string): string | undefined {
  if (typeof window === "undefined" || typeof window.MediaRecorder === "undefined") {
    return preferred
  }

  const supported = (type?: string) => {
    if (!type) return false
    try {
      return typeof MediaRecorder.isTypeSupported === "function"
        ? MediaRecorder.isTypeSupported(type)
        : true
    } catch {
      return false
    }
  }

  if (preferred && supported(preferred)) {
    return preferred
  }

  for (const candidate of MIME_TYPE_CANDIDATES) {
    if (supported(candidate)) {
      return candidate
    }
  }

  return preferred
}

function computeRms(bytes: Uint8Array): number {
  let sumSquares = 0
  for (let i = 0; i < bytes.length; i += 1) {
    const centred = bytes[i] / 128 - 1
    sumSquares += centred * centred
  }
  return Math.sqrt(sumSquares / bytes.length)
}

export function useMicrophoneStream({
  chunkDurationMs = 2000,
  audioConstraints,
  preferredMimeType,
  onChunk,
  onStop,
  onStart,
  autoStart = false,
}: UseMicrophoneStreamOptions = {}) {
  const [status, setStatus] = useState<MicrophoneStatus>("idle")
  const [permission, setPermission] = useState<MicrophonePermission>("unknown")
  const [error, setError] = useState<string | null>(null)
  const [mimeType, setMimeType] = useState<string>("")
  const [volume, setVolume] = useState(0)

  const recorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const stopPromiseRef = useRef<Promise<void> | null>(null)

  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const volumeFrameRef = useRef<number | null>(null)
  const analyserDataRef = useRef<Uint8Array | null>(null)

  const isSupported = useMemo(() => {
    if (typeof window === "undefined") return false
    const hasRecorder = typeof window.MediaRecorder !== "undefined"
    const hasDevices = !!navigator.mediaDevices?.getUserMedia
    return hasRecorder && hasDevices
  }, [])

  const teardownStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => {
      try {
        track.stop()
      } catch {
        // ignore
      }
    })
    streamRef.current = null
  }, [])

  const stopMeter = useCallback(() => {
    if (volumeFrameRef.current != null) {
      cancelAnimationFrame(volumeFrameRef.current)
      volumeFrameRef.current = null
    }
    analyserDataRef.current = null
    analyserRef.current?.disconnect()
    analyserRef.current = null
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => undefined)
      audioContextRef.current = null
    }
    setVolume(0)
  }, [])

  const startMeter = useCallback((stream: MediaStream) => {
    try {
      const AudioCtx =
        window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      if (!AudioCtx) {
        return
      }
      const context = new AudioCtx()
      audioContextRef.current = context
      const source = context.createMediaStreamSource(stream)
      const analyser = context.createAnalyser()
      analyser.fftSize = 512
      const data = new Uint8Array(analyser.frequencyBinCount)
      source.connect(analyser)
      analyserRef.current = analyser
      analyserDataRef.current = data

      const tick = () => {
        const buffer = analyserDataRef.current
        if (!buffer || !analyserRef.current) {
          return
        }
        analyserRef.current.getByteTimeDomainData(buffer)
        setVolume(computeRms(buffer))
        volumeFrameRef.current = requestAnimationFrame(tick)
      }

      tick()
    } catch (caught) {
      console.warn("Unable to initialise microphone volume meter", caught)
    }
  }, [])

  const cleanup = useCallback(() => {
    recorderRef.current = null
    teardownStream()
    stopMeter()
  }, [stopMeter, teardownStream])

  const start = useCallback(async () => {
    if (!isSupported) {
      const message = "Your browser does not support microphone capture."
      setError(message)
      setStatus("error")
      throw new Error(message)
    }

    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      return
    }

    setStatus("requesting-permission")
    setError(null)

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { ...DEFAULT_CONSTRAINTS, ...audioConstraints },
      })
      streamRef.current = stream
      setPermission("granted")

      startMeter(stream)

      const mime = pickMimeType(preferredMimeType)
      const options: MediaRecorderOptions = {}
      if (mime) {
        options.mimeType = mime
      }

      let recorder: MediaRecorder
      try {
        recorder = new MediaRecorder(stream, options)
      } catch (caught) {
        if (options.mimeType) {
          recorder = new MediaRecorder(stream)
        } else {
          throw caught
        }
      }

      recorderRef.current = recorder
      setMimeType(recorder.mimeType || options.mimeType || "")

      recorder.addEventListener("start", () => {
        setStatus("recording")
        onStart?.()
      })

      recorder.addEventListener("dataavailable", (event) => {
        if (event.data && event.data.size > 0) {
          onChunk?.(event.data)
        }
      })

      recorder.addEventListener("stop", () => {
        setStatus("idle")
        cleanup()
        onStop?.({})
      })

      recorder.addEventListener("error", (event) => {
        console.error("MediaRecorder error", event)
        const message =
          event instanceof MediaRecorderErrorEvent
            ? event.error?.message ?? "Recording error occurred"
            : "Recording error occurred"
        setStatus("error")
        setError(message)
        cleanup()
        onStop?.({ error: message })
      })

      recorder.start(chunkDurationMs)
    } catch (caught) {
      console.error("Unable to start microphone stream", caught)
      const message =
        caught instanceof Error
          ? caught.name === "NotAllowedError"
            ? "Microphone permission denied. Please enable access and try again."
            : caught.message
          : "Unable to access the microphone"
      setStatus("error")
      setError(message)
      setPermission("denied")
      cleanup()
      throw caught instanceof Error ? caught : new Error(message)
    }
  }, [
    audioConstraints,
    chunkDurationMs,
    cleanup,
    isSupported,
    onChunk,
    onStart,
    onStop,
    preferredMimeType,
    startMeter,
  ])

  const stop = useCallback(() => {
    if (!recorderRef.current || recorderRef.current.state === "inactive") {
      return Promise.resolve()
    }

    if (stopPromiseRef.current) {
      return stopPromiseRef.current
    }

    stopPromiseRef.current = new Promise<void>((resolve) => {
      const recorder = recorderRef.current
      if (!recorder) {
        resolve()
        stopPromiseRef.current = null
        return
      }
      const handleStop = () => {
        recorder.removeEventListener("stop", handleStop)
        recorder.removeEventListener("error", handleError)
        stopPromiseRef.current = null
        resolve()
      }
      const handleError = () => {
        recorder.removeEventListener("stop", handleStop)
        recorder.removeEventListener("error", handleError)
        stopPromiseRef.current = null
        resolve()
      }
      recorder.addEventListener("stop", handleStop)
      recorder.addEventListener("error", handleError)
      try {
        setStatus("stopping")
        recorder.stop()
      } catch (caught) {
        console.error("Failed to stop MediaRecorder", caught)
        recorder.removeEventListener("stop", handleStop)
        recorder.removeEventListener("error", handleError)
        stopPromiseRef.current = null
        cleanup()
        resolve()
      }
    })

    return stopPromiseRef.current
  }, [cleanup])

  useEffect(() => {
    if (!autoStart) {
      return
    }
    void start()
    return () => {
      void stop()
    }
  }, [autoStart, start, stop])

  useEffect(() => {
    return () => {
      void stop()
      cleanup()
    }
  }, [cleanup, stop])

  return {
    start,
    stop,
    status,
    permission,
    error,
    isSupported,
    mimeType,
    volume,
  }
}
