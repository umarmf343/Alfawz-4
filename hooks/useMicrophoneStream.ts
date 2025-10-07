"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"

export type MicrophonePermissionStatus = "unknown" | "granted" | "denied"

export interface MicrophoneFrameMetadata {
  sampleRate: number
  timestamp: number
}

export interface UseMicrophoneStreamOptions {
  /**
   * Buffer size in samples for the underlying processor node. Smaller buffers
   * yield lower latency but require more frequent processing.
   */
  bufferSize?: 256 | 512 | 1024 | 2048 | 4096
  /**
   * Optional smoothing factor applied to the computed volume level (0-1).
   */
  smoothing?: number
  /**
   * Optional callback invoked with each recorded audio frame.
   */
  onAudioFrame?: (frame: Float32Array, metadata: MicrophoneFrameMetadata) => void
  /**
   * Optional callback fired whenever a new RMS volume level is available.
   */
  onVolume?: (volume: number) => void
  /**
   * Extra constraints passed to `getUserMedia`.
   */
  audioConstraints?: MediaTrackConstraints
}

export interface UseMicrophoneStreamResult {
  /** Begin streaming audio from the user's microphone. */
  start: () => Promise<{ stream: MediaStream; sampleRate: number }>
  /** Stop streaming audio and release all audio resources. */
  stop: () => Promise<void>
  /** Whether the microphone stream is currently active. */
  isActive: boolean
  /** Whether microphone streaming is supported in the current browser. */
  isSupported: boolean
  /** The most recent permission status reported by the browser. */
  permission: MicrophonePermissionStatus
  /** Any fatal error encountered while capturing audio. */
  error: string | null
  /**
   * Smoothed RMS volume level (0-1). Useful for visual level meters.
   */
  volume: number
  /** Sample rate of the active audio context, if any. */
  sampleRate: number | null
  /** Underlying MediaStream reference, if the capture session is active. */
  stream: MediaStream | null
}

type AudioContextConstructor = typeof AudioContext

type NextWindow = typeof window & {
  __NEXT_DATA__?: {
    assetPrefix?: string
  }
}

const defaultConstraints: MediaTrackConstraints = {
  channelCount: 1,
  echoCancellation: true,
  noiseSuppression: true,
  autoGainControl: true,
}

const WORKLET_MODULE_PATH = "/audio-worklets/microphone-processor.js"

export function useMicrophoneStream(options: UseMicrophoneStreamOptions = {}): UseMicrophoneStreamResult {
  const [permission, setPermission] = useState<MicrophonePermissionStatus>("unknown")
  const [isActive, setIsActive] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [volume, setVolume] = useState(0)
  const [sampleRate, setSampleRate] = useState<number | null>(null)

  const streamRef = useRef<MediaStream | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null)
  const workletRef = useRef<AudioWorkletNode | null>(null)
  const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null)
  const gainNodeRef = useRef<GainNode | null>(null)
  const volumeRef = useRef(0)
  const frameCallbackRef = useRef<UseMicrophoneStreamOptions["onAudioFrame"]>()
  const volumeCallbackRef = useRef<UseMicrophoneStreamOptions["onVolume"]>()
  const pendingFlushResolverRef = useRef<(() => void) | null>(null)
  const pendingFlushTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const bufferSize = options.bufferSize ?? 2048
  const smoothing = options.smoothing ?? 0.25

  useEffect(() => {
    frameCallbackRef.current = options.onAudioFrame
  }, [options.onAudioFrame])

  useEffect(() => {
    volumeCallbackRef.current = options.onVolume
  }, [options.onVolume])

  const isSupported = useMemo(() => {
    if (typeof window === "undefined") {
      return false
    }
    const hasMedia = typeof navigator !== "undefined" && !!navigator.mediaDevices?.getUserMedia
    const AudioCtx =
      window.AudioContext ?? (window as unknown as { webkitAudioContext?: AudioContextConstructor }).webkitAudioContext
    return hasMedia && typeof AudioCtx === "function"
  }, [])

  const clearFlushTimeout = useCallback(() => {
    if (pendingFlushTimeoutRef.current) {
      clearTimeout(pendingFlushTimeoutRef.current)
      pendingFlushTimeoutRef.current = null
    }
  }, [])

  const processAudioFrame = useCallback(
    (frame: Float32Array, rate: number, timestamp?: number) => {
      if (!frame || frame.length === 0 || !Number.isFinite(rate)) {
        return
      }

      const metadata: MicrophoneFrameMetadata = {
        sampleRate: rate,
        timestamp: typeof timestamp === "number" ? timestamp : performance.now(),
      }

      frameCallbackRef.current?.(frame, metadata)

      let sum = 0
      for (let index = 0; index < frame.length; index += 1) {
        const value = frame[index]
        sum += value * value
      }

      const rms = Math.sqrt(sum / frame.length)
      const previous = volumeRef.current
      const nextVolume = smoothing * previous + (1 - smoothing) * rms
      volumeRef.current = nextVolume

      if (Number.isFinite(nextVolume) && Math.abs(nextVolume - previous) > 0.01) {
        setVolume(nextVolume)
        volumeCallbackRef.current?.(nextVolume)
      }
    },
    [smoothing],
  )

  const cleanup = useCallback(() => {
    clearFlushTimeout()
    pendingFlushResolverRef.current = null

    if (workletRef.current) {
      try {
        workletRef.current.port.onmessage = null
      } catch (caught) {
        console.warn("Failed to detach microphone worklet listener", caught)
      }
      try {
        workletRef.current.disconnect()
      } catch {
        // ignore errors during disconnect
      }
      workletRef.current = null
    }

    if (scriptProcessorRef.current) {
      try {
        scriptProcessorRef.current.disconnect()
      } catch {
        // ignore
      }
      scriptProcessorRef.current.onaudioprocess = null
      scriptProcessorRef.current = null
    }

    if (gainNodeRef.current) {
      try {
        gainNodeRef.current.disconnect()
      } catch {
        // ignore
      }
      gainNodeRef.current = null
    }

    if (sourceNodeRef.current) {
      try {
        sourceNodeRef.current.disconnect()
      } catch {
        // ignore
      }
      sourceNodeRef.current = null
    }

    if (audioContextRef.current) {
      const context = audioContextRef.current
      audioContextRef.current = null
      context.close().catch(() => undefined)
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }

    setIsActive(false)
    setSampleRate(null)
    volumeRef.current = 0
    setVolume(0)
  }, [clearFlushTimeout])

  const stop = useCallback(async () => {
    if (workletRef.current) {
      try {
        const flushPromise = new Promise<void>((resolve) => {
          pendingFlushResolverRef.current = resolve
          pendingFlushTimeoutRef.current = setTimeout(() => {
            const fallback = pendingFlushResolverRef.current
            pendingFlushResolverRef.current = null
            clearFlushTimeout()
            fallback?.()
          }, 120)
        })

        try {
          workletRef.current.port.postMessage({ type: "flush" })
        } catch (caught) {
          console.warn("Failed to request microphone worklet flush", caught)
          pendingFlushResolverRef.current?.()
          pendingFlushResolverRef.current = null
        }

        await flushPromise
      } finally {
        cleanup()
      }
      return
    }

    cleanup()
  }, [cleanup, clearFlushTimeout])

  const start = useCallback(async () => {
    if (!isSupported) {
      throw new Error("Microphone streaming is not supported in this browser")
    }

    if (streamRef.current && audioContextRef.current) {
      return {
        stream: streamRef.current,
        sampleRate: audioContextRef.current.sampleRate,
      }
    }

    setError(null)

    const AudioCtx =
      window.AudioContext ?? (window as unknown as { webkitAudioContext?: AudioContextConstructor }).webkitAudioContext

    if (!AudioCtx) {
      throw new Error("Web Audio API is not available in this environment")
    }

    try {
      const constraints: MediaStreamConstraints = {
        audio: { ...defaultConstraints, ...(options.audioConstraints ?? {}) },
        video: false,
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      streamRef.current = stream
      setPermission("granted")

      const audioContext = new AudioCtx()
      audioContextRef.current = audioContext
      if (audioContext.state === "suspended") {
        await audioContext.resume().catch(() => undefined)
      }

      setSampleRate(audioContext.sampleRate)

      const sourceNode = audioContext.createMediaStreamSource(stream)
      sourceNodeRef.current = sourceNode

      let workletInitialised = false
      const supportsWorklet =
        typeof AudioWorkletNode === "function" &&
        !!audioContext.audioWorklet &&
        typeof audioContext.audioWorklet.addModule === "function"

      if (supportsWorklet) {
        try {
          const win = window as NextWindow
          const prefix = win.__NEXT_DATA__?.assetPrefix?.replace(/\/$/, "") ?? ""
          const moduleUrl = prefix ? `${prefix}${WORKLET_MODULE_PATH}` : WORKLET_MODULE_PATH
          await audioContext.audioWorklet.addModule(moduleUrl)

          const workletNode = new AudioWorkletNode(audioContext, "microphone-worklet", {
            processorOptions: {
              bufferSize,
              channelIndex: 0,
            },
          })

          workletNode.port.onmessage = (event) => {
            const message = event.data as
              | { type: "audio"; frame: Float32Array | ArrayBuffer; timestamp?: number }
              | { type: "flush-complete" }
              | undefined

            if (!message) {
              return
            }

            if (message.type === "audio") {
              const frameData = message.frame
              const frame =
                frameData instanceof Float32Array ? frameData : new Float32Array(frameData)
              const timestamp =
                typeof message.timestamp === "number" ? message.timestamp * 1000 : undefined
              processAudioFrame(frame, audioContext.sampleRate, timestamp)
              return
            }

            if (message.type === "flush-complete") {
              clearFlushTimeout()
              const resolve = pendingFlushResolverRef.current
              pendingFlushResolverRef.current = null
              resolve?.()
            }
          }

          workletNode.onprocessorerror = (caught) => {
            console.error("Microphone worklet error", caught)
            setError("Microphone processing failed. Please restart the session.")
          }

          const gainNode = audioContext.createGain()
          gainNode.gain.value = 0
          gainNodeRef.current = gainNode

          sourceNode.connect(workletNode)
          workletNode.connect(gainNode)
          gainNode.connect(audioContext.destination)

          workletRef.current = workletNode
          workletInitialised = true
        } catch (caught) {
          console.warn("Falling back to ScriptProcessor microphone capture", caught)
        }
      }

      if (!workletInitialised) {
        const processor = audioContext.createScriptProcessor(bufferSize, 1, 1)
        processor.onaudioprocess = (event) => {
          const channelData = event.inputBuffer.getChannelData(0)
          const frame = new Float32Array(channelData.length)
          frame.set(channelData)
          processAudioFrame(frame, audioContext.sampleRate)
        }

        const gainNode = audioContext.createGain()
        gainNode.gain.value = 0
        gainNodeRef.current = gainNode

        sourceNode.connect(processor)
        processor.connect(gainNode)
        gainNode.connect(audioContext.destination)

        scriptProcessorRef.current = processor
      } else {
        scriptProcessorRef.current = null
      }

      setIsActive(true)

      return {
        stream,
        sampleRate: audioContext.sampleRate,
      }
    } catch (caught) {
      console.error("Failed to start microphone stream", caught)
      cleanup()
      if (caught instanceof DOMException && caught.name === "NotAllowedError") {
        setPermission("denied")
        setError("Microphone access was denied")
      } else if (caught instanceof DOMException && caught.name === "NotFoundError") {
        setPermission("denied")
        setError("No microphone was found. Check your device and try again.")
      } else {
        setError(caught instanceof Error ? caught.message : "Unable to access microphone")
      }
      throw caught
    }
  }, [
    cleanup,
    clearFlushTimeout,
    isSupported,
    options.audioConstraints,
    processAudioFrame,
    bufferSize,
  ])

  useEffect(
    () => () => {
      void stop()
    },
    [stop],
  )

  return {
    start,
    stop,
    isActive,
    isSupported,
    permission,
    error,
    volume,
    sampleRate,
    stream: streamRef.current,
  }
}
