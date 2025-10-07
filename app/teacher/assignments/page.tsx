import { redirect } from "next/navigation"

import Link from "next/link"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { getActiveSession } from "@/lib/data/auth"
import { listClassesForTeacher, listStudentsForTeacher, listTeacherAssignments } from "@/lib/data/teacher-database"

export default function TeacherAssignmentsPage() {
  const session = getActiveSession()
  if (!session) {
    redirect("/auth/sign-in")
  }
  if (session.role !== "teacher") {
    redirect("/dashboard")
  }

  const assignments = listTeacherAssignments(session.userId)
  const classes = listClassesForTeacher(session.userId)
  const students = listStudentsForTeacher(session.userId)

  const classDirectory = new Map(classes.map((classRecord) => [classRecord.id, classRecord.name]))
  const studentDirectory = new Map(students.map((student) => [student.id, student.name]))

  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-8 px-4 py-10">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Assignments</h1>
        <p className="text-muted-foreground">
          Review every recitation assignment you&apos;ve published, monitor submissions, and jump into learner feedback.
        </p>
      </div>

      {assignments.length === 0 ? (
        <Card className="border-border/60">
          <CardContent className="py-12 text-center text-muted-foreground">
            You haven&apos;t created any assignments yet. Publish one to appear here instantly.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {assignments.map((summary) => {
            const dueDate = new Date(summary.assignment.dueDate)
            const dueLabel = Number.isNaN(dueDate.getTime())
              ? "Due date pending"
              : new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(dueDate)
            const classNames =
              summary.assignment.classIds.length > 0
                ? summary.assignment.classIds
                    .map((classId) => classDirectory.get(classId) ?? classId)
                    .join(", ")
                : "Individual learners"

            return (
              <Card key={summary.assignment.id} className="border-border/60">
                <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-2xl font-semibold">{summary.assignment.title}</CardTitle>
                    <CardDescription>
                      {summary.assignment.surahName} • {summary.assignment.ayahRange}
                    </CardDescription>
                  </div>
                  <Badge variant="secondary">{summary.assignment.status}</Badge>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-3">
                    <div>
                      <p className="text-xs uppercase text-muted-foreground">Due</p>
                      <p className="text-sm font-medium text-foreground">{dueLabel}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase text-muted-foreground">Classes</p>
                      <p className="text-sm font-medium text-foreground">{classNames}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase text-muted-foreground">Assigned learners</p>
                      <p className="text-sm font-medium text-foreground">{summary.stats.assignedStudents}</p>
                    </div>
                  </div>

                  <Separator />

                  <div className="grid gap-4 md:grid-cols-3">
                    <div>
                      <p className="text-xs uppercase text-muted-foreground">Submitted</p>
                      <p className="text-base font-semibold text-foreground">{summary.stats.submitted}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase text-muted-foreground">Reviewed</p>
                      <p className="text-base font-semibold text-foreground">{summary.stats.reviewed}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase text-muted-foreground">Pending review</p>
                      <p className="text-base font-semibold text-foreground">
                        {Math.max(0, summary.stats.submitted - summary.stats.reviewed)}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <p className="text-xs uppercase text-muted-foreground">Latest submissions</p>
                    <div className="space-y-2">
                      {summary.submissions.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No student submissions yet.</p>
                      ) : (
                        summary.submissions.slice(0, 4).map((submission) => (
                          <div key={submission.id} className="flex items-center justify-between text-sm">
                            <span className="font-medium text-foreground">
                              {studentDirectory.get(submission.studentId) ?? submission.studentId}
                            </span>
                            <span className="text-muted-foreground">{submission.status.replace("_", " ")}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <Button asChild variant="outline" className="bg-transparent">
                      <Link href={`/teacher/assignments/${summary.assignment.id}`}>View assignment</Link>
                    </Button>
                    <Button asChild variant="outline" className="bg-transparent">
                      <Link href={`/teacher/assignments/create?assignmentId=${summary.assignment.id}`}>
                        Duplicate in builder
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </main>
  )
}
