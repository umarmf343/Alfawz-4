"use client"

import { useMemo, useState, useTransition } from "react"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { Toggle } from "@/components/ui/toggle"
import { useToast } from "@/components/ui/use-toast"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  type CreatePersonalPlanPayload,
  type StudentMemorizationPlanContextDTO,
  createPersonalMemorizationPlan,
  setActiveMemorizationPlan,
} from "@/lib/memorization-api"
import { formatVerseReference } from "@/lib/quran-data"
import {
  expandVerseRange,
  getSurahOptions,
  normalizeVerseKey,
  validateVerseKeys,
} from "@/lib/verse-validator"
import { cn } from "@/lib/utils"
import { BookOpenCheck, Flame, MoonStar, Sparkles, SunMedium, Target } from "lucide-react"

interface StudentMemorizationDashboardProps {
  initialPlans: StudentMemorizationPlanContextDTO[]
  nudgeMessage?: string
  initialActivePlanId?: string
}

interface PersonalTemplate {
  id: string
  title: string
  description: string
  verseKeys: string[]
  badge?: string
  isCustom?: boolean
}

const cadenceOptions = [
  { value: "daily", title: "Daily", description: "Anchor every day with sacred repetition." },
  { value: "weekday", title: "Weekdays", description: "Keep momentum through the school week." },
  { value: "alternate", title: "Alternate days", description: "A steady, reflective rhythm." },
  { value: "weekend", title: "Weekends", description: "Deep focus during unhurried mornings." },
]

const anchorSuggestions = [
  { value: "after-fajr", label: "After Fajr", icon: SunMedium },
  { value: "after-maghrib", label: "After Maghrib", icon: MoonStar },
  { value: "study-break", label: "Study break reset", icon: BookOpenCheck },
]

const dayOptions = [
  { value: "monday", label: "Mon" },
  { value: "tuesday", label: "Tue" },
  { value: "wednesday", label: "Wed" },
  { value: "thursday", label: "Thu" },
  { value: "friday", label: "Fri" },
  { value: "saturday", label: "Sat" },
  { value: "sunday", label: "Sun" },
]

const templates: PersonalTemplate[] = [
  {
    id: "heart-softener",
    title: "Heart Softener",
    description: "Short surahs that calm and center your day.",
    verseKeys: [
      ...expandVerseRange(112, 1, 4),
      ...expandVerseRange(113, 1, 5),
      ...expandVerseRange(114, 1, 6),
    ],
    badge: "Morning glow",
  },
  {
    id: "fortress",
    title: "Fortress of Light",
    description: "Protective ayat for resilience and courage.",
    verseKeys: ["2:255", ...expandVerseRange(59, 22, 24)],
    badge: "Evening review",
  },
  {
    id: "custom-selection",
    title: "Personal selection",
    description: "Handpick a surah and ayat range that speak to you.",
    verseKeys: [],
    badge: "Your choice",
    isCustom: true,
  },
]

const anchorDescriptions: Record<string, string> = {
  "after-fajr": "Let the dawn prayer flow straight into your hifz.",
  "after-maghrib": "Wind down the day with a tranquil recitation circle.",
  "study-break": "Use a study pause to refresh with memorization.",
}

const reminderDefaults: Record<string, string> = {
  "after-fajr": "05:30",
  "after-maghrib": "18:45",
  "study-break": "14:00",
}

const surahOptions = getSurahOptions()

const customTemplateId = templates.find((template) => template.isCustom)?.id ?? null

function formatReminderLabel(anchor: string): string {
  const time = reminderDefaults[anchor]
  const description = anchorDescriptions[anchor]
  if (!time) {
    return description ?? "Reminders enabled"
  }
  const [hourString, minuteString] = time.split(":")
  const hour = Number.parseInt(hourString ?? "", 10)
  const minute = Number.parseInt(minuteString ?? "", 10)
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) {
    return description ?? "Reminders enabled"
  }
  const date = new Date()
  date.setHours(hour, minute, 0, 0)
  const formattedTime = new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  }).format(date)
  return description ? `${description} • ${formattedTime}` : `Reminder at ${formattedTime}`
}

function uniqueVerseKeys(keys: string[]): string[] {
  const seen = new Set<string>()
  const ordered: string[] = []
  keys.forEach((key) => {
    const normalized = normalizeVerseKey(key)
    if (normalized && !seen.has(normalized)) {
      seen.add(normalized)
      ordered.push(normalized)
    }
  })
  return ordered
}

export function StudentMemorizationDashboard({
  initialPlans,
  nudgeMessage,
  initialActivePlanId,
}: StudentMemorizationDashboardProps) {
  const { toast } = useToast()
  const [plans, setPlans] = useState<StudentMemorizationPlanContextDTO[]>(initialPlans)
  const [activePlanId, setActivePlanId] = useState<string | undefined>(initialActivePlanId)
  const [isSavingFocus, setIsSavingFocus] = useState<string | null>(null)
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(
    customTemplateId ?? (templates[0]?.id ?? null),
  )
  const [habitAnchor, setHabitAnchor] = useState<string>(anchorSuggestions[0]?.value ?? "after-fajr")
  const [cadence, setCadence] = useState<string>(cadenceOptions[0]?.value ?? "daily")
  const [selectedSurahNumber, setSelectedSurahNumber] = useState<number>(surahOptions[0]?.number ?? 1)
  const [startAyah, setStartAyah] = useState<number>(1)
  const [endAyah, setEndAyah] = useState<number>(1)
  const [selectedDays, setSelectedDays] = useState<string[]>([
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
  ])
  const [notes, setNotes] = useState("")
  const [submissionError, setSubmissionError] = useState<string | null>(null)
  const [isSubmitting, startTransition] = useTransition()

  const selectedTemplate = useMemo(
    () => templates.find((template) => template.id === selectedTemplateId) ?? null,
    [selectedTemplateId],
  )

  const currentSurah = useMemo(
    () => surahOptions.find((option) => option.number === selectedSurahNumber) ?? surahOptions[0],
    [selectedSurahNumber],
  )

  const customVerseKeys = useMemo(() => {
    if (!selectedTemplate?.isCustom) {
      return []
    }
    if (!currentSurah) {
      return []
    }
    try {
      return expandVerseRange(currentSurah.number, startAyah, endAyah)
    } catch (error) {
      console.error("Invalid custom range", error)
      return []
    }
  }, [currentSurah, endAyah, selectedTemplate?.isCustom, startAyah])

  const verseKeys = useMemo(() => {
    if (selectedTemplate?.isCustom) {
      return uniqueVerseKeys(customVerseKeys)
    }
    if (!selectedTemplate) {
      return []
    }
    return uniqueVerseKeys(selectedTemplate.verseKeys)
  }, [customVerseKeys, selectedTemplate])

  const verseValidation = useMemo(() => validateVerseKeys(verseKeys), [verseKeys])

  const planSummary = useMemo(() => {
    const totalVerses = verseValidation.validKeys.length
    const totalPlans = plans.length
    const activePlan = plans.find((plan) => plan.plan.id === activePlanId)
    const cadenceOption = cadenceOptions.find((option) => option.value === cadence)
    const reminderSummary = formatReminderLabel(habitAnchor)
    const focusLabel = (() => {
      if (selectedTemplate?.isCustom && currentSurah) {
        if (startAyah === endAyah) {
          return `${currentSurah.arabicName} • Ayah ${startAyah}`
        }
        return `${currentSurah.arabicName} • Ayat ${startAyah}-${endAyah}`
      }
      if (selectedTemplate) {
        return selectedTemplate.title
      }
      return "Select a focus to begin"
    })()
    return {
      totalVerses,
      totalPlans,
      activePlanTitle: activePlan?.plan.title,
      cadenceLabel: cadenceOption?.title ?? cadence,
      reminderSummary,
      focusLabel,
    }
  }, [
    activePlanId,
    cadence,
    currentSurah,
    habitAnchor,
    plans,
    selectedTemplate,
    startAyah,
    endAyah,
    verseValidation.validKeys.length,
  ])

  const handleToggleDay = (value: string) => {
    setSelectedDays((prev) => {
      if (prev.includes(value)) {
        return prev.filter((day) => day !== value)
      }
      return [...prev, value]
    })
  }

  const handleTemplateSelect = (template: PersonalTemplate) => {
    setSelectedTemplateId(template.id)
    if (template.isCustom) {
      setSelectedSurahNumber((current) => {
        const matching = surahOptions.find((option) => option.number === current)
        return matching ? matching.number : surahOptions[0]?.number ?? 1
      })
      setStartAyah(1)
      setEndAyah(1)
    }
  }

  const handleCreatePlan = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmissionError(null)

    if (verseValidation.validKeys.length === 0) {
      setSubmissionError("Select at least one valid verse to memorize.")
      return
    }

    const planTitle = (() => {
      if (selectedTemplate?.isCustom && currentSurah) {
        if (startAyah === endAyah) {
          return `${currentSurah.arabicName} • Ayah ${startAyah}`
        }
        return `${currentSurah.arabicName} • Ayat ${startAyah}-${endAyah}`
      }
      if (selectedTemplate) {
        return selectedTemplate.title
      }
      return "Personal memorization focus"
    })()

    const payload: CreatePersonalPlanPayload = {
      title: planTitle,
      verseKeys: verseValidation.validKeys,
      cadence,
      habitCue: anchorDescriptions[habitAnchor] ?? habitAnchor,
      reminderTime: reminderDefaults[habitAnchor],
      checkInDays: selectedDays,
      startDate: new Date().toISOString(),
      notes: notes.trim() ? notes : undefined,
    }

    startTransition(() => {
      void (async () => {
        try {
          const planContext = await createPersonalMemorizationPlan(payload)
          setPlans((prev) => {
            const next = prev
              .filter((entry) => entry.plan.id !== planContext.plan.id)
              .map((entry) => ({ ...entry, isActive: false }))
            return [{ ...planContext, isActive: true }, ...next]
          })
          setActivePlanId(planContext.plan.id)
          toast({
            title: "Plan created",
            description: "Your new memorization focus is ready. Bismillah!",
          })
        } catch (error) {
          const message = error instanceof Error ? error.message : "Unable to save plan"
          setSubmissionError(message)
          toast({
            title: "Could not create plan",
            description: message,
            variant: "destructive",
          })
        }
      })()
    })
  }

  const handleSetActivePlan = async (planId: string) => {
    setIsSavingFocus(planId)
    try {
      const { plan } = await setActiveMemorizationPlan(planId)
      setActivePlanId(plan.plan.id)
      setPlans((prev) => {
        const remaining = prev
          .filter((entry) => entry.plan.id !== plan.plan.id)
          .map((entry) => ({ ...entry, isActive: false }))
        return [{ ...plan, isActive: true }, ...remaining]
      })
      toast({ title: "Focus updated", description: "This plan is now your primary habit." })
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to update focus"
      toast({ title: "Could not update focus", description: message, variant: "destructive" })
    } finally {
      setIsSavingFocus(null)
    }
  }

  return (
    <div className="space-y-10">
      <section className="rounded-3xl border border-emerald-200/60 bg-white/90 p-8 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-3">
            <Badge className="bg-emerald-700 text-white">Memorization Studio</Badge>
            <h1 className="text-3xl font-semibold text-maroon-900">Design your hifz rhythm</h1>
            <p className="max-w-2xl text-sm text-maroon-700">
              Craft a plan you can return to each day. Anchor it to a habit, track your repetitions, and celebrate the
              verses that settle in your heart.
            </p>
          </div>
          <div className="flex min-w-[200px] flex-col items-end rounded-3xl border border-emerald-100 bg-emerald-50/70 p-4 text-right text-sm text-emerald-800">
            <span className="text-xs uppercase tracking-widest text-emerald-600">Current cadence</span>
            <span className="mt-1 text-lg font-semibold text-emerald-900">{planSummary.cadenceLabel}</span>
            <Separator className="my-2 bg-emerald-200" />
            <span className="text-xs uppercase tracking-widest text-emerald-600">Active plan</span>
            <span className="mt-1 font-medium text-maroon-800">
              {planSummary.activePlanTitle ?? "Choose a focus below"}
            </span>
          </div>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4 text-sm text-emerald-800">
            <div className="flex items-center gap-2 text-emerald-700">
              <Flame className="h-4 w-4" />
              Daily verse momentum
            </div>
            <p className="mt-2 text-2xl font-semibold text-maroon-900">{planSummary.totalVerses}</p>
            <p className="text-xs text-maroon-600">verse anchors in your new blueprint</p>
          </div>
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4 text-sm text-emerald-800">
            <div className="flex items-center gap-2 text-emerald-700">
              <Target className="h-4 w-4" />
              Plans in motion
            </div>
            <p className="mt-2 text-2xl font-semibold text-maroon-900">{planSummary.totalPlans}</p>
            <p className="text-xs text-maroon-600">active and archived focuses</p>
          </div>
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4 text-sm text-emerald-800">
            <div className="flex items-center gap-2 text-emerald-700">
              <Sparkles className="h-4 w-4" />
              Reminder schedule
            </div>
            <p className="mt-2 text-sm text-maroon-700">
              {planSummary.reminderSummary}
            </p>
          </div>
        </div>
      </section>

      {nudgeMessage && (
        <Alert className="border-amber-300 bg-amber-100/70 text-maroon-800">
          <AlertTitle>Your verses are waiting</AlertTitle>
          <AlertDescription>{nudgeMessage}</AlertDescription>
        </Alert>
      )}

      <section className="rounded-3xl border border-emerald-200/60 bg-white/95 p-6 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-maroon-900">Build a personal plan</h2>
            <p className="text-sm text-maroon-700">Choose a template or craft your own verse set, then align it with a daily habit.</p>
          </div>
        </div>
        <div className="mt-6 grid gap-4 lg:grid-cols-[1.3fr_1fr]">
          <form className="space-y-6" onSubmit={handleCreatePlan}>
            <div className="grid gap-4 md:grid-cols-2">
              {templates.map((template) => {
                const Icon = template.badge ? Sparkles : Flame
                const isActive = selectedTemplateId === template.id
                return (
                  <button
                    key={template.id}
                    type="button"
                    onClick={() => handleTemplateSelect(template)}
                    className={cn(
                      "rounded-2xl border p-4 text-left transition-all",
                      isActive
                        ? "border-emerald-400 bg-emerald-50/70 shadow-lg"
                        : "border-emerald-100 bg-emerald-50/40 hover:border-emerald-300",
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-base font-semibold text-maroon-900">{template.title}</p>
                        <p className="mt-1 text-sm text-maroon-700">{template.description}</p>
                      </div>
                      <Icon className="h-5 w-5 text-emerald-600" />
                    </div>
                    {template.badge && (
                      <Badge className="mt-3 bg-amber-200 text-amber-900">{template.badge}</Badge>
                    )}
                    <p className="mt-3 text-xs text-emerald-700">
                      {template.isCustom
                        ? `${customVerseKeys.length} verse${customVerseKeys.length === 1 ? "" : "s"} selected`
                        : `${template.verseKeys.length} verse${template.verseKeys.length === 1 ? "" : "s"}`}
                    </p>
                  </button>
                )
              })}
            </div>

            {selectedTemplate?.isCustom && currentSurah && (
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <Label htmlFor="surah-select">Surah</Label>
                  <Select
                    value={String(selectedSurahNumber)}
                    onValueChange={(value) => {
                      const parsed = Number.parseInt(value, 10)
                      const option = surahOptions.find((entry) => entry.number === parsed)
                      setSelectedSurahNumber(option?.number ?? surahOptions[0]?.number ?? 1)
                      setStartAyah(1)
                      setEndAyah(1)
                    }}
                  >
                    <SelectTrigger id="surah-select" className="mt-1">
                      <SelectValue placeholder="Choose a surah" />
                    </SelectTrigger>
                    <SelectContent>
                      {surahOptions.map((option) => (
                        <SelectItem key={option.number} value={String(option.number)}>
                          {option.number}. {option.arabicName} ({option.englishName})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="mt-2 text-xs text-maroon-600">
                    {currentSurah.arabicName} contains {currentSurah.ayahCount} ayat.
                  </p>
                </div>
                <div>
                  <Label htmlFor="start-ayah-select">Start verse</Label>
                  <Select
                    value={String(startAyah)}
                    onValueChange={(value) => {
                      const parsed = Number.parseInt(value, 10)
                      if (!Number.isFinite(parsed)) {
                        return
                      }
                      setStartAyah(parsed)
                      setEndAyah((previous) => (previous < parsed ? parsed : previous))
                    }}
                  >
                    <SelectTrigger id="start-ayah-select" className="mt-1">
                      <SelectValue placeholder="Select start ayah" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: currentSurah.ayahCount }, (_, index) => index + 1).map((ayah) => (
                        <SelectItem key={ayah} value={String(ayah)}>
                          Ayah {ayah}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="end-ayah-select">End verse</Label>
                  <Select
                    value={String(endAyah)}
                    onValueChange={(value) => {
                      const parsed = Number.parseInt(value, 10)
                      if (!Number.isFinite(parsed)) {
                        return
                      }
                      setEndAyah(parsed < startAyah ? startAyah : parsed)
                    }}
                  >
                    <SelectTrigger id="end-ayah-select" className="mt-1">
                      <SelectValue placeholder="Select end ayah" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: currentSurah.ayahCount - (startAyah - 1) }, (_, index) => startAyah + index).map(
                        (ayah) => (
                          <SelectItem key={ayah} value={String(ayah)}>
                            Ayah {ayah}
                          </SelectItem>
                        ),
                      )}
                    </SelectContent>
                  </Select>
                  <p className="mt-2 text-xs text-maroon-600">Focus preview: {planSummary.focusLabel}</p>
                </div>
              </div>
            )}

            <div>
              <Label htmlFor="notes">Personal du’a or notes</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Add a reminder from your teacher or a personal du’a."
                rows={3}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label>Attach to a habit</Label>
                <div className="flex flex-wrap gap-2">
                  {anchorSuggestions.map(({ value, label, icon: Icon }) => {
                    const isActive = habitAnchor === value
                    return (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setHabitAnchor(value)}
                        className={cn(
                          "flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition",
                          isActive
                            ? "border-emerald-400 bg-emerald-50 text-emerald-800 shadow-sm"
                            : "border-emerald-100 text-maroon-700 hover:border-emerald-300",
                        )}
                      >
                        <Icon className="h-4 w-4" />
                        {label}
                      </button>
                    )
                  })}
                </div>
                <p className="mt-2 text-xs text-maroon-600">{anchorDescriptions[habitAnchor]}</p>
              </div>
              <div>
                <Label>Cadence</Label>
                <RadioGroup value={cadence} onValueChange={setCadence} className="grid gap-2">
                  {cadenceOptions.map((option) => (
                    <Label
                      key={option.value}
                      className={cn(
                        "flex cursor-pointer items-start gap-3 rounded-2xl border p-3 text-sm",
                        cadence === option.value
                          ? "border-emerald-400 bg-emerald-50 text-emerald-800 shadow-sm"
                          : "border-emerald-100 text-maroon-700 hover:border-emerald-300",
                      )}
                    >
                      <RadioGroupItem value={option.value} className="mt-1" />
                      <span>
                        <span className="block font-semibold text-maroon-900">{option.title}</span>
                        <span className="text-xs text-maroon-600">{option.description}</span>
                      </span>
                    </Label>
                  ))}
                </RadioGroup>
              </div>
            </div>

            <div>
              <Label>Check-in days</Label>
              <div className="mt-2 flex flex-wrap gap-2">
                {dayOptions.map((day) => (
                  <Toggle
                    key={day.value}
                    pressed={selectedDays.includes(day.value)}
                    onPressedChange={() => handleToggleDay(day.value)}
                    className={cn(
                      "rounded-full border px-4 py-2 text-sm",
                      selectedDays.includes(day.value)
                        ? "border-emerald-400 bg-emerald-50 text-emerald-800"
                        : "border-emerald-100 text-maroon-700 hover:border-emerald-300",
                    )}
                  >
                    {day.label}
                  </Toggle>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4 text-sm text-emerald-800">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span>
                  {verseValidation.validKeys.length} verse{verseValidation.validKeys.length === 1 ? "" : "s"} ready •
                  {" "}
                  {verseValidation.issues.length > 0
                    ? `${verseValidation.issues.length} issue${verseValidation.issues.length === 1 ? "" : "s"} to resolve`
                    : "All references verified"}
                </span>
                {verseValidation.validKeys.slice(0, 3).length > 0 && (
                  <span className="text-xs text-emerald-700">
                    {verseValidation.validKeys
                      .slice(0, 3)
                      .map((key) => formatVerseReference(key))
                      .join(" • ")}
                    {verseValidation.validKeys.length > 3 ? " …" : ""}
                  </span>
                )}
              </div>
              {verseValidation.issues.length > 0 && (
                <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-amber-700">
                  {verseValidation.issues.map((issue) => (
                    <li key={issue.key}>{`Check ${issue.key}: ${issue.reason}`}</li>
                  ))}
                </ul>
              )}
            </div>

            {submissionError && <p className="text-sm text-amber-700">{submissionError}</p>}

            <Button type="submit" className="w-full bg-emerald-700 text-white hover:bg-emerald-800" disabled={isSubmitting}>
              {isSubmitting ? "Creating plan…" : "Create memorization plan"}
            </Button>
          </form>

          <div className="space-y-4 rounded-3xl border border-emerald-100 bg-emerald-50/60 p-4 text-sm text-emerald-800">
            <h3 className="text-base font-semibold text-emerald-900">Why this matters</h3>
            <p>
              Link your plan to a daily habit so your brain knows exactly when to return to the verses. Celebrate small
              wins—every repetition is a seed of light.
            </p>
            <Separator className="bg-emerald-200" />
            <p className="text-xs uppercase tracking-widest text-emerald-600">Habit cues</p>
            <ul className="space-y-2 text-sm">
              <li>✨ Pair with a consistent action (wudu, tea brewing, commute).</li>
              <li>🕰 Keep it brief—just 5 focused minutes builds the pathway.</li>
              <li>🤲 Close with a short du’a so the heart remembers why.</li>
            </ul>
            <Separator className="bg-emerald-200" />
            <p className="text-xs uppercase tracking-widest text-emerald-600">Verse preview</p>
            <div className="space-y-2">
              {verseValidation.validKeys.slice(0, 5).map((key) => (
                <div key={key} className="rounded-xl border border-emerald-100 bg-white/80 p-2 text-xs text-maroon-700">
                  {formatVerseReference(key)}
                </div>
              ))}
              {verseValidation.validKeys.length === 0 && (
                <p className="text-xs text-maroon-600">Choose a template or add ayat to see them listed here.</p>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-semibold text-maroon-900">Your memorization circles</h2>
          <p className="text-sm text-maroon-700">
            Track progress, revisit completed journeys, and switch your active habit focus anytime.
          </p>
        </div>

        {plans.length === 0 ? (
          <Card className="border-dashed border-emerald-200 bg-white/80">
            <CardHeader>
              <CardTitle className="text-maroon-900">No memorization plans yet</CardTitle>
              <CardDescription className="text-maroon-600">
                Create your first plan above to start a guided repetition journey.
              </CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <div className="grid gap-6 lg:grid-cols-2">
            {plans.map((assignment) => {
              const { plan, progress, teacher } = assignment
              const verseCount = plan.verseKeys.length
              const isComplete = Boolean(progress.completedAt)
              const planProgress = isComplete
                ? 100
                : verseCount === 0
                  ? 0
                  : Math.min(
                      ((progress.currentVerseIndex + progress.repetitionsDone / 20) / Math.max(verseCount, 1)) * 100,
                      100,
                    )
              const currentVerseKey = plan.verseKeys[Math.min(progress.currentVerseIndex, Math.max(verseCount - 1, 0))]
              const verseReference = currentVerseKey ? formatVerseReference(currentVerseKey) : undefined
              const lastTouched = progress.updatedAt
                ? `${formatDistanceToNow(new Date(progress.updatedAt), { addSuffix: true })}`
                : "Not started"
              const isActive = activePlanId === plan.id
              const personalSettings = plan.personalPlanSettings

              return (
                <Card
                  key={plan.id}
                  className={cn(
                    "flex h-full flex-col border-emerald-200/60 bg-white/90 shadow-md transition",
                    isActive && "border-emerald-500 shadow-lg",
                  )}
                >
                  <CardHeader className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <CardTitle className="text-lg text-maroon-900">{plan.title}</CardTitle>
                      <div className="flex flex-col items-end gap-2">
                        <Badge className={isComplete ? "bg-emerald-700 text-white" : "bg-amber-200 text-amber-900"}>
                          {isComplete ? "Completed" : "In progress"}
                        </Badge>
                        {isActive && <Badge className="bg-emerald-600 text-white">Active focus</Badge>}
                      </div>
                    </div>
                    <CardDescription className="text-sm text-maroon-600">
                      {teacher ? `Assigned by ${teacher.name}` : personalSettings ? "Self-paced memorization" : "Assigned plan"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-1 flex-col gap-4">
                    <div className="space-y-2">
                      <Progress value={planProgress} className="h-2 bg-emerald-100" />
                      <div className="flex flex-wrap items-center justify-between text-xs text-maroon-600">
                        <span>
                          {verseCount} verse{verseCount === 1 ? "" : "s"}
                        </span>
                        <span>Last touched: {lastTouched}</span>
                      </div>
                    </div>

                    {!isComplete && verseReference && (
                      <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-3 text-sm text-emerald-800">
                        Up next: {verseReference}
                      </div>
                    )}

                    {isComplete && progress.completedAt && (
                      <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-3 text-sm text-emerald-800">
                        Completed on {new Date(progress.completedAt).toLocaleDateString()}
                      </div>
                    )}

                    {personalSettings && (
                      <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-3 text-xs text-emerald-800">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-medium text-emerald-700">Cadence:</span>
                          <span>{personalSettings.cadence}</span>
                          <span className="font-medium text-emerald-700">Check-ins:</span>
                          <span>{personalSettings.checkInDays.join(" • ")}</span>
                        </div>
                      </div>
                    )}

                    <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-2">
                      <div className="text-xs text-maroon-600">
                        {progress.repetitionsDone} / 20 repetitions on current verse
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={isActive || isSavingFocus === plan.id}
                          onClick={() => void handleSetActivePlan(plan.id)}
                        >
                          {isSavingFocus === plan.id ? "Saving…" : isActive ? "Focused" : "Set focus"}
                        </Button>
                        <Button asChild size="sm" className="bg-emerald-700 text-white hover:bg-emerald-800">
                          <Link href={`/student/memorization/${plan.id}`}>{isComplete ? "Revisit" : "Resume"}</Link>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
