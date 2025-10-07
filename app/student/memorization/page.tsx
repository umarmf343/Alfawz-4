import { redirect } from "next/navigation"
import { getActiveSession } from "@/lib/data/auth"
import { listStudentMemorizationPlans } from "@/lib/data/teacher-database"
import { StudentMemorizationDashboard } from "@/components/student/StudentMemorizationDashboard"
import { formatVerseReference } from "@/lib/quran-data"

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

  const activePlanId =
    assignedPlans.find((context) => context.isActive)?.plan.id ?? assignedPlans[0]?.plan.id

  return (
    <div className="min-h-screen bg-amber-50/70 py-12">
      <div className="mx-auto max-w-6xl px-6">
        <StudentMemorizationDashboard
          initialPlans={assignedPlans.map((context) => ({
            plan: context.plan,
            progress: context.progress,
            classes: context.classes.map(({ studentIds, ...rest }) => {
              void studentIds
              return { ...rest }
            }),
            teacher: context.teacher,
            isActive: context.isActive,
          }))}
          nudgeMessage={nudgeMessage}
          initialActivePlanId={activePlanId}
        />
      </div>
    </div>
  )
}
