export type SpeechStartEvent = {
  error?: boolean
}

export type SpeechRecognizedEvent = {
  isFinal?: boolean
}

export type SpeechResultsEvent = {
  value?: string[]
  bestTranscription?: string
  isFinal?: boolean
}

export type SpeechErrorEvent = {
  error?: {
    code?: string
    message?: string
  } | string
  message?: string
}

export type SpeechEndEvent = {
  error?: boolean
}

export type SpeechVolumeChangeEvent = {
  value?: number
}

export type SpeechEvents = {
  onSpeechStart?: (event: SpeechStartEvent) => void
  onSpeechRecognized?: (event: SpeechRecognizedEvent) => void
  onSpeechEnd?: (event: SpeechEndEvent) => void
  onSpeechError?: (event: SpeechErrorEvent) => void
  onSpeechResults?: (event: SpeechResultsEvent) => void
  onSpeechPartialResults?: (event: SpeechResultsEvent) => void
  onSpeechVolumeChanged?: (event: SpeechVolumeChangeEvent) => void
}

export type BrowserVoiceOptions = {
  locale?: string
  continuous?: boolean
  interimResults?: boolean
  maxAlternatives?: number
}
