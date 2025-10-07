"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"

type SpeechRecognitionConstructor = new () => SpeechRecognition

declare global {
  interface Window {
    webkitSpeechRecognition?: SpeechRecognitionConstructor
  }
}

export interface SpeechRecognitionResultPayload {
  transcript: string
  isFinal: boolean
}

export interface UseSpeechRecognitionOptions {
  lang?: string
  continuous?: boolean
  interimResults?: boolean
  maxAlternatives?: number
  onResult?: (payload: SpeechRecognitionResultPayload) => void
  onError?: (error: string) => void
}

export interface UseSpeechRecognitionResult {
  start: () => Promise<void>
  stop: () => void
  abort: () => void
  reset: () => void
  isSupported: boolean
  isListening: boolean
  error: string | null
  partialTranscript: string
  finalTranscript: string
}

export function useSpeechRecognition(options: UseSpeechRecognitionOptions = {}): UseSpeechRecognitionResult {
  const [isListening, setIsListening] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [partialTranscript, setPartialTranscript] = useState("")
  const [finalTranscript, setFinalTranscript] = useState("")

  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const resultCallbackRef = useRef<UseSpeechRecognitionOptions["onResult"]>()
  const errorCallbackRef = useRef<UseSpeechRecognitionOptions["onError"]>()

  const recognitionConstructor = useMemo<SpeechRecognitionConstructor | null>(() => {
    if (typeof window === "undefined") {
      return null
    }
    return (window.SpeechRecognition ?? window.webkitSpeechRecognition ?? null) as SpeechRecognitionConstructor | null
  }, [])

  useEffect(() => {
    resultCallbackRef.current = options.onResult
  }, [options.onResult])

  useEffect(() => {
    errorCallbackRef.current = options.onError
  }, [options.onError])

  const resetRecognitionInstance = useCallback(() => {
    if (!recognitionConstructor) {
      recognitionRef.current = null
      return null
    }

    const recognition = new recognitionConstructor()
    recognition.continuous = options.continuous ?? true
    recognition.interimResults = options.interimResults ?? true
    recognition.lang = options.lang ?? "ar-SA"
    recognition.maxAlternatives = options.maxAlternatives ?? 1

    recognition.onresult = (event) => {
      let interim = ""
      const finals: string[] = []
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i]
        const transcript = (result[0]?.transcript ?? "").trim()
        if (!transcript) continue
        if (result.isFinal) {
          finals.push(transcript)
        } else {
          interim = transcript
        }
      }

      if (interim) {
        setPartialTranscript(interim)
        resultCallbackRef.current?.({ transcript: interim, isFinal: false })
      } else {
        setPartialTranscript("")
      }

      if (finals.length > 0) {
        const joinedFinal = finals.join(" ")
        setFinalTranscript((prev) => (prev ? `${prev} ${joinedFinal}` : joinedFinal))
        resultCallbackRef.current?.({ transcript: joinedFinal, isFinal: true })
        setPartialTranscript("")
      }
    }

    recognition.onerror = (event) => {
      const message = (event as SpeechRecognitionErrorEvent).error || "Speech recognition error"
      setError(message)
      errorCallbackRef.current?.(message)
    }

    recognition.onstart = () => {
      setIsListening(true)
      setError(null)
    }

    recognition.onend = () => {
      setIsListening(false)
      setPartialTranscript("")
    }

    recognitionRef.current = recognition
    return recognition
  }, [options.continuous, options.interimResults, options.lang, options.maxAlternatives, recognitionConstructor])

  const ensureRecognition = useCallback(() => {
    if (recognitionRef.current) {
      return recognitionRef.current
    }
    return resetRecognitionInstance()
  }, [resetRecognitionInstance])

  const start = useCallback(async () => {
    if (!recognitionConstructor) {
      throw new Error("Speech recognition is not supported in this browser")
    }
    const recognition = ensureRecognition()
    if (!recognition) {
      throw new Error("Unable to initialise speech recognition")
    }
    try {
      recognition.start()
    } catch (caught) {
      if (caught instanceof DOMException && caught.name === "InvalidStateError") {
        recognition.stop()
        recognition.start()
        return
      }
      const message = caught instanceof Error ? caught.message : "Failed to start speech recognition"
      setError(message)
      errorCallbackRef.current?.(message)
      throw caught
    }
  }, [ensureRecognition, recognitionConstructor])

  const stop = useCallback(() => {
    recognitionRef.current?.stop()
  }, [])

  const abort = useCallback(() => {
    recognitionRef.current?.abort()
  }, [])

  const reset = useCallback(() => {
    setPartialTranscript("")
    setFinalTranscript("")
    setError(null)
  }, [])

  useEffect(() => () => {
    recognitionRef.current?.stop()
    recognitionRef.current = null
  }, [])

  return {
    start,
    stop,
    abort,
    reset,
    isSupported: recognitionConstructor != null,
    isListening,
    error,
    partialTranscript,
    finalTranscript,
  }
}

