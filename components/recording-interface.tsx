"use client"

import { useState, useRef, useEffect, useMemo } from "react"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Textarea } from "@/components/ui/textarea"
import { Mic, Square, Play, Pause, RotateCcw, Upload, Award } from "lucide-react"
import {
  createLiveSessionSummary,
  MISTAKE_CATEGORY_META,
  type LiveSessionSummary,
  type MistakeCategory,
} from "@/lib/recitation-analysis"
import { createBrowserVoiceEngine, BrowserVoiceEngine } from "@/lib/voice/browser-voice-engine"
import { useVoiceFeedback } from "@/hooks/useVoiceFeedback"
import type { DialectCode } from "@/lib/phonetics"

const TRANSCRIPTION_UNAVAILABLE_MESSAGE =
  "AI transcription isn't configured on this server yet. Add a TARTEEL_API_KEY and refresh to enable AI feedback."

interface RecordingInterfaceProps {
  expectedText: string
  ayahId: string
  onTranscriptionComplete?: (result: LiveSessionSummary) => void
}

export function RecordingInterface({ expectedText, ayahId, onTranscriptionComplete }: RecordingInterfaceProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [transcriptionResult, setTranscriptionResult] = useState<LiveSessionSummary | null>(null)
  const [resultSource, setResultSource] = useState<"browser" | "server" | null>(null)
  const [recordingTime, setRecordingTime] = useState(0)
  const [voiceEngine, setVoiceEngine] = useState<BrowserVoiceEngine | null>(null)
  const [isVoiceAvailable, setIsVoiceAvailable] = useState(false)
  const [useOnDeviceAI, setUseOnDeviceAI] = useState(false)
  const [liveTranscript, setLiveTranscript] = useState("")
  const [interimTranscript, setInterimTranscript] = useState("")
  const [voiceStatus, setVoiceStatus] = useState<"idle" | "listening" | "error">("idle")
  const [voiceError, setVoiceError] = useState<string | null>(null)
  const [selectedDialect, setSelectedDialect] = useState<"auto" | DialectCode>("auto")
  const [substitutionThreshold, setSubstitutionThreshold] = useState(0.75)
  const [localeHint, setLocaleHint] = useState<string | null>(null)
  const [feedbackChoice, setFeedbackChoice] = useState<null | "accurate" | "inaccurate">(null)
  const [feedbackNotes, setFeedbackNotes] = useState("")
  const [correctionText, setCorrectionText] = useState("")
  const [feedbackStatus, setFeedbackStatus] = useState<"idle" | "submitting" | "success" | "error">("idle")
  const [feedbackError, setFeedbackError] = useState<string | null>(null)
  const lastAnalyzedTranscriptRef = useRef("")

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  const voiceFeedback = useVoiceFeedback()
  const dialectOptions = useMemo(
    () => [
      { value: "auto" as const, label: "Auto-detect" },
      { value: "standard" as DialectCode, label: "Standard Tajwīd" },
      { value: "middle_eastern" as DialectCode, label: "Middle Eastern" },
      { value: "south_asian" as DialectCode, label: "South Asian" },
      { value: "north_african" as DialectCode, label: "North African" },
    ],
    [],
  )
  const substitutionSliderValue = useMemo(() => [Math.round(substitutionThreshold * 100)], [substitutionThreshold])
  const isSubmittingFeedback = feedbackStatus === "submitting"
  const currentDialectLabel = useMemo(() => {
    const match = dialectOptions.find((option) => option.value === selectedDialect)
    return match?.label ?? "Auto-detect"
  }, [dialectOptions, selectedDialect])

  useEffect(() => {
    if (typeof window === "undefined") {
      return
    }

    const engine = createBrowserVoiceEngine()
    setVoiceEngine(engine)
    setIsVoiceAvailable(engine.isAvailable())
    setUseOnDeviceAI(engine.isAvailable())

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
      engine.destroy()
    }
  }, [])

  useEffect(() => {
    if (typeof navigator !== "undefined") {
      setLocaleHint(navigator.language ?? null)
    }
  }, [])

  useEffect(() => {
    if (!transcriptionResult) {
      return
    }
    setFeedbackChoice(null)
    setFeedbackNotes("")
    setCorrectionText("")
    setFeedbackStatus("idle")
    setFeedbackError(null)
  }, [transcriptionResult])

  useEffect(() => {
    if (!voiceEngine) return

    voiceEngine.removeAllListeners()

    voiceEngine.onSpeechStart = () => {
      setVoiceStatus("listening")
      setVoiceError(null)
      setLiveTranscript("")
      setInterimTranscript("")
    }

    voiceEngine.onSpeechPartialResults = (event) => {
      const transcript = (event?.bestTranscription ?? event?.value?.join(" ") ?? "").trim()
      if (transcript) {
        setInterimTranscript(transcript)
      }
    }

    voiceEngine.onSpeechResults = (event) => {
      const transcript = (event?.bestTranscription ?? event?.value?.join(" ") ?? "").trim()
      if (transcript) {
        setLiveTranscript(transcript)
        setInterimTranscript(transcript)
      }
    }

    voiceEngine.onSpeechError = (event) => {
      const message =
        typeof event?.error === "string"
          ? event.error
          : event?.error?.message ?? event?.message ?? "Speech recognition error"
      setVoiceError(message)
      setVoiceStatus("error")
    }

    voiceEngine.onSpeechEnd = () => {
      setVoiceStatus("idle")
    }

    return () => {
      voiceEngine.cancel()
      voiceEngine.removeAllListeners()
    }
  }, [voiceEngine])

  useEffect(() => {
    if (!isVoiceAvailable) {
      setUseOnDeviceAI(false)
    }
  }, [isVoiceAvailable])

  useEffect(() => {
    if (!useOnDeviceAI) {
      setLiveTranscript("")
      setInterimTranscript("")
      setVoiceStatus("idle")
      setVoiceError(null)
    }
  }, [useOnDeviceAI])

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        },
      })

      streamRef.current = stream

      // Set up audio analysis for waveform
      const audioContext = new AudioContext()
      const analyser = audioContext.createAnalyser()
      const source = audioContext.createMediaStreamSource(stream)
      source.connect(analyser)
      analyser.fftSize = 256
      analyserRef.current = analyser

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: "audio/webm;codecs=opus",
      })
      mediaRecorderRef.current = mediaRecorder

      const chunks: BlobPart[] = []
      mediaRecorder.ondataavailable = (e) => chunks.push(e.data)
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: "audio/wav" })
        setAudioBlob(blob)
        setAudioUrl(URL.createObjectURL(blob))
        stream.getTracks().forEach((track) => track.stop())
      }

      mediaRecorder.start()
      setIsRecording(true)
      setRecordingTime(0)

      if (voiceEngine && useOnDeviceAI && voiceEngine.isAvailable()) {
        try {
          await voiceEngine.start({
            locale: "ar-SA",
            continuous: true,
            interimResults: true,
          })
        } catch (error) {
          console.error("Error starting browser speech recognition", error)
          setVoiceError("Browser speech recognition could not be started. We'll use server transcription instead.")
          setUseOnDeviceAI(false)
        }
      }

      // Start timer and waveform animation
      intervalRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1)
        updateWaveform()
      }, 100)
    } catch (error) {
      console.error("Error starting recording:", error)
      alert("Could not access microphone. Please check permissions.")
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }

    if (voiceEngine && useOnDeviceAI) {
      voiceEngine.stop()
    }
  }

  const updateWaveform = () => {
    if (!analyserRef.current || !canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const bufferLength = analyserRef.current.frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)
    analyserRef.current.getByteFrequencyData(dataArray)

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Draw waveform
    const barWidth = canvas.width / bufferLength
    let x = 0

    ctx.fillStyle = "#7A001F"
    for (let i = 0; i < bufferLength; i++) {
      const barHeight = (dataArray[i] / 255) * canvas.height
      ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight)
      x += barWidth + 1
    }
  }

  const playRecording = () => {
    if (audioUrl && audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause()
        setIsPlaying(false)
      } else {
        audioRef.current.play()
        setIsPlaying(true)
      }
    }
  }

  const resetRecording = () => {
    setAudioBlob(null)
    setAudioUrl(null)
    setTranscriptionResult(null)
    setResultSource(null)
    setRecordingTime(0)
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
    }
    setIsPlaying(false)
    setLiveTranscript("")
    setInterimTranscript("")
    setVoiceError(null)
    setVoiceStatus("idle")
    lastAnalyzedTranscriptRef.current = ""
    voiceEngine?.cancel()
    voiceFeedback.cancel()
    setFeedbackChoice(null)
    setFeedbackNotes("")
    setCorrectionText("")
    setFeedbackStatus("idle")
    setFeedbackError(null)
  }

  const submitForTranscription = async () => {
    if (!audioBlob) return

    setIsTranscribing(true)
    try {
      setFeedbackStatus("idle")
      setFeedbackError(null)
      setFeedbackChoice(null)
      const formData = new FormData()
      formData.append("audio", audioBlob, "recording.wav")
      formData.append("expectedText", expectedText)
      formData.append("ayahId", ayahId)
      formData.append("durationSeconds", (recordingTime / 10).toFixed(1))
      formData.append("dialect", selectedDialect)
      if (localeHint) {
        formData.append("localeHint", localeHint)
      }
      formData.append("substitutionThreshold", substitutionThreshold.toFixed(2))

      const response = await fetch("/api/transcribe", {
        method: "POST",
        body: formData,
      })

      if (response.status === 503) {
        alert(TRANSCRIPTION_UNAVAILABLE_MESSAGE)
        return
      }

      if (!response.ok) {
        throw new Error("Transcription failed")
      }

      const result = (await response.json()) as LiveSessionSummary
      setTranscriptionResult(result)
      setResultSource("server")
      onTranscriptionComplete?.(result)
    } catch (error) {
      console.error("Transcription error:", error)
      alert(
        error instanceof Error && error.message.includes("OpenAI")
          ? TRANSCRIPTION_UNAVAILABLE_MESSAGE
          : "Failed to transcribe audio. Please try again.",
      )
    } finally {
      setIsTranscribing(false)
    }
  }

  const submitRecitationFeedback = async () => {
    if (!transcriptionResult || !feedbackChoice) return

    setFeedbackStatus("submitting")
    setFeedbackError(null)

    try {
      const response = await fetch("/api/recitation-feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ayahId,
          dialect: transcriptionResult.dialect.code,
          detectionSource: transcriptionResult.dialect.source,
          isAccurate: feedbackChoice === "accurate",
          systemConfidence: transcriptionResult.confidence.overall,
          notes: feedbackNotes.trim() || undefined,
          correction: correctionText.trim() || undefined,
          mistakes: transcriptionResult.mistakes.map((mistake) => ({
            index: mistake.index,
            type: mistake.type,
            word: mistake.word,
            correct: mistake.correct,
            confidence: mistake.confidence,
            categories: mistake.categories,
          })),
          expectedText: transcriptionResult.expectedText,
          transcription: transcriptionResult.transcription,
        }),
      })

      if (!response.ok) {
        throw new Error("Feedback submission failed")
      }

      setFeedbackStatus("success")
    } catch (error) {
      console.error("Feedback submission error", error)
      setFeedbackError(error instanceof Error ? error.message : "Unable to submit feedback")
      setFeedbackStatus("error")
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const analyzedTranscript = (liveTranscript || interimTranscript).trim()

  useEffect(() => {
    if (!useOnDeviceAI || isRecording) {
      return
    }

    const transcriptToAnalyze = analyzedTranscript
    if (!transcriptToAnalyze || lastAnalyzedTranscriptRef.current === transcriptToAnalyze) {
      return
    }

    lastAnalyzedTranscriptRef.current = transcriptToAnalyze
    const durationSeconds = Number.isFinite(recordingTime) ? recordingTime / 10 : undefined
    const startedAt = typeof performance !== "undefined" ? performance.now() : Date.now()
    const baseSummary = createLiveSessionSummary(transcriptToAnalyze, expectedText, {
      durationSeconds: typeof durationSeconds === "number" ? Number(durationSeconds.toFixed(1)) : undefined,
      ayahId,
      dialect: selectedDialect,
      localeHint,
      substitutionThreshold,
    })
    const endedAt = typeof performance !== "undefined" ? performance.now() : Date.now()
    const latencyMs = Math.max(1, Math.round(endedAt - startedAt))

    const summary: LiveSessionSummary = {
      ...baseSummary,
        analysis: {
          ...baseSummary.analysis,
          engine: useOnDeviceAI ? "on-device" : baseSummary.analysis.engine,
          latencyMs,
          description: useOnDeviceAI
            ? "Browser speech recognition processed locally with sub-200ms responsiveness."
            : baseSummary.analysis.description,
          stack: useOnDeviceAI
            ? ["Web Speech API", "Device microphone", "Client recitation heuristics"]
            : baseSummary.analysis.stack,
        },
    }

    setTranscriptionResult(summary)
    setResultSource("browser")
    onTranscriptionComplete?.(summary)
  }, [
    useOnDeviceAI,
    isRecording,
    analyzedTranscript,
    recordingTime,
    expectedText,
    ayahId,
    onTranscriptionComplete,
    selectedDialect,
    localeHint,
    substitutionThreshold,
  ])

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-600"
    if (score >= 75) return "text-blue-600"
    if (score >= 60) return "text-yellow-600"
    return "text-red-600"
  }

  const getScoreBadgeColor = (score: number) => {
    if (score >= 90) return "bg-green-100 text-green-800"
    if (score >= 75) return "bg-blue-100 text-blue-800"
    if (score >= 60) return "bg-yellow-100 text-yellow-800"
    return "bg-red-100 text-red-800"
  }

  const getResultSourceBadge = () => {
    if (resultSource === "browser") return "bg-emerald-100 text-emerald-800"
    if (resultSource === "server") return "bg-indigo-100 text-indigo-800"
    return "bg-gray-100 text-gray-700"
  }

  const formatLatency = (latency: number | null | undefined) => {
    if (typeof latency !== "number" || Number.isNaN(latency) || latency <= 0) {
      return "—"
    }
    return `${Math.round(latency)} ms`
  }

  const getEngineLabel = (engine: LiveSessionSummary["analysis"]["engine"]) => {
    if (engine === "tarteel") {
      return "Tarteel recitation engine"
    }

    if (engine === "nvidia") {
      return "NVIDIA GPU pipeline"
    }

    return "On-device AI"
  }

  const getCategoryLabel = (category: MistakeCategory) =>
    MISTAKE_CATEGORY_META[category]?.label ?? category

  const getErrorTypeLabel = (type: string) => {
    if (type === "missing") return "Missing word"
    if (type === "extra") return "Extra word"
    if (type === "substitution") return "Incorrect word"
    return type
  }

  const lowConfidenceMistakes = useMemo(() => {
    if (!transcriptionResult) {
      return [] as LiveSessionSummary["mistakes"]
    }
    return transcriptionResult.mistakes.filter((mistake) => mistake.confidence < 75).slice(0, 3)
  }, [transcriptionResult])

  return (
    <div className="space-y-6">
      {/* Expected Text Display */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-lg text-maroon-800">Practice Text</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-right text-2xl leading-relaxed font-arabic p-4 bg-cream-50 rounded-lg">
            {expectedText}
          </div>
        </CardContent>
      </Card>

      {/* Recording Interface */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-lg text-maroon-800">Record Your Recitation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Live Transcript & AI Toggle */}
          <div className="rounded-lg border border-maroon-100 bg-cream-50 p-4 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium text-maroon-800">Live AI Transcript</p>
                <p className="text-xs text-gray-600">
                  {isVoiceAvailable
                    ? "Powered by on-device speech recognition. Works instantly on supported browsers."
                    : "Your browser does not support on-device speech recognition. Use server AI after recording."}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="use-on-device-ai"
                  checked={useOnDeviceAI}
                  onCheckedChange={(checked) => setUseOnDeviceAI(Boolean(checked))}
                  disabled={!isVoiceAvailable}
                />
                <Label htmlFor="use-on-device-ai" className="text-xs text-gray-600">
                  Enable on-device AI
                </Label>
              </div>
            </div>
            <div className="mt-3 min-h-[3.5rem] rounded-md border border-maroon-100 bg-white p-3 text-right text-lg font-arabic shadow-inner">
              {analyzedTranscript
                ? analyzedTranscript
                : voiceStatus === "listening"
                  ? "..."
                  : "Start recording to view the live transcript."}
          </div>
          {voiceError && <p className="mt-2 text-xs text-red-600">{voiceError}</p>}
        </div>

        {/* Dialect & phonetic settings */}
        <div className="grid gap-4 rounded-lg border border-blue-100 bg-blue-50/60 p-4 shadow-sm md:grid-cols-2">
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase text-blue-700">Dialect preference</Label>
            <Select value={selectedDialect} onValueChange={(value) => setSelectedDialect(value as "auto" | DialectCode)}>
              <SelectTrigger className="bg-white">
                <SelectValue placeholder="Auto-detect" />
              </SelectTrigger>
              <SelectContent>
                {dialectOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-[11px] text-blue-700">
              Current model: <span className="font-semibold">{currentDialectLabel}</span>
              {localeHint ? ` · Browser locale: ${localeHint}` : ""}
            </p>
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase text-blue-700">Pronunciation sensitivity</Label>
            <Slider
              value={substitutionSliderValue}
              min={55}
              max={95}
              step={1}
              onValueChange={(value) => setSubstitutionThreshold(value[0] / 100)}
            />
            <p className="text-[11px] text-blue-700">
              Threshold: <span className="font-semibold">{Math.round(substitutionThreshold * 100)}%</span>. Lower values allow more
              dialect variation before marking a word as incorrect.
            </p>
          </div>
        </div>

        {/* Waveform Visualization */}
        <div className="bg-gray-50 rounded-lg p-4">
          <canvas ref={canvasRef} width={400} height={100} className="w-full h-20 rounded" />
            {isRecording && (
              <div className="text-center mt-2">
                <Badge variant="secondary" className="bg-red-100 text-red-800">
                  Recording: {formatTime(Math.floor(recordingTime / 10))}
                </Badge>
              </div>
            )}
          </div>

          {/* Recording Controls */}
          <div className="flex items-center justify-center space-x-4">
            {!isRecording && !audioBlob && (
              <Button
                onClick={startRecording}
                className="bg-maroon-600 hover:bg-maroon-700 text-white px-8 py-3"
                size="lg"
              >
                <Mic className="w-5 h-5 mr-2" />
                Start Recording
              </Button>
            )}

            {isRecording && (
              <Button onClick={stopRecording} className="bg-red-600 hover:bg-red-700 text-white px-8 py-3" size="lg">
                <Square className="w-5 h-5 mr-2" />
                Stop Recording
              </Button>
            )}

            {audioBlob && !isRecording && (
              <div className="flex items-center space-x-3">
                <Button onClick={playRecording} variant="outline" className="bg-transparent">
                  {isPlaying ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
                  {isPlaying ? "Pause" : "Play"}
                </Button>

                <Button onClick={resetRecording} variant="outline" className="bg-transparent">
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Reset
                </Button>

                <Button
                  onClick={submitForTranscription}
                  disabled={isTranscribing}
                  className="bg-maroon-600 hover:bg-maroon-700 text-white"
                >
                  {isTranscribing ? (
                    <>
                      <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Get Feedback
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>

          {/* Audio Element */}
          {audioUrl && <audio ref={audioRef} src={audioUrl} onEnded={() => setIsPlaying(false)} className="hidden" />}
        </CardContent>
      </Card>

      {/* Transcription Results */}
      {transcriptionResult && (
        <Card className="border-border/50">
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <CardTitle className="text-lg text-maroon-800 flex items-center">
                <Award className="w-5 h-5 mr-2" />
                Recitation Feedback
              </CardTitle>
              {resultSource && (
                <Badge className={getResultSourceBadge()}>
                  {resultSource === "browser" ? "On-device AI" : "Server AI"}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Overall Score */}
            <div className="text-center">
              <div className={`text-4xl font-bold ${getScoreColor(transcriptionResult.feedback.overallScore)}`}>
                {transcriptionResult.feedback.overallScore}%
              </div>
              <Badge className={getScoreBadgeColor(transcriptionResult.feedback.overallScore)}>Overall Score</Badge>
            </div>

            {/* Detailed Scores */}
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-semibold text-maroon-700">{transcriptionResult.feedback.accuracy}%</div>
                <div className="text-sm text-gray-600">Accuracy</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-semibold text-maroon-700">
                  {transcriptionResult.feedback.timingScore}%
                </div>
                <div className="text-sm text-gray-600">Timing</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-semibold text-maroon-700">
                  {transcriptionResult.feedback.fluencyScore}%
                </div>
                <div className="text-sm text-gray-600">Fluency</div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2 rounded-lg border border-emerald-100 bg-emerald-50/60 p-4">
                <p className="text-xs font-semibold uppercase text-emerald-700">Detection confidence</p>
                <div className="flex items-baseline justify-between">
                  <span className="text-3xl font-bold text-emerald-700">
                    {transcriptionResult.confidence.overall}%
                  </span>
                  <Badge variant="secondary" className="bg-emerald-100 text-emerald-700">
                    {lowConfidenceMistakes.length} words flagged for review
                  </Badge>
                </div>
                <p className="text-xs text-emerald-800">
                  Average certainty combining phonetic and textual alignment.
                </p>
                {lowConfidenceMistakes.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-[11px] font-semibold uppercase text-emerald-700">Manual review suggested</p>
                    <ul className="space-y-1 text-xs text-emerald-800">
                      {lowConfidenceMistakes.map((mistake) => (
                        <li key={`${mistake.index}-${mistake.type}`} className="flex items-center justify-between">
                          <span className="font-semibold">{mistake.correct ?? mistake.word}</span>
                          <span>{mistake.confidence}%</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              <div className="space-y-2 rounded-lg border border-indigo-100 bg-indigo-50/60 p-4">
                <p className="text-xs font-semibold uppercase text-indigo-700">Dialect model in use</p>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-indigo-900">{transcriptionResult.dialect.label}</span>
                  <Badge variant="secondary" className="bg-indigo-100 text-indigo-700">
                    {transcriptionResult.dialect.detectionConfidence}% match
                  </Badge>
                </div>
                <p className="text-xs text-indigo-800">{transcriptionResult.dialect.description}</p>
                <p className="text-[11px] text-indigo-700">Source: {transcriptionResult.dialect.source}</p>
                {transcriptionResult.dialect.reasons.length > 0 && (
                  <ul className="list-disc space-y-1 pl-4 text-[11px] text-indigo-700">
                    {transcriptionResult.dialect.reasons.map((reason, index) => (
                      <li key={`${reason}-${index}`}>{reason}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            <div className="grid gap-4 rounded-lg border border-muted/60 bg-muted/30 p-4 md:grid-cols-2">
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase text-muted-foreground">Inference engine</p>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-maroon-900">
                    {getEngineLabel(transcriptionResult.analysis.engine)}
                  </span>
                  <Badge variant="outline" className="text-xs">
                    {formatLatency(transcriptionResult.analysis.latencyMs)} latency
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  {transcriptionResult.analysis.description}
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase text-muted-foreground">Optimised stack</p>
                <div className="flex flex-wrap gap-2">
                  {transcriptionResult.analysis.stack.map((layer) => (
                    <Badge key={layer} variant="secondary" className="bg-maroon-100 text-maroon-700">
                      {layer}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            {/* Hasanat Points */}
            <div className="bg-gradient-to-r from-gold-50 to-gold-100 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-gold-700">+{transcriptionResult.hasanatPoints} Hasanat</div>
              <div className="text-sm text-gold-600">
                {transcriptionResult.arabicLetterCount} Arabic letters × 10 ×{" "}
                {transcriptionResult.feedback.overallScore}%
              </div>
            </div>

            {voiceFeedback.isSupported && (
              <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50/60 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h4 className="font-semibold text-slate-800">Audio feedback playback</h4>
                  <Badge variant="secondary" className="bg-slate-100 text-slate-700">
                    {voiceFeedback.isSpeaking ? "Playing" : "Ready"}
                  </Badge>
                </div>
                <div className="grid gap-3 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label className="text-xs text-slate-600">Voice</Label>
                    <Select
                      value={voiceFeedback.preferences.voiceURI ?? "default"}
                      onValueChange={(value) => voiceFeedback.setVoice(value === "default" ? null : value)}
                    >
                      <SelectTrigger className="bg-white">
                        <SelectValue placeholder="Browser default" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="default">Browser default</SelectItem>
                        {voiceFeedback.voices.map((voice) => (
                          <SelectItem key={voice.voiceURI} value={voice.voiceURI}>
                            {voice.name} · {voice.lang}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs text-slate-600">Speed</Label>
                    <Slider
                      value={[voiceFeedback.preferences.rate]}
                      min={0.6}
                      max={1.6}
                      step={0.05}
                      onValueChange={(value) => voiceFeedback.setRate(value[0])}
                    />
                    <p className="text-[11px] text-slate-600">{voiceFeedback.preferences.rate.toFixed(2)}×</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs text-slate-600">Pitch</Label>
                    <Slider
                      value={[voiceFeedback.preferences.pitch]}
                      min={0.7}
                      max={1.4}
                      step={0.05}
                      onValueChange={(value) => voiceFeedback.setPitch(value[0])}
                    />
                    <p className="text-[11px] text-slate-600">{voiceFeedback.preferences.pitch.toFixed(2)}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" onClick={() => voiceFeedback.speak(transcriptionResult.expectedText)}>
                    Play expected verse
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => voiceFeedback.speak(transcriptionResult.feedback.feedback, { queue: false })}
                  >
                    Play feedback message
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() =>
                      voiceFeedback.speak(
                        `Confidence ${transcriptionResult.confidence.overall} percent with ${lowConfidenceMistakes.length} uncertain words.`,
                        { queue: false },
                      )
                    }
                  >
                    Play confidence summary
                  </Button>
                  <Button variant="ghost" onClick={voiceFeedback.cancel} className="text-slate-600">
                    Stop audio
                  </Button>
                </div>
                {voiceFeedback.voices.length === 0 && (
                  <p className="text-[11px] text-slate-600">
                    Additional voices become available when your browser has speech synthesis packs installed.
                  </p>
                )}
              </div>
            )}

            {/* Feedback Message */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-blue-800">{transcriptionResult.feedback.feedback}</p>
            </div>

            {transcriptionResult.mistakeBreakdown.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-semibold text-maroon-800">Mistake detection coverage</h4>
                <div className="grid gap-3 sm:grid-cols-2">
                  {transcriptionResult.mistakeBreakdown.map((entry) => (
                    <div
                      key={entry.category}
                      className="rounded-lg border border-maroon-100 bg-rose-50/70 p-3 shadow-sm"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-semibold text-maroon-900">{entry.label}</span>
                        <Badge variant="secondary" className="bg-maroon-100 text-maroon-700">
                          {entry.count}
                        </Badge>
                      </div>
                      <p className="mt-2 text-xs leading-relaxed text-maroon-700">{entry.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Errors Analysis */}
            {transcriptionResult.feedback.errors.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-semibold text-maroon-800">Areas for Improvement:</h4>
                <div className="space-y-2">
                  {transcriptionResult.feedback.errors.slice(0, 5).map((error, index) => (
                    <div
                      key={`${error.type}-${index}-${error.expected ?? ""}-${error.transcribed ?? ""}`}
                      className="space-y-2 rounded-lg border border-red-200 bg-red-50/70 p-3"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <Badge variant="outline" className="border-red-300 text-xs uppercase text-red-700">
                          {getErrorTypeLabel(error.type)}
                        </Badge>
                        {error.categories && error.categories.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {error.categories.map((category) => (
                              <Badge
                                key={`${category}-${index}`}
                                variant="secondary"
                                className="bg-white/80 text-[10px] font-semibold uppercase text-maroon-700"
                              >
                                {getCategoryLabel(category)}
                              </Badge>
                            ))}
                          </div>
                        )}
                        <Badge variant="outline" className="border-blue-200 text-xs text-blue-700">
                          Confidence {error.confidence}%
                        </Badge>
                      </div>
                      <p className="text-sm text-red-800">{error.message}</p>
                      {(error.expected || error.transcribed) && (
                        <div className="text-xs text-red-700">
                          {error.expected && (
                            <span className="mr-3">
                              Expected: <span className="font-semibold">{error.expected}</span>
                            </span>
                          )}
                          {error.transcribed && (
                            <span>
                              Spoken: <span className="font-semibold">{error.transcribed}</span>
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* User feedback */}
            <div className="space-y-3 rounded-lg border border-emerald-200 bg-emerald-50/70 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h4 className="font-semibold text-emerald-800">Help us improve this detector</h4>
                <Badge variant="secondary" className="bg-emerald-100 text-emerald-700">
                  Crowdsourced quality
                </Badge>
              </div>
              <p className="text-sm text-emerald-900">Was the automatic feedback accurate for this recitation?</p>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={feedbackChoice === "accurate" ? "default" : "outline"}
                  onClick={() => setFeedbackChoice("accurate")}
                >
                  Accurate
                </Button>
                <Button
                  variant={feedbackChoice === "inaccurate" ? "destructive" : "outline"}
                  onClick={() => setFeedbackChoice("inaccurate")}
                >
                  Needs review
                </Button>
              </div>
              {feedbackChoice && (
                <div className="space-y-3">
                  <Textarea
                    value={feedbackNotes}
                    onChange={(event) => setFeedbackNotes(event.target.value)}
                    placeholder="Optional: share context about the flagged mistakes."
                  />
                  <Textarea
                    value={correctionText}
                    onChange={(event) => setCorrectionText(event.target.value)}
                    placeholder="Optional: provide the correct wording you recited."
                  />
                  <div className="flex items-center gap-3">
                    <Button
                      onClick={submitRecitationFeedback}
                      disabled={isSubmittingFeedback || feedbackStatus === "success"}
                    >
                      {isSubmittingFeedback ? "Sending..." : "Send feedback"}
                    </Button>
                    {feedbackStatus === "success" && (
                      <span className="text-sm text-emerald-700">JazakAllahu khayran! Feedback logged.</span>
                    )}
                    {feedbackStatus === "error" && feedbackError && (
                      <span className="text-sm text-red-600">{feedbackError}</span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Transcription Comparison */}
            <div className="space-y-3">
              <h4 className="font-semibold text-maroon-800">Transcription Comparison:</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600">Expected:</Label>
                  <div className="text-right text-lg font-arabic p-3 bg-green-50 rounded border">
                    {transcriptionResult.expectedText}
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Your Recitation:</Label>
                  <div className="text-right text-lg font-arabic p-3 bg-blue-50 rounded border">
                    {transcriptionResult.transcription}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
