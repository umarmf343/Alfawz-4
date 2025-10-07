import { notFound, redirect } from "next/navigation"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { getActiveSession } from "@/lib/data/auth"
import {
  getLearnerState,
  getLearnerStats,
  getTeacherNotes,
  listTeacherRecitationTasks,
  listStudentsForTeacher,
} from "@/lib/data/teacher-database"

interface PageProps {
  params: { studentId: string }
}

function formatDate(value: string | undefined | null) {
  if (!value) {
    return "—"
  }
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return "—"
  }
  return new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(date)
}

export default function TeacherStudentDetailPage({ params }: PageProps) {
  const session = getActiveSession()
  if (!session) {
    redirect("/auth/sign-in")
  }
  if (session.role !== "teacher") {
    redirect("/dashboard")
  }

  const students = listStudentsForTeacher(session.userId)
  const student = students.find((entry) => entry.id === params.studentId)
  if (!student) {
    notFound()
  }

  const learnerState = getLearnerState(student.id)
  const learnerStats = getLearnerStats(student.id)
  const notes = getTeacherNotes(student.id)
  const tasks = listTeacherRecitationTasks(session.userId)
    .filter((task) => task.studentId === student.id)
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-8 px-4 py-10">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{student.name}</h1>
          <p className="text-sm text-muted-foreground">{student.email}</p>
          <p className="text-xs text-muted-foreground">
            {student.classNames.length > 0 ? student.classNames.join(", ") : "No class assigned"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">{student.streak} day streak</Badge>
          <Badge variant="outline">Hasanat {student.hasanat}</Badge>
        </div>
      </div>

      <Card className="border-border/60">
        <CardHeader>
          <CardTitle>Progress overview</CardTitle>
          <CardDescription>Live metrics update every time the learner recites or reviews.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-2">
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span>Memorization progress</span>
              <span>{student.memorizationProgress}%</span>
            </div>
            <Progress value={student.memorizationProgress} />
            <div className="flex items-center justify-between text-sm">
              <span>Recitation accuracy</span>
              <span>{student.recitationProgress}%</span>
            </div>
            <Progress value={student.recitationProgress} />
          </div>
          <div className="space-y-3 text-sm text-muted-foreground">
            <p>Hasanat earned: {learnerStats?.hasanat ?? 0}</p>
            <p>Total ayahs read: {learnerStats?.ayahsRead ?? 0}</p>
            <p>Study minutes logged: {learnerStats?.studyMinutes ?? 0}</p>
            <p>Current XP level: {learnerStats?.level ?? 1}</p>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/60">
        <CardHeader>
          <CardTitle>Recitation tasks</CardTitle>
          <CardDescription>Monitor what&apos;s assigned, submitted, or awaiting your review.</CardDescription>
        </CardHeader>
        <CardContent>
          {tasks.length === 0 ? (
            <p className="text-sm text-muted-foreground">No recitation tasks assigned yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Task</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Due</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Reviewed</TableHead>
                  <TableHead>Score</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tasks.map((task) => (
                  <TableRow key={task.id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{task.surah} • {task.ayahRange}</span>
                        <span className="text-xs text-muted-foreground">
                          {task.classNames.length > 0 ? task.classNames.join(", ") : "Direct assignment"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="capitalize">{task.status}</TableCell>
                    <TableCell>{formatDate(task.dueDate)}</TableCell>
                    <TableCell>{formatDate(task.submittedAt)}</TableCell>
                    <TableCell>{formatDate(task.reviewedAt)}</TableCell>
                    <TableCell>{task.lastScore ?? "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card className="border-border/60">
        <CardHeader>
          <CardTitle>Instructor notes</CardTitle>
          <CardDescription>Recent reminders and feedback you or fellow teachers have left.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {notes.length === 0 ? (
            <p className="text-sm text-muted-foreground">No instructor notes recorded yet.</p>
          ) : (
            notes.map((note) => (
              <div key={note.id} className="rounded-lg border border-border/50 p-4">
                <div className="flex items-center justify-between">
                  <Badge variant="secondary" className="text-xs uppercase">
                    {note.category}
                  </Badge>
                  <span className="text-xs text-muted-foreground">{formatDate(note.createdAt)}</span>
                </div>
                <p className="mt-2 text-sm text-foreground">{note.note}</p>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {learnerState?.dashboard.activities.length ? (
        <Card className="border-border/60">
          <CardHeader>
            <CardTitle>Latest activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            {learnerState.dashboard.activities.slice(0, 5).map((activity) => (
              <div key={activity.id} className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground capitalize">{activity.type}</p>
                  {activity.surah ? <p className="text-xs">{activity.surah}</p> : null}
                </div>
                <span>{formatDate(activity.timestamp)}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}
    </main>
  )
}
