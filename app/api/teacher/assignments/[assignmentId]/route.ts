import { NextResponse } from "next/server"

import { getActiveSession } from "@/lib/data/auth"
import { getTeacherAssignment } from "@/lib/data/teacher-database"

import { serializeAssignment } from "../route"

interface Params {
  assignmentId: string
}

export function GET(_request: Request, { params }: { params: Params }) {
  const session = getActiveSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  if (session.role !== "teacher") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const assignment = getTeacherAssignment(session.userId, params.assignmentId)
  if (!assignment) {
    return NextResponse.json({ error: "Assignment not found" }, { status: 404 })
  }

  return NextResponse.json({ assignment: serializeAssignment(assignment) })
}
