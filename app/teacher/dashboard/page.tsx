"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  BookOpen,
  Users,
  Plus,
  Calendar,
  Clock,
  Star,
  TrendingUp,
  FileText,
  CheckCircle,
  BarChart3,
  Settings,
  Send,
  Eye,
} from "lucide-react"
import Link from "next/link"

export default function TeacherDashboardPage() {
  const [activeTab, setActiveTab] = useState("overview")

  const classStats = {
    totalStudents: 24,
    activeStudents: 18,
    completedAssignments: 156,
    averageProgress: 73,
  }

  const recentAssignments = [
    {
      id: 1,
      title: "Surah Al-Fatiha Memorization",
      class: "Beginner Class A",
      dueDate: "2025-01-15",
      submitted: 18,
      total: 24,
      status: "active",
    },
    {
      id: 2,
      title: "Tajweed Rules Practice",
      class: "Intermediate Class B",
      dueDate: "2025-01-12",
      submitted: 22,
      total: 25,
      status: "active",
    },
    {
      id: 3,
      title: "Surah Al-Mulk Reading",
      class: "Advanced Class C",
      dueDate: "2025-01-10",
      submitted: 15,
      total: 15,
      status: "completed",
    },
  ]

  const studentProgress = [
    { name: "Aisha Rahman", progress: 92, streak: 12, lastActive: "2 hours ago" },
    { name: "Omar Hassan", progress: 87, streak: 8, lastActive: "5 hours ago" },
    { name: "Fatima Ali", progress: 95, streak: 15, lastActive: "1 hour ago" },
    { name: "Ahmed Khan", progress: 78, streak: 5, lastActive: "1 day ago" },
    { name: "Zainab Malik", progress: 89, streak: 10, lastActive: "3 hours ago" },
  ]

  return (
    <div className="min-h-screen bg-gradient-cream">
      {/* Header */}
      <header className="border-b border-border/50 bg-background/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 gradient-maroon rounded-xl flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">Teacher Dashboard</h1>
                <p className="text-xs text-muted-foreground">Ustadh Muhammad Al-Rashid</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <Badge className="gradient-gold text-white border-0 px-3 py-1">
                <Star className="w-3 h-3 mr-1" />
                Master Teacher
              </Badge>
              <Link href="/teacher/assignments/create">
                <Button className="gradient-maroon text-white border-0">
                  <Plus className="w-4 h-4 mr-2" />
                  New Assignment
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-foreground mb-2">Assalamu Alaikum, Ustadh Muhammad</h2>
          <p className="text-lg text-muted-foreground">Manage your classes and guide your students' Qur'anic journey</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="border-border/50 hover:shadow-lg transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Students</p>
                  <p className="text-2xl font-bold text-primary">{classStats.totalStudents}</p>
                </div>
                <div className="w-12 h-12 gradient-maroon rounded-xl flex items-center justify-center">
                  <Users className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 hover:shadow-lg transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Today</p>
                  <p className="text-2xl font-bold text-primary">{classStats.activeStudents}</p>
                </div>
                <div className="w-12 h-12 gradient-gold rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 hover:shadow-lg transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Assignments</p>
                  <p className="text-2xl font-bold text-primary">{classStats.completedAssignments}</p>
                </div>
                <div className="w-12 h-12 gradient-maroon rounded-xl flex items-center justify-center">
                  <FileText className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 hover:shadow-lg transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Avg Progress</p>
                  <p className="text-2xl font-bold text-primary">{classStats.averageProgress}%</p>
                </div>
                <div className="w-12 h-12 gradient-gold rounded-xl flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="assignments">Assignments</TabsTrigger>
            <TabsTrigger value="students">Students</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Recent Assignments */}
              <div className="lg:col-span-2">
                <Card className="border-border/50 shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-xl">Recent Assignments</CardTitle>
                    <CardDescription>Track your latest assignments and student submissions</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {recentAssignments.map((assignment) => (
                      <div
                        key={assignment.id}
                        className="flex items-center justify-between p-4 rounded-lg border border-border/50 hover:border-primary/30 transition-colors"
                      >
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h4 className="font-medium">{assignment.title}</h4>
                            <Badge
                              variant={assignment.status === "completed" ? "default" : "secondary"}
                              className={
                                assignment.status === "completed"
                                  ? "gradient-gold text-white border-0"
                                  : "bg-orange-100 text-orange-800"
                              }
                            >
                              {assignment.status === "completed" ? "Completed" : "Active"}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{assignment.class}</p>
                          <div className="flex items-center space-x-4 text-sm">
                            <span className="flex items-center text-muted-foreground">
                              <Calendar className="w-4 h-4 mr-1" />
                              Due: {new Date(assignment.dueDate).toLocaleDateString()}
                            </span>
                            <span className="flex items-center text-muted-foreground">
                              <CheckCircle className="w-4 h-4 mr-1" />
                              {assignment.submitted}/{assignment.total} submitted
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button variant="outline" size="sm" className="bg-transparent">
                            <Eye className="w-4 h-4 mr-2" />
                            View
                          </Button>
                        </div>
                      </div>
                    ))}
                    <Link href="/teacher/assignments">
                      <Button variant="outline" className="w-full bg-transparent">
                        View All Assignments
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              </div>

              {/* Quick Actions */}
              <div className="space-y-6">
                <Card className="border-border/50">
                  <CardHeader>
                    <CardTitle className="text-lg">Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Link href="/teacher/assignments/create">
                      <Button className="w-full justify-start gradient-maroon text-white border-0">
                        <Plus className="w-4 h-4 mr-2" />
                        Create Assignment
                      </Button>
                    </Link>
                    <Link href="/teacher/students">
                      <Button variant="outline" className="w-full justify-start bg-transparent">
                        <Users className="w-4 h-4 mr-2" />
                        Manage Students
                      </Button>
                    </Link>
                    <Link href="/teacher/classes">
                      <Button variant="outline" className="w-full justify-start bg-transparent">
                        <BookOpen className="w-4 h-4 mr-2" />
                        View Classes
                      </Button>
                    </Link>
                    <Link href="/teacher/reports">
                      <Button variant="outline" className="w-full justify-start bg-transparent">
                        <BarChart3 className="w-4 h-4 mr-2" />
                        Generate Reports
                      </Button>
                    </Link>
                  </CardContent>
                </Card>

                <Card className="border-border/50">
                  <CardHeader>
                    <CardTitle className="text-lg">Today's Schedule</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center space-x-3 p-3 rounded-lg bg-primary/10">
                      <div className="w-2 h-2 rounded-full bg-primary"></div>
                      <div>
                        <p className="font-medium text-sm">Beginner Class A</p>
                        <p className="text-xs text-muted-foreground">10:00 AM - 11:00 AM</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 p-3 rounded-lg bg-accent/10">
                      <div className="w-2 h-2 rounded-full bg-accent"></div>
                      <div>
                        <p className="font-medium text-sm">Advanced Class C</p>
                        <p className="text-xs text-muted-foreground">2:00 PM - 3:30 PM</p>
                      </div>
                    </div>
                    <Button variant="outline" className="w-full mt-4 bg-transparent">
                      <Calendar className="w-4 h-4 mr-2" />
                      View Full Schedule
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="assignments" className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-bold">Assignment Management</h3>
              <Link href="/teacher/assignments/create">
                <Button className="gradient-maroon text-white border-0">
                  <Plus className="w-4 h-4 mr-2" />
                  Create New Assignment
                </Button>
              </Link>
            </div>

            <div className="grid gap-6">
              {recentAssignments.map((assignment) => (
                <Card key={assignment.id} className="border-border/50">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h4 className="text-lg font-semibold">{assignment.title}</h4>
                        <p className="text-muted-foreground">{assignment.class}</p>
                      </div>
                      <Badge
                        variant={assignment.status === "completed" ? "default" : "secondary"}
                        className={
                          assignment.status === "completed"
                            ? "gradient-gold text-white border-0"
                            : "bg-orange-100 text-orange-800"
                        }
                      >
                        {assignment.status === "completed" ? "Completed" : "Active"}
                      </Badge>
                    </div>

                    <div className="grid md:grid-cols-3 gap-4 mb-4">
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">Due: {new Date(assignment.dueDate).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">
                          {assignment.submitted}/{assignment.total} submitted
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">
                          {assignment.status === "completed" ? "Completed" : "2 days remaining"}
                        </span>
                      </div>
                    </div>

                    <Progress value={(assignment.submitted / assignment.total) * 100} className="mb-4" />

                    <div className="flex space-x-3">
                      <Button variant="outline" size="sm" className="bg-transparent">
                        <Eye className="w-4 h-4 mr-2" />
                        View Details
                      </Button>
                      <Button variant="outline" size="sm" className="bg-transparent">
                        <Send className="w-4 h-4 mr-2" />
                        Send Reminder
                      </Button>
                      <Button variant="outline" size="sm" className="bg-transparent">
                        <Settings className="w-4 h-4 mr-2" />
                        Edit
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="students" className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-bold">Student Progress</h3>
              <Button variant="outline" className="bg-transparent">
                <Plus className="w-4 h-4 mr-2" />
                Add Student
              </Button>
            </div>

            <div className="grid gap-4">
              {studentProgress.map((student, index) => (
                <Card key={index} className="border-border/50 hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 gradient-maroon rounded-full flex items-center justify-center">
                          <span className="text-white font-medium">{student.name.charAt(0)}</span>
                        </div>
                        <div>
                          <h4 className="font-semibold">{student.name}</h4>
                          <p className="text-sm text-muted-foreground">Last active: {student.lastActive}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center space-x-2 mb-1">
                          <Star className="w-4 h-4 text-accent" />
                          <span className="text-sm font-medium">{student.streak} day streak</span>
                        </div>
                        <Badge className="gradient-gold text-white border-0">{student.progress}% Progress</Badge>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Overall Progress</span>
                        <span>{student.progress}%</span>
                      </div>
                      <Progress value={student.progress} />
                    </div>

                    <div className="flex space-x-3 mt-4">
                      <Button variant="outline" size="sm" className="bg-transparent">
                        <Eye className="w-4 h-4 mr-2" />
                        View Profile
                      </Button>
                      <Button variant="outline" size="sm" className="bg-transparent">
                        <Send className="w-4 h-4 mr-2" />
                        Send Message
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <h3 className="text-2xl font-bold">Class Analytics</h3>

            <div className="grid lg:grid-cols-2 gap-6">
              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle>Student Engagement</CardTitle>
                  <CardDescription>Weekly activity overview</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Daily Active Students</span>
                      <span className="font-medium">18/24 (75%)</span>
                    </div>
                    <Progress value={75} />

                    <div className="flex justify-between items-center">
                      <span className="text-sm">Assignment Completion Rate</span>
                      <span className="font-medium">89%</span>
                    </div>
                    <Progress value={89} />

                    <div className="flex justify-between items-center">
                      <span className="text-sm">Average Study Time</span>
                      <span className="font-medium">45 min/day</span>
                    </div>
                    <Progress value={68} />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle>Performance Metrics</CardTitle>
                  <CardDescription>Class performance indicators</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Average Recitation Score</span>
                      <span className="font-medium">87%</span>
                    </div>
                    <Progress value={87} />

                    <div className="flex justify-between items-center">
                      <span className="text-sm">Memorization Accuracy</span>
                      <span className="font-medium">92%</span>
                    </div>
                    <Progress value={92} />

                    <div className="flex justify-between items-center">
                      <span className="text-sm">Tajweed Improvement</span>
                      <span className="font-medium">+15%</span>
                    </div>
                    <Progress value={78} />
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="border-border/50">
              <CardHeader>
                <CardTitle>Top Performers</CardTitle>
                <CardDescription>Students excelling in their studies</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {studentProgress
                    .sort((a, b) => b.progress - a.progress)
                    .slice(0, 5)
                    .map((student, index) => (
                      <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                        <div className="flex items-center space-x-3">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium ${
                              index === 0
                                ? "bg-yellow-500"
                                : index === 1
                                  ? "bg-gray-400"
                                  : index === 2
                                    ? "bg-amber-600"
                                    : "gradient-maroon"
                            }`}
                          >
                            {index + 1}
                          </div>
                          <span className="font-medium">{student.name}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge className="gradient-gold text-white border-0">{student.progress}%</Badge>
                          <div className="flex items-center space-x-1">
                            <Star className="w-3 h-3 text-accent" />
                            <span className="text-sm">{student.streak}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
