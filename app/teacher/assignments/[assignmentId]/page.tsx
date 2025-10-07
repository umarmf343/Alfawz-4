import { notFound, redirect } from "next/navigation"

import Link from "next/link"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { getActiveSession } from "@/lib/data/auth"
import {
  getTeacherAssignment,
  listClassesForTeacher,
  listStudentsForTeacher,
  type AssignmentSubmissionRecord,
} from "@/lib/data/teacher-database"

interface PageProps {
  params: { assignmentId: string }
}

function formatDate(value: string | undefined) {
  if (!value) {
    return "—"
  }
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return "—"
  }
  return new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(date)
}

function formatStatus(status: AssignmentSubmissionRecord["status"]) {
  return status.replace(/_/g, " ")
}

export default function AssignmentDetailPage({ params }: PageProps) {
  const session = getActiveSession()
  if (!session) {
    redirect("/auth/sign-in")
  }
  if (session.role !== "teacher") {
    redirect("/dashboard")
  }

  const summary = getTeacherAssignment(session.userId, params.assignmentId)
  if (!summary) {
    notFound()
  }

  const classes = listClassesForTeacher(session.userId)
  const students = listStudentsForTeacher(session.userId)
  const classDirectory = new Map(classes.map((classRecord) => [classRecord.id, classRecord.name]))
  const studentDirectory = new Map(students.map((student) => [student.id, student]))

  const dueLabel = formatDate(summary.assignment.dueDate)
  const classNames =
    summary.assignment.classIds.length > 0
      ? summary.assignment.classIds.map((classId) => classDirectory.get(classId) ?? classId).join(", ")
      : "Individual learners"

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-8 px-4 py-10">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">{summary.assignment.title}</h1>
        <p className="text-muted-foreground">
          {summary.assignment.surahName} • {summary.assignment.ayahRange}
        </p>
      </div>

      <Card className="border-border/60">
        <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg">Assignment overview</CardTitle>
            <CardDescription>Live stats update whenever a learner submits or you log a review.</CardDescription>
          </div>
          <Badge variant="secondary">{summary.assignment.status}</Badge>
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-3">
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
        </CardContent>
      </Card>

      {summary.assignment.instructions || summary.assignment.description ? (
        <Card className="border-border/60">
          <CardHeader>
            <CardTitle>Instructions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            {summary.assignment.instructions ? <p>{summary.assignment.instructions}</p> : null}
            {summary.assignment.description ? <p>{summary.assignment.description}</p> : null}
          </CardContent>
        </Card>
      ) : null}

      <Card className="border-border/60">
        <CardHeader>
          <CardTitle>Submissions</CardTitle>
          <CardDescription>Track every learner&apos;s status and jump to their profile.</CardDescription>
        </CardHeader>
        <CardContent>
          {summary.submissions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No learner submissions recorded yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Learner</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Reviewed</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {summary.submissions.map((submission) => {
                  const student = studentDirectory.get(submission.studentId)
                  return (
                    <TableRow key={submission.id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{student?.name ?? submission.studentId}</span>
                          {student?.email ? (
                            <span className="text-xs text-muted-foreground">{student.email}</span>
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell>{formatStatus(submission.status)}</TableCell>
                      <TableCell>{formatDate(submission.submittedAt)}</TableCell>
                      <TableCell>{formatDate(submission.reviewedAt)}</TableCell>
                      <TableCell>{submission.score ?? "—"}</TableCell>
                      <TableCell className="text-right">
                        <Button asChild variant="outline" size="sm" className="bg-transparent">
                          <Link href={`/teacher/students/${submission.studentId}`}>View learner</Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </main>
  )
}
