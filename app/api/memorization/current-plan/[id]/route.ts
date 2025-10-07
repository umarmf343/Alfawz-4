import { NextResponse } from "next/server"
import { getActiveSession } from "@/lib/data/auth"
import { getStudentMemorizationPlanContext } from "@/lib/data/teacher-database"

interface RouteContext {
  params: { id: string }
}

export function GET(_request: Request, { params }: RouteContext) {
  const session = getActiveSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  if (session.role !== "student") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const planContext = getStudentMemorizationPlanContext(session.userId, decodeURIComponent(params.id))
  if (!planContext) {
    return NextResponse.json({ error: "Plan not found" }, { status: 404 })
  }

  const payload = {
    plan: {
      plan: planContext.plan,
      progress: planContext.progress,
      classes: planContext.classes.map(({ studentIds: _studentIds, ...rest }) => ({ ...rest })),
      teacher: planContext.teacher ? { ...planContext.teacher } : undefined,
      isActive: planContext.isActive,
    },
  }

  return NextResponse.json(payload)
}
