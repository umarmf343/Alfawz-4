import { redirect } from "next/navigation"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { getActiveSession } from "@/lib/data/auth"
import { listClassesForTeacher, listStudentsForTeacher } from "@/lib/data/teacher-database"

function formatDateLabel(timestamp?: string | null) {
  if (!timestamp) {
    return "No activity yet"
  }

  const date = new Date(timestamp)
  if (Number.isNaN(date.getTime())) {
    return "No activity yet"
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date)
}

export default function TeacherStudentsPage() {
  const session = getActiveSession()
  if (!session) {
    redirect("/auth/sign-in")
  }
  if (session.role !== "teacher") {
    redirect("/dashboard")
  }

  const students = listStudentsForTeacher(session.userId)
  const classes = listClassesForTeacher(session.userId)

  const totalStudents = students.length
  const averageMemorization =
    totalStudents === 0
      ? 0
      : Math.round(
          students.reduce((total, student) => total + student.memorizationProgress, 0) / totalStudents,
        )
  const averageRecitation =
    totalStudents === 0
      ? 0
      : Math.round(students.reduce((total, student) => total + student.recitationProgress, 0) / totalStudents)

  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-8 px-4 py-10">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Student Roster</h1>
        <p className="text-muted-foreground">
          Monitor every learner assigned to your classes and review their memorization momentum at a glance.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Students</CardTitle>
            <CardDescription className="text-3xl font-semibold text-foreground">{totalStudents}</CardDescription>
          </CardHeader>
        </Card>
        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg. Memorization Progress</CardTitle>
            <CardDescription className="text-3xl font-semibold text-foreground">{averageMemorization}%</CardDescription>
          </CardHeader>
        </Card>
        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg. Recitation Accuracy</CardTitle>
            <CardDescription className="text-3xl font-semibold text-foreground">{averageRecitation}%</CardDescription>
          </CardHeader>
        </Card>
      </div>

      <Card className="border-border/60">
        <CardHeader>
          <CardTitle>Students</CardTitle>
          <CardDescription>
            Each learner is automatically grouped by the classes you oversee so you can follow-up with ease.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {students.length === 0 ? (
            <p className="text-sm text-muted-foreground">No students are assigned to your classes yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Classes</TableHead>
                    <TableHead className="text-right">Streak</TableHead>
                    <TableHead className="text-right">Hasanat</TableHead>
                    <TableHead className="text-right">Memorization</TableHead>
                    <TableHead className="text-right">Recitation</TableHead>
                    <TableHead className="text-right">Last Active</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell className="font-medium">
                        <div className="flex flex-col">
                          <span>{student.name}</span>
                          <span className="text-xs text-muted-foreground">{student.email}</span>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[220px]">
                        <div className="flex flex-wrap gap-1">
                          {student.classNames.map((className, index) => (
                            <Badge key={`${student.id}-${student.classIds[index]}`} variant="secondary">
                              {className}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">{student.streak} days</TableCell>
                      <TableCell className="text-right">{student.hasanat}</TableCell>
                      <TableCell className="text-right">{student.memorizationProgress}%</TableCell>
                      <TableCell className="text-right">{student.recitationProgress}%</TableCell>
                      <TableCell className="text-right text-sm text-muted-foreground">
                        {formatDateLabel(student.lastActiveAt)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-border/60">
        <CardHeader>
          <CardTitle>Your Classes</CardTitle>
          <CardDescription>Quick summary of the cohorts you&apos;re currently supporting.</CardDescription>
        </CardHeader>
        <CardContent>
          {classes.length === 0 ? (
            <p className="text-sm text-muted-foreground">No classes have been created for this instructor yet.</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {classes.map((classRecord) => (
                <div key={classRecord.id} className="rounded-lg border border-border/60 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-semibold">{classRecord.name}</h3>
                      <p className="text-sm text-muted-foreground">{classRecord.description ?? "No description yet."}</p>
                    </div>
                    <Badge variant="outline">{classRecord.studentCount} students</Badge>
                  </div>
                  {classRecord.schedule && (
                    <p className="mt-3 text-sm text-muted-foreground">Schedule: {classRecord.schedule}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  )
}
