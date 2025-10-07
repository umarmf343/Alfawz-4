import Link from "next/link"
import { redirect } from "next/navigation"
import { formatDistanceToNow } from "date-fns"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { getActiveSession } from "@/lib/data/auth"
import { listStudentMemorizationPlans } from "@/lib/data/teacher-database"
import { formatVerseReference } from "@/lib/quran-data"
import { MemorizationStudioPanel } from "@/components/memorization/memorization-studio-panel"

const REPETITION_TARGET = 20

function buildNudgeMessage(plan: ReturnType<typeof listStudentMemorizationPlans>[number]) {
  const progress = plan.progress
  if (progress.completedAt || progress.repetitionsDone === 0) {
    return undefined
  }
  const lastTouched = progress.updatedAt ? new Date(progress.updatedAt) : null
  if (!lastTouched) return undefined
  const hoursSince = (Date.now() - lastTouched.getTime()) / (1000 * 60 * 60)
  if (hoursSince < 18) return undefined
  const verseKey = plan.plan.verseKeys[Math.min(progress.currentVerseIndex, plan.plan.verseKeys.length - 1)]
  if (!verseKey) return undefined
  return `Your heart is waiting for ${formatVerseReference(verseKey)}…`
}

export default function StudentMemorizationPage() {
  const session = getActiveSession()
  if (!session) {
    redirect("/auth/sign-in")
  }
  if (session.role !== "student") {
    redirect("/dashboard")
  }

  const assignedPlans = listStudentMemorizationPlans(session.userId)
  const nudgePlan = assignedPlans.find((plan) => buildNudgeMessage(plan))
  const nudgeMessage = nudgePlan ? buildNudgeMessage(nudgePlan) : undefined

  return (
    <div className="min-h-screen bg-amber-50/70 py-12">
      <div className="mx-auto flex max-w-5xl flex-col gap-10 px-6">
        <header className="space-y-4">
          <Badge className="w-fit bg-emerald-700 text-white">Memorization Panel</Badge>
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold text-maroon-900">Your Hifz Journey</h1>
            <p className="max-w-2xl text-sm text-maroon-700">
              Return to the verses your teacher assigned, track your repetitions, and celebrate every ayah you bring into your
              heart.
            </p>
          </div>
        </header>

        {nudgeMessage && (
          <Alert className="border-emerald-200 bg-emerald-50/70 text-emerald-900">
            <AlertTitle>Gentle reminder</AlertTitle>
            <AlertDescription>{nudgeMessage}</AlertDescription>
          </Alert>
        )}

        <MemorizationStudioPanel />

        {assignedPlans.length === 0 ? (
          <Card className="border-dashed border-emerald-200 bg-white/80">
            <CardHeader>
              <CardTitle className="text-maroon-900">No memorization plans yet</CardTitle>
              <CardDescription className="text-maroon-600">
                Once your teacher assigns a plan, it will appear here with guided repetitions.
              </CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {assignedPlans.map((assignment) => {
              const { plan, progress, teacher } = assignment
              const verseCount = plan.verseKeys.length
              const currentVerseKey = plan.verseKeys[Math.min(progress.currentVerseIndex, Math.max(verseCount - 1, 0))]
              const verseReference = currentVerseKey ? formatVerseReference(currentVerseKey) : undefined
              const isComplete = Boolean(progress.completedAt)
              const planProgress = isComplete
                ? 100
                : verseCount === 0
                  ? 0
                  : Math.min(
                      ((progress.currentVerseIndex + progress.repetitionsDone / REPETITION_TARGET) /
                        Math.max(verseCount, 1)) *
                        100,
                      100,
                    )
              const lastTouched = progress.updatedAt
                ? `${formatDistanceToNow(new Date(progress.updatedAt), { addSuffix: true })}`
                : "Not started"

              return (
                <Card key={plan.id} className="flex h-full flex-col border-emerald-200/60 bg-white/90 shadow-md">
                  <CardHeader className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <CardTitle className="text-lg text-maroon-900">{plan.title}</CardTitle>
                      <Badge className={isComplete ? "bg-emerald-700 text-white" : "bg-amber-200 text-amber-900"}>
                        {isComplete ? "Completed" : "In progress"}
                      </Badge>
                    </div>
                    <CardDescription className="text-sm text-maroon-600">
                      {teacher ? `Assigned by ${teacher.name}` : "Assigned memorization plan"}
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

                    <div className="mt-auto flex items-center justify-between pt-2">
                      <div className="text-xs text-maroon-600">
                        {progress.repetitionsDone} / {REPETITION_TARGET} repetitions on current verse
                      </div>
                      <Button
                        asChild
                        className="bg-emerald-700 text-white hover:bg-emerald-800"
                      >
                        <Link href={`/student/memorization/${plan.id}`}>
                          {isComplete ? "Revisit" : "Resume"}
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
