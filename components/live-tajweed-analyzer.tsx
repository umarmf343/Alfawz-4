"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Mic, Square, RotateCcw, AlertCircle, Sparkles } from "lucide-react"

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

type RecognitionInstance = SpeechRecognition & {
  start: () => void
  stop: () => void
  abort: () => void
}

declare global {
  interface Window {
    webkitSpeechRecognition?: typeof SpeechRecognition
  }
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
  const [isListening, setIsListening] = useState(false)
  const [hasActivated, setHasActivated] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSupported, setIsSupported] = useState(true)

  const recognitionRef = useRef<RecognitionInstance | null>(null)
  const shouldResumeRef = useRef(false)

  const expectedTokens = useMemo(() => buildTokens(verses), [verses])
  const normalizedTranscript = useMemo(() => normalizeArabic(transcript), [transcript])
  const recognizedTokens = useMemo(
    () => (normalizedTranscript.length > 0 ? normalizedTranscript.split(" ").filter(Boolean) : []),
    [normalizedTranscript],
  )

  const tokenStatuses: TokenStatus[] = useMemo(() => {
    if (expectedTokens.length === 0) return []
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

  useEffect(() => {
    if (typeof window === "undefined") {
      return
    }
    const RecognitionClass = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!RecognitionClass) {
      setIsSupported(false)
      return
    }

    const recognition = new RecognitionClass() as RecognitionInstance
    recognition.lang = "ar-SA"
    recognition.continuous = true
    recognition.interimResults = true
    recognition.maxAlternatives = 1

    recognition.onresult = (event) => {
      const value = Array.from(event.results)
        .map((result) => result[0]?.transcript ?? "")
        .join(" ")
      setTranscript(value.trim())
    }

    recognition.onstart = () => {
      setIsListening(true)
      setError(null)
    }

    recognition.onend = () => {
      setIsListening(false)
      if (shouldResumeRef.current) {
        setTimeout(() => {
          try {
            recognition.start()
          } catch (caught) {
            console.error("Failed to restart speech recognition", caught)
            setError("Speech recognition stopped unexpectedly. Try starting again.")
            shouldResumeRef.current = false
          }
        }, 350)
      }
    }

    recognition.onerror = (event) => {
      const message = event.error === "not-allowed"
        ? "Microphone permission denied. Allow access to use live analysis."
        : event.error === "no-speech"
          ? "No speech detected. Try speaking closer to the microphone."
          : "Speech recognition error occurred."
      setError(message)
      setIsListening(false)
    }

    recognitionRef.current = recognition

    return () => {
      shouldResumeRef.current = false
      recognition.stop()
      recognitionRef.current = null
    }
  }, [])

  const startListening = () => {
    if (!recognitionRef.current || isListening) {
      return
    }
    try {
      setTranscript("")
      setError(null)
      shouldResumeRef.current = true
      recognitionRef.current.start()
      setHasActivated(true)
    } catch (caught) {
      console.error("Unable to start speech recognition", caught)
      setError("Could not start live analysis. Ensure your microphone is available.")
      shouldResumeRef.current = false
    }
  }

  const stopListening = () => {
    if (!recognitionRef.current) {
      return
    }
    shouldResumeRef.current = false
    try {
      recognitionRef.current.stop()
    } catch (caught) {
      console.error("Unable to stop speech recognition", caught)
    }
  }

  const resetAnalysis = () => {
    setTranscript("")
  }

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

  const statusStyles: Record<TokenStatus, string> = {
    correct: "bg-emerald-100 text-emerald-800 border border-emerald-200",
    needs_attention: "bg-amber-100 text-amber-800 border border-amber-200",
    mistake: "bg-rose-100 text-rose-800 border border-rose-200",
    current: "bg-blue-100 text-blue-800 border border-blue-200",
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
            className={cn("text-xs", isListening ? "bg-emerald-600" : "bg-maroon-100 text-maroon-700")}
          >
            {isListening ? "Live" : "Standby"}
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
              Your browser does not support the Web Speech API required for live tajweed analysis. Please use a modern Chrome
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
                {transcript && (
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
          </>
        )}
      </CardContent>
    </Card>
  )
}
