import { NextResponse } from "next/server"
import { getActiveSession } from "@/lib/data/auth"
import { advanceMemorizationVerse } from "@/lib/data/teacher-database"

export async function POST(request: Request) {
  const session = getActiveSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  if (session.role !== "student") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch (error) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }

  const planId = typeof (body as { planId?: unknown })?.planId === "string" ? (body as { planId: string }).planId : null
  if (!planId) {
    return NextResponse.json({ error: "planId is required" }, { status: 400 })
  }

  try {
    const progress = advanceMemorizationVerse(session.userId, planId)
    return NextResponse.json({ progress })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to advance verse"
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
