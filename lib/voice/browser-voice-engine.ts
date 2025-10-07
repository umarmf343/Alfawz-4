import {
  BrowserVoiceOptions,
  SpeechEndEvent,
  SpeechErrorEvent,
  SpeechEvents,
  SpeechRecognizedEvent,
  SpeechResultsEvent,
  SpeechStartEvent,
} from "./types"

type SpeechRecognitionConstructor = new () => SpeechRecognition

const getSpeechRecognitionCtor = (): SpeechRecognitionConstructor | null => {
  if (typeof window === "undefined") {
    return null
  }

  const globalWindow = window as typeof window & {
    SpeechRecognition?: SpeechRecognitionConstructor
    webkitSpeechRecognition?: SpeechRecognitionConstructor
  }

  const ctor = globalWindow.SpeechRecognition ?? globalWindow.webkitSpeechRecognition

  return ctor ?? null
}

const defaultEvents = (): Required<SpeechEvents> => ({
  onSpeechStart: () => {},
  onSpeechRecognized: () => {},
  onSpeechEnd: () => {},
  onSpeechError: () => {},
  onSpeechResults: () => {},
  onSpeechPartialResults: () => {},
  onSpeechVolumeChanged: () => {},
})

export class BrowserVoiceEngine {
  private RecognitionCtor: SpeechRecognitionConstructor | null
  private recognition: SpeechRecognition | null
  private events: Required<SpeechEvents>
  private isRecognizing: boolean
  private finalTranscript: string
  private interimTranscript: string

  constructor(RecognitionCtor: SpeechRecognitionConstructor | null) {
    this.RecognitionCtor = RecognitionCtor
    this.recognition = null
    this.events = defaultEvents()
    this.isRecognizing = false
    this.finalTranscript = ""
    this.interimTranscript = ""
  }

  isAvailable() {
    return Boolean(this.RecognitionCtor)
  }

  get isListening() {
    return this.isRecognizing
  }

  get transcript() {
    return {
      final: this.finalTranscript,
      partial: this.interimTranscript || this.finalTranscript,
    }
  }

  removeAllListeners() {
    this.events = defaultEvents()
  }

  set onSpeechStart(handler: SpeechEvents["onSpeechStart"]) {
    this.events.onSpeechStart = handler ?? (() => {})
  }

  set onSpeechRecognized(handler: SpeechEvents["onSpeechRecognized"]) {
    this.events.onSpeechRecognized = handler ?? (() => {})
  }

  set onSpeechEnd(handler: SpeechEvents["onSpeechEnd"]) {
    this.events.onSpeechEnd = handler ?? (() => {})
  }

  set onSpeechError(handler: SpeechEvents["onSpeechError"]) {
    this.events.onSpeechError = handler ?? (() => {})
  }

  set onSpeechResults(handler: SpeechEvents["onSpeechResults"]) {
    this.events.onSpeechResults = handler ?? (() => {})
  }

  set onSpeechPartialResults(handler: SpeechEvents["onSpeechPartialResults"]) {
    this.events.onSpeechPartialResults = handler ?? (() => {})
  }

  set onSpeechVolumeChanged(handler: SpeechEvents["onSpeechVolumeChanged"]) {
    this.events.onSpeechVolumeChanged = handler ?? (() => {})
  }

  async start(options: BrowserVoiceOptions = {}) {
    if (!this.RecognitionCtor) {
      throw new Error("Browser speech recognition is not supported")
    }

    if (this.recognition) {
      this.recognition.abort()
      this.detachListeners(this.recognition)
      this.recognition = null
    }

    const recognition = new this.RecognitionCtor()
    recognition.lang = options.locale ?? "ar-SA"
    recognition.continuous = options.continuous ?? true
    recognition.interimResults = options.interimResults ?? true
    recognition.maxAlternatives = options.maxAlternatives ?? 1

    this.finalTranscript = ""
    this.interimTranscript = ""

    recognition.onstart = () => {
      this.isRecognizing = true
      const event: SpeechStartEvent = { error: false }
      this.events.onSpeechStart(event)
    }

    recognition.onresult = (event) => {
      let hasFinalResult = false
      let interimBuffer = ""

      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const result = event.results[index]
        if (!result || !result[0]) continue

        const transcript = result[0].transcript.trim()
        if (!transcript) continue

        if (result.isFinal) {
          hasFinalResult = true
          this.finalTranscript = `${this.finalTranscript} ${transcript}`.trim()
        } else {
          interimBuffer = transcript
        }
      }

      const interim = `${this.finalTranscript} ${interimBuffer}`.trim()
      this.interimTranscript = interim || this.finalTranscript

      if (this.interimTranscript) {
        const partialEvent: SpeechResultsEvent = {
          value: [this.interimTranscript],
          bestTranscription: this.interimTranscript,
          isFinal: hasFinalResult,
        }
        this.events.onSpeechPartialResults(partialEvent)
      }

      if (hasFinalResult && this.finalTranscript) {
        const recognizedEvent: SpeechRecognizedEvent = { isFinal: true }
        const resultsEvent: SpeechResultsEvent = {
          value: [this.finalTranscript],
          bestTranscription: this.finalTranscript,
          isFinal: true,
        }

        this.events.onSpeechRecognized(recognizedEvent)
        this.events.onSpeechResults(resultsEvent)
      }
    }

    recognition.onerror = (event) => {
      const error: SpeechErrorEvent = {
        error: event.error,
        message:
          event.error === "not-allowed"
            ? "Microphone access was blocked. Please enable it in your browser settings."
            : event.message || event.error,
      }

      this.events.onSpeechError(error)
    }

    recognition.onend = () => {
      const endEvent: SpeechEndEvent = { error: false }
      this.events.onSpeechEnd(endEvent)
      this.isRecognizing = false
      this.recognition = null
    }

    recognition.onspeechend = () => {
      const endEvent: SpeechEndEvent = { error: false }
      this.events.onSpeechEnd(endEvent)
    }

    recognition.start()
    this.recognition = recognition
  }

  stop() {
    if (!this.recognition) {
      return
    }

    try {
      this.recognition.stop()
    } catch (error) {
      console.warn("Failed to stop speech recognition", error)
    }
  }

  cancel() {
    if (!this.recognition) {
      return
    }

    try {
      this.recognition.abort()
    } catch (error) {
      console.warn("Failed to cancel speech recognition", error)
    }
  }

  destroy() {
    this.cancel()
    this.recognition = null
    this.removeAllListeners()
  }

  private detachListeners(instance: SpeechRecognition) {
    instance.onstart = null
    instance.onresult = null
    instance.onerror = null
    instance.onend = null
    instance.onspeechend = null
  }
}

export const createBrowserVoiceEngine = () =>
  new BrowserVoiceEngine(getSpeechRecognitionCtor())
