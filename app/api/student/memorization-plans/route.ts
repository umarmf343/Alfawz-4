import { NextResponse } from "next/server"
import { getActiveSession } from "@/lib/data/auth"
import { listStudentMemorizationPlans } from "@/lib/data/teacher-database"

export function GET() {
  const session = getActiveSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  if (session.role !== "student") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const plans = listStudentMemorizationPlans(session.userId).map((context) => ({
    plan: context.plan,
    progress: context.progress,
    classes: context.classes.map(({ studentIds: _studentIds, ...rest }) => ({ ...rest })),
    teacher: context.teacher ? { ...context.teacher } : undefined,
  }))

  return NextResponse.json({ plans })
}
