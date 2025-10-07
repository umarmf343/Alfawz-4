import { NextResponse } from "next/server"

import { getActiveSession } from "@/lib/data/auth"
import {
  CreateTeacherPlanInput,
  createTeacherMemorizationPlan,
  listTeacherMemorizationPlans,
} from "@/lib/data/teacher-database"

export function GET() {
  const session = getActiveSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  if (session.role !== "teacher") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const plans = listTeacherMemorizationPlans(session.userId).map((summary) => ({
    plan: { ...summary.plan, verseKeys: [...summary.plan.verseKeys], classIds: [...summary.plan.classIds] },
    stats: { ...summary.stats },
    classes: summary.classes.map(({ studentIds, ...rest }) => ({ ...rest, studentIds: [...studentIds] })),
  }))

  return NextResponse.json({ plans })
}

export async function POST(request: Request) {
  const session = getActiveSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  if (session.role !== "teacher") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  let payload: Partial<CreateTeacherPlanInput>
  try {
    payload = (await request.json()) as Partial<CreateTeacherPlanInput>
  } catch (error) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }

  if (typeof payload.title !== "string" || !Array.isArray(payload.verseKeys) || !Array.isArray(payload.classIds)) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
  }

  const verseKeys = payload.verseKeys.filter((key): key is string => typeof key === "string")
  const classIds = payload.classIds.filter((id): id is string => typeof id === "string")

  try {
    const plan = createTeacherMemorizationPlan(session.userId, {
      title: payload.title,
      verseKeys,
      classIds,
      notes: typeof payload.notes === "string" ? payload.notes : undefined,
    })
    return NextResponse.json({ plan })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to create plan"
    const status = message.includes("Daily plan creation limit") ? 429 : 400
    return NextResponse.json({ error: message }, { status })
  }
}
