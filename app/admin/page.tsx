"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Users,
  BookOpen,
  TrendingUp,
  DollarSign,
  Activity,
  AlertTriangle,
  Star,
  Calendar,
  BarChart3,
  Settings,
  Shield,
  Database,
  AudioWaveform,
  ShieldCheck,
  ListChecks,
  Radar,
  Clock3,
  Sparkles,
} from "lucide-react"
import { getAdminOverview } from "@/lib/data/teacher-database"
import { getTajweedCMSOverview } from "@/lib/data/tajweed-cms"
import { getRecitationOpsOverview } from "@/lib/data/recitation-ops"
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export default function AdminDashboard() {
  const { stats, recentActivity, userGrowth, gamification } = getAdminOverview()
  const tajweedOverview = getTajweedCMSOverview()
  const recitationOps = getRecitationOpsOverview()
  const activeUserPercent =
    stats.totalUsers === 0 ? 0 : Math.round((stats.activeUsers / stats.totalUsers) * 100)
  const sessionMinutes = Number.parseInt(stats.avgSessionTime.replace(/[^\d]/g, ""), 10)
  const sessionDurationPercent = Number.isFinite(sessionMinutes)
    ? Math.max(0, Math.min(100, Math.round((sessionMinutes / 60) * 100)))
    : 0
  const totalGameTasks = gamification.completedTasks + gamification.pendingTasks
  const featureUsagePercent =
    totalGameTasks === 0 ? 0 : Math.round((gamification.completedTasks / totalGameTasks) * 100)
  const premiumUsers = Math.round((stats.subscriptionRate / 100) * stats.totalUsers)
  const basicUsers = Math.max(0, stats.totalUsers - premiumUsers)
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

  const pipelineStatusStyles: Record<string, string> = {
    green: "bg-emerald-100 text-emerald-700 border-emerald-200",
    amber: "bg-amber-100 text-amber-700 border-amber-200",
    red: "bg-red-100 text-red-700 border-red-200",
  }

  const scriptStatusStyles: Record<string, string> = {
    ready: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    needs_attention: "bg-amber-50 text-amber-700 border border-amber-200",
    in_progress: "bg-sky-50 text-sky-700 border border-sky-200",
  }

  const monitorStatusStyles: Record<string, string> = {
    success: "text-emerald-700 bg-emerald-50",
    warning: "text-amber-700 bg-amber-50",
    error: "text-red-700 bg-red-50",
  }

  const alertSeverityStyles: Record<string, string> = {
    low: "bg-blue-50 text-blue-700 border border-blue-200",
    medium: "bg-amber-50 text-amber-700 border border-amber-200",
    high: "bg-red-50 text-red-700 border border-red-200",
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "reading":
        return <BookOpen className="h-4 w-4" />
      case "memorization":
        return <Star className="h-4 w-4" />
      case "recitation":
        return <TrendingUp className="h-4 w-4" />
      default:
        return <Activity className="h-4 w-4" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "success":
        return "bg-green-100 text-green-800 border-green-200"
      case "warning":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "error":
        return "bg-red-100 text-red-800 border-red-200"
      case "info":
        return "bg-blue-100 text-blue-800 border-blue-200"
      default:
@@ -123,71 +172,75 @@ export default function AdminDashboard() {
                <div>
                  <p className="text-purple-100 text-sm">Active Sessions</p>
                  <p className="text-2xl font-bold">{stats.totalSessions.toLocaleString()}</p>
                  <p className="text-purple-100 text-xs">Avg: {stats.avgSessionTime}</p>
                </div>
                <Activity className="h-8 w-8 text-purple-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-600 to-orange-700 text-white border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm">Completion Rate</p>
                  <p className="text-2xl font-bold">{stats.completionRate}%</p>
                  <p className="text-orange-100 text-xs">+5% from last month</p>
                </div>
                <TrendingUp className="h-8 w-8 text-orange-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-7 bg-white/50 backdrop-blur-sm">
            <TabsTrigger value="overview" className="data-[state=active]:bg-maroon-600 data-[state=active]:text-white">
              <BarChart3 className="h-4 w-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="users" className="data-[state=active]:bg-maroon-600 data-[state=active]:text-white">
              <Users className="h-4 w-4 mr-2" />
              Users
            </TabsTrigger>
            <TabsTrigger value="content" className="data-[state=active]:bg-maroon-600 data-[state=active]:text-white">
              <BookOpen className="h-4 w-4 mr-2" />
              Content
            </TabsTrigger>
            <TabsTrigger value="payments" className="data-[state=active]:bg-maroon-600 data-[state=active]:text-white">
              <DollarSign className="h-4 w-4 mr-2" />
              Payments
            </TabsTrigger>
            <TabsTrigger value="security" className="data-[state=active]:bg-maroon-600 data-[state=active]:text-white">
              <Shield className="h-4 w-4 mr-2" />
              Security
            </TabsTrigger>
            <TabsTrigger value="recitation" className="data-[state=active]:bg-maroon-600 data-[state=active]:text-white">
              <AudioWaveform className="h-4 w-4 mr-2" />
              Recitation QA
            </TabsTrigger>
            <TabsTrigger value="tajweed" className="data-[state=active]:bg-maroon-600 data-[state=active]:text-white">
              <BookOpen className="h-4 w-4 mr-2" />
              Tajweed CMS
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Growth Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>User Growth & Revenue</CardTitle>
                  <CardDescription>Monthly growth trends over the past 6 months</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {userGrowth.map((data) => (
                      <div key={data.month} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 text-sm font-medium text-gray-600">{data.month}</div>
                          <div className="flex-1">
                            <Progress
                              value={Math.max(
                                0,
@@ -309,50 +362,302 @@ export default function AdminDashboard() {
                      <span className="text-sm text-gray-600">Active quests</span>
                      <Badge className="bg-blue-100 text-blue-700 border-blue-200">
                        {gamification.pendingTasks}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Active boosts</span>
                      <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
                        {gamification.activeBoosts}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Avg season level</span>
                      <span className="font-medium">{gamification.averageSeasonLevel}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Avg energy</span>
                      <span className="font-medium">{gamification.averageEnergy}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="recitation" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              <Card className="border-0 bg-gradient-to-br from-maroon-600 to-maroon-700 text-white">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-maroon-100">Labeled hours</p>
                      <p className="text-3xl font-bold">{recitationOps.summary.labeledHours.toFixed(1)}h</p>
                      <p className="text-xs text-maroon-100/80">Across all verified corpora</p>
                    </div>
                    <Database className="h-8 w-8 text-maroon-100" />
                  </div>
                </CardContent>
              </Card>
              <Card className="border border-emerald-200 bg-emerald-50">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-emerald-700">Production accuracy</p>
                      <p className="text-3xl font-bold text-emerald-900">{accuracyPercent}%</p>
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
                      <p className="text-3xl font-bold text-amber-900">{recitationOps.summary.flaggedSessions}</p>
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
                      <p className="text-3xl font-bold text-blue-900">Synced</p>
                      <p className="text-xs text-blue-700/80">Updated {wikiUpdatedAt}</p>
                    </div>
                    <ListChecks className="h-8 w-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle>Corpus coverage</CardTitle>
                  <CardDescription>Balance locales and narration styles for reliable correction detection</CardDescription>
                </div>
                <Badge variant="outline" className="text-xs">
                  <Sparkles className="h-3 w-3 mr-1" />
                  {recitationOps.summary.labeledHours.toFixed(1)} hours tracked
                </Badge>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Pipeline health</CardTitle>
                  <CardDescription>Automation status for recitation accuracy & correction detection</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {recitationOps.pipeline.map((stage) => (
                    <div key={stage.id} className="rounded-lg border border-dashed p-4">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
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
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Radar className="h-4 w-4" />
                          Last run {stage.lastRun}
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
                        {stage.blockers && stage.blockers.length > 0 && (
                          <div className="rounded-lg border border-amber-200 bg-amber-50/60 p-3 text-sm text-amber-800">
                            <p className="font-semibold">Current blockers</p>
                            <ul className="mt-1 space-y-1 list-disc pl-4">
                              {stage.blockers.map((item) => (
                                <li key={item}>{item}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Realtime monitors</CardTitle>
                    <CardDescription>Keep ASR + tajwīd scoring healthy during peak recitation hours</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {recitationOps.monitors.map((monitor) => (
                      <div
                        key={monitor.id}
                        className={`rounded-xl border p-4 ${monitorStatusStyles[monitor.status] ?? ""}`}
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

                <Card className="border border-maroon-200/70">
                  <CardHeader>
                    <CardTitle>Active experiments</CardTitle>
                    <CardDescription>Synchronised with the experimentation wiki for reproducible results</CardDescription>
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
                            <TableCell className="font-medium">{experiment.name}</TableCell>
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
                                {experiment.notes && (
                                  <span className="text-muted-foreground">{experiment.notes}</span>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                      <TableCaption>Log structured metrics after each run to maintain auditability.</TableCaption>
                    </Table>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Latest alerts</CardTitle>
                    <CardDescription>Surface anything blocking accurate recitation feedback</CardDescription>
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
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>User Management</CardTitle>
                  <CardDescription>Manage user accounts and permissions</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      {
                        name: "Ahmad Al-Hafiz",
                        email: "ahmad@example.com",
                        role: "Premium Student",
                        status: "Active",
                        joinDate: "2024-01-15",
                      },
                      {
                        name: "Fatima Zahra",
                        email: "fatima@example.com",
                        role: "Teacher",
                        status: "Active",
                        joinDate: "2023-12-10",
                      },