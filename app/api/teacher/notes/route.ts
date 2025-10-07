import { NextResponse } from "next/server"

import { getActiveSession } from "@/lib/data/auth"
import { addTeacherNote, type TeacherFeedbackNote } from "@/lib/data/teacher-database"

export async function POST(request: Request) {
  const session = getActiveSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  if (session.role !== "teacher") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  let payload: Record<string, unknown>
  try {
    payload = (await request.json()) as Record<string, unknown>
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }

  const studentId = typeof payload.studentId === "string" ? payload.studentId : ""
  const message = typeof payload.message === "string" ? payload.message : ""
  const category = typeof payload.category === "string" ? payload.category : "communication"

  if (!studentId) {
    return NextResponse.json({ error: "Student is required" }, { status: 400 })
  }

  try {
    const note = addTeacherNote(studentId, session.userId, message, category as TeacherFeedbackNote["category"])
    return NextResponse.json({ success: true, note })
  } catch (error) {
    const messageText = error instanceof Error ? error.message : "Unable to add note"
    return NextResponse.json({ error: messageText }, { status: 400 })
  }
}
