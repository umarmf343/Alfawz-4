"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"

export type MicrophonePermissionStatus = "unknown" | "granted" | "denied"

export interface MicrophoneFrameMetadata {
  sampleRate: number
  timestamp: number
}

export interface UseMicrophoneStreamOptions {
  /**
   * Buffer size in samples for the underlying ScriptProcessorNode. Smaller buffers
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
  stop: () => void
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

const defaultConstraints: MediaTrackConstraints = {
  channelCount: 1,
  echoCancellation: true,
  noiseSuppression: true,
  autoGainControl: true,
}

export function useMicrophoneStream(options: UseMicrophoneStreamOptions = {}): UseMicrophoneStreamResult {
  const [permission, setPermission] = useState<MicrophonePermissionStatus>("unknown")
  const [isActive, setIsActive] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [volume, setVolume] = useState(0)
  const [sampleRate, setSampleRate] = useState<number | null>(null)

  const streamRef = useRef<MediaStream | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const processorRef = useRef<ScriptProcessorNode | null>(null)
  const gainRef = useRef<GainNode | null>(null)
  const volumeRef = useRef(0)
  const frameCallbackRef = useRef<UseMicrophoneStreamOptions["onAudioFrame"]>()
  const volumeCallbackRef = useRef<UseMicrophoneStreamOptions["onVolume"]>()

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
    const AudioCtx = (window.AudioContext ?? (window as unknown as { webkitAudioContext?: AudioContextConstructor }).webkitAudioContext)
    return hasMedia && typeof AudioCtx === "function"
  }, [])

  const cleanup = useCallback(() => {
    processorRef.current?.disconnect()
    processorRef.current = null

    gainRef.current?.disconnect()
    gainRef.current = null

    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => undefined)
      audioContextRef.current = null
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }

    setIsActive(false)
    setSampleRate(null)
    volumeRef.current = 0
    setVolume(0)
  }, [])

  const stop = useCallback(() => {
    cleanup()
  }, [cleanup])

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

      const source = audioContext.createMediaStreamSource(stream)
      const processor = audioContext.createScriptProcessor(bufferSize, 1, 1)
      const gainNode = audioContext.createGain()
      gainNode.gain.value = 0

      source.connect(processor)
      processor.connect(gainNode)
      gainNode.connect(audioContext.destination)

      processor.onaudioprocess = (event) => {
        const channelData = event.inputBuffer.getChannelData(0)
        const frame = new Float32Array(channelData.length)
        frame.set(channelData)

        const metadata: MicrophoneFrameMetadata = {
          sampleRate: audioContext.sampleRate,
          timestamp: performance.now(),
        }

        frameCallbackRef.current?.(frame, metadata)

        let sum = 0
        for (let i = 0; i < frame.length; i += 1) {
          const value = frame[i]
          sum += value * value
        }
        const rms = Math.sqrt(sum / frame.length)
        const previous = volumeRef.current
        const nextVolume = smoothing * previous + (1 - smoothing) * rms
        volumeRef.current = nextVolume
        if (Math.abs(nextVolume - previous) > 0.01) {
          setVolume(nextVolume)
          volumeCallbackRef.current?.(nextVolume)
        }
      }

      processorRef.current = processor
      gainRef.current = gainNode
      setIsActive(true)

      return { stream, sampleRate: audioContext.sampleRate }
    } catch (caught) {
      console.error("Failed to start microphone stream", caught)
      cleanup()
      if (caught instanceof DOMException && caught.name === "NotAllowedError") {
        setPermission("denied")
        setError("Microphone access was denied")
      } else {
        setError(caught instanceof Error ? caught.message : "Unable to access microphone")
      }
      throw caught
    }
  }, [cleanup, isSupported, options.audioConstraints, bufferSize, smoothing])

  useEffect(() => () => stop(), [stop])

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

