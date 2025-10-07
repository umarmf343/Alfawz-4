declare module "@react-native-voice/voice" {
  export type SpeechStartEvent = { error?: string | null }
  export type SpeechEndEvent = Record<string, never>
  export type SpeechResultsEvent = { value?: string[] }
  export type SpeechPartialResultsEvent = { value?: string[] }
  export type SpeechErrorEvent = { error: { message: string; code: string } }
  export type SpeechVolumeChangeEvent = { value: number }

  export type SpeechEventHandler<T> = (event: T) => void

  export interface VoiceModule {
    onSpeechStart?: SpeechEventHandler<SpeechStartEvent>
    onSpeechEnd?: SpeechEventHandler<SpeechEndEvent>
    onSpeechResults?: SpeechEventHandler<SpeechResultsEvent>
    onSpeechPartialResults?: SpeechEventHandler<SpeechPartialResultsEvent>
    onSpeechError?: SpeechEventHandler<SpeechErrorEvent>
    onSpeechVolumeChanged?: SpeechEventHandler<SpeechVolumeChangeEvent>
    start(locale: string, options?: Record<string, unknown>): Promise<void>
    stop(): Promise<void>
    cancel(): Promise<void>
    destroy(): Promise<void>
    isAvailable(): Promise<boolean>
  }

  const Voice: VoiceModule
  export default Voice
}
