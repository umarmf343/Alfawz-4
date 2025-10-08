"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useUser } from "@/hooks/use-user"
import {
  BookOpen,
  Users,
  Trophy,
  CreditCard,
  Settings,
  BarChart3,
  User,
  LogOut,
  Menu,
  X,
  Home,
  Target,
  Crown,
  Shield,
  Bell,
  Gamepad2,
  Sparkles,
} from "lucide-react"

export default function Navigation() {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const { profile, isPremium, signOut } = useUser()

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: Home },
    { name: "Play Games", href: "/games", icon: Gamepad2 },
    { name: "Habit Quest", href: "/habits", icon: Gamepad2 },
    { name: "Qur'an Reader", href: "/reader", icon: BookOpen },
    { name: "Tajweed Lab", href: "/tajweed-lab", icon: Sparkles },
    { name: "Memorization", href: "/student/memorization", icon: Target },
    { name: "Progress", href: "/progress", icon: BarChart3 },
    { name: "Achievements", href: "/achievements", icon: Trophy },
    { name: "Leaderboard", href: "/leaderboard", icon: Crown },
    { name: "Billing", href: "/billing", icon: CreditCard },
  ]

  const teacherNavigation = [
    { name: "Teacher Dashboard", href: "/teacher/dashboard", icon: Users },
    { name: "Create Assignment", href: "/teacher/assignments/create", icon: Settings },
  ]

  const adminNavigation = [
    { name: "Admin Panel", href: "/admin", icon: Shield },
    { name: "System Settings", href: "/admin/settings", icon: Settings },
  ]

  const isActive = (href: string) => pathname === href

  const planLabel = useMemo(() => {
    const roleLabel = profile.role.charAt(0).toUpperCase() + profile.role.slice(1)
    const planName = isPremium ? "Premium" : "Free"
    return `${planName} ${roleLabel}`
  }, [profile.role, isPremium])

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button variant="outline" size="sm" onClick={() => setIsOpen(!isOpen)} className="bg-white/90 backdrop-blur-sm">
          {isOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </Button>
      </div>

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center gap-3 p-6 border-b">
            <div className="w-10 h-10 bg-gradient-to-br from-maroon-600 to-maroon-700 rounded-lg flex items-center justify-center">
              <BookOpen className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-maroon-900">AlFawz</h1>
              <p className="text-xs text-maroon-600">Qur'an Institute</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            {/* Main Navigation */}
            <div className="space-y-1">
              {navigation.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive(item.href) ? "bg-maroon-100 text-maroon-900" : "text-gray-700 hover:bg-gray-100"
                    }`}
                    onClick={() => setIsOpen(false)}
                  >
                    <Icon className="h-4 w-4" />
                    {item.name}
                    {item.name === "Habit Quest" && !isPremium && (
                      <Badge className="ml-auto bg-gradient-to-r from-yellow-400 to-orange-500 text-white border-0 flex items-center gap-1">
                        <Sparkles className="h-3 w-3" />
                        New
                      </Badge>
                    )}
                    {item.name === "Achievements" && (
                      <Badge className="ml-auto bg-yellow-100 text-yellow-800 border-yellow-200">3</Badge>
                    )}
                  </Link>
                )
              })}
            </div>

            {/* Teacher Section */}
            <div className="pt-4">
              <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Teaching</h3>
              <div className="space-y-1">
                {teacherNavigation.map((item) => {
                  const Icon = item.icon
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        isActive(item.href) ? "bg-maroon-100 text-maroon-900" : "text-gray-700 hover:bg-gray-100"
                      }`}
                      onClick={() => setIsOpen(false)}
                    >
                      <Icon className="h-4 w-4" />
                      {item.name}
                    </Link>
                  )
                })}
              </div>
            </div>

            {/* Admin Section */}
            <div className="pt-4">
              <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Administration</h3>
              <div className="space-y-1">
                {adminNavigation.map((item) => {
                  const Icon = item.icon
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        isActive(item.href) ? "bg-maroon-100 text-maroon-900" : "text-gray-700 hover:bg-gray-100"
                      }`}
                      onClick={() => setIsOpen(false)}
                    >
                      <Icon className="h-4 w-4" />
                      {item.name}
                      {item.name === "Admin Panel" && (
                        <Badge className="ml-auto bg-red-100 text-red-800 border-red-200">2</Badge>
                      )}
                    </Link>
                  )
                })}
              </div>
            </div>
          </nav>

          {/* User Profile */}
          <div className="p-4 border-t">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 bg-maroon-100 rounded-full flex items-center justify-center">
                <User className="h-4 w-4 text-maroon-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{profile.name}</p>
                <p className="text-xs text-gray-500">{planLabel}</p>
              </div>
              <Button variant="ghost" size="sm">
                <Bell className="h-4 w-4" />
              </Button>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start text-gray-700 bg-transparent"
              onClick={() => {
                console.log("[v0] User logging out")
                signOut()
                setIsOpen(false)
                router.push("/auth/login")
              }}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>

      {/* Overlay for mobile */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden" onClick={() => setIsOpen(false)} />
      )}
    </>
  )
}
