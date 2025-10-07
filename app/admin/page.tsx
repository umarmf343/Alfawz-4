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
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-cream-50 to-maroon-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-maroon-900 mb-2">Admin Dashboard</h1>
            <p className="text-lg text-maroon-700">Manage and monitor the AlFawz Qur&apos;an Institute platform</p>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="outline" className="bg-white">
              <Calendar className="h-4 w-4 mr-2" />
              Export Report
            </Button>
            <Button className="bg-gradient-to-r from-maroon-600 to-maroon-700">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-blue-600 to-blue-700 text-white border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm">Total Users</p>
                  <p className="text-2xl font-bold">{stats.totalUsers.toLocaleString()}</p>
                  <p className="text-blue-100 text-xs">+12% from last month</p>
                </div>
                <Users className="h-8 w-8 text-blue-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-600 to-green-700 text-white border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm">Monthly Revenue</p>
                  <p className="text-2xl font-bold">₦{(stats.monthlyRevenue / 1000).toFixed(0)}K</p>
                  <p className="text-green-100 text-xs">+8% from last month</p>
                </div>
                <DollarSign className="h-8 w-8 text-green-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-600 to-purple-700 text-white border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
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
                                Math.min(
                                  100,
                                  Math.round((data.users / Math.max(stats.totalUsers, 1)) * 100),
                                ),
                              )}
                              className="h-2"
                            />
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium">{data.users.toLocaleString()}</div>
                          <div className="text-xs text-gray-500">₦{(data.revenue / 1000).toFixed(0)}K</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>Latest platform activities and events</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentActivity.map((activity) => (
                      <div key={activity.id} className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                          {getActivityIcon(activity.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-gray-900">{activity.user}</p>
                            <Badge className={`text-xs ${getStatusColor(activity.status)}`}>{activity.status}</Badge>
                          </div>
                          <p className="text-sm text-gray-600">{activity.action}</p>
                          <p className="text-xs text-gray-500">{activity.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Performance Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Engagement</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Daily Active Users</span>
                        <span>{activeUserPercent}%</span>
                      </div>
                      <Progress value={activeUserPercent} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Session Duration</span>
                        <span>{sessionDurationPercent}%</span>
                      </div>
                      <Progress value={sessionDurationPercent} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Feature Usage</span>
                        <span>{featureUsagePercent}%</span>
                      </div>
                      <Progress value={featureUsagePercent} className="h-2" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Subscriptions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Basic</span>
                      <span className="font-medium">{basicUsers.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Premium</span>
                      <span className="font-medium">{premiumUsers.toLocaleString()}</span>
                    </div>
                    <p className="text-xs text-gray-500">
                      Subscription rate {stats.subscriptionRate}% of total users
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Gamification Snapshot</CardTitle>
                  <CardDescription>Quest participation across the platform</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Completed quests</span>
                      <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">
                        {gamification.completedTasks}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
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
                      {
                        name: "Omar Ibn Khattab",
                        email: "omar@example.com",
                        role: "Family Plan",
                        status: "Active",
                        joinDate: "2024-01-20",
                      },
                      {
                        name: "Aisha Siddiq",
                        email: "aisha@example.com",
                        role: "Basic Student",
                        status: "Suspended",
                        joinDate: "2023-11-05",
                      },
                    ].map((user, index) => (
                      <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-maroon-100 rounded-full flex items-center justify-center">
                            <Users className="h-5 w-5 text-maroon-600" />
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{user.name}</div>
                            <div className="text-sm text-gray-600">{user.email}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <div className="text-sm font-medium">{user.role}</div>
                            <div className="text-xs text-gray-500">Joined {user.joinDate}</div>
                          </div>
                          <Badge
                            className={
                              user.status === "Active"
                                ? "bg-green-100 text-green-800 border-green-200"
                                : "bg-red-100 text-red-800 border-red-200"
                            }
                          >
                            {user.status}
                          </Badge>
                          <Button variant="outline" size="sm">
                            Manage
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>User Statistics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Students</span>
                        <span>10,847</span>
                      </div>
                      <Progress value={85} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Teachers</span>
                        <span>1,234</span>
                      </div>
                      <Progress value={10} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Admins</span>
                        <span>45</span>
                      </div>
                      <Progress value={5} className="h-2" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Content Tab */}
          <TabsContent value="content" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Content Moderation</CardTitle>
                  <CardDescription>Review and moderate user-generated content</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                      <div className="flex items-center gap-3">
                        <AlertTriangle className="h-5 w-5 text-yellow-600" />
                        <div>
                          <div className="font-medium">Reported Assignment</div>
                          <div className="text-sm text-gray-600">User reported inappropriate content</div>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        Review
                      </Button>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                      <div className="flex items-center gap-3">
                        <BookOpen className="h-5 w-5 text-green-600" />
                        <div>
                          <div className="font-medium">New Qur&apos;an Audio</div>
                          <div className="text-sm text-gray-600">Teacher uploaded new recitation</div>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        Approve
                      </Button>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex items-center gap-3">
                        <Star className="h-5 w-5 text-blue-600" />
                        <div>
                          <div className="font-medium">Assignment Template</div>
                          <div className="text-sm text-gray-600">New template awaiting approval</div>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        Review
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Content Statistics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Total Assignments</span>
                      <span className="font-medium">15,847</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Audio Files</span>
                      <span className="font-medium">8,234</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">User Recordings</span>
                      <span className="font-medium">45,678</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Pending Reviews</span>
                      <span className="font-medium text-yellow-600">23</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Payments Tab */}
          <TabsContent value="payments" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Recent Transactions</CardTitle>
                  <CardDescription>Latest payment transactions and subscriptions</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      {
                        id: "TXN_001",
                        user: "Ahmad Hassan",
                        amount: "₦15,000",
                        plan: "Premium Monthly",
                        status: "Completed",
                        date: "2024-01-15",
                      },
                      {
                        id: "TXN_002",
                        user: "Fatima Ali",
                        amount: "₦25,000",
                        plan: "Family Monthly",
                        status: "Completed",
                        date: "2024-01-14",
                      },
                      {
                        id: "TXN_003",
                        user: "Omar Khalil",
                        amount: "₦5,000",
                        plan: "Basic Monthly",
                        status: "Failed",
                        date: "2024-01-13",
                      },
                    ].map((transaction) => (
                      <div key={transaction.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                            <DollarSign className="h-5 w-5 text-green-600" />
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{transaction.user}</div>
                            <div className="text-sm text-gray-600">{transaction.plan}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <div className="font-medium">{transaction.amount}</div>
                            <div className="text-xs text-gray-500">{transaction.date}</div>
                          </div>
                          <Badge
                            className={
                              transaction.status === "Completed"
                                ? "bg-green-100 text-green-800 border-green-200"
                                : "bg-red-100 text-red-800 border-red-200"
                            }
                          >
                            {transaction.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Revenue Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-maroon-900">₦2.45M</div>
                      <div className="text-sm text-gray-600">Total Revenue</div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>This Month</span>
                        <span className="font-medium">₦450K</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Last Month</span>
                        <span className="font-medium">₦420K</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Growth</span>
                        <span className="font-medium text-green-600">+7.1%</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Security Alerts</CardTitle>
                  <CardDescription>Monitor security events and threats</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
                      <div className="flex items-center gap-3">
                        <AlertTriangle className="h-5 w-5 text-red-600" />
                        <div>
                          <div className="font-medium">Failed Login Attempts</div>
                          <div className="text-sm text-gray-600">Multiple failed attempts from IP: 192.168.1.100</div>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        Block IP
                      </Button>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                      <div className="flex items-center gap-3">
                        <Shield className="h-5 w-5 text-yellow-600" />
                        <div>
                          <div className="font-medium">Suspicious Activity</div>
                          <div className="text-sm text-gray-600">Unusual access pattern detected</div>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        Investigate
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>System Security</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">SSL Certificate</span>
                      <Badge className="bg-green-100 text-green-800 border-green-200">Valid</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Firewall Status</span>
                      <Badge className="bg-green-100 text-green-800 border-green-200">Active</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Last Security Scan</span>
                      <Badge className="bg-green-100 text-green-800 border-green-200">2 hours ago</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Backup Status</span>
                      <Badge className="bg-green-100 text-green-800 border-green-200">Up to date</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          <TabsContent value="tajweed" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-gradient-to-br from-maroon-600 to-maroon-700 text-white border-0">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-maroon-100 text-sm">Managed Assets</p>
                      <p className="text-2xl font-bold">{tajweedOverview.assets.length}</p>
                      <p className="text-maroon-100 text-xs">Tracked tajweed-ready datasets</p>
                    </div>
                    <Database className="h-8 w-8 text-maroon-100" />
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-amber-500 to-amber-600 text-white border-0">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-amber-100 text-sm">Audio Segments</p>
                      <p className="text-2xl font-bold">
                        {tajweedOverview.recitations.reduce((total, recitation) => total + recitation.segmentCount, 0)}
                      </p>
                      <p className="text-amber-100 text-xs">
                        {tajweedOverview.recitations
                          .flatMap((recitation) => recitation.segments)
                          .filter((segment) => segment.qaStatus !== "approved").length}{" "}
                        pending QA checks
                      </p>
                    </div>
                    <AudioWaveform className="h-8 w-8 text-amber-100" />
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white border-0">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-emerald-100 text-sm">Role Assignments</p>
                      <p className="text-2xl font-bold">{tajweedOverview.roleAssignments.length}</p>
                      <p className="text-emerald-100 text-xs">Scholar-gated review workflows</p>
                    </div>
                    <ShieldCheck className="h-8 w-8 text-emerald-100" />
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-indigo-500 to-indigo-600 text-white border-0">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-indigo-100 text-sm">Reading Plans</p>
                      <p className="text-2xl font-bold">{tajweedOverview.plans.length}</p>
                      <p className="text-indigo-100 text-xs">Collaborative tajweed intensives</p>
                    </div>
                    <ListChecks className="h-8 w-8 text-indigo-100" />
                  </div>
                </CardContent>
              </Card>
            </div>
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <Card className="bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle>Quranic Assets</CardTitle>
                  <CardDescription>Version-controlled translations, scripts, and datasets</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {tajweedOverview.assets.map((asset) => (
                    <div key={asset.id} className="rounded-lg border border-maroon-100 bg-cream-50/80 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <p className="font-semibold text-maroon-900">{asset.title}</p>
                          <p className="text-sm text-maroon-700 capitalize">
                            {asset.type.replaceAll("_", " ")} • {asset.language.toUpperCase()}
                          </p>
                        </div>
                        <Badge variant="secondary" className="bg-maroon-100 text-maroon-800">
                          {asset.status}
                        </Badge>
                      </div>
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        {asset.tags.map((tag) => (
                          <Badge key={tag} variant="outline" className="border-maroon-200 text-maroon-700">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                      <div className="mt-3 text-xs text-maroon-600">
                        Last updated {new Date(asset.updatedAt).toLocaleString()} • Version {asset.versionHistory.at(-1)?.version}
                      </div>
                      {asset.annotationLayers.length > 0 && (
                        <div className="mt-4 space-y-2">
                          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-maroon-500">
                            Annotation Layers
                          </p>
                          {asset.annotationLayers.map((layer) => (
                            <div key={layer.id} className="rounded-md border border-amber-100 bg-amber-50/60 p-3">
                              <p className="text-sm font-medium text-amber-900">{layer.name}</p>
                              <p className="text-xs text-amber-800">{layer.description}</p>
                              <p className="mt-1 text-xs text-amber-700">
                                {layer.rulesCovered.join(", ")} • {layer.ayahKeys.length} ayat tracked
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
              <div className="space-y-6">
                <Card className="bg-white/80 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle>Recitation Datasets</CardTitle>
                    <CardDescription>Segment metadata for tajweed-aligned playback</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {tajweedOverview.recitations.map((recitation) => {
                      const pendingSegments = recitation.segments.filter((segment) => segment.qaStatus !== "approved").length
                      return (
                        <div key={recitation.id} className="rounded-lg border border-emerald-100 bg-emerald-50/70 p-4">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div>
                              <p className="font-semibold text-emerald-900">{recitation.reciterName}</p>
                              <p className="text-sm text-emerald-800">
                                {recitation.style} • {recitation.type === "gapless" ? "Gapless" : "Ayah Segmented"}
                              </p>
                            </div>
                            <Badge variant="secondary" className="bg-emerald-200 text-emerald-900">
                              {recitation.status}
                            </Badge>
                          </div>
                          <p className="mt-2 text-xs text-emerald-800">
                            {recitation.segmentCount} segments • {(recitation.durationSeconds / 60).toFixed(1)} min • Uploaded by {recitation.uploadedBy}
                          </p>
                          <Progress value={((recitation.segmentCount - pendingSegments) / recitation.segmentCount) * 100} className="mt-3" />
                          <p className="mt-2 text-xs text-emerald-900">
                            {recitation.segmentCount - pendingSegments} approved • {pendingSegments} awaiting QA
                          </p>
                        </div>
                      )
                    })}
                  </CardContent>
                </Card>
                <Card className="bg-white/80 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle>Specialized Roles & Plans</CardTitle>
                    <CardDescription>Governance for tajweed corrections and collaboration</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="rounded-lg border border-blue-100 bg-blue-50/60 p-4">
                      <p className="text-sm font-semibold text-blue-900">Role Directory</p>
                      <div className="mt-3 space-y-2">
                        {tajweedOverview.roleAssignments.map((assignment) => (
                          <div key={assignment.id} className="flex flex-col rounded-md border border-blue-100 bg-white/80 p-3">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div>
                                <p className="text-sm font-medium text-blue-900">{assignment.name}</p>
                                <p className="text-xs text-blue-700">{assignment.email}</p>
                              </div>
                              <Badge variant="secondary" className="bg-blue-200 text-blue-900">
                                {assignment.role}
                              </Badge>
                            </div>
                            <p className="mt-2 text-xs text-blue-700">
                              {assignment.scopes.join(", ")}
                            </p>
                            <p className="mt-1 text-[11px] text-blue-600">
                              Granted {new Date(assignment.grantedAt).toLocaleDateString()} by {assignment.grantedBy}
                              {assignment.expiresAt ? ` • Expires ${new Date(assignment.expiresAt).toLocaleDateString()}` : ""}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="rounded-lg border border-purple-100 bg-purple-50/60 p-4">
                      <p className="text-sm font-semibold text-purple-900">Active Reading Plans</p>
                      <div className="mt-3 space-y-3">
                        {tajweedOverview.plans.map((plan) => (
                          <div key={plan.id} className="rounded-md border border-purple-100 bg-white/80 p-3">
                            <p className="text-sm font-semibold text-purple-900">{plan.title}</p>
                            <p className="text-xs text-purple-700">{plan.description}</p>
                            <p className="mt-1 text-[11px] text-purple-600">
                              {plan.milestones.length} milestones • {plan.participantIds.length} collaborators • v{plan.version}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
