import { NextResponse } from "next/server"

import { getActiveSession } from "@/lib/data/auth"
import {
  UpdateTeacherPlanInput,
  deleteTeacherMemorizationPlan,
  listTeacherMemorizationPlans,
  updateTeacherMemorizationPlan,
} from "@/lib/data/teacher-database"

interface RouteContext {
  params: { id: string }
}

function ensureTeacherSession() {
  const session = getActiveSession()
  if (!session) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) }
  }
  if (session.role !== "teacher") {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) }
  }
  return { session }
}

export function GET(_request: Request, context: RouteContext) {
  const result = ensureTeacherSession()
  if (result.error) return result.error

  const plan = listTeacherMemorizationPlans(result.session.userId).find(
    (candidate) => candidate.plan.id === context.params.id,
  )
  if (!plan) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }
  return NextResponse.json({
    plan: {
      plan: { ...plan.plan, verseKeys: [...plan.plan.verseKeys], classIds: [...plan.plan.classIds] },
      stats: { ...plan.stats },
      classes: plan.classes.map(({ studentIds, ...rest }) => ({ ...rest, studentIds: [...studentIds] })),
    },
  })
}

export async function PATCH(request: Request, context: RouteContext) {
  const result = ensureTeacherSession()
  if (result.error) return result.error

  let payload: Partial<UpdateTeacherPlanInput>
  try {
    payload = (await request.json()) as Partial<UpdateTeacherPlanInput>
  } catch (error) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }

  const updates: UpdateTeacherPlanInput = {}
  if (typeof payload.title === "string") {
    updates.title = payload.title
  }
  if (Array.isArray(payload.verseKeys)) {
    updates.verseKeys = payload.verseKeys.filter((key): key is string => typeof key === "string")
  }
  if (Array.isArray(payload.classIds)) {
    updates.classIds = payload.classIds.filter((id): id is string => typeof id === "string")
  }
  if (typeof payload.notes === "string") {
    updates.notes = payload.notes
  }

  try {
    const plan = updateTeacherMemorizationPlan(result.session.userId, context.params.id, updates)
    return NextResponse.json({ plan })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to update plan"
    return NextResponse.json({ error: message }, { status: 400 })
  }
}

export function DELETE(_request: Request, context: RouteContext) {
  const result = ensureTeacherSession()
  if (result.error) return result.error

  try {
    const success = deleteTeacherMemorizationPlan(result.session.userId, context.params.id)
    if (!success) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }
    return NextResponse.json({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to delete plan"
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
