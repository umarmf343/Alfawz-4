"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { AlertCircle, CheckCircle2, Mic, Pause, Play, Waves } from "lucide-react"

interface TranscriptLog {
  id: string
  transcript: string
  confidence?: number
  timestamp: string
}

type PermissionState = "idle" | "granted" | "denied"

type SpeechRecognitionAlternativeLike = {
  transcript: string
  confidence: number
}

type SpeechRecognitionResultLike = {
  isFinal: boolean
  0: SpeechRecognitionAlternativeLike
  length: number
}

type SpeechRecognitionEventLike = {
  results: {
    length: number
    item: (index: number) => SpeechRecognitionResultLike
    [index: number]: SpeechRecognitionResultLike
  }
}

type SpeechRecognitionLike = {
  lang: string
  continuous: boolean
  interimResults: boolean
  onresult: ((event: SpeechRecognitionEventLike) => void) | null
  onerror: ((event: { error: string; message?: string }) => void) | null
  start: () => void
  stop: () => void
  abort: () => void
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike

const getSpeechRecognition = (): SpeechRecognitionConstructor | null => {
  if (typeof window === "undefined") return null
  const SpeechRecognitionImpl =
    (window as unknown as { SpeechRecognition?: SpeechRecognitionConstructor }).SpeechRecognition ??
    (window as unknown as { webkitSpeechRecognition?: SpeechRecognitionConstructor }).webkitSpeechRecognition
  return SpeechRecognitionImpl ?? null
}

const formatElapsed = (milliseconds: number) => {
  if (milliseconds <= 0) return "0:00"
  const totalSeconds = Math.floor(milliseconds / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${seconds.toString().padStart(2, "0")}`
}

export function RecitationLab() {
  const [permissionState, setPermissionState] = useState<PermissionState>("idle")
  const [isRecording, setIsRecording] = useState(false)
  const [isSpeechSupported, setIsSpeechSupported] = useState(false)
  const [transcripts, setTranscripts] = useState<TranscriptLog[]>([])
  const [sessionNotes, setSessionNotes] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [sessionDuration, setSessionDuration] = useState(0)
  const [streamSize, setStreamSize] = useState(0)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioStreamRef = useRef<MediaStream | null>(null)
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null)
  const startTimeRef = useRef<number | null>(null)
  const sessionChunksRef = useRef<Blob[]>([])
  const rafRef = useRef<number | null>(null)
  const shouldRestartRecognitionRef = useRef(false)

  useEffect(() => {
    const recognizer = getSpeechRecognition()
    setIsSpeechSupported(Boolean(recognizer))
  }, [])

  useEffect(() => {
    if (!isRecording) {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
      return
    }

    const tick = () => {
      if (startTimeRef.current) {
        setSessionDuration(Date.now() - startTimeRef.current)
      }
      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
    }
  }, [isRecording])

  const resetSession = useCallback(() => {
    shouldRestartRecognitionRef.current = false
    mediaRecorderRef.current?.stop()
    recognitionRef.current?.stop()
    audioStreamRef.current?.getTracks().forEach((track) => track.stop())
    mediaRecorderRef.current = null
    recognitionRef.current = null
    audioStreamRef.current = null
    startTimeRef.current = null
    sessionChunksRef.current = []
    setIsRecording(false)
    setSessionDuration(0)
    setStreamSize(0)
  }, [])

  const handlePermission = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      setPermissionState("granted")
      audioStreamRef.current = stream
      return stream
    } catch (err) {
      console.error("Failed to access microphone", err)
      setPermissionState("denied")
      setError("Microphone permission denied. Enable audio access to begin streaming.")
      throw err
    }
  }, [])

  const setupSpeechRecognition = useCallback(() => {
    const SpeechRecognitionImpl = getSpeechRecognition()
    if (!SpeechRecognitionImpl) {
      return null
    }

    const recognition = new SpeechRecognitionImpl()
    recognition.lang = "ar-SA"
    recognition.continuous = true
    recognition.interimResults = true
    recognition.onerror = (event) => {
      if (!event) {
        return
      }

      const errorCode = event.error

      if (errorCode === "no-speech" || errorCode === "aborted") {
        // These errors occur naturally when the user is quiet for a while. When streaming
        // we silently restart recognition to keep transcripts flowing without surfacing
        // a confusing error state to the user.
        return
      }

      console.warn("Speech recognition error", event)

      if (errorCode === "not-allowed" || errorCode === "service-not-allowed") {
        setPermissionState("denied")
        setError("Microphone access is blocked. Enable audio permissions to continue capturing transcripts.")
        return
      }

      if (errorCode === "network") {
        setError("Speech recognition service is currently unreachable. We'll keep recording so you can export audio later.")
        return
      }

      const description = errorCode ? `Speech recognition error: ${errorCode}` : "Speech recognition encountered an unknown error."
      setError(event.message ? `${description} – ${event.message}` : description)
    }
    recognition.onend = () => {
      if (!shouldRestartRecognitionRef.current) {
        return
      }
      window.setTimeout(() => {
        if (!shouldRestartRecognitionRef.current) {
          return
        }
        try {
          recognition.start()
        } catch (restartError) {
          console.error("Failed to restart speech recognition", restartError)
          setError("Speech recognition stopped unexpectedly. Try restarting the capture session.")
        }
      }, 250)
    }
    recognition.onresult = (event) => {
      for (let i = event.results.length - 1; i >= 0; i -= 1) {
        const result = event.results[i]
        if (!result.isFinal) continue
        const alternative = result[0]
        if (!alternative) continue
        setTranscripts((prev) => [
          {
            id: crypto.randomUUID(),
            transcript: alternative.transcript.trim(),
            confidence: alternative.confidence,
            timestamp: new Date().toISOString(),
          },
          ...prev,
        ])
        break
      }
    }
    return recognition
  }, [])

  const startRecording = useCallback(async () => {
    setError(null)
    try {
      const stream = audioStreamRef.current ?? (await handlePermission())
      if (!stream) {
        throw new Error("Microphone stream not available")
      }

      const recorder = new MediaRecorder(stream, { mimeType: "audio/webm" })
      sessionChunksRef.current = []
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          sessionChunksRef.current.push(event.data)
          setStreamSize((size) => size + event.data.size)
        }
      }
      recorder.start(1000)
      mediaRecorderRef.current = recorder

      const recognition = setupSpeechRecognition()
      if (recognition) {
        recognitionRef.current = recognition
        shouldRestartRecognitionRef.current = true
        recognition.start()
      }

      startTimeRef.current = Date.now()
      setIsRecording(true)
      setSessionDuration(0)
    } catch (err) {
      console.error("Unable to start recording", err)
      setError("Unable to start recording. Check microphone availability and try again.")
      resetSession()
    }
  }, [handlePermission, resetSession, setupSpeechRecognition])

  const stopRecording = useCallback(() => {
    shouldRestartRecognitionRef.current = false
    mediaRecorderRef.current?.stop()
    recognitionRef.current?.stop()
    audioStreamRef.current?.getTracks().forEach((track) => track.stop())
    mediaRecorderRef.current = null
    recognitionRef.current = null
    audioStreamRef.current = null
    startTimeRef.current = null
    setIsRecording(false)
  }, [])

  const exportSession = useCallback(() => {
    if (sessionChunksRef.current.length === 0 && transcripts.length === 0) {
      setError("Nothing to export yet. Record audio or capture a transcript first.")
      return
    }

    const payload = {
      startedAt: transcripts[0]?.timestamp ?? new Date().toISOString(),
      durationMs: sessionDuration,
      notes: sessionNotes,
      transcripts,
    }

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" })
    const blobUrl = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = blobUrl
    link.download = `tajweed-session-${Date.now()}.json`
    link.click()
    URL.revokeObjectURL(blobUrl)
  }, [sessionDuration, sessionNotes, transcripts])

  const downloadAudio = useCallback(() => {
    if (sessionChunksRef.current.length === 0) {
      setError("Record some audio before downloading the session clip.")
      return
    }
    const audioBlob = new Blob(sessionChunksRef.current, { type: "audio/webm" })
    const blobUrl = URL.createObjectURL(audioBlob)
    const link = document.createElement("a")
    link.href = blobUrl
    link.download = `tajweed-session-${Date.now()}.webm`
    link.click()
    URL.revokeObjectURL(blobUrl)
  }, [])

  const statusBadge = useMemo(() => {
    if (isRecording) {
      return <Badge className="bg-red-100 text-red-700 border-red-200">Live</Badge>
    }
    if (permissionState === "denied") {
      return <Badge variant="outline" className="border-red-200 text-red-700">Permission blocked</Badge>
    }
    if (transcripts.length > 0) {
      return <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">Session captured</Badge>
    }
    return <Badge variant="secondary">Idle</Badge>
  }, [isRecording, permissionState, transcripts.length])

  const averageConfidence = useMemo(() => {
    if (transcripts.length === 0) return null
    const total = transcripts.reduce((sum, entry) => sum + (entry.confidence ?? 0), 0)
    return Math.round((total / transcripts.length) * 100)
  }, [transcripts])

  return (
    <Card className="border-maroon-100 bg-white/90 backdrop-blur">
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle className="text-2xl font-semibold text-maroon-900">Recitation Stream</CardTitle>
          <CardDescription>
            Stream microphone audio, capture live transcripts, and log tajweed mistakes for offline review.
          </CardDescription>
        </div>
        {statusBadge}
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-[3fr_2fr]">
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-xl border border-maroon-100 bg-maroon-50/60 p-4">
              <div className="flex items-center gap-3">
                <div className={cn("flex h-12 w-12 items-center justify-center rounded-full border", isRecording ? "border-red-300 bg-red-50" : "border-maroon-200 bg-white") }>
                  {isRecording ? <Waves className="h-6 w-6 text-red-500" /> : <Mic className="h-6 w-6 text-maroon-500" />}
                </div>
                <div>
                  <p className="text-sm font-medium text-maroon-900">Session duration</p>
                  <p className="text-2xl font-semibold text-maroon-700">{formatElapsed(sessionDuration)}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs uppercase tracking-wide text-maroon-600">Captured data</p>
                <p className="font-semibold text-maroon-800">{(streamSize / 1024).toFixed(1)} KB</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button
                size="lg"
                className="gap-2"
                onClick={isRecording ? stopRecording : startRecording}
              >
                {isRecording ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                {isRecording ? "Stop" : "Start"} capture
              </Button>
              <Button variant="outline" onClick={downloadAudio} className="gap-2">
                <Waves className="h-4 w-4" /> Download audio
              </Button>
              <Button variant="secondary" onClick={exportSession} className="gap-2">
                <CheckCircle2 className="h-4 w-4" /> Export transcript
              </Button>
              <Button variant="ghost" onClick={resetSession} className="gap-2 text-maroon-600">
                Reset session
              </Button>
            </div>

            {!isSpeechSupported && (
              <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
                <AlertCircle className="h-4 w-4" />
                Browser speech recognition API is unavailable. Audio still records for server-side transcription.
              </div>
            )}

            {error && (
              <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}

            <div className="space-y-3">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-maroon-700">Session notes</h3>
              <Textarea
                value={sessionNotes}
                onChange={(event) => setSessionNotes(event.target.value)}
                placeholder="Log observed tajweed slips, reviewer assignments, or contextual notes for offline QA."
                className="min-h-[120px] resize-y"
              />
            </div>
          </div>

          <div className="rounded-xl border border-maroon-100 bg-white/80 p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-maroon-900">Live quality signals</h3>
              {averageConfidence !== null ? (
                <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">{averageConfidence}% confidence</Badge>
              ) : (
                <Badge variant="outline">Awaiting transcript</Badge>
              )}
            </div>
            <p className="mt-2 text-sm text-maroon-600">
              Each transcript snippet is stored with a timestamp so the correction workflow can replay audio against the Mushaf
              view.
            </p>
            <Separator className="my-4" />
            <ScrollArea className="h-60 pr-2">
              <div className="space-y-3">
                {transcripts.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-maroon-200 p-4 text-center text-sm text-maroon-500">
                    Start a session to populate transcripts for later tajweed error mining.
                  </div>
                ) : (
                  transcripts.map((entry) => (
                    <div key={entry.id} className="rounded-lg border border-maroon-100 bg-maroon-50/60 p-3">
                      <p className="text-sm font-medium text-maroon-900">{entry.transcript}</p>
                      <div className="mt-2 flex items-center justify-between text-xs text-maroon-600">
                        <span>{new Date(entry.timestamp).toLocaleTimeString()}</span>
                        {typeof entry.confidence === "number" && (
                          <span>{Math.round(entry.confidence * 100)}% confidence</span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col gap-4 border-t border-maroon-100 bg-maroon-50/50 p-6">
        <div className="flex w-full flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-maroon-900">Correction workflow readiness</p>
            <p className="text-xs text-maroon-600">
              Keep the browser tab active while recording to maintain a stable audio stream for tajweed scoring.
            </p>
          </div>
          <div className="flex min-w-[220px] flex-col gap-2">
            <Progress value={Math.min(100, transcripts.length * 12)} className="h-2" />
            <p className="text-xs text-right text-maroon-600">
              {transcripts.length} transcript{transcripts.length === 1 ? "" : "s"} captured
            </p>
          </div>
        </div>
      </CardFooter>
    </Card>
  )
}

