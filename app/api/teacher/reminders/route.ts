import { NextResponse } from "next/server"

import { getActiveSession } from "@/lib/data/auth"
import { sendRecitationTaskReminder } from "@/lib/data/teacher-database"

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

  const taskId = typeof payload.taskId === "string" ? payload.taskId : ""
  const message = typeof payload.message === "string" ? payload.message : ""

  if (!taskId) {
    return NextResponse.json({ error: "Recitation task is required" }, { status: 400 })
  }

  const result = sendRecitationTaskReminder(session.userId, taskId, message)
  if (!result.success) {
    return NextResponse.json({ error: result.error ?? "Unable to send reminder" }, { status: 400 })
  }

  return NextResponse.json({ success: true, note: result.note })
}
