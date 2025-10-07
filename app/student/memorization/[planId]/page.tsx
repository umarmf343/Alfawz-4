import { notFound, redirect } from "next/navigation"
import { MemorizationSession } from "@/components/MemorizationSession"
import { getActiveSession } from "@/lib/data/auth"
import { getStudentMemorizationPlanContext } from "@/lib/data/teacher-database"

interface MemorizationPlanPageProps {
  params: { planId: string }
}

export default function MemorizationPlanPage({ params }: MemorizationPlanPageProps) {
  const session = getActiveSession()
  if (!session) {
    redirect("/auth/sign-in")
  }
  if (session.role !== "student") {
    redirect("/dashboard")
  }

  const planContext = getStudentMemorizationPlanContext(session.userId, decodeURIComponent(params.planId))
  if (!planContext) {
    notFound()
  }

  return (
    <MemorizationSession
      plan={planContext.plan}
      initialProgress={planContext.progress}
      classes={planContext.classes.map(({ id, name, description, teacherId, schedule }) => ({
        id,
        name,
        description,
        teacherId,
        schedule,
      }))}
      teacherName={planContext.teacher?.name}
    />
  )
}
