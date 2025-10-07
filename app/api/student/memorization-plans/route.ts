import { NextResponse } from "next/server"
import { getActiveSession } from "@/lib/data/auth"
import {
  createPersonalMemorizationPlan,
  listStudentMemorizationPlans,
  setStudentActiveMemorizationPlan,
} from "@/lib/data/teacher-database"

export function GET() {
  const session = getActiveSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  if (session.role !== "student") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const planContexts = listStudentMemorizationPlans(session.userId)
  const activePlanId = planContexts.find((context) => context.isActive)?.plan.id
  const plans = planContexts.map((context) => ({
    plan: context.plan,
    progress: context.progress,
    classes: context.classes.map(({ studentIds, ...rest }) => {
      void studentIds
      return { ...rest }
    }),
    teacher: context.teacher ? { ...context.teacher } : undefined,
    isActive: context.isActive,
  }))

  return NextResponse.json({ plans, activePlanId })
}

export async function POST(request: Request) {
  const session = getActiveSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  if (session.role !== "student") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const body = await request.json().catch(() => null)
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  }

  try {
    const planContext = createPersonalMemorizationPlan(session.userId, {
      title: String(body.title ?? ""),
      verseKeys: Array.isArray(body.verseKeys) ? body.verseKeys.map((key: unknown) => String(key ?? "")) : [],
      cadence: String(body.cadence ?? ""),
      intention: typeof body.intention === "string" ? body.intention : undefined,
      habitCue: typeof body.habitCue === "string" ? body.habitCue : undefined,
      reminderTime: typeof body.reminderTime === "string" ? body.reminderTime : undefined,
      checkInDays: Array.isArray(body.checkInDays)
        ? body.checkInDays.map((day: unknown) => String(day ?? ""))
        : undefined,
      startDate: typeof body.startDate === "string" ? body.startDate : undefined,
      notes: typeof body.notes === "string" ? body.notes : undefined,
    })

    return NextResponse.json({
      plan: {
        plan: planContext.plan,
        progress: planContext.progress,
        classes: planContext.classes.map(({ studentIds, ...rest }) => {
          void studentIds
          return { ...rest }
        }),
        teacher: planContext.teacher ? { ...planContext.teacher } : undefined,
        isActive: planContext.isActive,
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to create plan"
    return NextResponse.json({ error: message }, { status: 400 })
  }
}

export async function PATCH(request: Request) {
  const session = getActiveSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  if (session.role !== "student") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const body = await request.json().catch(() => null)
  const planId = typeof body?.planId === "string" ? body.planId : null
  if (!planId) {
    return NextResponse.json({ error: "Plan identifier required" }, { status: 400 })
  }

  try {
    const planContext = setStudentActiveMemorizationPlan(session.userId, planId)
    return NextResponse.json({
      plan: {
        plan: planContext.plan,
        progress: planContext.progress,
        classes: planContext.classes.map(({ studentIds, ...rest }) => {
          void studentIds
          return { ...rest }
        }),
        teacher: planContext.teacher ? { ...planContext.teacher } : undefined,
        isActive: planContext.isActive,
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to update plan"
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
