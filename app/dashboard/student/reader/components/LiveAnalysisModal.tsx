"use client"

import { useEffect, useMemo } from "react"
import { AlertCircle, Mic, PauseCircle, PlayCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

import {
  useLiveRecitation,
  type UseLiveRecitationOptions,
  type WordFeedback,
} from "../hooks/useLiveRecitation"

interface LiveAnalysisModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  expectedVerse: string
  verseReference?: string
  options?: UseLiveRecitationOptions
}

const statusCopy: Record<string, string> = {
  idle: "Idle",
  "requesting-permission": "Requesting microphone access",
  "permission-denied": "Microphone access denied",
  listening: "Listening…",
  processing: "Processing audio…",
  error: "An error occurred",
}

const statusTone: Record<string, string> = {
  idle: "text-slate-500",
  "requesting-permission": "text-amber-500",
  "permission-denied": "text-red-500",
  listening: "text-emerald-500",
  processing: "text-amber-500",
  error: "text-red-500",
}

function wordClassName(feedback: WordFeedback) {
  switch (feedback.status) {
    case "correct":
      return "underline decoration-emerald-500 decoration-4 underline-offset-4"
    case "incorrect":
      return "underline decoration-red-500 decoration-4 underline-offset-4"
    case "missing":
    default:
      return "underline decoration-red-500 decoration-4 underline-offset-4 opacity-80"
  }
}

function tooltipFor(feedback: WordFeedback) {
  if (feedback.status === "correct") {
    return "Pronunciation matches expected text"
  }
  if (feedback.status === "missing") {
    return "Expected word was not detected in the latest transcription"
  }
  if (!feedback.detected) {
    return undefined
  }
  return `Detected: "${feedback.detected}" → Expected: "${feedback.expected}"`
}

export function LiveAnalysisModal({
  open,
  onOpenChange,
  expectedVerse,
  verseReference,
  options,
}: LiveAnalysisModalProps) {
  const { start, stop, status, feedback, extras, error, permission, results } = useLiveRecitation(
    expectedVerse,
    options,
  )

  useEffect(() => {
    if (open) {
      start()
    } else {
      stop()
    }
    // stop recorder when unmounting modal
    return () => {
      stop()
    }
  }, [open, start, stop])

  const latestTranscription = useMemo(() => {
    if (results.length === 0) return ""
    return results[results.length - 1]?.text ?? ""
  }, [results])

  const canRetry = permission === "denied" || status === "permission-denied"

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mic className="h-5 w-5 text-emerald-500" aria-hidden />
            Live Qur’an Recitation Analysis
          </DialogTitle>
          <DialogDescription>
            Recite the current āyah clearly into your microphone. We will highlight any mispronunciations in
            real time using Whisper-powered analysis.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <section className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/40">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Live status</p>
                <p className={`text-base font-semibold ${statusTone[status] ?? "text-slate-500"}`}>
                  {statusCopy[status] ?? status}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {status === "listening" || status === "processing" ? (
                  <Badge variant="outline" className="border-emerald-500 text-emerald-600 dark:text-emerald-400">
                    <span className="mr-1 inline-flex h-2 w-2 animate-pulse rounded-full bg-emerald-500" aria-hidden />
                    Listening
                  </Badge>
                ) : (
                  <Badge variant="outline" className="border-slate-300 text-slate-500">
                    <span className="mr-1 inline-flex h-2 w-2 rounded-full bg-slate-400" aria-hidden />
                    Paused
                  </Badge>
                )}
                <Button
                  variant={status === "listening" || status === "processing" ? "destructive" : "secondary"}
                  size="sm"
                  onClick={() => {
                    if (status === "listening" || status === "processing") {
                      stop()
                    } else {
                      start()
                    }
                  }}
                >
                  {status === "listening" || status === "processing" ? (
                    <span className="flex items-center gap-1">
                      <PauseCircle className="h-4 w-4" />
                      Stop Analysis
                    </span>
                  ) : (
                    <span className="flex items-center gap-1">
                      <PlayCircle className="h-4 w-4" />
                      Retry
                    </span>
                  )}
                </Button>
              </div>
            </div>

            {error ? (
              <p className="mt-3 flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
                <AlertCircle className="h-4 w-4" />
                {error}
              </p>
            ) : null}

            {canRetry ? (
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                Please allow microphone access in your browser settings, then click <strong>Retry</strong>.
              </p>
            ) : null}
          </section>

          <section>
            <header className="mb-2 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">Expected āyah</p>
                {verseReference ? (
                  <p className="text-xs text-slate-500 dark:text-slate-400">{verseReference}</p>
                ) : null}
              </div>
            </header>
            <div className="rounded-lg border border-slate-200 bg-white p-4 text-xl leading-relaxed shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="flex flex-wrap gap-x-2 gap-y-3 text-right font-quran">
                {feedback.length > 0 ? (
                  feedback.map((word, index) => (
                    <span key={`${word.expected}-${index}`} className={wordClassName(word)} title={tooltipFor(word)}>
                      {word.expected}
                    </span>
                  ))
                ) : (
                  <span className="text-slate-400">Waiting for transcription…</span>
                )}
              </div>
            </div>
          </section>

          <section>
            <h3 className="mb-2 text-sm font-semibold text-slate-600 dark:text-slate-300">Latest transcription</h3>
            <div className="rounded-lg border border-slate-200 bg-white p-3 text-base dark:border-slate-800 dark:bg-slate-900">
              <ScrollArea className="max-h-24 text-right">
                <p className="leading-7 text-slate-700 dark:text-slate-200">
                  {latestTranscription || "No audio processed yet."}
                </p>
              </ScrollArea>
            </div>
          </section>

          {extras.length > 0 ? (
            <section>
              <h3 className="mb-2 text-sm font-semibold text-slate-600 dark:text-slate-300">Extra detected words</h3>
              <div className="flex flex-wrap gap-2">
                {extras.map((item, index) => (
                  <Badge key={`${item.word}-${index}`} variant="destructive" className="bg-red-500/10 text-red-600">
                    {item.word}
                  </Badge>
                ))}
              </div>
            </section>
          ) : null}

          <Separator />

          <section className="space-y-2 text-xs text-slate-500 dark:text-slate-400">
            <p>
              Audio is processed in short segments (≈{(options?.chunkDurationMs ?? 4000) / 1000}s). No recordings are stored; all
              analysis happens live during the session.
            </p>
            <p>
              For the best accuracy, recite in a quiet space and keep your device close. Whisper Small/Tiny models support Arabic
              phonetics but may require a few seconds to stabilise.
            </p>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  )
}

