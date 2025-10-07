"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"

export type SpeechRecognitionStatus = "idle" | "initialising" | "listening" | "stopping" | "error"

export interface UseSpeechRecognitionOptions {
  language?: string
  continuous?: boolean
  interimResults?: boolean
  autoStart?: boolean
  onPartialResult?: (transcript: string) => void
  onFinalResult?: (transcript: string) => void
  onError?: (message: string) => void
}

interface SpeechRecognitionConstructor {
  new (): SpeechRecognitionInstance
}

interface SpeechRecognitionResultAlternative {
  transcript: string
  confidence: number
}

interface SpeechRecognitionResult {
  readonly isFinal: boolean
  readonly length: number
  item(index: number): SpeechRecognitionResultAlternative
  [index: number]: SpeechRecognitionResultAlternative
}

interface SpeechRecognitionEvent extends Event {
  readonly resultIndex: number
  readonly results: SpeechRecognitionResultList
}

interface SpeechRecognitionResultList {
  readonly length: number
  item(index: number): SpeechRecognitionResult
  [index: number]: SpeechRecognitionResult
}

interface SpeechRecognitionInstance {
  lang: string
  continuous: boolean
  interimResults: boolean
  onspeechend: (() => void) | null
  onend: ((event: Event) => void) | null
  onresult: ((event: SpeechRecognitionEvent) => void) | null
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null
  onaudiostart: (() => void) | null
  onaudioend: (() => void) | null
  onstart: (() => void) | null
  stop(): void
  start(): void
  abort(): void
}

interface SpeechRecognitionErrorEvent extends Event {
  readonly error: string
  readonly message?: string
}

function resolveSpeechRecognition(): SpeechRecognitionConstructor | null {
  if (typeof window === "undefined") {
    return null
  }
  const SpeechRecognitionImpl =
    (window as unknown as { SpeechRecognition?: SpeechRecognitionConstructor }).SpeechRecognition ??
    (window as unknown as { webkitSpeechRecognition?: SpeechRecognitionConstructor }).webkitSpeechRecognition
  return typeof SpeechRecognitionImpl === "function" ? SpeechRecognitionImpl : null
}

export function useSpeechRecognition({
  language = "ar-SA",
  continuous = true,
  interimResults = true,
  autoStart = false,
  onPartialResult,
  onFinalResult,
  onError,
}: UseSpeechRecognitionOptions = {}) {
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null)
  const [status, setStatus] = useState<SpeechRecognitionStatus>("idle")
  const [error, setError] = useState<string | null>(null)
  const [partialTranscript, setPartialTranscript] = useState<string>("")
  const [finalResults, setFinalResults] = useState<string[]>([])

  const RecognitionCtor = useMemo(resolveSpeechRecognition, [])
  const isSupported = RecognitionCtor != null

  const reset = useCallback(() => {
    setPartialTranscript("")
    setFinalResults([])
    setError(null)
  }, [])

  const stop = useCallback(() => {
    if (!recognitionRef.current) {
      return Promise.resolve()
    }

    if (status === "idle" || status === "error") {
      recognitionRef.current.abort()
      recognitionRef.current = null
      return Promise.resolve()
    }

    return new Promise<void>((resolve) => {
      const recognition = recognitionRef.current
      if (!recognition) {
        resolve()
        return
      }
      const handleEnd = () => {
        recognition.onend = null
        recognition.onresult = null
        recognition.onerror = null
        recognitionRef.current = null
        setStatus("idle")
        resolve()
      }
      recognition.onend = handleEnd
      try {
        setStatus("stopping")
        recognition.stop()
      } catch (caught) {
        console.error("Failed to stop speech recognition", caught)
        recognitionRef.current = null
        setStatus("idle")
        resolve()
      }
    })
  }, [status])

  const start = useCallback(async () => {
    if (!RecognitionCtor) {
      const message = "This browser does not support the Web Speech API."
      setError(message)
      setStatus("error")
      throw new Error(message)
    }

    if (recognitionRef.current) {
      return
    }

    const recognition = new RecognitionCtor()
    recognition.lang = language
    recognition.continuous = continuous
    recognition.interimResults = interimResults
    recognitionRef.current = recognition

    recognition.onstart = () => {
      setStatus("listening")
    }

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      const message = event.message ?? event.error ?? "Speech recognition error"
      console.error("Speech recognition error", event)
      setError(message)
      setStatus("error")
      onError?.(message)
    }

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interimTranscript = ""
      const finalised: string[] = []
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i]
        const alternative = result[0]
        const transcript = alternative.transcript.trim()
        if (!transcript) {
          continue
        }
        if (result.isFinal) {
          finalised.push(transcript)
        } else if (interimResults) {
          interimTranscript += `${transcript} `
        }
      }

      if (interimTranscript.trim().length > 0) {
        const trimmed = interimTranscript.trim()
        setPartialTranscript(trimmed)
        onPartialResult?.(trimmed)
      } else {
        setPartialTranscript("")
      }

      if (finalised.length > 0) {
        setFinalResults((prev) => [...prev, ...finalised])
        finalised.forEach((text) => onFinalResult?.(text))
      }
    }

    recognition.onend = () => {
      if (status !== "stopping") {
        setStatus("idle")
      }
      recognitionRef.current = null
    }

    try {
      setStatus("initialising")
      recognition.start()
    } catch (caught) {
      console.error("Unable to start speech recognition", caught)
      const message =
        caught instanceof Error ? caught.message : "Unable to start speech recognition in this browser"
      setStatus("error")
      setError(message)
      recognitionRef.current = null
      onError?.(message)
      throw caught instanceof Error ? caught : new Error(message)
    }
  }, [RecognitionCtor, continuous, interimResults, language, onError, onFinalResult, onPartialResult, status])

  useEffect(() => {
    if (!autoStart) {
      return
    }
    void start()
    return () => {
      void stop()
    }
  }, [autoStart, start, stop])

  return {
    start,
    stop,
    reset,
    status,
    error,
    isSupported,
    partialTranscript,
    finalResults,
  }
}
