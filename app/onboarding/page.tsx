"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  BookOpenCheck,
  CalendarDays,
  CheckCircle2,
  Clock,
  Sparkles,
  Target,
  Users,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"

const onboardingSteps = [
  {
    id: "role" as const,
    title: "Tell us about you",
    description: "Choose the role that best represents how you’ll use AlFawz.",
    icon: Users,
  },
  {
    id: "goals" as const,
    title: "Set your goals",
    description: "We’ll personalize lessons based on your aspirations.",
    icon: Target,
  },
  {
    id: "schedule" as const,
    title: "Plan your study",
    description: "Let us know when you’re most available to learn.",
    icon: Clock,
  },
  {
    id: "review" as const,
    title: "Review & finish",
    description: "Confirm your selections and start learning.",
    icon: CheckCircle2,
  },
]

type RoleOption = {
  id: "student" | "teacher" | "parent" | "administrator"
  title: string
  description: string
}

type FocusArea = "tajweed" | "memorization" | "recitation" | "arabic" | "revision"

type AvailabilityOption = {
  id: "weekday-mornings" | "weekday-evenings" | "weekend" | "flexible"
  title: string
  description: string
}

type GoalType = "verses" | "minutes"

type OnboardingFormState = {
  role: RoleOption["id"] | ""
  goalType: GoalType
  dailyGoal: number
  focusAreas: FocusArea[]
  availability: AvailabilityOption["id"]
  notifications: boolean
  timezone: string
  startDate: string
}

const roleOptions: RoleOption[] = [
  {
    id: "student",
    title: "Student",
    description: "Build consistent Qur’an habits with guided lessons and AI feedback.",
  },
  {
    id: "teacher",
    title: "Teacher",
    description: "Manage classes, track progress, and share feedback with learners.",
  },
  {
    id: "parent",
    title: "Parent",
    description: "Support your child’s journey with shared goals and progress reports.",
  },
  {
    id: "administrator",
    title: "Administrator",
    description: "Oversee programs, curriculum, and institute-wide analytics.",
  },
]

const focusAreas: { id: FocusArea; title: string; description: string }[] = [
  {
    id: "tajweed",
    title: "Tajweed mastery",
    description: "Perfect pronunciation and articulation with instant corrections.",
  },
  {
    id: "memorization",
    title: "Memorization",
    description: "Structured Hifz plans with spaced repetition and review alerts.",
  },
  {
    id: "recitation",
    title: "Recitation",
    description: "Guided recitation sessions with teacher and AI support.",
  },
  {
    id: "arabic",
    title: "Arabic language",
    description: "Strengthen understanding through vocabulary and grammar practice.",
  },
  {
    id: "revision",
    title: "Revision",
    description: "Stay consistent with smart revision playlists and reminders.",
  },
]

const availabilityOptions: AvailabilityOption[] = [
  {
    id: "weekday-mornings",
    title: "Weekday mornings",
    description: "Ideal for early learners who prefer a fresh start to the day.",
  },
  {
    id: "weekday-evenings",
    title: "Weekday evenings",
    description: "Great for balancing studies or work with evening sessions.",
  },
  {
    id: "weekend",
    title: "Weekends",
    description: "Focus on longer sessions with flexible weekend planning.",
  },
  {
    id: "flexible",
    title: "Flexible",
    description: "Mix of short micro-sessions spread throughout the week.",
  },
]

const timezoneOptions = [
  { value: "UTC", label: "Coordinated Universal Time (UTC)" },
  { value: "America/New_York", label: "Eastern Time (GMT-4)" },
  { value: "Europe/London", label: "London (GMT+1)" },
  { value: "Asia/Riyadh", label: "Riyadh (GMT+3)" },
  { value: "Asia/Karachi", label: "Karachi (GMT+5)" },
]

const getInitialTimezone = () => {
  const systemTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone
  if (timezoneOptions.some((option) => option.value === systemTimezone)) {
    return systemTimezone
  }
  return "UTC"
}

export default function OnboardingPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(0)
  const [formState, setFormState] = useState<OnboardingFormState>(() => ({
    role: "",
    goalType: "verses",
    dailyGoal: 10,
    focusAreas: ["tajweed", "memorization"],
    availability: "weekday-evenings",
    notifications: true,
    timezone: getInitialTimezone(),
    startDate: new Date().toISOString().slice(0, 10),
  }))

  const progress = ((currentStep + 1) / onboardingSteps.length) * 100
  const activeStep = onboardingSteps[currentStep]
  const StepIcon = activeStep.icon
  const isReviewStep = activeStep.id === "review"

  const handleNext = () => {
    if (currentStep < onboardingSteps.length - 1) {
      setCurrentStep((step) => Math.min(step + 1, onboardingSteps.length - 1))
      return
    }
    router.push("/dashboard")
  }

  const handleBack = () => {
    setCurrentStep((step) => Math.max(step - 1, 0))
  }

  const toggleFocusArea = (area: FocusArea, checked: boolean) => {
    setFormState((prev) => {
      const exists = prev.focusAreas.includes(area)
      if (checked && !exists) {
        return { ...prev, focusAreas: [...prev.focusAreas, area] }
      }
      if (!checked && exists) {
        return { ...prev, focusAreas: prev.focusAreas.filter((item) => item !== area) }
      }
      return prev
    })
  }

  const roleSummary = useMemo(() => roleOptions.find((role) => role.id === formState.role)?.title ?? "Not selected", [
    formState.role,
  ])

  const goalSummary = useMemo(
    () =>
      formState.goalType === "verses"
        ? `${formState.dailyGoal} ayahs per day`
        : `${formState.dailyGoal} minutes per day`,
    [formState.dailyGoal, formState.goalType],
  )

  const focusSummary = useMemo(() => {
    if (formState.focusAreas.length === 0) {
      return "No focus areas selected yet"
    }
    return formState.focusAreas
      .map((area) => focusAreas.find((option) => option.id === area)?.title ?? area)
      .join(", ")
  }, [formState.focusAreas])

  const availabilitySummary = useMemo(
    () => availabilityOptions.find((option) => option.id === formState.availability)?.title ?? formState.availability,
    [formState.availability],
  )

  const timezoneSummary = useMemo(
    () => timezoneOptions.find((option) => option.value === formState.timezone)?.label ?? formState.timezone,
    [formState.timezone],
  )

  return (
    <div className="min-h-screen bg-gradient-cream pb-16">
      <div className="mx-auto flex w-full max-w-6xl flex-col px-4 pt-10 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="mb-8 inline-flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Back to home
        </Link>

        <div className="flex flex-col gap-6 lg:flex-row">
          <aside className="lg:w-80">
            <Card className="border-border/50 shadow-lg">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl font-semibold">Welcome to AlFawz</CardTitle>
                  <Sparkles className="h-5 w-5 text-primary" />
                </div>
                <CardDescription>
                  We’re excited to tailor the academy to your Qur’an learning journey.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <div className="mb-2 flex items-center justify-between text-sm font-medium text-muted-foreground">
                    <span>
                      Step {currentStep + 1} of {onboardingSteps.length}
                    </span>
                    <span>{Math.round(progress)}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>

                <div className="space-y-3">
                  {onboardingSteps.map((step, index) => {
                    const Icon = step.icon
                    const isCompleted = index < currentStep
                    const isActive = index === currentStep

                    return (
                      <div
                        key={step.id}
                        className={cn(
                          "flex items-center gap-3 rounded-xl border p-3 text-sm transition-colors",
                          isActive
                            ? "border-primary/70 bg-primary/5 text-foreground"
                            : isCompleted
                              ? "border-primary/40 bg-background"
                              : "border-border/60 bg-background/50 text-muted-foreground",
                        )}
                      >
                        <div
                          className={cn(
                            "flex h-10 w-10 items-center justify-center rounded-lg border",
                            isActive
                              ? "border-primary/50 bg-primary/10"
                              : isCompleted
                                ? "border-primary/40 bg-primary/10"
                                : "border-border/60 bg-background",
                          )}
                        >
                          <Icon
                            className={cn(
                              "h-5 w-5",
                              isActive || isCompleted ? "text-primary" : "text-muted-foreground",
                            )}
                          />
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">{step.title}</p>
                          <p className="text-xs text-muted-foreground">{step.description}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>

                <div className="rounded-xl bg-primary/5 p-4 text-sm text-primary">
                  <p className="font-medium">Need help?</p>
                  <p className="text-primary/80">
                    Our onboarding mentors can walk you through the platform and answer your questions.
                  </p>
                </div>
              </CardContent>
            </Card>
          </aside>

          <main className="flex-1">
            <Card className="border-border/50 shadow-lg">
              <CardHeader className="space-y-2 border-b border-border/40 bg-background/70">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <StepIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl font-semibold">{activeStep.title}</CardTitle>
                    <CardDescription className="text-base text-muted-foreground">
                      {activeStep.description}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-10 p-6 sm:p-10">
                {activeStep.id === "role" && (
                  <div className="space-y-6">
                    <p className="text-muted-foreground">
                      Select the option that best describes how you’ll participate in the academy. This helps us surface the right
                      lessons and dashboard tools for you.
                    </p>
                    <RadioGroup
                      value={formState.role}
                      onValueChange={(value: RoleOption["id"]) =>
                        setFormState((prev) => ({ ...prev, role: value }))
                      }
                      className="grid gap-4 md:grid-cols-2"
                    >
                      {roleOptions.map((option) => (
                        <label
                          key={option.id}
                          className={cn(
                            "group relative flex h-full cursor-pointer flex-col rounded-2xl border p-5 transition",
                            formState.role === option.id
                              ? "border-primary bg-primary/5"
                              : "border-border/60 bg-background hover:border-primary/60",
                          )}
                        >
                          <div className="absolute right-5 top-5">
                            <RadioGroupItem value={option.id} className="h-4 w-4" />
                          </div>
                          <div className="flex flex-1 flex-col gap-2">
                            <p className="text-lg font-semibold">{option.title}</p>
                            <p className="text-sm text-muted-foreground">{option.description}</p>
                          </div>
                        </label>
                      ))}
                    </RadioGroup>
                  </div>
                )}

                {activeStep.id === "goals" && (
                  <div className="space-y-8">
                    <div className="grid gap-6 md:grid-cols-2">
                      <div className="space-y-3">
                        <Label htmlFor="goalType">I want to focus on</Label>
                        <Select
                          value={formState.goalType}
                          onValueChange={(value: GoalType) =>
                            setFormState((prev) => ({ ...prev, goalType: value }))
                          }
                        >
                          <SelectTrigger id="goalType" className="h-11">
                            <SelectValue placeholder="Choose a goal type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="verses">Memorizing ayahs</SelectItem>
                            <SelectItem value="minutes">Daily study minutes</SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="text-sm text-muted-foreground">
                          We’ll build a personalized study plan that balances memorization and revision.
                        </p>
                      </div>

                      <div className="space-y-3">
                        <Label htmlFor="startDate">When would you like to begin?</Label>
                        <Input
                          id="startDate"
                          type="date"
                          value={formState.startDate}
                          onChange={(event) =>
                            setFormState((prev) => ({ ...prev, startDate: event.target.value }))
                          }
                          className="h-11"
                        />
                        <p className="text-sm text-muted-foreground">You can always adjust this later in your dashboard.</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Daily target</Label>
                          <p className="text-sm text-muted-foreground">
                            Slide to set a consistent pace that feels sustainable for you.
                          </p>
                        </div>
                        <div className="rounded-full bg-primary/10 px-4 py-1 text-sm font-semibold text-primary">
                          {goalSummary}
                        </div>
                      </div>
                      <Slider
                        min={formState.goalType === "verses" ? 3 : 10}
                        max={formState.goalType === "verses" ? 30 : 120}
                        step={formState.goalType === "verses" ? 1 : 5}
                        value={[formState.dailyGoal]}
                        onValueChange={([value]) =>
                          setFormState((prev) => ({ ...prev, dailyGoal: value }))
                        }
                      />
                      <div className="grid gap-3 sm:grid-cols-3">
                        {["Gentle", "Balanced", "Intensive"].map((label, index) => (
                          <div
                            key={label}
                            className={cn(
                              "rounded-2xl border p-3 text-sm",
                              index === 1 ? "border-primary/40 bg-primary/5" : "border-border/60 bg-background",
                            )}
                          >
                            <p className="font-semibold text-foreground">{label}</p>
                            <p className="text-muted-foreground">
                              {index === 0 && "Perfect for building consistency."}
                              {index === 1 && "Balanced progress with room for review."}
                              {index === 2 && "Ambitious pace with accelerated goals."}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <Label>What would you like to prioritize?</Label>
                      <div className="grid gap-4 md:grid-cols-2">
                        {focusAreas.map((area) => (
                          <label
                            key={area.id}
                            className={cn(
                              "flex h-full cursor-pointer flex-col rounded-2xl border p-5 transition",
                              formState.focusAreas.includes(area.id)
                                ? "border-primary bg-primary/5"
                                : "border-border/60 bg-background hover:border-primary/60",
                            )}
                          >
                            <Checkbox
                              checked={formState.focusAreas.includes(area.id)}
                              onCheckedChange={(checked) =>
                                toggleFocusArea(area.id, checked === true)
                              }
                              className="mb-3 h-5 w-5"
                            />
                            <p className="text-lg font-semibold text-foreground">{area.title}</p>
                            <p className="text-sm text-muted-foreground">{area.description}</p>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {activeStep.id === "schedule" && (
                  <div className="space-y-8">
                    <div className="grid gap-6 md:grid-cols-2">
                      <div className="space-y-3">
                        <Label htmlFor="timezone">Timezone</Label>
                        <Select
                          value={formState.timezone}
                          onValueChange={(value) =>
                            setFormState((prev) => ({ ...prev, timezone: value }))
                          }
                        >
                          <SelectTrigger id="timezone" className="h-11">
                            <SelectValue placeholder="Choose your timezone" />
                          </SelectTrigger>
                          <SelectContent>
                            {timezoneOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <p className="text-sm text-muted-foreground">
                          We’ll schedule reminders and live sessions according to your local time.
                        </p>
                      </div>

                      <div className="space-y-3">
                        <Label>Preferred session structure</Label>
                        <RadioGroup
                          value={formState.goalType === "verses" ? "structured" : "flexible"}
                          onValueChange={(value) =>
                            setFormState((prev) => ({
                              ...prev,
                              goalType: value === "structured" ? "verses" : "minutes",
                            }))
                          }
                          className="grid gap-3"
                        >
                          <label className="flex cursor-pointer items-center gap-3 rounded-xl border p-4">
                            <RadioGroupItem value="structured" className="h-4 w-4" />
                            <div>
                              <p className="font-semibold">Structured ayah sets</p>
                              <p className="text-sm text-muted-foreground">
                                Focus on memorizing a set number of verses each session.
                              </p>
                            </div>
                          </label>
                            <label className="flex cursor-pointer items-center gap-3 rounded-xl border p-4">
                              <RadioGroupItem value="flexible" className="h-4 w-4" />
                              <div>
                                <p className="font-semibold">Flexible study minutes</p>
                                <p className="text-sm text-muted-foreground">
                                  Choose how long you’d like to practice instead of a verse count.
                                </p>
                              </div>
                            </label>
                        </RadioGroup>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <Label>When are you usually available?</Label>
                      <div className="grid gap-4 md:grid-cols-2">
                        {availabilityOptions.map((option) => (
                          <label
                            key={option.id}
                            className={cn(
                              "flex h-full cursor-pointer flex-col rounded-2xl border p-5 transition",
                              formState.availability === option.id
                                ? "border-primary bg-primary/5"
                                : "border-border/60 bg-background hover:border-primary/60",
                            )}
                          >
                            <div className="mb-3 flex items-center justify-between">
                              <p className="text-lg font-semibold text-foreground">{option.title}</p>
                              <div
                                className={cn(
                                  "rounded-full border px-3 py-1 text-xs font-semibold",
                                  formState.availability === option.id
                                    ? "border-primary bg-primary/10 text-primary"
                                    : "border-border/60 text-muted-foreground",
                                )}
                              >
                                <CalendarDays className="mr-2 inline h-3.5 w-3.5" />
                                Slot
                              </div>
                            </div>
                            <p className="text-sm text-muted-foreground">{option.description}</p>
                            <div className="mt-4 inline-flex items-center gap-2 text-xs text-muted-foreground">
                              <Clock className="h-3.5 w-3.5" />
                              Smart reminders included
                            </div>
                            <input
                              type="radio"
                              className="sr-only"
                              name="availability"
                              value={option.id}
                              checked={formState.availability === option.id}
                              onChange={() =>
                                setFormState((prev) => ({ ...prev, availability: option.id }))
                              }
                            />
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 rounded-2xl border border-primary/40 bg-primary/5 p-4">
                      <BookOpenCheck className="h-5 w-5 text-primary" />
                      <div className="space-y-1 text-sm">
                        <p className="font-semibold text-primary">Enable smart reminders</p>
                        <p className="text-muted-foreground">
                          We’ll nudge you when it’s time to revise and celebrate your milestones.
                        </p>
                      </div>
                      <Checkbox
                        checked={formState.notifications}
                        onCheckedChange={(checked) =>
                          setFormState((prev) => ({ ...prev, notifications: checked === true }))
                        }
                        className="ml-auto h-5 w-5"
                      />
                    </div>
                  </div>
                )}

                {isReviewStep && (
                  <div className="space-y-8">
                    <div className="rounded-3xl border border-primary/40 bg-primary/5 p-6">
                      <div className="flex items-center gap-3 text-primary">
                        <CheckCircle2 className="h-6 w-6" />
                        <div>
                          <p className="text-lg font-semibold">You’re all set!</p>
                          <p className="text-sm text-primary/80">
                            Review your plan below and jump straight into your personalized dashboard.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-5 md:grid-cols-2">
                      {["Your role", "Daily target", "Focus areas", "Preferred schedule", "Timezone", "Start date"].map(
                        (label) => {
                          const value = (() => {
                            switch (label) {
                              case "Your role":
                                return roleSummary
                              case "Daily target":
                                return goalSummary
                              case "Focus areas":
                                return focusSummary
                              case "Preferred schedule":
                                return availabilitySummary
                              case "Timezone":
                                return timezoneSummary
                              case "Start date":
                                return formState.startDate
                              default:
                                return ""
                            }
                          })()

                          return (
                            <Card key={label} className="border-border/60 bg-background/80">
                              <CardHeader className="pb-2">
                                <CardTitle className="text-base font-semibold text-muted-foreground">
                                  {label}
                                </CardTitle>
                              </CardHeader>
                              <CardContent>
                                <p className="text-lg font-semibold text-foreground">{value}</p>
                              </CardContent>
                            </Card>
                          )
                        },
                      )}
                    </div>

                    <div className="rounded-2xl border border-border/60 bg-background/90 p-6 text-sm text-muted-foreground">
                      <p>
                        The onboarding details help us craft the right curriculum, match you with recommended teachers, and schedule
                        reminders at the times you learn best. You can fine-tune everything later from your dashboard preferences.
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex flex-col gap-3 border-t border-border/60 pt-6 sm:flex-row sm:items-center sm:justify-between">
                  <div className="text-sm text-muted-foreground">
                    {isReviewStep
                      ? "Ready to explore the dashboard?"
                      : "You can update these preferences anytime in your profile settings."}
                  </div>
                  <div className="flex gap-3">
                    <Button
                      variant="ghost"
                      onClick={handleBack}
                      disabled={currentStep === 0}
                    >
                      Back
                    </Button>
                    <Button onClick={handleNext}>
                      {isReviewStep ? "Finish and go to dashboard" : "Save and continue"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </main>
        </div>
      </div>
    </div>
  )
}
