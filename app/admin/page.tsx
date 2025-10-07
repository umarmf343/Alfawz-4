"use client"

import { useMemo, useState } from "react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Users,
  BarChart3,
  DollarSign,
  Activity,
  TrendingUp,
  Settings,
  Sparkles,
  Clock3,
  BookOpen,
  AudioWaveform,
  Shield,
  ShieldCheck,
  AlertTriangle,
  Database,
  ListChecks,
  Radar,
  Calendar,
  GraduationCap,
  UserPlus,
} from "lucide-react"
import {
  createMemorizationClass,
  getAdminClassSummaries,
  getAdminOverview,
  getTeacherProfiles,
  listLearners,
} from "@/lib/data/teacher-database"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Checkbox } from "@/components/ui/checkbox"
import type { CheckedState } from "@radix-ui/react-checkbox"
import { useToast } from "@/hooks/use-toast"
import { getTajweedCMSOverview } from "@/lib/data/tajweed-cms"
import { getRecitationOpsOverview } from "@/lib/data/recitation-ops"
import TarteelMlIntegrationPanel from "@/components/admin/tarteel-ml-integration"
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

const statusBadgeStyles: Record<string, string> = {
  success: "bg-emerald-100 text-emerald-800 border border-emerald-200",
  warning: "bg-amber-100 text-amber-800 border border-amber-200",
  info: "bg-blue-100 text-blue-800 border border-blue-200",
  error: "bg-red-100 text-red-800 border border-red-200",
}

const pipelineStatusStyles: Record<string, string> = {
  green: "bg-emerald-100 text-emerald-700 border border-emerald-200",
  amber: "bg-amber-100 text-amber-700 border border-amber-200",
  red: "bg-red-100 text-red-700 border border-red-200",
}

const scriptStatusStyles: Record<string, string> = {
  ready: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  needs_attention: "bg-amber-50 text-amber-700 border border-amber-200",
  in_progress: "bg-sky-50 text-sky-700 border border-sky-200",
}

const monitorStatusStyles: Record<string, string> = {
  success: "bg-emerald-50 text-emerald-700",
  warning: "bg-amber-50 text-amber-700",
  error: "bg-red-50 text-red-700",
}

const alertSeverityStyles: Record<string, string> = {
  low: "bg-blue-50 text-blue-700 border border-blue-200",
  medium: "bg-amber-50 text-amber-700 border border-amber-200",
  high: "bg-red-50 text-red-700 border border-red-200",
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(value)

const formatNumber = (value: number) => new Intl.NumberFormat("en-NG").format(value)


export default function AdminDashboard() {
  const { stats, recentActivity, userGrowth, gamification } = getAdminOverview()
  const tajweedOverview = getTajweedCMSOverview()
  const recitationOps = getRecitationOpsOverview()
  const teacherDirectory = useMemo(() => getTeacherProfiles(), [])
  const studentDirectory = useMemo(() => listLearners({ role: "student" }), [])
  const initialClassSummaries = useMemo(() => getAdminClassSummaries(), [])
  const [classSummaries, setClassSummaries] = useState(initialClassSummaries)
  const [className, setClassName] = useState("")
  const [teacherId, setTeacherId] = useState<string>(teacherDirectory[0]?.id ?? "")
  const [schedule, setSchedule] = useState("")
  const [description, setDescription] = useState("")
  const [selectedStudents, setSelectedStudents] = useState<string[]>([])
  const [isCreatingClass, setIsCreatingClass] = useState(false)
  const [classCreationError, setClassCreationError] = useState<string | null>(null)
  const { toast } = useToast()

  const sortedClassSummaries = useMemo(
    () =>
      [...classSummaries].sort((a, b) => {
        const teacherCompare = a.teacher.name.localeCompare(b.teacher.name)
        if (teacherCompare !== 0) {
          return teacherCompare
        }
        return a.class.name.localeCompare(b.class.name)
      }),
    [classSummaries],
  )

  function handleToggleStudent(studentId: string, checked: CheckedState) {
    setSelectedStudents((current) => {
      const next = new Set(current)
      if (checked === true || checked === "indeterminate") {
        next.add(studentId)
      } else {
        next.delete(studentId)
      }
      return Array.from(next)
    })
  }

  function resetClassForm() {
    setClassName("")
    setSchedule("")
    setDescription("")
    setSelectedStudents([])
    setTeacherId(teacherDirectory[0]?.id ?? "")
  }

  function handleCreateClass() {
    if (!teacherId) {
      setClassCreationError("Select an instructor for this class")
      return
    }
    setIsCreatingClass(true)
    setClassCreationError(null)
    try {
      const summary = createMemorizationClass({
        name: className,
        teacherId,
        description,
        schedule,
        studentIds: selectedStudents,
      })
      setClassSummaries((current) => [...current, summary])
      toast({
        title: "Class created",
        description: `${summary.class.name} is now managed by ${summary.teacher.name}.`,
      })
      resetClassForm()
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "Failed to create class"
      setClassCreationError(message)
      toast({
        title: "Class creation failed",
        description: message,
        variant: "destructive",
      })
    } finally {
      setIsCreatingClass(false)
    }
  }

  const activeUserPercent =
    stats.totalUsers === 0 ? 0 : Math.round((stats.activeUsers / stats.totalUsers) * 100)
  const premiumUsers = Math.round((stats.subscriptionRate / 100) * stats.totalUsers)
  const basicUsers = Math.max(0, stats.totalUsers - premiumUsers)
  const totalGameTasks = gamification.completedTasks + gamification.pendingTasks
  const featureUsagePercent =
    totalGameTasks === 0 ? 0 : Math.round((gamification.completedTasks / totalGameTasks) * 100)
  const accuracyPercent = Math.round(recitationOps.summary.accuracy * 100)
  const wikiUpdatedAt = (() => {
    const parsed = new Date(recitationOps.summary.wikiUpdatedAt)
    if (Number.isNaN(parsed.getTime())) {
      return "Not yet synced"
    }
    return parsed.toLocaleString("en-NG", {
      dateStyle: "medium",
      timeStyle: "short",
    })
  })()

  const sampleUsers = recentActivity.slice(0, 5).map((activity, index) => {
    const tiers = ["Premium Student", "Teacher", "Guardian", "Student", "Student"]
    const status = activity.status ?? "success"
    const email = `${activity.user.toLowerCase().replace(/[^a-z0-9]+/g, ".")}@example.com`
    return {
      id: activity.id,
      name: activity.user,
      email,
      role: tiers[index] ?? "Student",
      status: status === "success" ? "Active" : status === "info" ? "Review" : "Attention",
      lastAction: activity.action,
      lastSeen: activity.time,
      badgeStyle: statusBadgeStyles[status] ?? statusBadgeStyles.success,
    }
  })

  const subscriptionBreakdown = [
    { label: "Premium", value: premiumUsers, color: "bg-maroon-600" },
    { label: "Basic", value: basicUsers, color: "bg-maroon-300" },
  ]

  return (
    <div className="space-y-8 px-6 py-8 lg:px-12">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-maroon-900">Alfawz Admin Control Centre</h1>
          <p className="text-muted-foreground">
            Monitor learner success, oversee tajwīd content operations, and keep recitation QA on track.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" className="gap-2">
            <Settings className="h-4 w-4" />
            Configure alerts
          </Button>
          <Button className="gap-2 bg-maroon-600 hover:bg-maroon-700">
            <Sparkles className="h-4 w-4" />
            Launch initiative
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="border-0 bg-gradient-to-br from-maroon-600 to-maroon-700 text-white">
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="text-sm text-white/70">Total learners</p>
              <p className="mt-2 text-3xl font-semibold">{formatNumber(stats.totalUsers)}</p>
              <p className="text-xs text-white/60">{activeUserPercent}% active this week</p>
            </div>
            <Users className="h-10 w-10 text-white/70" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="text-sm text-muted-foreground">Monthly revenue</p>
              <p className="mt-2 text-3xl font-semibold">{formatCurrency(stats.monthlyRevenue)}</p>
              <p className="text-xs text-muted-foreground">Annualised {formatCurrency(stats.totalRevenue)}</p>
            </div>
            <DollarSign className="h-10 w-10 text-maroon-600" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="text-sm text-muted-foreground">Recitation sessions</p>
              <p className="mt-2 text-3xl font-semibold">{formatNumber(stats.totalSessions)}</p>
              <p className="text-xs text-muted-foreground">Avg session {stats.avgSessionTime}</p>
            </div>
            <Activity className="h-10 w-10 text-maroon-600" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="text-sm text-muted-foreground">Completion rate</p>
              <p className="mt-2 text-3xl font-semibold">{stats.completionRate}%</p>
              <p className="text-xs text-muted-foreground">Subscription uptake {stats.subscriptionRate}%</p>
            </div>
            <TrendingUp className="h-10 w-10 text-maroon-600" />
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-1 gap-2 md:grid-cols-3 xl:grid-cols-8">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="classes">Classes</TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="recitation">Recitation QA</TabsTrigger>
          <TabsTrigger value="tajweed">Tajwīd CMS</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" /> User growth & revenue trend
                </CardTitle>
                <CardDescription>Tracking the last 6 months of product momentum.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {userGrowth.map((point) => (
                  <div key={point.month} className="flex flex-col gap-2">
                    <div className="flex items-center justify-between text-sm font-medium">
                      <span>{point.month}</span>
                      <span className="text-muted-foreground">{formatCurrency(point.revenue)}</span>
                    </div>
                    <Progress value={Math.min(100, (point.users / Math.max(stats.totalUsers, 1)) * 100)} />
                    <p className="text-xs text-muted-foreground">
                      {formatNumber(point.users)} learners engaged
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4" /> Gamification snapshot
                </CardTitle>
                <CardDescription>How the Alfawz quest system keeps learners motivated.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-lg border border-muted p-3">
                    <p className="text-xs text-muted-foreground">Completed quests</p>
                    <p className="text-xl font-semibold">{gamification.completedTasks}</p>
                  </div>
                  <div className="rounded-lg border border-muted p-3">
                    <p className="text-xs text-muted-foreground">Pending quests</p>
                    <p className="text-xl font-semibold">{gamification.pendingTasks}</p>
                  </div>
                  <div className="rounded-lg border border-muted p-3">
                    <p className="text-xs text-muted-foreground">Active boosts</p>
                    <p className="text-xl font-semibold">{gamification.activeBoosts}</p>
                  </div>
                  <div className="rounded-lg border border-muted p-3">
                    <p className="text-xs text-muted-foreground">Quest completion</p>
                    <p className="text-xl font-semibold">{featureUsagePercent}%</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium">Average season level</p>
                  <Progress value={Math.min(100, (gamification.averageSeasonLevel / 20) * 100)} />
                  <p className="mt-1 text-xs text-muted-foreground">
                    Level {gamification.averageSeasonLevel} • Energy {gamification.averageEnergy}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-4 w-4" /> Live learner activity
              </CardTitle>
              <CardDescription>Latest recitation, memorisation, and reading actions across the platform.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {recentActivity.map((activity) => (
                <div
                  key={activity.id}
                  className="flex flex-col gap-2 rounded-lg border border-dashed border-maroon-100 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex flex-1 items-start gap-3">
                    <Badge className={statusBadgeStyles[activity.status ?? "success"] ?? statusBadgeStyles.success}>
                      {activity.status ?? "success"}
                    </Badge>
                    <div>
                      <p className="font-medium text-maroon-900">{activity.user}</p>
                      <p className="text-sm text-muted-foreground">{activity.action}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock3 className="h-3 w-3" />
                    {activity.time}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>User management</CardTitle>
                <CardDescription>Quick view of active community members and their latest actions.</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Last action</TableHead>
                      <TableHead>Last seen</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sampleUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="space-y-1">
                            <p className="font-medium text-maroon-900">{user.name}</p>
                            <p className="text-xs text-muted-foreground">{user.email}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="capitalize">
                            {user.role}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{user.lastAction}</TableCell>
                        <TableCell>
                          <Badge className={user.badgeStyle}>{user.status}</Badge>
                          <p className="text-xs text-muted-foreground">{user.lastSeen}</p>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Retention & subscription</CardTitle>
                <CardDescription>Monitor how many learners are investing in Alfawz premium.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-baseline justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Active rate</p>
                    <p className="text-3xl font-semibold">{activeUserPercent}%</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Premium adoption</p>
                    <p className="text-lg font-semibold">{stats.subscriptionRate}%</p>
                  </div>
                </div>
                <div className="space-y-3">
                  {subscriptionBreakdown.map((segment) => (
                    <div key={segment.label} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span>{segment.label}</span>
                        <span className="text-muted-foreground">{formatNumber(segment.value)}</span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className={`${segment.color} h-full`}
                          style={{
                            width: `${
                              stats.totalUsers === 0 ? 0 : Math.round((segment.value / stats.totalUsers) * 100)
                            }%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  Use this to prioritise outreach campaigns and premium upsell experiments.
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="classes" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,380px)_1fr]">
            <Card className="border border-maroon-100 bg-cream-50/70">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-maroon-900">
                  <UserPlus className="h-5 w-5" /> Create learning circle
                </CardTitle>
                <CardDescription className="text-sm text-maroon-700">
                  Set up a new class, assign an instructor, and enrol learners across the platform.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="class-name" className="text-sm font-medium text-maroon-900">
                    Class name
                  </Label>
                  <Input
                    id="class-name"
                    placeholder="eg. Weekend Hifz Circle"
                    value={className}
                    onChange={(event) => setClassName(event.target.value)}
                    className="bg-white/90"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="class-schedule" className="text-sm font-medium text-maroon-900">
                    Schedule
                  </Label>
                  <Input
                    id="class-schedule"
                    placeholder="eg. Fridays & Saturdays"
                    value={schedule}
                    onChange={(event) => setSchedule(event.target.value)}
                    className="bg-white/90"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-maroon-900">Instructor</Label>
                  <Select value={teacherId} onValueChange={(value) => setTeacherId(value)}>
                    <SelectTrigger className="bg-white/90">
                      <SelectValue placeholder="Select instructor" />
                    </SelectTrigger>
                    <SelectContent>
                      {teacherDirectory.map((teacher) => (
                        <SelectItem key={teacher.id} value={teacher.id}>
                          {teacher.name} • {teacher.specialization}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="class-description" className="text-sm font-medium text-maroon-900">
                    Description
                  </Label>
                  <Textarea
                    id="class-description"
                    placeholder="Share what this cohort will focus on to help teachers and parents align."
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    className="min-h-[96px] bg-white/90"
                  />
                </div>
                <div className="space-y-3">
                  <Label className="text-sm font-medium text-maroon-900">Enrol learners</Label>
                  <ScrollArea className="h-48 rounded-md border border-dashed border-maroon-200 bg-white/80 p-2">
                    <div className="space-y-2">
                      {studentDirectory.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No students available to enrol yet.</p>
                      ) : (
                        studentDirectory.map((student) => {
                          const checked = selectedStudents.includes(student.id)
                          return (
                            <label
                              key={student.id}
                              className={`flex cursor-pointer items-center justify-between gap-3 rounded-md border border-transparent px-3 py-2 text-sm transition hover:border-maroon-200 hover:bg-maroon-50/70 ${
                                checked ? "border-maroon-300 bg-maroon-50" : ""
                              }`}
                            >
                              <div className="space-y-1">
                                <p className="font-medium text-maroon-900">{student.name}</p>
                                <p className="text-xs text-muted-foreground">{student.email}</p>
                              </div>
                              <Checkbox
                                checked={checked}
                                onCheckedChange={(state) => handleToggleStudent(student.id, state)}
                                aria-label={`Toggle ${student.name}`}
                              />
                            </label>
                          )
                        })
                      )}
                    </div>
                  </ScrollArea>
                  {selectedStudents.length > 0 ? (
                    <p className="text-xs text-muted-foreground">
                      {selectedStudents.length} learner{selectedStudents.length === 1 ? "" : "s"} selected.
                    </p>
                  ) : null}
                </div>
                {classCreationError ? (
                  <p className="text-sm font-medium text-red-600">{classCreationError}</p>
                ) : null}
                <div className="flex items-center gap-2">
                  <Button
                    className="bg-maroon-600 text-white hover:bg-maroon-700"
                    onClick={handleCreateClass}
                    disabled={isCreatingClass}
                  >
                    {isCreatingClass ? "Creating..." : "Create class"}
                  </Button>
                  <Button variant="ghost" disabled={isCreatingClass} onClick={resetClassForm}>
                    Reset
                  </Button>
                </div>
              </CardContent>
            </Card>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-maroon-900">Managed cohorts</h3>
                  <p className="text-sm text-muted-foreground">
                    Classes sync instantly with teacher and student dashboards for unified oversight.
                  </p>
                </div>
                <Badge variant="secondary" className="gap-1">
                  <GraduationCap className="h-4 w-4" /> {classSummaries.length}
                </Badge>
              </div>
              {sortedClassSummaries.length === 0 ? (
                <Card className="border-border/60">
                  <CardContent className="py-10 text-center text-muted-foreground">
                    No classes have been created yet. Use the form to launch your first cohort.
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {sortedClassSummaries.map((summary) => {
                    const visibleStudents = summary.students.slice(0, 5)
                    const remainingStudents = summary.students.length - visibleStudents.length
                    return (
                      <Card key={summary.class.id} className="border-border/60 bg-background/90">
                        <CardHeader className="space-y-3">
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                              <CardTitle className="text-xl font-semibold text-maroon-900">
                                {summary.class.name}
                              </CardTitle>
                              <CardDescription className="text-sm text-muted-foreground">
                                {summary.class.description ?? "No description provided yet."}
                              </CardDescription>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                              {summary.class.schedule ? (
                                <Badge variant="secondary" className="capitalize">
                                  <Calendar className="mr-1 h-3.5 w-3.5" /> {summary.class.schedule}
                                </Badge>
                              ) : null}
                              <Badge variant="outline" className="gap-1">
                                <Users className="h-3.5 w-3.5" /> {summary.class.studentCount} learners
                              </Badge>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-maroon-700">
                            <span className="font-medium">{summary.teacher.name}</span>
                            <Badge variant="outline" className="text-xs">
                              {summary.teacher.specialization}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          {visibleStudents.length === 0 ? (
                            <p className="text-sm text-muted-foreground">No learners enrolled yet.</p>
                          ) : (
                            <div className="grid gap-3 md:grid-cols-2">
                              {visibleStudents.map((student) => (
                                <div
                                  key={student.id}
                                  className="rounded-lg border border-border/60 bg-background/80 p-4 text-sm"
                                >
                                  <div className="flex items-center justify-between gap-2">
                                    <div>
                                      <p className="font-medium text-maroon-900">{student.name}</p>
                                      <p className="text-xs text-muted-foreground">{student.email}</p>
                                    </div>
                                    <Badge variant="secondary" className="text-xs">
                                      {student.streak} day streak
                                    </Badge>
                                  </div>
                                  <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
                                    <div>
                                      <p className="text-muted-foreground">Memorization</p>
                                      <p className="font-semibold text-maroon-900">
                                        {student.memorizationProgress}%
                                      </p>
                                    </div>
                                    <div>
                                      <p className="text-muted-foreground">Recitation</p>
                                      <p className="font-semibold text-maroon-900">
                                        {student.recitationProgress}%
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                          {remainingStudents > 0 ? (
                            <p className="text-xs text-muted-foreground">
                              +{remainingStudents} more learner{remainingStudents === 1 ? "" : "s"} in this class.
                            </p>
                          ) : null}
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="content" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Tajwīd asset catalogue</CardTitle>
              <CardDescription>Centralised translations, scripts, and tajwīd annotation layers.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Updated</TableHead>
                    <TableHead>Tags</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tajweedOverview.assets.map((asset) => (
                    <TableRow key={asset.id}>
                      <TableCell className="font-medium text-maroon-900">{asset.title}</TableCell>
                      <TableCell className="capitalize">{asset.type.replace(/_/g, " ")}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {asset.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(asset.updatedAt).toLocaleDateString("en-NG", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {asset.tags.join(", ")}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableCaption>
                  Version history is synchronised with the tajwīd review board for full transparency.
                </TableCaption>
              </Table>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AudioWaveform className="h-4 w-4" /> Recitation catalogue
                </CardTitle>
                <CardDescription>Track ingestion status and QA coverage for curated recordings.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {tajweedOverview.recitations.map((recitation) => (
                  <div key={recitation.id} className="rounded-lg border border-muted p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-maroon-900">{recitation.reciterName}</p>
                        <p className="text-xs text-muted-foreground">
                          {recitation.style} • {recitation.type.replace(/_/g, " ")} • {recitation.bitrate}kbps
                        </p>
                      </div>
                      <Badge variant="secondary" className="capitalize">
                        {recitation.status}
                      </Badge>
                    </div>
                    <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                      <span>Duration {(recitation.durationSeconds / 60).toFixed(1)} mins</span>
                      <span>{recitation.segmentCount} segments</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4" /> Collaborative plans
                </CardTitle>
                <CardDescription>Coordinate multi-teacher tajwīd programs with milestone tracking.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {tajweedOverview.plans.map((plan) => (
                  <div key={plan.id} className="rounded-lg border border-muted p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-maroon-900">{plan.title}</p>
                        <p className="text-xs text-muted-foreground">Version {plan.version}</p>
                      </div>
                      <Badge variant="outline">{plan.milestones.length} milestones</Badge>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">{plan.description}</p>
                    <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      Created {new Date(plan.createdAt).toLocaleDateString("en-NG", {
                        month: "short",
                        day: "numeric",
                      })}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="payments" className="space-y-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Revenue performance</CardTitle>
                <CardDescription>Baseline tuition plus premium uplift for the current cohort.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-baseline justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Monthly</p>
                    <p className="text-2xl font-semibold">{formatCurrency(stats.monthlyRevenue)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Annualised</p>
                    <p className="text-lg font-semibold">{formatCurrency(stats.totalRevenue)}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium">Premium uptake</p>
                  <Progress value={stats.subscriptionRate} className="h-2" />
                  <p className="mt-1 text-xs text-muted-foreground">
                    {premiumUsers} premium • {basicUsers} basic plans
                  </p>
                </div>
                <div className="rounded-lg border border-muted p-4 text-sm text-muted-foreground">
                  Use this panel to schedule new scholarship cycles and alert finance when monthly revenue dips
                  below projections.
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Upcoming billing checkpoints</CardTitle>
                <CardDescription>Coordinate with finance and product for smooth renewals.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between rounded-lg border border-dashed border-maroon-200 p-4">
                  <div>
                    <p className="text-sm font-semibold text-maroon-900">Quarterly revenue sync</p>
                    <p className="text-xs text-muted-foreground">Finance + Product roadmap alignment</p>
                  </div>
                  <Badge variant="outline">Next: 3 July</Badge>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-dashed border-maroon-200 p-4">
                  <div>
                    <p className="text-sm font-semibold text-maroon-900">Scholarship review board</p>
                    <p className="text-xs text-muted-foreground">Assess guardian subsidy pipeline</p>
                  </div>
                  <Badge variant="secondary">Monthly</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Platform hardening checklist</CardTitle>
              <CardDescription>Ensure Alfawz admin tools stay compliant and secure.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 h-4 w-4 text-emerald-600" />
                <div>
                  <p className="font-medium text-maroon-900">Role-based access control</p>
                  <p className="text-muted-foreground">All admin accounts use scoped roles synced from the tajwīd CMS.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Shield className="mt-0.5 h-4 w-4 text-maroon-600" />
                <div>
                  <p className="font-medium text-maroon-900">S3 recitation buckets encrypted</p>
                  <p className="text-muted-foreground">Daily audits confirm uploads use server-side encryption with rotating keys.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 h-4 w-4 text-amber-500" />
                <div>
                  <p className="font-medium text-maroon-900">Pending SOC 2 evidence</p>
                  <p className="text-muted-foreground">Collect final tajwīd reviewer onboarding logs ahead of certification.</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Incident response drills</CardTitle>
              <CardDescription>Preparedness across engineering and tajwīd review teams.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border border-muted p-4">
                <p className="font-medium text-maroon-900">Production rollback rehearsal</p>
                <p className="text-sm text-muted-foreground">Scheduled for 28 June • Coordinated with recitation QA leads.</p>
              </div>
              <div className="rounded-lg border border-muted p-4">
                <p className="font-medium text-maroon-900">Access review cadence</p>
                <p className="text-sm text-muted-foreground">Monthly • Verify all tajwīd contributors with admin scopes.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recitation" className="space-y-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Card className="border-0 bg-gradient-to-br from-maroon-600 to-maroon-700 text-white">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-white/70">Labeled hours</p>
                    <p className="text-3xl font-semibold">{recitationOps.summary.labeledHours.toFixed(1)}h</p>
                    <p className="text-xs text-white/60">Across all verified corpora</p>
                  </div>
                  <Database className="h-8 w-8 text-white/70" />
                </div>
              </CardContent>
            </Card>
            <Card className="border border-emerald-200 bg-emerald-50">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-emerald-700">Production accuracy</p>
                    <p className="text-3xl font-semibold text-emerald-900">{accuracyPercent}%</p>
                    <p className="text-xs text-emerald-700/80">Recitation scorer v1.1</p>
                  </div>
                  <ShieldCheck className="h-8 w-8 text-emerald-600" />
                </div>
                <div className="mt-4">
                  <Progress value={accuracyPercent} className="h-2" />
                </div>
              </CardContent>
            </Card>
            <Card className="border border-amber-200 bg-amber-50">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-amber-700">Flagged sessions</p>
                    <p className="text-3xl font-semibold text-amber-900">{recitationOps.summary.flaggedSessions}</p>
                    <p className="text-xs text-amber-700/80">Awaiting tajwīd reviewer sign-off</p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-amber-500" />
                </div>
              </CardContent>
            </Card>
            <Card className="border border-blue-200 bg-blue-50">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-blue-700">Experimentation wiki</p>
                    <p className="text-3xl font-semibold text-blue-900">Synced</p>
                    <p className="text-xs text-blue-700/80">Updated {wikiUpdatedAt}</p>
                  </div>
                  <ListChecks className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Corpus coverage</CardTitle>
              <CardDescription>Balance locales and narration styles for reliable correction detection.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
              {recitationOps.corpusBreakdown.map((segment) => (
                <div key={segment.locale} className="rounded-lg border border-muted bg-muted/20 p-4">
                  <p className="text-sm font-medium text-maroon-900">{segment.locale}</p>
                  <p className="mt-2 text-2xl font-semibold text-maroon-700">{segment.hours.toFixed(1)}h</p>
                  <Progress value={segment.percentage} className="mt-3 h-2" />
                  <p className="mt-1 text-xs text-muted-foreground">{segment.percentage}% of active dataset</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Pipeline health</CardTitle>
                <CardDescription>Automation status for recitation accuracy & correction detection.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {recitationOps.pipeline.map((stage) => (
                  <div key={stage.id} className="rounded-lg border border-dashed p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-semibold text-maroon-900">{stage.title}</h3>
                          <Badge className={pipelineStatusStyles[stage.status] ?? ""}>
                            {stage.status === "green"
                              ? "On schedule"
                              : stage.status === "amber"
                                ? "Needs attention"
                                : "Blocked"}
                          </Badge>
                        </div>
                        <p className="mt-2 text-sm text-muted-foreground">{stage.description}</p>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Radar className="h-4 w-4" /> Last run {stage.lastRun}
                      </div>
                    </div>
                    <div className="mt-4 space-y-2">
                      <div className="flex items-center justify-between text-sm font-medium text-maroon-800">
                        <span>Owner: {stage.owner}</span>
                        <span>{stage.completion}%</span>
                      </div>
                      <Progress value={stage.completion} className="h-2" />
                      <div className="flex flex-wrap gap-2 pt-2">
                        {stage.scripts.map((script) => (
                          <span
                            key={`${stage.id}-${script.name}`}
                            className={`rounded-full px-3 py-1 text-xs font-medium ${
                              scriptStatusStyles[script.status] ?? "bg-muted text-muted-foreground"
                            }`}
                          >
                            {script.name}
                            <span className="ml-1 text-[10px] text-muted-foreground">{script.path}</span>
                          </span>
                        ))}
                      </div>
                      {stage.blockers?.length ? (
                        <div className="rounded-lg border border-amber-200 bg-amber-50/60 p-3 text-xs text-amber-800">
                          <p className="font-semibold">Current blockers</p>
                          <ul className="mt-1 list-disc space-y-1 pl-4">
                            {stage.blockers.map((blocker) => (
                              <li key={blocker}>{blocker}</li>
                            ))}
                          </ul>
                        </div>
                      ) : null}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Realtime monitors</CardTitle>
                  <CardDescription>Keep ASR + tajwīd scoring healthy during peak recitation hours.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {recitationOps.monitors.map((monitor) => (
                    <div
                      key={monitor.id}
                      className={`rounded-xl border p-4 ${monitorStatusStyles[monitor.status] ?? "bg-muted"}`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold text-maroon-900">{monitor.title}</p>
                          <p className="text-xs text-muted-foreground">{monitor.description}</p>
                        </div>
                        <div className="text-right text-sm font-medium text-maroon-900">
                          <p>{monitor.metric}</p>
                          <p className="text-xs text-muted-foreground">Target {monitor.target}</p>
                        </div>
                      </div>
                      <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock3 className="h-3 w-3" />
                          {monitor.trend}
                        </div>
                        <span>Live feed</span>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Active experiments</CardTitle>
                  <CardDescription>Synchronised with the experimentation wiki for reproducible results.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Experiment</TableHead>
                        <TableHead>Dataset</TableHead>
                        <TableHead>Model</TableHead>
                        <TableHead>Metric</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Owner</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recitationOps.experiments.map((experiment) => (
                        <TableRow key={experiment.id}>
                          <TableCell className="font-medium text-maroon-900">{experiment.name}</TableCell>
                          <TableCell>{experiment.dataset}</TableCell>
                          <TableCell>{experiment.model}</TableCell>
                          <TableCell>
                            <span className="font-semibold text-maroon-900">{experiment.value}</span>
                            <span className="ml-1 text-xs text-muted-foreground">{experiment.metric}</span>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="capitalize">
                              {experiment.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col text-xs">
                              <span className="text-sm font-medium text-maroon-900">{experiment.owner}</span>
                              {experiment.notes ? (
                                <span className="text-muted-foreground">{experiment.notes}</span>
                              ) : null}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                    <TableCaption>
                      Log structured metrics after each run to maintain auditability.
                    </TableCaption>
                  </Table>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Latest alerts</CardTitle>
                  <CardDescription>Surface anything blocking accurate recitation feedback.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {recitationOps.alerts.map((alert) => (
                    <div
                      key={alert.id}
                      className={`rounded-xl p-4 shadow-sm ${alertSeverityStyles[alert.severity] ?? "bg-gray-50"}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-maroon-900">{alert.title}</p>
                          <p className="text-xs text-muted-foreground">{alert.description}</p>
                        </div>
                        <Badge variant={alert.resolved ? "secondary" : "outline"} className="text-xs">
                          {alert.resolved ? "Resolved" : "Open"}
                        </Badge>
                      </div>
                      <p className="mt-2 text-xs text-muted-foreground">Logged {alert.timestamp}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>

          <TarteelMlIntegrationPanel />
        </TabsContent>

        <TabsContent value="tajweed" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Tajwīd roles & permissions</CardTitle>
              <CardDescription>Ensure only authorised scholars manage sensitive tajwīd layers.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Scopes</TableHead>
                    <TableHead>Granted</TableHead>
                    <TableHead>Expires</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tajweedOverview.roleAssignments.map((assignment) => (
                    <TableRow key={assignment.id}>
                      <TableCell className="font-medium text-maroon-900">{assignment.name}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="capitalize">
                          {assignment.role}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {assignment.scopes.join(", ")}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(assignment.grantedAt).toLocaleDateString("en-NG", {
                          month: "short",
                          day: "numeric",
                        })}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {assignment.expiresAt
                          ? new Date(assignment.expiresAt).toLocaleDateString("en-NG", {
                              month: "short",
                              day: "numeric",
                            })
                          : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Operational notes</CardTitle>
              <CardDescription>Highlights for tajwīd content editors and program leads.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="rounded-lg border border-muted p-4">
                <p className="font-medium text-maroon-900">Asset review queue</p>
                <p className="text-sm text-muted-foreground">
                  Coordinate weekly reviews with scholars to keep translations and tajwīd layers updated.
                </p>
              </div>
              <div className="rounded-lg border border-muted p-4">
                <p className="font-medium text-maroon-900">Recitation ingestion</p>
                <p className="text-sm text-muted-foreground">
                  Verify waveform QA results before promoting new recitations to the learner library.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
