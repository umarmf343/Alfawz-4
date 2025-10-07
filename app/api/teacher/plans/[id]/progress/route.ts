import { NextResponse } from "next/server"

import { getActiveSession } from "@/lib/data/auth"
import { getTeacherPlanProgress } from "@/lib/data/teacher-database"

interface RouteContext {
  params: { id: string }
}

export function GET(_request: Request, context: RouteContext) {
  const session = getActiveSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  if (session.role !== "teacher") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const progress = getTeacherPlanProgress(session.userId, context.params.id)
  if (!progress) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  return NextResponse.json({
    progress: {
      plan: { ...progress.plan, verseKeys: [...progress.plan.verseKeys], classIds: [...progress.plan.classIds] },
      classes: progress.classes.map((entry) => ({ ...entry })),
      students: progress.students.map((student) => ({ ...student })),
    },
  })
}
