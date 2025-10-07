"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import clsx from "clsx"
import { Amiri } from "next/font/google"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Switch } from "@/components/ui/switch"
import { CelebrationModal } from "@/components/CelebrationModal"
import { useMemorizationProgress } from "@/hooks/useMemorizationProgress"
import {
  type MemorizationClassSummary,
  type MemorizationPlanDTO,
  type StudentPlanProgressDTO,
} from "@/lib/memorization-api"
import { formatVerseReference, getVerseText } from "@/lib/quran-data"

const amiri = Amiri({ subsets: ["arabic"], weight: ["400", "700"], variable: "--font-amiri" })

function formatCadenceLabel(cadence: string): string {
  switch (cadence) {
    case "daily":
      return "Daily rhythm"
    case "weekday":
      return "Weekday flow"
    case "weekend":
      return "Weekend immersion"
    case "alternate":
      return "Alternate day pacing"
    default:
      return cadence.charAt(0).toUpperCase() + cadence.slice(1)
  }
}

function formatReminderTime(value: string): string {
  const [hoursPart, minutesPart] = value.split(":")
  const hours = Number.parseInt(hoursPart ?? "", 10)
  const minutes = Number.parseInt(minutesPart ?? "", 10)
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) {
    return value
  }
  const date = new Date()
  date.setHours(hours, minutes, 0, 0)
  return new Intl.DateTimeFormat("en", { hour: "numeric", minute: "2-digit" }).format(date)
}

interface MemorizationSessionProps {
  plan: MemorizationPlanDTO
  initialProgress: StudentPlanProgressDTO
  classes: MemorizationClassSummary[]
  teacherName?: string
}

const REPETITION_TARGET = 20

export function MemorizationSession({ plan, initialProgress, classes, teacherName }: MemorizationSessionProps) {
  const [tasbeehEnabled, setTasbeehEnabled] = useState(true)
  const {
    progress,
    isRepeating,
    isAdvancing,
    repetitionProgress,
    isVerseCelebrationOpen,
    setVerseCelebrationOpen,
    isCompletionOpen,
    setCompletionOpen,
    handleRepeat,
    handleAdvanceVerse,
  } = useMemorizationProgress({ plan, initialProgress })

  const totalVerses = plan.verseKeys.length
  const hasVerses = totalVerses > 0
  const safeIndex = hasVerses ? Math.min(progress.currentVerseIndex, totalVerses - 1) : 0
  const currentVerseKey = hasVerses ? plan.verseKeys[safeIndex] : ""
  const currentVerseText = useMemo(
    () => (hasVerses ? getVerseText(currentVerseKey) : ""),
    [currentVerseKey, hasVerses],
  )
  const verseReference = useMemo(
    () => (hasVerses ? formatVerseReference(currentVerseKey) : ""),
    [currentVerseKey, hasVerses],
  )
  const nextVerseKey = hasVerses ? plan.verseKeys[safeIndex + 1] : undefined
  const nextVerseReference = nextVerseKey ? formatVerseReference(nextVerseKey) : undefined

  const verseDisplayText = hasVerses
    ? currentVerseText
    : "Awaiting verses from your teacher."

  useEffect(() => {
    if (nextVerseKey) {
      getVerseText(nextVerseKey)
    }
  }, [nextVerseKey])

  const planProgressRatio = useMemo(() => {
    if (!hasVerses) return progress.completedAt ? 1 : 0
    if (progress.completedAt) return 1
    const completedVerses = progress.currentVerseIndex
    return Math.min((completedVerses + progress.repetitionsDone / REPETITION_TARGET) / totalVerses, 1)
  }, [hasVerses, progress.completedAt, progress.currentVerseIndex, progress.repetitionsDone, totalVerses])

  const audioContextRef = useRef<AudioContext | null>(null)
  const previousRepetitionRef = useRef(progress.repetitionsDone)

  const playTasbeehTone = useCallback(async () => {
    if (!tasbeehEnabled) return
    try {
      const extendedWindow = window as typeof window & { webkitAudioContext?: typeof AudioContext }
      const AudioContextClass = extendedWindow.AudioContext ?? extendedWindow.webkitAudioContext
      if (!AudioContextClass) return
      let ctx = audioContextRef.current
      if (!ctx) {
        ctx = new AudioContextClass()
        audioContextRef.current = ctx
      }
      if (ctx.state === "suspended") {
        await ctx.resume()
      }
      const now = ctx.currentTime
      const oscillator = ctx.createOscillator()
      oscillator.type = "sine"
      oscillator.frequency.setValueAtTime(620, now)

      const gain = ctx.createGain()
      gain.gain.setValueAtTime(0.0001, now)
      gain.gain.exponentialRampToValueAtTime(0.08, now + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.5)

      oscillator.connect(gain)
      gain.connect(ctx.destination)

      oscillator.start(now)
      oscillator.stop(now + 0.55)
    } catch (error) {
      console.error("tasbeeh audio error", error)
    }
  }, [tasbeehEnabled])

  useEffect(() => {
    return () => {
      if (audioContextRef.current) {
        void audioContextRef.current.close().catch(() => undefined)
        audioContextRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    if (!tasbeehEnabled) {
      previousRepetitionRef.current = progress.repetitionsDone
      return
    }
    if (progress.repetitionsDone > previousRepetitionRef.current) {
      void playTasbeehTone()
    }
    previousRepetitionRef.current = progress.repetitionsDone
  }, [playTasbeehTone, progress.repetitionsDone, tasbeehEnabled])

  useEffect(() => {
    const handleEnter = (event: KeyboardEvent) => {
      if (event.key === "Enter" && !event.repeat) {
        event.preventDefault()
        void handleRepeat()
      }
    }
    window.addEventListener("keydown", handleEnter)
    return () => window.removeEventListener("keydown", handleEnter)
  }, [handleRepeat])

  const isPlanComplete = Boolean(progress.completedAt)
  const personalPlanSettings = plan.personalPlanSettings
  const isPersonalPlan = Boolean(plan.createdByStudentId)
  const checkInLabel = personalPlanSettings
    ? personalPlanSettings.checkInDays
        .map((day) => day.charAt(0).toUpperCase() + day.slice(1))
        .join(" • ")
    : undefined
  const cadenceLabel = personalPlanSettings ? formatCadenceLabel(personalPlanSettings.cadence) : undefined
  const reminderLabel = personalPlanSettings?.reminderTime
    ? formatReminderTime(personalPlanSettings.reminderTime)
    : undefined
  const startDateLabel = personalPlanSettings?.startDate
    ? new Date(personalPlanSettings.startDate).toLocaleDateString()
    : undefined
  const verseNumber = hasVerses ? Math.min(progress.currentVerseIndex + 1, totalVerses) : 0
  const repetitionsRemaining = Math.max(REPETITION_TARGET - progress.repetitionsDone, 0)

  const updatedAt = progress.updatedAt ? new Date(progress.updatedAt) : null
  const hoursSinceUpdate = updatedAt ? (Date.now() - updatedAt.getTime()) / (1000 * 60 * 60) : 0
  const shouldNudge =
    hasVerses &&
    !isPlanComplete &&
    progress.repetitionsDone > 0 &&
    hoursSinceUpdate >= 18 &&
    !isVerseCelebrationOpen

  const primaryRepeatDisabled =
    !hasVerses || isPlanComplete || isRepeating || progress.repetitionsDone >= REPETITION_TARGET

  return (
    <div className="min-h-screen bg-amber-50/70 py-12">
      <div className="mx-auto flex max-w-4xl flex-col gap-8 px-6">
        <header className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h1 className="text-3xl font-semibold text-maroon-900">{plan.title}</h1>
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="bg-emerald-700 text-white">Memorization Plan</Badge>
              {isPersonalPlan && (
                <Badge className="bg-amber-200 text-amber-900">Self-paced focus</Badge>
              )}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-sm text-maroon-700">
            {teacherName && (
              <span>
                Guided by <span className="font-medium text-emerald-700">{teacherName}</span>
              </span>
            )}
            {!teacherName && isPersonalPlan && (
              <span>Self-guided journey</span>
            )}
            {classes.length > 0 && (
              <span>
                Circles: {classes.map((cls) => cls.name).join(", ")}
              </span>
            )}
            <span>{totalVerses} verses</span>
          </div>
          <Progress value={planProgressRatio * 100} className="h-2 bg-emerald-100" />
        </header>

        {shouldNudge && (
          <Alert className="border-amber-300 bg-amber-100/70 text-maroon-800">
            <AlertTitle>Gentle reminder</AlertTitle>
            <AlertDescription>
              Your heart is waiting for {verseReference}. Take a breath and let the words settle again.
            </AlertDescription>
          </Alert>
        )}

        <section className="rounded-3xl border border-amber-100 bg-white/90 p-8 shadow-xl">
          {!hasVerses ? (
            <div className="space-y-3 text-center text-maroon-700">
              <p className="text-lg font-medium">This plan has not been configured with verses yet.</p>
              <p className="text-sm text-maroon-600">
                Please let your teacher know so they can complete the assignment details.
              </p>
            </div>
          ) : (
            <>
              {!isPlanComplete && (
                <div className="mb-4 flex flex-wrap items-center justify-between gap-4 text-sm text-emerald-800">
                  <span>
                    Verse {verseNumber} of {totalVerses}
                  </span>
                  <span>{progress.repetitionsDone} / {REPETITION_TARGET} repetitions</span>
                </div>
              )}

              {!isPlanComplete && (
                <Progress value={repetitionProgress * 100} className="mb-6 h-3 bg-emerald-100" />
              )}

              <div
                dir="rtl"
                className={clsx(
                  "rounded-3xl bg-amber-100/70 p-8 text-right text-maroon-900 shadow-inner",
                  amiri.className,
                  "text-3xl leading-relaxed md:text-5xl",
                )}
                aria-live="polite"
              >
                <p>{verseDisplayText}</p>
              </div>

              <div className="mt-6 flex flex-wrap items-center justify-between gap-4 text-sm text-maroon-700">
                <div className="flex items-center gap-3">
                  <Switch checked={tasbeehEnabled} onCheckedChange={setTasbeehEnabled} id="tasbeeh-sound" />
                  <label htmlFor="tasbeeh-sound" className="cursor-pointer select-none">
                    Tasbeeh chime after each repetition
                  </label>
                </div>
                <span className="text-xs uppercase tracking-widest text-emerald-700">Press Enter to repeat</span>
              </div>

              <div className="mt-8 flex justify-center">
                <Button
                  type="button"
                  aria-label="Repeat verse aloud"
                  onClick={() => void handleRepeat()}
                  disabled={primaryRepeatDisabled}
                  className={clsx(
                    "rounded-full bg-emerald-600 px-12 py-6 text-lg font-semibold text-white shadow-lg transition-transform",
                    "focus-visible:ring-4 focus-visible:ring-emerald-400 focus-visible:ring-offset-2",
                    !primaryRepeatDisabled && "hover:bg-emerald-700",
                    !primaryRepeatDisabled && "animate-[pulse_3s_ease-in-out_infinite]",
                    primaryRepeatDisabled && "opacity-70",
                  )}
                >
                  {isRepeating ? "Saving..." : "Repeat"}
                </Button>
              </div>

              {!isPlanComplete && (
                <p className="mt-6 text-center text-sm text-emerald-800">
                  {repetitionsRemaining > 0
                    ? `${repetitionsRemaining} more repetitions to anchor this verse in your heart.`
                    : "Great job! Move forward with tranquility."}
                </p>
              )}

              {nextVerseReference && !isPlanComplete && (
                <div className="mt-6 rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4 text-sm text-emerald-800">
                  Next: {nextVerseReference}
                </div>
              )}
            </>
          )}
        </section>

        {personalPlanSettings && (
          <section className="rounded-3xl border border-emerald-100 bg-white/85 p-6 shadow-inner">
            <h2 className="text-base font-semibold text-emerald-900">Habit blueprint</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {cadenceLabel && (
                <div>
                  <p className="text-xs uppercase tracking-widest text-emerald-600">Cadence</p>
                  <p className="text-sm text-maroon-800">{cadenceLabel}</p>
                </div>
              )}
              {checkInLabel && (
                <div>
                  <p className="text-xs uppercase tracking-widest text-emerald-600">Check-in days</p>
                  <p className="text-sm text-maroon-800">{checkInLabel}</p>
                </div>
              )}
              {(personalPlanSettings.habitCue || reminderLabel) && (
                <div>
                  <p className="text-xs uppercase tracking-widest text-emerald-600">Anchor cue</p>
                  <p className="text-sm text-maroon-800">
                    {personalPlanSettings.habitCue ? personalPlanSettings.habitCue : "Bring the verse to life after your chosen moment."}
                  </p>
                </div>
              )}
              {reminderLabel && (
                <div>
                  <p className="text-xs uppercase tracking-widest text-emerald-600">Gentle reminder</p>
                  <p className="text-sm text-maroon-800">{reminderLabel}</p>
                </div>
              )}
              {startDateLabel && (
                <div>
                  <p className="text-xs uppercase tracking-widest text-emerald-600">Journey began</p>
                  <p className="text-sm text-maroon-800">{startDateLabel}</p>
                </div>
              )}
            </div>
            {personalPlanSettings.intention && (
              <p className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4 text-sm italic text-emerald-900">
                “{personalPlanSettings.intention}”
              </p>
            )}
          </section>
        )}

        {plan.notes && (
          <section className="rounded-3xl border border-emerald-100 bg-emerald-50/50 p-6 text-sm text-emerald-800 shadow-inner">
            <h2 className="mb-2 text-base font-semibold text-emerald-900">Teacher’s Reflection</h2>
            <p>{plan.notes}</p>
          </section>
        )}

        {isPlanComplete && (
          <section className="rounded-3xl border-2 border-emerald-600/50 bg-white/95 p-8 text-center shadow-2xl">
            <h2 className="text-2xl font-semibold text-emerald-700">BarakAllahu Feek!</h2>
            <p className="mt-2 text-maroon-700">
              You completed this journey on {progress.completedAt ? new Date(progress.completedAt).toLocaleDateString() : "today"}.
            </p>
            <p className="mt-2 text-sm text-emerald-800">
              Keep revising and share the light of these ayat with your loved ones.
            </p>
          </section>
        )}
      </div>

      <CelebrationModal
        open={isVerseCelebrationOpen}
        onOpenChange={setVerseCelebrationOpen}
        mode="verse"
        planTitle={plan.title}
        verseReference={hasVerses ? verseReference : undefined}
        onPrimaryAction={() => void handleAdvanceVerse()}
        primaryActionLabel={isAdvancing ? "Advancing..." : "Next Verse"}
      />

      <CelebrationModal
        open={isCompletionOpen}
        onOpenChange={setCompletionOpen}
        mode="plan"
        planTitle={plan.title}
        completionDate={progress.completedAt}
        primaryActionLabel="Alhamdulillah"
      />
    </div>
  )
}
