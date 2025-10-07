import { redirect } from "next/navigation"

import { getActiveSession } from "@/lib/data/auth"
import {
  listClassesForTeacher,
  listTeacherMemorizationPlans,
  suggestMemorizationPlans,
} from "@/lib/data/teacher-database"

import PlanManagementClient from "./PlanManagementClient"

export default function TeacherMemorizationPlansPage() {
  const session = getActiveSession()
  if (!session) {
    redirect("/auth/sign-in")
  }
  if (session.role !== "teacher") {
    redirect("/dashboard")
  }

  const plans = listTeacherMemorizationPlans(session.userId)
  const classes = listClassesForTeacher(session.userId)
  const suggestions = suggestMemorizationPlans(session.userId)

  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-8 px-4 py-10">
      <PlanManagementClient
        teacherId={session.userId}
        initialPlans={plans}
        initialClasses={classes}
        suggestions={suggestions}
      />
    </main>
  )
}
