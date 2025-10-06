"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Loader2, Mic, Square, RotateCcw, AlertCircle, Sparkles } from "lucide-react"

import type { RecitationVerseRecord } from "@/lib/data/teacher-database"
import { cn } from "@/lib/utils"

interface LiveTajweedAnalyzerProps {
  surah: string
  ayahRange?: string
  verses: RecitationVerseRecord[]
}

type TokenStatus = "upcoming" | "current" | "correct" | "needs_attention" | "mistake"

type TokenDescriptor = {
  id: string
  ayah: number
  display: string
  normalized: string
}

type IssueDescriptor = {
  id: string
  ayah: number
  expected: string
  heard: string
  severity: Extract<TokenStatus, "needs_attention" | "mistake">
  hint: string
}

type LiveSummary = {
  transcription: string
  expectedText: string
  feedback: {
    overallScore: number
    accuracy: number
    timingScore: number
    fluencyScore: number
    feedback: string
    errors: { type: string; message: string; expected?: string; transcribed?: string }[]
  }
  hasanatPoints: number
  arabicLetterCount: number
  words?: { start: number; end: number; word: string }[]
  duration?: number
  ayahId?: string
}

const ARABIC_DIACRITICS = /[\u064B-\u065F\u0670]/g
const ARABIC_TATWEEL = /\u0640/g
const NON_ARABIC = /[^\u0621-\u064A\s]/g

function normalizeArabic(input: string): string {
  return input
    .replace(ARABIC_DIACRITICS, "")
    .replace(ARABIC_TATWEEL, "")
    .replace(NON_ARABIC, "")
    .replace(/\s+/g, " ")
    .trim()
}

function buildTokens(verses: RecitationVerseRecord[]): TokenDescriptor[] {
  return verses.flatMap((verse) => {
    const words = verse.arabic.split(/\s+/).filter(Boolean)
    return words.map((word, index) => ({
      id: `${verse.ayah}-${index}`,
      ayah: verse.ayah,
      display: word,
      normalized: normalizeArabic(word),
    }))
  })
}

function levenshtein(a: string, b: string): number {
  if (a === b) return 0
  if (!a.length) return b.length
  if (!b.length) return a.length

  const matrix: number[][] = Array.from({ length: a.length + 1 }, () => Array(b.length + 1).fill(0))

  for (let i = 0; i <= a.length; i++) {
    matrix[i][0] = i
  }
  for (let j = 0; j <= b.length; j++) {
    matrix[0][j] = j
  }

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost,
      )
    }
  }

  return matrix[a.length][b.length]
}

function similarity(a: string, b: string): number {
  if (!a && !b) return 1
  if (!a || !b) return 0
  const distance = levenshtein(a, b)
  const maxLength = Math.max(a.length, b.length) || 1
  return 1 - distance / maxLength
}

function buildHint(expected: string, heard: string, severity: IssueDescriptor["severity"]): string {
  if (/اللّه|اللَّه/i.test(expected)) {
    return "Preserve the fullness of the lafẓ al-jalālah — keep the heavy pronunciation when preceded by fatḥah or ḍammah."
  }
  if (/[ن|م].*ّ/.test(expected)) {
    return "Maintain a full ghunnah (nasalisation) on the doubled letter. Let the sound resonate for two counts."
  }
  if (/[ققططبجد]/.test(expected)) {
    return "Give the qalqalah letter a crisp bounce. Avoid letting it fade or merge with surrounding sounds."
  }
  if (/رَ|رُ|رّ/.test(expected)) {
    return "Ensure the rāʼ is pronounced with the correct heaviness (tafkhīm) — do not flatten the sound."
  }
  if (/يْ|وْ/.test(expected)) {
    return "Hold the madd letter for the full two counts so the elongation is clear."
  }
  if (severity === "needs_attention") {
    return "There is a slight drift from the written form. Soften the articulation and keep the makhārij precise."
  }
  if (heard) {
    return `The recogniser heard “${heard}”. Re-articulate to match the written word exactly and observe its tajweed rule.`
  }
  return "Re-articulate this word carefully, paying attention to its specific tajweed characteristics."
}

export function LiveTajweedAnalyzer({ surah, ayahRange, verses }: LiveTajweedAnalyzerProps) {
  const [transcript, setTranscript] = useState("")
  const [recognizedTokens, setRecognizedTokens] = useState<string[]>([])
  const [isListening, setIsListening] = useState(false)
  const [hasActivated, setHasActivated] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSupported, setIsSupported] = useState(true)
  const [isProcessingChunk, setIsProcessingChunk] = useState(false)
  const [isFinalizing, setIsFinalizing] = useState(false)
  const [finalSummary, setFinalSummary] = useState<LiveSummary | null>(null)

  const recorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const chunkQueueRef = useRef<Blob[]>([])
  const allChunksRef = useRef<Blob[]>([])
  const recognitionHistoryRef = useRef<string[]>([])
  const displayHistoryRef = useRef<string[]>([])
  const isProcessingRef = useRef(false)
  const recorderMimeTypeRef = useRef("audio/webm")
  const shouldFinalizeRef = useRef(false)

  const expectedTokens = useMemo(() => buildTokens(verses), [verses])
  const expectedFullText = useMemo(() => verses.map((verse) => verse.arabic).join(" "), [verses])
  const versesFingerprint = useMemo(
    () => verses.map((verse) => `${verse.ayah}:${verse.arabic}`).join("|"),
    [verses],
  )

  useEffect(() => {
    if (typeof window === "undefined") {
      return
    }
    const hasRecorder = typeof window.MediaRecorder !== "undefined"
    const hasMicrophone = !!navigator.mediaDevices?.getUserMedia
    setIsSupported(hasRecorder && hasMicrophone)
  }, [])

  useEffect(() => {
    recognitionHistoryRef.current = []
    displayHistoryRef.current = []
    chunkQueueRef.current = []
    allChunksRef.current = []
    setTranscript("")
    setRecognizedTokens([])
    setFinalSummary(null)
    setHasActivated(false)
  }, [versesFingerprint])

  const cleanupStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
  }, [])

  useEffect(() => {
    return () => {
      shouldFinalizeRef.current = false
      if (recorderRef.current && recorderRef.current.state !== "inactive") {
        try {
          recorderRef.current.stop()
        } catch (caught) {
          console.error("Failed to stop recorder on cleanup", caught)
        }
      }
      cleanupStream()
    }
  }, [cleanupStream])

  const updateTranscriptFromChunk = useCallback((chunkText: string) => {
    const rawTokens = chunkText.split(/\s+/).filter(Boolean)
    if (rawTokens.length === 0) {
      return
    }

    const zipped = rawTokens
      .map((raw) => ({ raw, normalized: normalizeArabic(raw) }))
      .filter((entry) => entry.normalized.length > 0)

    if (zipped.length === 0) {
      return
    }

    const history = recognitionHistoryRef.current
    const newNormalized = zipped.map((entry) => entry.normalized)
    let overlap = Math.min(history.length, newNormalized.length)

    while (overlap > 0) {
      const historySuffix = history.slice(history.length - overlap).join(" ")
      const chunkPrefix = newNormalized.slice(0, overlap).join(" ")
      if (historySuffix === chunkPrefix) {
        break
      }
      overlap--
    }

    const entriesToAdd = zipped.slice(overlap)
    if (entriesToAdd.length === 0) {
      return
    }

    recognitionHistoryRef.current = [...history, ...entriesToAdd.map((entry) => entry.normalized)]
    displayHistoryRef.current = [...displayHistoryRef.current, ...entriesToAdd.map((entry) => entry.raw)]
    setRecognizedTokens([...recognitionHistoryRef.current])
    setTranscript(displayHistoryRef.current.join(" "))
  }, [])

  const processQueue = useCallback(async () => {
    if (isProcessingRef.current) {
      return
    }
    const nextChunk = chunkQueueRef.current.shift()
    if (!nextChunk) {
      return
    }

    isProcessingRef.current = true
    setIsProcessingChunk(true)

    try {
      const chunkType = (nextChunk as Blob).type || recorderMimeTypeRef.current || "audio/webm"
      const chunkFile = new File([nextChunk], `live-chunk-${Date.now()}.webm`, { type: chunkType })
      const formData = new FormData()
      formData.append("audio", chunkFile)
      formData.append("mode", "live")

      const response = await fetch("/api/transcribe", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error(`Live transcription failed with status ${response.status}`)
      }

      const result = (await response.json()) as { transcription?: string }
      if (typeof result.transcription === "string" && result.transcription.trim().length > 0) {
        updateTranscriptFromChunk(result.transcription)
      }
    } catch (caught) {
      console.error("Live chunk transcription failed", caught)
      setError("Live transcription encountered an error on a segment. We\'re still recording — you can continue reciting.")
    } finally {
      isProcessingRef.current = false
      setIsProcessingChunk(false)
      if (chunkQueueRef.current.length > 0) {
        setTimeout(() => {
          void processQueue()
        }, 150)
      }
    }
  }, [updateTranscriptFromChunk])
  const finalizeAnalysis = useCallback(
    async (audioBlob: Blob) => {
      if (!expectedFullText) {
        return
      }

      setIsFinalizing(true)
      try {
        const fileType = audioBlob.type || recorderMimeTypeRef.current || "audio/webm"
        const file = new File([audioBlob], "live-session.webm", { type: fileType })
        const formData = new FormData()
        formData.append("audio", file)
        formData.append("expectedText", expectedFullText)
        formData.append("ayahId", "live-session")

        const response = await fetch("/api/transcribe", {
          method: "POST",
          body: formData,
        })

        if (!response.ok) {
          throw new Error(`Failed to finalise analysis: ${response.status}`)
        }

        const result = (await response.json()) as LiveSummary
        setFinalSummary(result)
        if (typeof result.transcription === "string" && result.transcription.trim().length > 0) {
          updateTranscriptFromChunk(result.transcription)
        }
      } catch (caught) {
        console.error("Failed to finalise live tajweed analysis", caught)
        setError("We couldn't generate the final tajweed summary. You can record another attempt and try again.")
      } finally {
        setIsFinalizing(false)
        allChunksRef.current = []
      }
    },
    [expectedFullText, updateTranscriptFromChunk],
  )

  const startListening = useCallback(async () => {
    if (isListening) {
      return
    }

    if (!isSupported) {
      setError("Your browser does not support live tajweed analysis. Please try a modern Chromium-based browser.")
      return
    }

    if (expectedTokens.length === 0) {
      setError("No verses are available for live analysis. Ask your teacher to assign text with verse details.")
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        },
      })

      streamRef.current = stream
      const recorder = new MediaRecorder(stream, {
        mimeType: "audio/webm;codecs=opus",
      })

      recorderMimeTypeRef.current = recorder.mimeType || "audio/webm"
      recorderRef.current = recorder
      chunkQueueRef.current = []
      allChunksRef.current = []
      recognitionHistoryRef.current = []
      displayHistoryRef.current = []
      setRecognizedTokens([])
      setTranscript("")
      setFinalSummary(null)
      setError(null)
      setHasActivated(true)

      recorder.onstart = () => {
        shouldFinalizeRef.current = false
        setIsListening(true)
      }

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          chunkQueueRef.current.push(event.data)
          allChunksRef.current.push(event.data)
          if (chunkQueueRef.current.length > 4) {
            chunkQueueRef.current.splice(0, chunkQueueRef.current.length - 4)
          }
          void processQueue()
        }
      }

      recorder.onstop = () => {
        setIsListening(false)
        cleanupStream()
        recorderRef.current = null
        const shouldFinalize = shouldFinalizeRef.current
        shouldFinalizeRef.current = false
        if (shouldFinalize && allChunksRef.current.length > 0) {
          const finalBlob = new Blob(allChunksRef.current, {
            type: recorderMimeTypeRef.current || "audio/webm",
          })
          void finalizeAnalysis(finalBlob)
        }
      }

      recorder.onerror = (event) => {
        console.error("Recorder error", event)
        setError("Live analysis encountered a recording error. Try restarting the session.")
        setIsListening(false)
        cleanupStream()
      }

      recorder.start(4000)
    } catch (caught) {
      console.error("Unable to access microphone for live analysis", caught)
      setError("Could not access the microphone. Check your permissions and try again.")
      cleanupStream()
    }
  }, [cleanupStream, expectedTokens.length, finalizeAnalysis, isListening, isSupported, processQueue])

  const stopListening = useCallback(() => {
    if (!recorderRef.current) {
      return
    }
    shouldFinalizeRef.current = true
    try {
      if (recorderRef.current.state !== "inactive") {
        recorderRef.current.stop()
      }
    } catch (caught) {
      console.error("Unable to stop live recorder", caught)
      cleanupStream()
    }
  }, [cleanupStream])

  const resetAnalysis = () => {
    recognitionHistoryRef.current = []
    displayHistoryRef.current = []
    chunkQueueRef.current = []
    allChunksRef.current = []
    setRecognizedTokens([])
    setTranscript("")
    setFinalSummary(null)
    setError(null)
    if (!isListening) {
      setHasActivated(false)
    }
  }

  const tokenStatuses: TokenStatus[] = useMemo(() => {
    if (expectedTokens.length === 0) {
      return []
    }
    return expectedTokens.map((token, index) => {
      const heard = recognizedTokens[index]
      if (heard == null) {
        return index === recognizedTokens.length && isListening ? "current" : "upcoming"
      }
      if (heard === token.normalized) {
        return "correct"
      }
      const score = similarity(heard, token.normalized)
      if (score >= 0.88) {
        return "correct"
      }
      if (score >= 0.7) {
        return "needs_attention"
      }
      return "mistake"
    })
  }, [expectedTokens, recognizedTokens, isListening])

  const correctCount = useMemo(
    () => tokenStatuses.filter((status) => status === "correct").length,
    [tokenStatuses],
  )

  const progress = expectedTokens.length > 0 ? Math.round((correctCount / expectedTokens.length) * 100) : 0
  const extraTokens = Math.max(recognizedTokens.length - expectedTokens.length, 0)

  const groupedTokens = useMemo(() => {
    const buckets = new Map<number, (TokenDescriptor & { status: TokenStatus })[]>()
    expectedTokens.forEach((token, index) => {
      const status = tokenStatuses[index]
      if (!buckets.has(token.ayah)) {
        buckets.set(token.ayah, [])
      }
      buckets.get(token.ayah)?.push({ ...token, status })
    })
    return Array.from(buckets.entries()).sort((a, b) => a[0] - b[0])
  }, [expectedTokens, tokenStatuses])

  const analysisIssues: IssueDescriptor[] = useMemo(() => {
    return expectedTokens.flatMap((token, index) => {
      const status = tokenStatuses[index]
      if (status !== "needs_attention" && status !== "mistake") {
        return []
      }
      const heard = recognizedTokens[index] ?? ""
      return [
        {
          id: token.id,
          ayah: token.ayah,
          expected: token.display,
          heard,
          severity: status,
          hint: buildHint(token.display, heard, status),
        },
      ]
    })
  }, [expectedTokens, tokenStatuses, recognizedTokens])

  const ayahSummary = useMemo(() => {
    if (verses.length === 0) return ""
    const first = verses[0]?.ayah
    const last = verses[verses.length - 1]?.ayah
    if (first == null || last == null) return ""
    if (first === last) {
      return `Ayah ${first}`
    }
    return `Ayahs ${first}-${last}`
  }, [verses])

  const statusBadgeLabel = isListening
    ? isProcessingChunk
      ? "Live • analysing"
      : "Live"
    : isFinalizing
      ? "Summarising"
      : "Standby"

  const statusBadgeClass = isListening
    ? isProcessingChunk
      ? "bg-emerald-600 animate-pulse"
      : "bg-emerald-600"
    : isFinalizing
      ? "bg-maroon-600 text-white"
      : "bg-maroon-100 text-maroon-700"

  const statusStyles: Record<TokenStatus, string> = {
    correct: "bg-emerald-100 text-emerald-800 border border-emerald-200",
    needs_attention: "bg-amber-100 text-amber-800 border border-amber-200",
    mistake: "bg-rose-100 text-rose-800 border border-rose-200",
    current: "bg-maroon-100 text-maroon-800 border border-maroon-200",
    upcoming: "text-gray-500 border border-dashed border-gray-300",
  }

  return (
    <Card className="border-maroon-100 shadow-sm">
      <CardHeader className="space-y-1.5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle className="text-lg flex items-center gap-2 text-maroon-900">
            <Sparkles className="w-5 h-5 text-maroon-600" /> Live Tajweed Analyzer
          </CardTitle>
          <Badge
            variant={isListening ? "default" : "secondary"}
            className={cn("text-xs", statusBadgeClass)}
          >
            {statusBadgeLabel}
          </Badge>
        </div>
        <p className="text-sm text-gray-600">
          Real-time tajweed feedback for Surah {surah}
          {ayahRange ? ` • ${ayahRange}` : ayahSummary ? ` • ${ayahSummary}` : ""}
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {!isSupported ? (
          <Alert>
            <AlertCircle className="w-4 h-4" />
            <AlertTitle className="text-sm font-semibold">Browser not supported</AlertTitle>
            <AlertDescription className="text-xs text-muted-foreground">
              Your browser does not support the MediaRecorder API required for live tajweed analysis. Please use a modern Chrome
              or Edge browser.
            </AlertDescription>
          </Alert>
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-maroon-900">Ready when you are</p>
                <p className="text-xs text-gray-600">{verses.length} verse{verses.length === 1 ? "" : "s"} loaded for analysis.</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary" className="text-xs bg-emerald-50 text-emerald-700">
                  {progress}% precise
                </Badge>
                {(transcript || finalSummary) && (
                  <Button variant="ghost" size="sm" onClick={resetAnalysis} className="text-gray-600 hover:text-maroon-700">
                    <RotateCcw className="w-4 h-4 mr-1" /> Reset
                  </Button>
                )}
                <Button
                  onClick={isListening ? stopListening : startListening}
                  className={cn(
                    "px-4",
                    isListening
                      ? "bg-red-600 hover:bg-red-700 text-white"
                      : "bg-gradient-to-r from-maroon-600 to-maroon-700 text-white border-0",
                  )}
                >
                  {isListening ? <Square className="w-4 h-4 mr-2" /> : <Mic className="w-4 h-4 mr-2" />}
                  {isListening ? "Stop" : "Begin Analysis"}
                </Button>
              </div>
            </div>

            {error && (
              <Alert className="border-amber-200 bg-amber-50/80 text-amber-800">
                <AlertCircle className="w-4 h-4" />
                <AlertTitle className="text-sm font-semibold">Microphone alert</AlertTitle>
                <AlertDescription className="text-xs">{error}</AlertDescription>
              </Alert>
            )}

            {expectedTokens.length === 0 ? (
              <div className="rounded-lg border border-dashed border-gray-300 bg-white/70 p-4 text-sm text-gray-600">
                No verses available for live analysis. Ask your teacher to assign a recitation with verse text.
              </div>
            ) : hasActivated ? (
              <div className="space-y-4">
                <div className="rounded-xl border border-maroon-100 bg-cream-50/80 p-4 shadow-inner" dir="rtl">
                  <div className="flex flex-col gap-4">
                    {groupedTokens.map(([ayah, tokens]) => (
                      <div key={ayah} className="space-y-2">
                        <div className="flex items-center justify-between text-xs text-gray-600" dir="ltr">
                          <span>Ayah {ayah}</span>
                          <span>
                            {tokens.filter((token) => token.status === "correct").length}/{tokens.length} accurate
                          </span>
                        </div>
                        <div className="flex flex-wrap-reverse gap-2 justify-end">
                          {tokens.map((token) => (
                            <span
                              key={token.id}
                              className={cn(
                                "inline-flex items-center rounded-full px-3 py-1 text-base font-arabic transition-colors",
                                statusStyles[token.status],
                              )}
                            >
                              {token.display}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Progress value={progress} className="h-2" />
                  <div className="flex flex-wrap items-center gap-3 text-xs text-gray-600">
                    <span>
                      {correctCount} of {expectedTokens.length} words matched
                    </span>
                    <span>
                      {analysisIssues.length} tajweed cue{analysisIssues.length === 1 ? "" : "s"} detected
                    </span>
                    {extraTokens > 0 && (
                      <Badge variant="outline" className="text-xs border-amber-300 text-amber-700">
                        {extraTokens} extra word{extraTokens === 1 ? "" : "s"} detected
                      </Badge>
                    )}
                    {isProcessingChunk && (
                      <Badge variant="outline" className="text-xs border-blue-300 text-blue-700">
                        <Loader2 className="w-3 h-3 mr-1 animate-spin" /> syncing audio
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-maroon-900 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-500" /> Tajweed cues
                  </h4>
                  {analysisIssues.length > 0 ? (
                    <div className="space-y-3">
                      {analysisIssues.map((issue) => (
                        <div
                          key={issue.id}
                          className={cn(
                            "rounded-lg border p-3",
                            issue.severity === "mistake"
                              ? "border-rose-200 bg-rose-50/80"
                              : "border-amber-200 bg-amber-50/80",
                          )}
                        >
                          <div className="flex items-center justify-between text-xs text-gray-600" dir="ltr">
                            <span>Ayah {issue.ayah}</span>
                            <Badge
                              variant="secondary"
                              className={cn(
                                "text-xs",
                                issue.severity === "mistake"
                                  ? "bg-rose-100 text-rose-700"
                                  : "bg-amber-100 text-amber-700",
                              )}
                            >
                              {issue.severity === "mistake" ? "Needs correction" : "Refine"}
                            </Badge>
                          </div>
                          <p className="mt-2 text-base font-arabic text-maroon-900" dir="rtl">
                            {issue.expected}
                          </p>
                          <p className="mt-1 text-xs text-gray-600" dir="ltr">
                            Heard: {issue.heard ? issue.heard : "—"}
                          </p>
                          <p className="mt-2 text-xs text-maroon-700 leading-relaxed">{issue.hint}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-lg border border-emerald-200 bg-emerald-50/70 p-3 text-sm text-emerald-700">
                      No tajweed deviations detected so far. Keep the beautiful recitation flowing.
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-maroon-200 bg-white/70 p-4 text-sm text-maroon-700">
                Start the live analysis to stream the Qur&apos;an text you recite and highlight tajweed feedback in real time.
              </div>
            )}

            {transcript && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-gray-600">Recognizer transcript</p>
                <div className="rounded-lg border border-gray-200 bg-white p-3 text-sm" dir="rtl">
                  {transcript}
                </div>
              </div>
            )}

            {(isFinalizing || finalSummary) && (
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h4 className="text-sm font-semibold text-maroon-900 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-maroon-600" /> Session summary
                  </h4>
                  {isFinalizing && (
                    <Badge variant="outline" className="text-xs border-blue-300 text-blue-700">
                      <Loader2 className="w-3 h-3 mr-1 animate-spin" /> Processing
                    </Badge>
                  )}
                </div>
                {finalSummary ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="rounded-lg border border-emerald-200 bg-emerald-50/70 p-4 text-center">
                        <p className="text-xs uppercase tracking-wide text-emerald-700">Overall</p>
                        <p className="text-3xl font-bold text-emerald-700">{finalSummary.feedback.overallScore}%</p>
                        <p className="text-xs text-emerald-700">Composite precision</p>
                      </div>
                      <div className="rounded-lg border border-maroon-200 bg-cream-50 p-4 text-center">
                        <p className="text-xs uppercase tracking-wide text-maroon-700">Accuracy</p>
                        <p className="text-2xl font-semibold text-maroon-800">{finalSummary.feedback.accuracy}%</p>
                        <p className="text-xs text-maroon-600">Word alignment</p>
                      </div>
                      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-center">
                        <p className="text-xs uppercase tracking-wide text-blue-700">Fluency</p>
                        <p className="text-2xl font-semibold text-blue-700">{finalSummary.feedback.fluencyScore}%</p>
                        <p className="text-xs text-blue-600">Cadence &amp; pacing</p>
                      </div>
                    </div>

                    <div className="rounded-lg border border-gold-200 bg-gold-50/80 p-4 text-center">
                      <p className="text-xs uppercase tracking-wide text-gold-700">Hasanat earned</p>
                      <p className="text-3xl font-bold text-gold-700">+{finalSummary.hasanatPoints}</p>
                      <p className="text-xs text-gold-700">{finalSummary.arabicLetterCount} letters × 10 × accuracy</p>
                    </div>

                    <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
                      {finalSummary.feedback.feedback}
                    </div>

                    {finalSummary.feedback.errors?.length > 0 && (
                      <div className="space-y-2">
                        <h5 className="text-xs font-semibold uppercase tracking-wide text-maroon-700">
                          Priority corrections
                        </h5>
                        <div className="space-y-2">
                          {finalSummary.feedback.errors.slice(0, 5).map((issue, index) => (
                            <div key={`${issue.type}-${index}`} className="rounded-md border border-amber-200 bg-amber-50/80 p-3 text-xs">
                              <p className="font-semibold text-maroon-800 capitalize">{issue.type}</p>
                              <p className="text-maroon-700 mt-1">{issue.message}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs font-medium text-gray-600">Expected passage</p>
                        <div className="rounded-lg border border-gray-200 bg-white p-3 text-sm font-arabic" dir="rtl">
                          {finalSummary.expectedText}
                        </div>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-600">Your recitation</p>
                        <div className="rounded-lg border border-gray-200 bg-white p-3 text-sm font-arabic" dir="rtl">
                          {finalSummary.transcription}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-lg border border-dashed border-gray-300 bg-white/70 p-4 text-sm text-gray-600">
                    Whisper is compiling the detailed tajweed summary for this session.
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
