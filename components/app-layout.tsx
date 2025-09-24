"use client"

import type React from "react"

import Navigation from "@/components/navigation"

interface AppLayoutProps {
  children: React.ReactNode
}

export default function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="flex h-screen bg-gradient-to-br from-cream-50 to-maroon-50">
      <Navigation />
      <main className="flex-1 lg:ml-64 overflow-auto">{children}</main>
    </div>
  )
}

export { AppLayout }
