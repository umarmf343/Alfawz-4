import { redirect } from "next/navigation"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { getActiveSession } from "@/lib/data/auth"
import { getInstructorDashboardSummary } from "@/lib/data/teacher-database"

export default function TeacherReportsPage() {
  const session = getActiveSession()
  if (!session) {
    redirect("/auth/sign-in")
  }
  if (session.role !== "teacher") {
    redirect("/dashboard")
  }

  const summary = getInstructorDashboardSummary(session.userId)

  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-8 px-4 py-10">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Progress & Reports</h1>
        <p className="text-muted-foreground">
          Real-time insight into learner momentum, assignment completion, and gamified engagement across your classes.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Students</CardTitle>
            <CardDescription className="text-3xl font-semibold text-foreground">
              {summary.classStats.totalStudents}
            </CardDescription>
          </CardHeader>
        </Card>
        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Active in Last 24h</CardTitle>
            <CardDescription className="text-3xl font-semibold text-foreground">
              {summary.classStats.activeStudents}
            </CardDescription>
          </CardHeader>
        </Card>
        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Assignments Reviewed</CardTitle>
            <CardDescription className="text-3xl font-semibold text-foreground">
              {summary.classStats.completedAssignments}
            </CardDescription>
          </CardHeader>
        </Card>
        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg. Recitation Accuracy</CardTitle>
            <CardDescription className="text-3xl font-semibold text-foreground">
              {summary.classStats.averageProgress}%
            </CardDescription>
          </CardHeader>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-border/60">
          <CardHeader>
            <CardTitle>Recent Assignments</CardTitle>
            <CardDescription>Track delivery and submissions at a glance.</CardDescription>
          </CardHeader>
          <CardContent>
            {summary.recentAssignments.length === 0 ? (
              <p className="text-sm text-muted-foreground">No assignments have been issued yet.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Assignment</TableHead>
                    <TableHead className="text-right">Due Date</TableHead>
                    <TableHead className="text-right">Status</TableHead>
                    <TableHead className="text-right">Submissions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {summary.recentAssignments.map((assignment) => (
                    <TableRow key={assignment.id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{assignment.title}</span>
                          <span className="text-xs text-muted-foreground">{assignment.className}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right text-sm text-muted-foreground">
                        {new Date(assignment.dueDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant={assignment.status === "reviewed" ? "default" : "secondary"}>
                          {assignment.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {assignment.submitted}/{assignment.total}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader>
            <CardTitle>Top Student Progress</CardTitle>
            <CardDescription>Recognize momentum and offer timely encouragement.</CardDescription>
          </CardHeader>
          <CardContent>
            {summary.studentProgress.length === 0 ? (
              <p className="text-sm text-muted-foreground">No student activity has been recorded yet.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Learner</TableHead>
                    <TableHead className="text-right">Memorization</TableHead>
                    <TableHead className="text-right">Streak</TableHead>
                    <TableHead className="text-right">Recitation</TableHead>
                    <TableHead className="text-right">Last Active</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {summary.studentProgress.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell>{student.name}</TableCell>
                      <TableCell className="text-right">{student.progress}%</TableCell>
                      <TableCell className="text-right">{student.streak}</TableCell>
                      <TableCell className="text-right">{student.recitationAccuracy}%</TableCell>
                      <TableCell className="text-right text-sm text-muted-foreground">{student.lastActive}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/60">
        <CardHeader>
          <CardTitle>Gamification Snapshot</CardTitle>
          <CardDescription>Understand how your learners are interacting with Alfawz missions.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="rounded-lg border border-border/50 p-4">
              <p className="text-sm text-muted-foreground">Completed Tasks</p>
              <p className="text-2xl font-semibold">{summary.gamification.completedTasks}</p>
            </div>
            <div className="rounded-lg border border-border/50 p-4">
              <p className="text-sm text-muted-foreground">Pending Tasks</p>
              <p className="text-2xl font-semibold">{summary.gamification.pendingTasks}</p>
            </div>
            <div className="rounded-lg border border-border/50 p-4">
              <p className="text-sm text-muted-foreground">Active Boosts</p>
              <p className="text-2xl font-semibold">{summary.gamification.activeBoosts}</p>
            </div>
            <div className="rounded-lg border border-border/50 p-4">
              <p className="text-sm text-muted-foreground">Average Season Level</p>
              <p className="text-2xl font-semibold">{summary.gamification.averageSeasonLevel}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </main>
  )
}
