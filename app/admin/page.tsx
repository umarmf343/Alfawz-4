"use client"

import { useState } from "react"
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
} from "lucide-react"

export default function AdminDashboard() {
  const [timeframe, setTimeframe] = useState("7d")

  const stats = {
    totalUsers: 12847,
    activeUsers: 8934,
    totalRevenue: 2450000,
    monthlyRevenue: 450000,
    totalSessions: 45678,
    avgSessionTime: "24m",
    completionRate: 78,
    subscriptionRate: 34,
  }

  const recentActivity = [
    {
      id: 1,
      type: "user_registration",
      user: "Ahmad Hassan",
      action: "New user registered",
      time: "2 minutes ago",
      status: "success",
    },
    {
      id: 2,
      type: "payment",
      user: "Fatima Ali",
      action: "Premium subscription purchased",
      time: "5 minutes ago",
      status: "success",
    },
    {
      id: 3,
      type: "content_report",
      user: "Omar Khalil",
      action: "Reported inappropriate content",
      time: "12 minutes ago",
      status: "warning",
    },
    {
      id: 4,
      type: "achievement",
      user: "Aisha Mahmoud",
      action: "Completed Hafiz milestone",
      time: "18 minutes ago",
      status: "success",
    },
    {
      id: 5,
      type: "system",
      user: "System",
      action: "Daily backup completed",
      time: "1 hour ago",
      status: "info",
    },
  ]

  const userGrowth = [
    { month: "Jan", users: 8500, revenue: 340000 },
    { month: "Feb", users: 9200, revenue: 368000 },
    { month: "Mar", users: 10100, revenue: 404000 },
    { month: "Apr", users: 11300, revenue: 452000 },
    { month: "May", users: 12100, revenue: 484000 },
    { month: "Jun", users: 12847, revenue: 513880 },
  ]

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "user_registration":
        return <Users className="h-4 w-4" />
      case "payment":
        return <DollarSign className="h-4 w-4" />
      case "content_report":
        return <AlertTriangle className="h-4 w-4" />
      case "achievement":
        return <Star className="h-4 w-4" />
      case "system":
        return <Settings className="h-4 w-4" />
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
            <p className="text-lg text-maroon-700">Manage and monitor the AlFawz Qur'an Institute platform</p>
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
          <TabsList className="grid w-full grid-cols-5 bg-white/50 backdrop-blur-sm">
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
                    {userGrowth.map((data, index) => (
                      <div key={data.month} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 text-sm font-medium text-gray-600">{data.month}</div>
                          <div className="flex-1">
                            <Progress value={(data.users / 15000) * 100} className="h-2" />
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
                        <span>68%</span>
                      </div>
                      <Progress value={68} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Session Duration</span>
                        <span>82%</span>
                      </div>
                      <Progress value={82} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Feature Usage</span>
                        <span>75%</span>
                      </div>
                      <Progress value={75} className="h-2" />
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
                      <span className="font-medium">2,847</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Premium</span>
                      <span className="font-medium">4,521</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Family</span>
                      <span className="font-medium">1,234</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Institution</span>
                      <span className="font-medium">89</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">System Health</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Server Uptime</span>
                      <Badge className="bg-green-100 text-green-800 border-green-200">99.9%</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">API Response</span>
                      <Badge className="bg-green-100 text-green-800 border-green-200">Fast</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Database</span>
                      <Badge className="bg-green-100 text-green-800 border-green-200">Healthy</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Storage</span>
                      <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">78% Used</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
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
                          <div className="font-medium">New Qur'an Audio</div>
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
        </Tabs>
      </div>
    </div>
  )
}
