"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Loader2, Mic, RotateCcw, Sparkles, Square } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Progress } from "@/components/ui/progress"

import { useSpeechRecognition } from "@/hooks/useSpeechRecognition"
import {
  ensureVerseIndex,
  findBestVerseMatches,
  type VerseMatch,
} from "@/lib/quranic-verse-recognition"
import { formatVerseReference } from "@/lib/quran-data"
import { cn } from "@/lib/utils"

interface VoiceRecognitionWidgetProps {
  className?: string
}

export function VoiceRecognitionWidget({ className }: VoiceRecognitionWidgetProps) {
  const [open, setOpen] = useState(false)
  const [sessionTranscript, setSessionTranscript] = useState("")
  const [matches, setMatches] = useState<VerseMatch[]>([])
  const [isIndexReady, setIsIndexReady] = useState(false)
  const [matchingError, setMatchingError] = useState<string | null>(null)
  const [controlError, setControlError] = useState<string | null>(null)

  const {
    start,
    stop,
    reset,
    isSupported,
    isListening,
    error: speechError,
    partialTranscript,
  } = useSpeechRecognition({
    lang: "ar-SA",
    interimResults: true,
    continuous: true,
    onResult: ({ transcript, isFinal }) => {
      if (isFinal) {
        setSessionTranscript((previous) => appendTranscript(previous, transcript))
      }
    },
  })

  const overallError = controlError ?? speechError

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen) {
        stop()
        reset()
        setSessionTranscript("")
        setMatches([])
        setMatchingError(null)
        setControlError(null)
      }
      setOpen(nextOpen)
    },
    [reset, stop],
  )

  const handleStart = useCallback(async () => {
    if (!isSupported) {
      setControlError("Speech recognition is not available in this browser.")
      return
    }
    try {
      setControlError(null)
      setMatchingError(null)
      setSessionTranscript("")
      setMatches([])
      reset()
      ensureVerseIndex()
      await start()
    } catch (caught) {
      const message =
        caught instanceof Error ? caught.message : "Unable to start voice recognition. Please try again."
      setControlError(message)
    }
  }, [isSupported, reset, start])

  const handleStop = useCallback(() => {
    stop()
  }, [stop])

  const handleClear = useCallback(() => {
    stop()
    reset()
    setSessionTranscript("")
    setMatches([])
    setMatchingError(null)
    setControlError(null)
  }, [reset, stop])

  useEffect(() => {
    if (!open) {
      return
    }
    try {
      ensureVerseIndex()
      setIsIndexReady(true)
    } catch (caught) {
      console.error("Failed to prepare verse index", caught)
      setMatchingError("We couldn't prepare the verse reference data. Please refresh and try again.")
    }
  }, [open])

  useEffect(() => {
    if (!sessionTranscript) {
      setMatches([])
      setMatchingError(null)
      return
    }
    try {
      const results = findBestVerseMatches(sessionTranscript, { limit: 5, threshold: 0.6 })
      setMatches(results)
      if (results.length === 0) {
        setMatchingError("We couldn't confidently match this recitation to a verse yet.")
      } else {
        setMatchingError(null)
      }
    } catch (caught) {
      console.error("Failed to analyse transcript", caught)
      setMatchingError("An error occurred while analysing the recitation.")
    }
  }, [sessionTranscript])

  useEffect(() => {
    return () => {
      stop()
      reset()
    }
  }, [reset, stop])

  const hasTranscript = sessionTranscript.trim().length > 0
  const livePreview = partialTranscript.trim()

  const bestMatch = useMemo(() => (matches.length > 0 ? matches[0] : null), [matches])

  return (
    <>
      <Button
        type="button"
        variant="secondary"
        className={cn(
          "inline-flex items-center gap-2 rounded-full border-maroon-200 bg-white/80 text-maroon-700 shadow",
          "hover:bg-white",
          className,
        )}
        onClick={() => setOpen(true)}
      >
        <Mic className="h-4 w-4" />
        Voice Recognition
      </Button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-maroon-900">
              <Mic className="h-5 w-5 text-emerald-500" />
              Quranic Voice Recognition
            </DialogTitle>
            <DialogDescription>
              Start listening, recite a verse aloud, and we will transcribe your recitation with the browser and match it to the
              closest Qur&apos;anic verse.
            </DialogDescription>
          </DialogHeader>

          {!isSupported && (
            <Alert variant="destructive">
              <AlertDescription>
                Your browser doesn&apos;t support the Web Speech API. Try Chrome on desktop for the best experience.
              </AlertDescription>
            </Alert>
          )}

          {overallError && (
            <Alert variant="destructive">
              <AlertDescription>{overallError}</AlertDescription>
            </Alert>
          )}

          {matchingError && !overallError && (
            <Alert className="border-amber-200 bg-amber-50 text-amber-800">
              <AlertDescription>{matchingError}</AlertDescription>
            </Alert>
          )}

          <div className="rounded-xl border border-maroon-100 bg-cream-50/80 p-4 shadow-inner">
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant="secondary" className="bg-emerald-100 text-emerald-700">
                {isListening ? "Listening" : "Ready"}
              </Badge>
              {bestMatch ? (
                <Badge variant="outline" className="border-emerald-400 bg-white text-emerald-600">
                  <Sparkles className="mr-1 h-3 w-3" /> Best match: {formatVerseReference(bestMatch.key)}
                </Badge>
              ) : null}
              {isIndexReady ? (
                <Badge variant="outline" className="border-maroon-200 text-maroon-600">
                  Verse index loaded
                </Badge>
              ) : (
                <Badge variant="outline" className="border-maroon-200 text-maroon-600">
                  Preparing verse index…
                </Badge>
              )}
            </div>

            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <Button
                type="button"
                className="inline-flex items-center gap-2 bg-emerald-600 text-white shadow"
                onClick={handleStart}
                disabled={isListening || !isSupported}
              >
                {isListening ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mic className="h-4 w-4" />}
                {isListening ? "Listening" : "Start listening"}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="inline-flex items-center gap-2"
                onClick={handleStop}
                disabled={!isListening}
              >
                <Square className="h-4 w-4" />
                Stop
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="inline-flex items-center gap-2 text-maroon-700"
                onClick={handleClear}
              >
                <RotateCcw className="h-4 w-4" />
                Clear session
              </Button>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-lg border border-maroon-100 bg-white/70 p-4">
                <p className="text-sm font-medium text-maroon-600">Live preview</p>
                <p className="mt-2 min-h-[3rem] text-right text-lg font-arabic text-maroon-800" dir="rtl">
                  {livePreview ? livePreview : isListening ? "Listening…" : "Start the microphone to see live words."}
                </p>
              </div>
              <div className="rounded-lg border border-maroon-100 bg-white/70 p-4">
                <p className="text-sm font-medium text-maroon-600">Captured transcript</p>
                <p className="mt-2 min-h-[3rem] text-right text-lg font-arabic text-maroon-800" dir="rtl">
                  {hasTranscript ? sessionTranscript : "No final transcript yet. Recite clearly to capture a verse."}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <h3 className="text-lg font-semibold text-maroon-900">Top verse matches</h3>
            <p className="text-sm text-maroon-600">
              We compare your transcript against every āyah in the Qur&apos;an, mirroring the original Quranic Verse Recognition
              tool.
            </p>
            <ScrollArea className="mt-4 h-72 rounded-xl border border-maroon-100 bg-white p-4">
              {matches.length === 0 ? (
                <div className="flex h-full items-center justify-center text-center text-sm text-maroon-500">
                  Recite an āyah to see the best matches here.
                </div>
              ) : (
                <div className="space-y-4">
                  {matches.map((match, index) => {
                    const confidence = Math.round(match.similarity * 100)
                    return (
                      <div
                        key={`${match.key}-${index}`}
                        className={cn(
                          "rounded-xl border border-maroon-100 bg-cream-50/80 p-4 shadow-sm",
                          index === 0 ? "ring-2 ring-emerald-400" : "",
                        )}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <p className="text-sm font-medium text-maroon-700">{formatVerseReference(match.key)}</p>
                            <p className="text-xs text-maroon-500">Confidence score</p>
                          </div>
                          <Badge
                            variant="secondary"
                            className={cn(
                              "bg-emerald-100 text-emerald-700",
                              index === 0 ? "border-emerald-400" : "border-emerald-200",
                            )}
                          >
                            {confidence}%
                          </Badge>
                        </div>
                        <div className="mt-3 text-right text-2xl font-arabic text-maroon-900" dir="rtl">
                          {match.text}
                        </div>
                        <Progress value={confidence} className="mt-4 h-2" />
                      </div>
                    )
                  })}
                </div>
              )}
            </ScrollArea>
          </div>

          <DialogFooter className="mt-4">
            <Button type="button" variant="secondary" onClick={() => handleOpenChange(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

function appendTranscript(previous: string, addition: string): string {
  const trimmedAddition = addition.trim()
  if (!trimmedAddition) {
    return previous
  }
  if (!previous) {
    return trimmedAddition
  }
  return `${previous} ${trimmedAddition}`.replace(/\s+/g, " ").trim()
}
