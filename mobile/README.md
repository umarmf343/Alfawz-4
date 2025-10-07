# Mobile Speech Capture Utilities

This directory contains React Native utilities that mirror the live tajwīd capture
experience showcased across TarteelAI's public repositories. They provide a drop-in
microphone stream handler and a speech recognition hook so a cross-platform recitation
client can surface real-time transcripts, tajwīd analysis and responsive prompts.

## Hooks

### `useMicrophoneStream`
- Wraps `react-native-microphone-stream` with declarative React state.
- Normalises raw PCM frames into Float32 buffers ready for waveform streaming or
  WebSocket uploads.
- Handles app backgrounding automatically so live sessions pause when a learner
  minimises the experience and resume when they return.

### `useSpeechRecognition`
- Wraps `@react-native-voice/voice` with status tracking, partial/final transcript
  aggregation and volume monitoring.
- Supports continuous sessions by automatically re-arming the recogniser once a
  final transcript arrives, enabling uninterrupted tajwīd feedback loops.

### `LiveRecitationSession`
- Couples both hooks and exposes a render-prop so UI layers can wire up controls
  while keeping streaming logic isolated.
- Emits microphone chunks, partial captions and final recognised text — the same
  signals required for the live tajwīd analyser in the web dashboard.

## Usage Example

```tsx
import { LiveRecitationSession } from "@/mobile/components/LiveRecitationSession"

export function MobileTajweedSession() {
  return (
    <LiveRecitationSession
      autoStart
      locale="ar-SA"
      onAudioChunk={(chunk) => console.log("buffer", chunk.length)}
      onPartialTranscript={(partial) => console.log("partial", partial)}
      onFinalTranscript={(final) => console.log("final", final)}
    >
      {({ startSession, stopSession, microphone, speech }) => (
        <>
          {/* Render native UI controls here */}
          <Button title={microphone.isActive ? "Stop" : "Start"} onPress={microphone.isActive ? stopSession : startSession} />
          <Text>{speech.partialTranscript || speech.aggregatedTranscript}</Text>
        </>
      )}
    </LiveRecitationSession>
  )
}
```

These utilities remain tree-shakable from the Next.js web build while giving the
React Native client parity with Tarteel's live recitation workflow.
