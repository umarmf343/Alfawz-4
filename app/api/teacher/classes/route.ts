import { NextResponse } from "next/server"

import { getActiveSession } from "@/lib/data/auth"
import { listClassesForTeacher } from "@/lib/data/teacher-database"

export function GET() {
  const session = getActiveSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  if (session.role !== "teacher") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const classes = listClassesForTeacher(session.userId).map(({ studentIds, ...rest }) => ({
    ...rest,
    studentIds: [...studentIds],
  }))

  return NextResponse.json({ classes })
}
