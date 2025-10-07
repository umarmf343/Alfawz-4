import { useCallback, useEffect } from "react"
import type { ReactNode } from "react"

import type { MicrophoneChunkListener } from "../hooks/useMicrophoneStream"
import { useMicrophoneStream } from "../hooks/useMicrophoneStream"
import { useSpeechRecognition } from "../hooks/useSpeechRecognition"

export interface LiveRecitationSessionRenderState {
  startSession: () => void
  stopSession: () => void
  microphone: ReturnType<typeof useMicrophoneStream>
  speech: ReturnType<typeof useSpeechRecognition>
}

export interface LiveRecitationSessionProps {
  /** Automatically start microphone capture and speech recognition. */
  autoStart?: boolean
  /** Locale string forwarded to the speech recogniser. */
  locale?: string
  /** Receives raw audio buffers (Float32) captured from the microphone. */
  onAudioChunk?: MicrophoneChunkListener
  /** Receives aggregated final transcripts from the recogniser. */
  onFinalTranscript?: (transcript: string) => void
  /** Receives partial transcripts emitted during recognition. */
  onPartialTranscript?: (transcript: string) => void
  /** Render prop exposing the live session state. */
  children?: (state: LiveRecitationSessionRenderState) => ReactNode
}

export function LiveRecitationSession({
  autoStart = false,
  locale,
  onAudioChunk,
  onFinalTranscript,
  onPartialTranscript,
  children,
}: LiveRecitationSessionProps) {
  const microphone = useMicrophoneStream({ autoStart: false, onChunk: onAudioChunk })
  const speech = useSpeechRecognition({
    autoStart: false,
    locale,
    onFinalResult: onFinalTranscript,
    onPartialResult: onPartialTranscript,
  })

  const startSession = useCallback(() => {
    microphone.start()
    speech.start(locale)
  }, [locale, microphone, speech])

  const stopSession = useCallback(() => {
    microphone.stop()
    speech.stop()
  }, [microphone, speech])

  useEffect(() => {
    if (!autoStart) return
    startSession()
    return () => {
      stopSession()
    }
  }, [autoStart, startSession, stopSession])

  if (!children) {
    return null
  }

  return <>{children({ startSession, stopSession, microphone, speech })}</>
}
