import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { AppState, type AppStateStatus, Platform } from "react-native"
import MicStream, {
  type MicrophoneStreamChunk,
  type MicrophoneStreamHandle,
  type MicrophoneStreamInitOptions,
} from "react-native-microphone-stream"

export type MicrophoneStreamState = "idle" | "starting" | "active" | "paused" | "stopped"

export type MicrophoneChunkListener = (
  normalized: Float32Array,
  raw: MicrophoneStreamChunk,
) => void

export interface UseMicrophoneStreamOptions extends MicrophoneStreamInitOptions {
  /** Automatically start streaming when the hook mounts. */
  autoStart?: boolean
  /** Forward each captured audio chunk to the provided callback. */
  onChunk?: MicrophoneChunkListener
  /** Attempt to normalise PCM data into a -1 to 1 Float32Array. */
  normalize?: boolean
}

const DEFAULT_STREAM_OPTIONS: Required<Pick<MicrophoneStreamInitOptions, "bufferSize" | "sampleRate" | "bitsPerChannel" | "channelsPerFrame">> = {
  bufferSize: 4096,
  sampleRate: 44100,
  bitsPerChannel: 16,
  channelsPerFrame: 1,
}

const isNativePlatform = Platform.OS !== "web"

function normaliseChunk(chunk: MicrophoneStreamChunk, normalize: boolean): Float32Array {
  if (!normalize) {
    if (chunk instanceof Float32Array) return chunk
    if (Array.isArray(chunk)) return Float32Array.from(chunk)
    return new Float32Array(chunk)
  }

  if (chunk instanceof Float32Array) {
    return chunk
  }

  if (Array.isArray(chunk)) {
    return Float32Array.from(chunk.map((value) => {
      const bounded = Math.max(-32768, Math.min(32767, value))
      return bounded / 32768
    }))
  }

  const view = new DataView(chunk.buffer, chunk.byteOffset, chunk.byteLength)
  const samples = new Float32Array(chunk.byteLength / 2)
  for (let i = 0; i < samples.length; i++) {
    samples[i] = view.getInt16(i * 2, true) / 32768
  }
  return samples
}

export function useMicrophoneStream({
  autoStart = false,
  onChunk,
  normalize = true,
  ...initOptions
}: UseMicrophoneStreamOptions = {}) {
  const [state, setState] = useState<MicrophoneStreamState>("idle")
  const [error, setError] = useState<string | null>(null)
  const listenerRef = useRef<MicrophoneStreamHandle | null>(null)
  const shouldResumeRef = useRef(false)
  const options = useMemo(
    () => ({ ...DEFAULT_STREAM_OPTIONS, ...initOptions }),
    [initOptions],
  )

  const detachListener = useCallback(() => {
    listenerRef.current?.remove()
    listenerRef.current = null
  }, [])

  const attachListener = useCallback(() => {
    detachListener()
    listenerRef.current = MicStream.addListener((chunk) => {
      if (!onChunk) return
      const normalized = normaliseChunk(chunk, normalize)
      onChunk(normalized, chunk)
    })
  }, [detachListener, normalize, onChunk])

  const stop = useCallback(() => {
    if (!isNativePlatform) return
    try {
      MicStream.stop()
      MicStream.pause()
      MicStream.removeAllListeners?.()
    } catch {
      // Ignore errors triggered when stopping an already-stopped stream.
    }
    detachListener()
    setState("stopped")
  }, [detachListener])

  const start = useCallback(() => {
    if (!isNativePlatform) {
      setError("Microphone streaming is only supported on native mobile builds.")
      return
    }
    if (state === "active" || state === "starting") return
    setState("starting")
    setError(null)
    try {
      MicStream.init(options)
      attachListener()
      MicStream.start()
      setState("active")
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "Unable to start microphone stream"
      setError(message)
      setState("idle")
      detachListener()
    }
  }, [attachListener, detachListener, options, state])

  const pause = useCallback(() => {
    if (!isNativePlatform) return
    try {
      MicStream.pause()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to pause microphone stream")
    }
    setState("paused")
  }, [])

  const resume = useCallback(() => {
    if (!isNativePlatform) return
    try {
      MicStream.start()
      setState("active")
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to resume microphone stream")
    }
  }, [])

  useEffect(() => {
    if (!isNativePlatform) return
    const subscription = AppState.addEventListener("change", (next: AppStateStatus) => {
      if (next === "active") {
        if (shouldResumeRef.current && state === "paused") {
          resume()
        }
        shouldResumeRef.current = false
        return
      }

      if (state === "active") {
        shouldResumeRef.current = true
        pause()
      }
    })

    return () => {
      subscription.remove()
    }
  }, [pause, resume, state])

  useEffect(() => {
    if (!autoStart) return
    start()
    return () => {
      stop()
    }
  }, [autoStart, start, stop])

  useEffect(() => () => {
    stop()
  }, [stop])

  return {
    state,
    error,
    start,
    stop,
    pause,
    resume,
    isActive: state === "active",
    isStarting: state === "starting",
    isPaused: state === "paused",
  }
}
