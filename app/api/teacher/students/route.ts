import { NextResponse } from "next/server"

import { getActiveSession } from "@/lib/data/auth"
import { listStudentsForTeacher } from "@/lib/data/teacher-database"

export function GET() {
  const session = getActiveSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (session.role !== "teacher") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const students = listStudentsForTeacher(session.userId).map((student) => ({
    ...student,
    classIds: [...student.classIds],
    classNames: [...student.classNames],
  }))

  return NextResponse.json({ students })
}
