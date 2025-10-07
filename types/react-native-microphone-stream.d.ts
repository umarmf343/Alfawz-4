declare module "react-native-microphone-stream" {
  export type MicrophoneStreamInitOptions = {
    bufferSize?: number
    sampleRate?: number
    bitsPerChannel?: number
    channelsPerFrame?: number
    format?: "float" | "int"
    audioSource?: number
  }

  export type MicrophoneStreamChunk = number[] | Float32Array | Uint8Array

  export type MicrophoneStreamListener = (data: MicrophoneStreamChunk) => void

  export interface MicrophoneStreamHandle {
    remove(): void
  }

  export interface MicrophoneStreamModule {
    init(options?: MicrophoneStreamInitOptions): void
    start(): void
    stop(): void
    pause(): void
    addListener(listener: MicrophoneStreamListener): MicrophoneStreamHandle
    removeAllListeners?(): void
  }

  const MicStream: MicrophoneStreamModule
  export default MicStream
}
