import { NextResponse } from "next/server"

import { getActiveSession } from "@/lib/data/auth"
import {
  createTeacherAssignment,
  deleteTeacherAssignment,
  getTeacherAssignment,
  listTeacherAssignments,
  type AssignmentHotspotInput,
  type AssignmentStatus,
  type AssignmentWithStats,
} from "@/lib/data/teacher-database"

function combineDateAndTime(date: string | undefined, time: string | undefined): string | null {
  const trimmedDate = date?.trim()
  if (!trimmedDate) {
    return null
  }
  const trimmedTime = time?.trim()
  const normalizedTime = trimmedTime
    ? trimmedTime.length === 5
      ? `${trimmedTime}:00`
      : trimmedTime
    : "23:59:00"
  const candidate = new Date(`${trimmedDate}T${normalizedTime}`)
  if (Number.isNaN(candidate.getTime())) {
    return null
  }
  return candidate.toISOString()
}

function sanitizeHotspots(raw: unknown): AssignmentHotspotInput[] {
  if (!Array.isArray(raw)) {
    return []
  }
  return raw
    .map((entry) => {
      if (!entry || typeof entry !== "object") {
        return null
      }
      const candidate = entry as Partial<AssignmentHotspotInput>
      if (
        typeof candidate.title !== "string" ||
        typeof candidate.description !== "string" ||
        typeof candidate.x !== "number" ||
        typeof candidate.y !== "number" ||
        typeof candidate.width !== "number" ||
        typeof candidate.height !== "number"
      ) {
        return null
      }
      return {
        title: candidate.title,
        description: candidate.description,
        x: candidate.x,
        y: candidate.y,
        width: candidate.width,
        height: candidate.height,
        audioUrl: typeof candidate.audioUrl === "string" ? candidate.audioUrl : undefined,
      }
    })
    .filter((hotspot): hotspot is AssignmentHotspotInput => hotspot !== null)
}

export function serializeAssignment(summary: AssignmentWithStats) {
  return {
    assignment: {
      ...summary.assignment,
      classIds: [...summary.assignment.classIds],
      studentIds: [...summary.assignment.studentIds],
      hotspots: summary.assignment.hotspots.map((hotspot) => ({ ...hotspot })),
    },
    stats: { ...summary.stats },
    submissions: summary.submissions.map((submission) => ({ ...submission })),
  }
}

export function GET() {
  const session = getActiveSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  if (session.role !== "teacher") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const assignments = listTeacherAssignments(session.userId).map((summary) => serializeAssignment(summary))
  return NextResponse.json({ assignments })
}

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

  const title = typeof payload.title === "string" ? payload.title : ""
  const assignmentType = typeof payload.assignmentType === "string" ? payload.assignmentType : "recitation"
  const surahName = typeof payload.surahName === "string" ? payload.surahName : ""
  const surahNumber = Number(payload.surahNumber)
  const ayahRange = typeof payload.ayahRange === "string" ? payload.ayahRange : ""
  const dueDate = typeof payload.dueDate === "string" ? payload.dueDate : undefined
  const dueTime = typeof payload.dueTime === "string" ? payload.dueTime : undefined
  const dueAt = combineDateAndTime(dueDate, dueTime)
  const classIds = Array.isArray(payload.classIds)
    ? payload.classIds.filter((value): value is string => typeof value === "string")
    : []
  const studentIds = Array.isArray(payload.studentIds)
    ? payload.studentIds.filter((value): value is string => typeof value === "string")
    : []
  const status: AssignmentStatus = payload.publish ? "published" : "draft"
  const description = typeof payload.description === "string" ? payload.description : undefined
  const instructions = typeof payload.instructions === "string" ? payload.instructions : undefined
  const imageUrl = typeof payload.imageUrl === "string" ? payload.imageUrl : undefined
  const hotspots = sanitizeHotspots(payload.hotspots)
  const assignmentId = typeof payload.assignmentId === "string" ? payload.assignmentId : undefined

  if (!dueAt) {
    return NextResponse.json({ error: "A valid due date is required" }, { status: 400 })
  }

  if (assignmentId) {
    const existing = getTeacherAssignment(session.userId, assignmentId)
    if (!existing) {
      return NextResponse.json({ error: "Assignment not found" }, { status: 404 })
    }
  }

  try {
    const summary = createTeacherAssignment(session.userId, {
      title,
      description,
      instructions,
      assignmentType,
      surahName,
      surahNumber,
      ayahRange,
      dueAt,
      classIds,
      studentIds,
      imageUrl,
      hotspots,
      status,
    })

    if (assignmentId) {
      deleteTeacherAssignment(session.userId, assignmentId)
    }

    return NextResponse.json({ assignment: serializeAssignment(summary) })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to create assignment"
    const statusCode = message.toLowerCase().includes("select at least one student") ? 422 : 400
    return NextResponse.json({ error: message }, { status: statusCode })
  }
}
