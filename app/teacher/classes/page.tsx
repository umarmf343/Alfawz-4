import { redirect } from "next/navigation"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { getActiveSession } from "@/lib/data/auth"
import { listClassesForTeacher, listStudentsForTeacher } from "@/lib/data/teacher-database"

export default function TeacherClassesPage() {
  const session = getActiveSession()
  if (!session) {
    redirect("/auth/sign-in")
  }
  if (session.role !== "teacher") {
    redirect("/dashboard")
  }

  const classes = listClassesForTeacher(session.userId)
  const students = listStudentsForTeacher(session.userId)
  const studentsById = new Map(students.map((student) => [student.id, student]))

  const totalStudents = classes.reduce((total, classRecord) => total + classRecord.studentCount, 0)

  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-8 px-4 py-10">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Classes & Cohorts</h1>
        <p className="text-muted-foreground">
          Review each learning circle, its schedule, and the students assigned to you.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Classes</CardTitle>
            <CardDescription className="text-3xl font-semibold text-foreground">{classes.length}</CardDescription>
          </CardHeader>
        </Card>
        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Learners Assigned</CardTitle>
            <CardDescription className="text-3xl font-semibold text-foreground">{totalStudents}</CardDescription>
          </CardHeader>
        </Card>
        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Average Class Size</CardTitle>
            <CardDescription className="text-3xl font-semibold text-foreground">
              {classes.length === 0 ? 0 : Math.round(totalStudents / classes.length)}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>

      {classes.length === 0 ? (
        <Card className="border-border/60">
          <CardContent className="py-10 text-center text-muted-foreground">
            You don&apos;t have any classes yet. Create a class to begin assigning memorization plans and tasks.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {classes.map((classRecord) => (
            <Card key={classRecord.id} className="border-border/60">
              <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <CardTitle className="text-2xl font-semibold">{classRecord.name}</CardTitle>
                  <CardDescription>{classRecord.description ?? "No description has been added yet."}</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{classRecord.schedule ?? "Schedule coming soon"}</Badge>
                  <Badge variant="outline">{classRecord.studentCount} students</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Enrolled Students</h3>
                  <Separator className="my-3" />
                  {classRecord.studentIds.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No students have been added to this class yet.
                    </p>
                  ) : (
                    <div className="grid gap-3 md:grid-cols-2">
                      {classRecord.studentIds.map((studentId) => {
                        const student = studentsById.get(studentId)
                        if (!student) {
                          return null
                        }
                        return (
                          <div
                            key={student.id}
                            className="rounded-lg border border-border/50 bg-background/80 p-4 shadow-sm"
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-base font-semibold">{student.name}</p>
                                <p className="text-xs text-muted-foreground">{student.email}</p>
                              </div>
                              <Badge variant="outline">{student.streak} day streak</Badge>
                            </div>
                            <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                              <div>
                                <p className="text-muted-foreground">Memorization</p>
                                <p className="font-semibold">{student.memorizationProgress}%</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Recitation</p>
                                <p className="font-semibold">{student.recitationProgress}%</p>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </main>
  )
}
