import { redirect } from "next/navigation"

import { getActiveSession } from "@/lib/data/auth"
import { getTeacherDashboardSnapshot } from "@/lib/teacher-dashboard"

import TeacherDashboardClient from "./dashboard-client"

export default function TeacherDashboardPage() {
  const session = getActiveSession()
  if (!session) {
    redirect("/auth/sign-in")
  }
  if (session.role !== "teacher") {
    redirect("/dashboard")
  }

  const snapshot = getTeacherDashboardSnapshot(session.userId)

  return <TeacherDashboardClient snapshot={snapshot} />
}
