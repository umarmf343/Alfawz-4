"use client"

import { useMemo, useState, useTransition } from "react"
import Link from "next/link"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import {
  BarChart3,
  BellRing,
  BookOpen,
  Calendar,
  CheckCircle,
  Clock,
  Eye,
  Mail,
  MessageSquare,
  Plus,
  Send,
  Star,
  TrendingUp,
  Users,
} from "lucide-react"

import type { TeacherRecitationTaskSummary, TeacherStudentSummary } from "@/lib/data/teacher-database"
import type { TeacherDashboardSnapshot, TeacherUpcomingSession } from "@/lib/teacher-dashboard"

interface TeacherDashboardClientProps {
  snapshot: TeacherDashboardSnapshot
}

const ROLE_LABEL: Record<TeacherDashboardSnapshot["teacher"]["role"], string> = {
  head: "Lead Instructor",
  assistant: "Assistant Teacher",
}

function formatDateTime(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return "Date pending"
  }
  return new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(date)
}

function formatDate(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return "Date pending"
  }
  return new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(date)
}

function formatRelativeDue(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return "No due date"
  }
  const diffMs = date.getTime() - Date.now()
  const dayMs = 24 * 60 * 60 * 1000
  const diffDays = Math.round(diffMs / dayMs)
  if (diffDays === 0) {
    return "Due today"
  }
  if (diffDays > 0) {
    return `Due in ${diffDays} day${diffDays === 1 ? "" : "s"}`
  }
  return `Overdue by ${Math.abs(diffDays)} day${Math.abs(diffDays) === 1 ? "" : "s"}`
}

function getStatusColor(status: TeacherRecitationTaskSummary["status"]): string {
  switch (status) {
    case "reviewed":
      return "gradient-gold text-white border-0"
    case "submitted":
      return "bg-blue-100 text-blue-800"
    default:
      return "bg-orange-100 text-orange-800"
  }
}

function normalizeProgress(value: number): number {
  if (value < 0) return 0
  if (value > 100) return 100
  return Math.round(value)
}

export default function TeacherDashboardClient({ snapshot }: TeacherDashboardClientProps) {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("overview")
  const [reminderDialogOpen, setReminderDialogOpen] = useState(false)
  const [messageDialogOpen, setMessageDialogOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState<TeacherRecitationTaskSummary | null>(null)
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null)
  const [reminderMessage, setReminderMessage] = useState("")
  const [messageBody, setMessageBody] = useState("")
  const [isReminderPending, startReminder] = useTransition()
  const [isMessagePending, startMessage] = useTransition()

  const studentDirectory = snapshot.studentDirectory
  const classDirectory = snapshot.classDirectory

  const pendingTasks = useMemo(
    () => snapshot.recitationTasks.filter((task) => task.status !== "reviewed"),
    [snapshot.recitationTasks],
  )

  const studentDisplay = useMemo(() => new Map(Object.entries(studentDirectory)), [studentDirectory])
  const studentSummaryMap = useMemo(
    () => new Map(snapshot.students.map((student) => [student.id, student])),
    [snapshot.students],
  )
  const totalClassStudents = useMemo(
    () => snapshot.classes.reduce((total, classRecord) => total + classRecord.studentCount, 0),
    [snapshot.classes],
  )
  const averageClassSize = useMemo(() => {
    if (snapshot.classes.length === 0) {
      return 0
    }
    return Math.round(totalClassStudents / snapshot.classes.length)
  }, [snapshot.classes.length, totalClassStudents])

  const handleOpenReminder = (task: TeacherRecitationTaskSummary) => {
    setSelectedTask(task)
    setReminderMessage(
      `Assalamu alaikum ${task.studentName}, please submit your ${task.surah} • ${task.ayahRange} recitation by ${formatDateTime(
        task.dueDate,
      )}.`,
    )
    setReminderDialogOpen(true)
  }

  const handleSendReminder = () => {
    if (!selectedTask) {
      return
    }
    if (!reminderMessage.trim()) {
      toast({
        title: "Add a reminder message",
        description: "Share a short note so the student understands what to do.",
        variant: "destructive",
      })
      return
    }

    startReminder(async () => {
      try {
        const response = await fetch("/api/teacher/reminders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ taskId: selectedTask.id, message: reminderMessage }),
        })

        const data = (await response.json()) as { error?: string }
        if (!response.ok) {
          throw new Error(data.error ?? "Unable to send reminder")
        }

        toast({
          title: "Reminder sent",
          description: `${selectedTask.studentName} has been notified about ${selectedTask.surah}.`,
        })
        setReminderDialogOpen(false)
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to send reminder"
        toast({ title: "Reminder not sent", description: message, variant: "destructive" })
      }
    })
  }

  const handleOpenMessage = (studentId: string) => {
    setSelectedStudentId(studentId)
    const student = studentDisplay.get(studentId)
    setMessageBody(
      student
        ? `Assalamu alaikum ${student.name}, just checking in on your memorization goals. Let me know if you need any support.`
        : "Assalamu alaikum, let me know if you need any support with your recitation.",
    )
    setMessageDialogOpen(true)
  }

  const handleSendMessage = () => {
    if (!selectedStudentId) {
      return
    }
    if (!messageBody.trim()) {
      toast({
        title: "Write a quick message",
        description: "Share encouragement or clear next steps for your learner.",
        variant: "destructive",
      })
      return
    }

    startMessage(async () => {
      try {
        const response = await fetch("/api/teacher/notes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ studentId: selectedStudentId, message: messageBody, category: "communication" }),
        })
        const data = (await response.json()) as { error?: string }
        if (!response.ok) {
          throw new Error(data.error ?? "Unable to send message")
        }
        const student = studentDisplay.get(selectedStudentId)
        toast({
          title: "Message delivered",
          description: student
            ? `${student.name} will see your note in their feedback stream.`
            : "Your note has been logged for this learner.",
        })
        setMessageDialogOpen(false)
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to send message"
        toast({ title: "Message not sent", description: message, variant: "destructive" })
      }
    })
  }

  const roleLabel = ROLE_LABEL[snapshot.teacher.role]

  return (
    <div className="min-h-screen bg-gradient-cream">
      <Dialog open={reminderDialogOpen} onOpenChange={setReminderDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Send reminder</DialogTitle>
            <DialogDescription>
              Encourage your learner to submit the pending recitation. The note appears instantly in their teacher feedback
              feed.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              {selectedTask
                ? `${selectedTask.studentName} • ${selectedTask.surah} • ${selectedTask.ayahRange}`
                : "Select a recitation task to notify."}
            </p>
            <Textarea
              value={reminderMessage}
              onChange={(event) => setReminderMessage(event.target.value)}
              placeholder="Share a gentle nudge or clarify what should be submitted."
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReminderDialogOpen(false)} className="bg-transparent">
              Cancel
            </Button>
            <Button onClick={handleSendReminder} disabled={isReminderPending} className="gradient-maroon text-white border-0">
              <BellRing className="mr-2 h-4 w-4" />
              {isReminderPending ? "Sending..." : "Send reminder"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={messageDialogOpen} onOpenChange={setMessageDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Message learner</DialogTitle>
            <DialogDescription>
              Your note is saved as instructor feedback so the learner and parents can review it later.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={messageBody}
            onChange={(event) => setMessageBody(event.target.value)}
            placeholder="Share encouragement, next steps, or a summary of class feedback."
            rows={4}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setMessageDialogOpen(false)} className="bg-transparent">
              Cancel
            </Button>
            <Button onClick={handleSendMessage} disabled={isMessagePending} className="gradient-maroon text-white border-0">
              <Mail className="mr-2 h-4 w-4" />
              {isMessagePending ? "Sending..." : "Send message"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <header className="border-b border-border/50 bg-background/80 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-maroon-600 to-maroon-800">
              <BookOpen className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Teacher Dashboard</h1>
              <p className="text-xs text-muted-foreground">{snapshot.teacher.name}</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Badge className="gradient-gold text-white border-0 px-3 py-1">{roleLabel}</Badge>
            {snapshot.teacher.specialization ? (
              <Badge variant="secondary" className="px-3 py-1">
                {snapshot.teacher.specialization}
              </Badge>
            ) : null}
            <Link href="/teacher/assignments/create">
              <Button className="gradient-maroon text-white border-0">
                <Plus className="mr-2 h-4 w-4" />
                New Assignment
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 space-y-1">
          <h2 className="text-3xl font-bold text-foreground">Assalamu alaikum, {snapshot.teacher.name.split(" ")[0]}</h2>
          <p className="text-lg text-muted-foreground">
            Track momentum across your classes and take action the moment a learner needs support.
          </p>
        </div>

        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className="border-border/50 hover:shadow-lg transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total students</p>
                  <p className="text-2xl font-bold text-primary">{snapshot.summary.classStats.totalStudents}</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-maroon-600 to-maroon-800">
                  <Users className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/50 hover:shadow-lg transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active in last 24h</p>
                  <p className="text-2xl font-bold text-primary">{snapshot.summary.classStats.activeStudents}</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-yellow-500">
                  <TrendingUp className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/50 hover:shadow-lg transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Tasks reviewed</p>
                  <p className="text-2xl font-bold text-primary">{snapshot.summary.classStats.completedAssignments}</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-maroon-600 to-maroon-800">
                  <CheckCircle className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/50 hover:shadow-lg transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Avg. recitation accuracy</p>
                  <p className="text-2xl font-bold text-primary">{snapshot.summary.classStats.averageProgress}%</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-yellow-500">
                  <BarChart3 className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="mb-8 border-border/50 shadow-lg">
          <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle className="text-xl">Gamification insights</CardTitle>
              <CardDescription>Habit Quest activity across your learners updates in real time.</CardDescription>
            </div>
            <Badge variant="secondary" className="px-3 py-1">
              {snapshot.summary.gamification.completedTasks} quests cleared
            </Badge>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-4">
            <div className="rounded-lg border border-border/50 p-4">
              <p className="text-xs text-muted-foreground uppercase">Completed quests</p>
              <p className="text-2xl font-bold text-primary">{snapshot.summary.gamification.completedTasks}</p>
            </div>
            <div className="rounded-lg border border-border/50 p-4">
              <p className="text-xs text-muted-foreground uppercase">Pending quests</p>
              <p className="text-2xl font-bold text-primary">{snapshot.summary.gamification.pendingTasks}</p>
            </div>
            <div className="rounded-lg border border-border/50 p-4">
              <p className="text-xs text-muted-foreground uppercase">Active boosts</p>
              <p className="text-2xl font-bold text-primary">{snapshot.summary.gamification.activeBoosts}</p>
            </div>
            <div className="rounded-lg border border-border/50 p-4">
              <p className="text-xs text-muted-foreground uppercase">Avg. season level</p>
              <p className="text-2xl font-bold text-primary">{snapshot.summary.gamification.averageSeasonLevel}</p>
            </div>
          </CardContent>
        </Card>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="assignments">Assignments</TabsTrigger>
            <TabsTrigger value="classes">Classes</TabsTrigger>
            <TabsTrigger value="students">Students</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2 space-y-4">
                <Card className="border-border/50 shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-xl">Recent recitation checkpoints</CardTitle>
                    <CardDescription>Follow up on the latest recitation tasks issued to your learners.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {snapshot.recentAssignments.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No recitation tasks have been assigned yet.</p>
                    ) : (
                      snapshot.recentAssignments.map((assignment) => {
                        const studentId = assignment.studentId
                        const student = studentId ? studentDisplay.get(studentId) : undefined
                        return (
                          <div
                            key={`${assignment.id}-${studentId ?? "cohort"}`}
                            className="flex flex-col gap-4 rounded-lg border border-border/50 p-4 transition-colors hover:border-primary/40 md:flex-row md:items-center md:justify-between"
                          >
                            <div className="flex-1 space-y-2">
                              <div className="flex flex-wrap items-center gap-3">
                                <h4 className="text-base font-semibold">{assignment.title}</h4>
                                <Badge variant="secondary" className={getStatusColor(assignment.status)}>
                                  {assignment.status === "reviewed"
                                    ? "Reviewed"
                                    : assignment.status === "submitted"
                                      ? "Submitted"
                                      : "Assigned"}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">{assignment.className}</p>
                              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                                <span className="flex items-center">
                                  <Calendar className="mr-2 h-4 w-4" />
                                  Due {formatDate(assignment.dueDate)}
                                </span>
                                <span className="flex items-center">
                                  <CheckCircle className="mr-2 h-4 w-4" />
                                  {assignment.submitted}/{assignment.total} submitted
                                </span>
                                {student ? (
                                  <span className="flex items-center">
                                    <Users className="mr-2 h-4 w-4" />
                                    {student.name}
                                  </span>
                                ) : null}
                              </div>
                            </div>
                            {studentId ? (
                              <Link href={`/teacher/students/${studentId}`}>
                                <Button variant="outline" size="sm" className="bg-transparent">
                                  <Eye className="mr-2 h-4 w-4" />
                                  View learner
                                </Button>
                              </Link>
                            ) : (
                              <Link href="/teacher/assignments">
                                <Button variant="outline" size="sm" className="bg-transparent">
                                  <Eye className="mr-2 h-4 w-4" />
                                  View assignment
                                </Button>
                              </Link>
                            )}
                          </div>
                        )
                      })
                    )}
                    <Link href="/teacher/assignments">
                      <Button variant="outline" className="w-full bg-transparent">
                        View all assignments
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-6">
                <Card className="border-border/50">
                  <CardHeader>
                    <CardTitle className="text-lg">Quick actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Link href="/teacher/assignments/create">
                      <Button className="w-full justify-start gradient-maroon text-white border-0">
                        <Plus className="mr-2 h-4 w-4" />
                        Create assignment
                      </Button>
                    </Link>
                    <Link href="/teacher/students">
                      <Button variant="outline" className="w-full justify-start bg-transparent">
                        <Users className="mr-2 h-4 w-4" />
                        Manage students
                      </Button>
                    </Link>
                    <Link href="/teacher/classes">
                      <Button variant="outline" className="w-full justify-start bg-transparent">
                        <BookOpen className="mr-2 h-4 w-4" />
                        View classes
                      </Button>
                    </Link>
                    <Link href="/teacher/reports">
                      <Button variant="outline" className="w-full justify-start bg-transparent">
                        <BarChart3 className="mr-2 h-4 w-4" />
                        Generate reports
                      </Button>
                    </Link>
                  </CardContent>
                </Card>

                <Card className="border-border/50">
                  <CardHeader>
                    <CardTitle className="text-lg">Today&apos;s schedule</CardTitle>
                    <CardDescription>Sessions ordered by due time across your roster.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {snapshot.upcomingSessions.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No sessions scheduled in the next few days.</p>
                    ) : (
                      snapshot.upcomingSessions.map((session) => (
                        <ScheduleCard key={session.id} session={session} />
                      ))
                    )}
                    <Link href="/teacher/assignments">
                      <Button variant="outline" className="mt-4 w-full bg-transparent">
                        <Calendar className="mr-2 h-4 w-4" />
                        View assignment calendar
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="assignments" className="space-y-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <h3 className="text-2xl font-bold">Assignment management</h3>
              <Link href="/teacher/assignments/create">
                <Button className="gradient-maroon text-white border-0">
                  <Plus className="mr-2 h-4 w-4" />
                  Create new assignment
                </Button>
              </Link>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              {snapshot.assignments.length === 0 ? (
                <Card className="border-border/50">
                  <CardContent className="py-10 text-center text-sm text-muted-foreground">
                    You haven&apos;t published any assignments yet. Create one to deliver a recitation task instantly.
                  </CardContent>
                </Card>
              ) : (
                snapshot.assignments.map((summary) => (
                  <Card key={summary.assignment.id} className="border-border/50">
                    <CardContent className="space-y-4 p-6">
                      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                        <div>
                          <h4 className="text-lg font-semibold">{summary.assignment.title}</h4>
                          <p className="text-sm text-muted-foreground">
                            {summary.assignment.surahName} • {summary.assignment.ayahRange}
                          </p>
                        </div>
                        <Badge variant="secondary" className={getStatusColor(summary.assignment.status === "archived" ? "reviewed" : summary.assignment.status === "published" ? "submitted" : "assigned")}>
                          {summary.assignment.status}
                        </Badge>
                      </div>

                      <div className="grid gap-2 text-sm md:grid-cols-2">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          Due {formatDate(summary.assignment.dueDate)}
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Users className="h-4 w-4" />
                          {summary.assignment.classIds.length > 0
                            ? summary.assignment.classIds
                                .map((classId) => classDirectory[classId] ?? classId)
                                .join(", ")
                            : "Individual learners"}
                        </div>
                      </div>

                      <div className="grid gap-2 md:grid-cols-3">
                        <div>
                          <p className="text-xs text-muted-foreground uppercase">Assigned</p>
                          <p className="text-base font-semibold">{summary.stats.assignedStudents}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground uppercase">Submitted</p>
                          <p className="text-base font-semibold">{summary.stats.submitted}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground uppercase">Reviewed</p>
                          <p className="text-base font-semibold">{summary.stats.reviewed}</p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-3">
                        <Link href={`/teacher/assignments/${summary.assignment.id}`}>
                          <Button variant="outline" size="sm" className="bg-transparent">
                            <Eye className="mr-2 h-4 w-4" />
                            View details
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>

            <Card className="border-border/50">
              <CardHeader>
                <CardTitle>Pending recitation submissions</CardTitle>
                <CardDescription>Send reminders before due dates slip by.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {pendingTasks.length === 0 ? (
                  <p className="text-sm text-muted-foreground">All recitation tasks are either submitted or reviewed. Excellent!</p>
                ) : (
                  pendingTasks.map((task) => (
                    <div
                      key={task.id}
                      className="flex flex-col gap-4 rounded-lg border border-border/50 p-4 md:flex-row md:items-center md:justify-between"
                    >
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="text-base font-semibold">{task.surah} • {task.ayahRange}</h4>
                          <Badge variant="secondary" className={getStatusColor(task.status)}>
                            {task.status === "submitted" ? "Awaiting review" : "Pending"}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {task.studentName}
                          {task.classNames.length > 0 ? ` • ${task.classNames.join(", ")}` : ""}
                        </p>
                        <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center">
                            <Clock className="mr-2 h-4 w-4" />
                            {formatRelativeDue(task.dueDate)}
                          </span>
                          <span className="flex items-center">
                            <Calendar className="mr-2 h-4 w-4" />
                            Due {formatDate(task.dueDate)}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Link href={`/teacher/students/${task.studentId}`}>
                          <Button variant="outline" size="sm" className="bg-transparent">
                            <Eye className="mr-2 h-4 w-4" />
                            View learner
                          </Button>
                        </Link>
                        <Button
                          variant="outline"
                          size="sm"
                          className="bg-transparent"
                          onClick={() => handleOpenReminder(task)}
                        >
                          <Send className="mr-2 h-4 w-4" />
                          Send reminder
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="classes" className="space-y-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h3 className="text-2xl font-bold">Class roster</h3>
                <p className="text-sm text-muted-foreground">
                  Monitor the circles entrusted to you and follow up with learners right from the dashboard.
                </p>
              </div>
              <div className="text-sm text-muted-foreground">
                {snapshot.classes.length} class{snapshot.classes.length === 1 ? "" : "es"} • {totalClassStudents} learner
                {totalClassStudents === 1 ? "" : "s"}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-muted-foreground">Assigned classes</CardTitle>
                  <CardDescription className="text-3xl font-semibold text-foreground">
                    {snapshot.classes.length}
                  </CardDescription>
                </CardHeader>
              </Card>
              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-muted-foreground">Enrolled learners</CardTitle>
                  <CardDescription className="text-3xl font-semibold text-foreground">
                    {totalClassStudents}
                  </CardDescription>
                </CardHeader>
              </Card>
              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-muted-foreground">Average class size</CardTitle>
                  <CardDescription className="text-3xl font-semibold text-foreground">{averageClassSize}</CardDescription>
                </CardHeader>
              </Card>
            </div>

            {snapshot.classes.length === 0 ? (
              <Card className="border-border/50">
                <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
                  <p className="text-sm text-muted-foreground">
                    You haven&apos;t been assigned to any classes yet. Once a class is created for you, it will appear here instantly.
                  </p>
                  <Link href="/teacher/classes">
                    <Button variant="outline" className="bg-transparent">
                      Manage classes
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {snapshot.classes.map((classRecord) => {
                  const enrolledStudents = classRecord.studentIds
                    .map((studentId) => studentSummaryMap.get(studentId))
                    .filter((student): student is TeacherStudentSummary => Boolean(student))
                  const highlightedStudents = enrolledStudents.slice(0, 3)

                  return (
                    <Card key={classRecord.id} className="border-border/50">
                      <CardHeader className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                        <div>
                          <CardTitle className="text-lg font-semibold">{classRecord.name}</CardTitle>
                          <CardDescription>
                            {classRecord.description ?? "No description has been added yet."}
                          </CardDescription>
                        </div>
                        <div className="flex flex-col items-start gap-2 text-sm text-muted-foreground md:items-end">
                          <Badge variant="secondary">
                            {classRecord.schedule ?? "Schedule coming soon"}
                          </Badge>
                          <Badge variant="outline">{classRecord.studentCount} students</Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {highlightedStudents.length === 0 ? (
                          <p className="text-sm text-muted-foreground">
                            No learners have been assigned to this class yet.
                          </p>
                        ) : (
                          <div className="space-y-3">
                            {highlightedStudents.map((student) => (
                              <div key={student.id} className="flex items-center justify-between rounded-lg border border-border/40 p-3">
                                <div>
                                  <p className="text-sm font-semibold">{student.name}</p>
                                  <p className="text-xs text-muted-foreground">{student.email}</p>
                                </div>
                                <Badge variant="outline">{student.streak} day streak</Badge>
                              </div>
                            ))}
                            {classRecord.studentCount > highlightedStudents.length ? (
                              <p className="text-xs text-muted-foreground">
                                And {classRecord.studentCount - highlightedStudents.length} more learner
                                {classRecord.studentCount - highlightedStudents.length === 1 ? "" : "s"} awaiting your guidance.
                              </p>
                            ) : null}
                          </div>
                        )}

                        <div className="flex flex-wrap gap-2">
                          <Link href="/teacher/classes">
                            <Button variant="outline" size="sm" className="bg-transparent">
                              View class details
                            </Button>
                          </Link>
                          <Link href="/teacher/students">
                            <Button variant="outline" size="sm" className="bg-transparent">
                              Manage learners
                            </Button>
                          </Link>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="students" className="space-y-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <h3 className="text-2xl font-bold">Student progress</h3>
              <div className="text-sm text-muted-foreground">
                {snapshot.students.length} learners • {snapshot.classes.length} classes
              </div>
            </div>

            <div className="grid gap-4">
              {snapshot.students.map((student) => (
                <Card key={student.id} className="border-border/50 transition-shadow hover:shadow-md">
                  <CardContent className="space-y-4 p-6">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-maroon-600 to-maroon-800 text-white text-lg font-semibold">
                          {student.name.charAt(0)}
                        </div>
                        <div>
                          <h4 className="text-lg font-semibold">{student.name}</h4>
                          <p className="text-sm text-muted-foreground">{student.email}</p>
                          <p className="text-xs text-muted-foreground">
                            {student.classNames.length > 0 ? student.classNames.join(", ") : "No class assigned"}
                          </p>
                        </div>
                      </div>
                      <div className="space-y-2 text-right">
                        <div className="flex items-center justify-end gap-2 text-sm">
                          <Star className="h-4 w-4 text-amber-500" />
                          <span>{student.streak} day streak</span>
                        </div>
                        <Badge className="gradient-gold text-white border-0">
                          {student.memorizationProgress}% memorization
                        </Badge>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>Memorization progress</span>
                        <span>{student.memorizationProgress}%</span>
                      </div>
                      <Progress value={normalizeProgress(student.memorizationProgress)} />
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Recitation accuracy</span>
                        <span>{student.recitationProgress}%</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <Link href={`/teacher/students/${student.id}`}>
                        <Button variant="outline" size="sm" className="bg-transparent">
                          <Eye className="mr-2 h-4 w-4" />
                          View profile
                        </Button>
                      </Link>
                      <Button variant="outline" size="sm" className="bg-transparent" onClick={() => handleOpenMessage(student.id)}>
                        <MessageSquare className="mr-2 h-4 w-4" />
                        Send message
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <h3 className="text-2xl font-bold">Class analytics</h3>
            <div className="grid gap-6 lg:grid-cols-2">
              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle>Student engagement</CardTitle>
                  <CardDescription>Live indicators of participation across your roster.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Daily active learners</span>
                    <span className="font-medium">
                      {snapshot.summary.classStats.activeStudents}/{snapshot.summary.classStats.totalStudents} (
                      {snapshot.analytics.dailyActivePercentage}%
                      )
                    </span>
                  </div>
                  <Progress value={normalizeProgress(snapshot.analytics.dailyActivePercentage)} />

                  <div className="flex items-center justify-between">
                    <span className="text-sm">Assignment submission rate</span>
                    <span className="font-medium">{snapshot.analytics.assignmentSubmissionRate}%</span>
                  </div>
                  <Progress value={normalizeProgress(snapshot.analytics.assignmentSubmissionRate)} />

                  <div className="flex items-center justify-between">
                    <span className="text-sm">Average study minutes</span>
                    <span className="font-medium">{snapshot.analytics.averageStudyMinutes} min/day</span>
                  </div>
                  <Progress value={normalizeProgress((snapshot.analytics.averageStudyMinutes / 120) * 100)} />
                </CardContent>
              </Card>

              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle>Performance metrics</CardTitle>
                  <CardDescription>Accuracy and review pipeline at a glance.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Average recitation score</span>
                    <span className="font-medium">{snapshot.analytics.averageRecitationScore}%</span>
                  </div>
                  <Progress value={normalizeProgress(snapshot.analytics.averageRecitationScore)} />

                  <div className="flex items-center justify-between">
                    <span className="text-sm">Memorization momentum</span>
                    <span className="font-medium">{snapshot.analytics.memorizationAverage}%</span>
                  </div>
                  <Progress value={normalizeProgress(snapshot.analytics.memorizationAverage)} />

                  <div className="flex items-center justify-between">
                    <span className="text-sm">Pending reviews</span>
                    <span className="font-medium">
                      {snapshot.analytics.pendingReviewCount} waiting ({snapshot.analytics.pendingReviewRate}%)
                    </span>
                  </div>
                  <Progress value={normalizeProgress(snapshot.analytics.pendingReviewRate)} />
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

function ScheduleCard({ session }: { session: TeacherUpcomingSession }) {
  return (
    <div className="flex items-start justify-between rounded-lg border border-border/50 bg-background/80 p-3">
      <div>
        <p className="font-medium text-sm">{session.title}</p>
        <p className="text-xs text-muted-foreground">{session.studentName}</p>
      </div>
      <div className="text-right text-xs text-muted-foreground">
        <p>{formatDateTime(session.dueDate)}</p>
        <p className={session.isOverdue ? "text-destructive" : ""}>{formatRelativeDue(session.dueDate)}</p>
      </div>
    </div>
  )
}
