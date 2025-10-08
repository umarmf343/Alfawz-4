"use client"

import Link from "next/link"
import { BookOpen } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function StudentQuranReaderPage() {
  return (
    <main className="flex min-h-[60vh] items-center justify-center px-4 py-12">
      <Card className="max-w-2xl border-maroon-100 bg-cream-50/60 shadow-xl">
        <CardHeader className="space-y-3">
          <CardTitle className="flex items-center gap-3 text-2xl text-maroon-900">
            <BookOpen className="h-6 w-6 text-maroon-600" aria-hidden />
            Qur&apos;an flipbook retired
          </CardTitle>
          <p className="text-sm text-gray-600">
            The interactive mushaf flipbook has been removed while we focus on other recitation tools. You can still track
            assignments, submit recordings, and receive feedback through the Practice Lab and dashboard.
          </p>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 text-sm text-gray-600">
          <p>
            Visit the Practice Lab to continue recording your tilawah sessions, or head back to the dashboard for your latest
            teacher updates and progress insights.
          </p>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Button className="bg-maroon-600 text-white hover:bg-maroon-700" asChild>
              <Link href="/practice">Open Practice Lab</Link>
            </Button>
            <Button variant="outline" className="border-maroon-200 text-maroon-700" asChild>
              <Link href="/dashboard">Return to dashboard</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  )
}
