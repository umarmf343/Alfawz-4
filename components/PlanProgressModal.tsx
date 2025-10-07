"use client"

import type React from "react"
import { useEffect, useMemo, useState } from "react"

import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  TeacherPlanProgress,
  TeacherPlanProgressClassSummary,
  TeacherPlanProgressStudent,
} from "@/lib/data/teacher-database"
import { formatVerseReference } from "@/lib/quran-data"
import { cn } from "@/lib/utils"
import { formatDistanceToNow } from "date-fns"
import { AlertCircle, CheckCircle2, Clock3, Loader2, PauseCircle } from "lucide-react"

interface PlanProgressModalProps {
  planId: string | null
  planTitle?: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface FetchState {
  status: "idle" | "loading" | "success" | "error"
  error?: string
  data?: TeacherPlanProgress
}

const statusConfig: Record<
  TeacherPlanProgressStudent["status"],
  { label: string; icon: React.ComponentType<{ className?: string }>; className: string }
> = {
  completed: { label: "Completed", icon: CheckCircle2, className: "text-emerald-700" },
  in_progress: { label: "In progress", icon: Clock3, className: "text-amber-600" },
  not_started: { label: "Not started", icon: PauseCircle, className: "text-slate-500" },
}

export function PlanProgressModal({ planId, planTitle, open, onOpenChange }: PlanProgressModalProps) {
  const [state, setState] = useState<FetchState>({ status: "idle" })

  useEffect(() => {
    if (!open || !planId) {
      return
    }
    let ignore = false
    async function fetchProgress() {
      setState({ status: "loading" })
      try {
        const response = await fetch(`/api/teacher/plans/${planId}/progress`)
        const data = (await response.json().catch(() => null)) as
          | { progress?: TeacherPlanProgress; error?: string }
          | null
        if (ignore) return
        if (!response.ok || !data?.progress) {
          throw new Error(data?.error ?? "Unable to load plan progress")
        }
        setState({ status: "success", data: data.progress })
      } catch (error) {
        if (ignore) return
        setState({
          status: "error",
          error: error instanceof Error ? error.message : "Unable to load plan progress",
        })
      }
    }
    fetchProgress()
    return () => {
      ignore = true
    }
  }, [open, planId])

  const classProgress = useMemo(() => {
    if (state.status !== "success" || !state.data) {
      return [] as TeacherPlanProgressClassSummary[]
    }
    return state.data.classes
  }, [state])

  const students = state.status === "success" && state.data ? state.data.students : []
  const verseCount = state.status === "success" && state.data ? state.data.plan.verseKeys.length : 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl border-emerald-100 bg-white/95">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between gap-3 text-maroon-900">
            <span>Plan progress overview</span>
            {verseCount > 0 && (
              <Badge className="bg-emerald-700 text-white">{verseCount} verses</Badge>
            )}
          </DialogTitle>
          <DialogDescription className="text-emerald-800">
            {planTitle ?? "Memorization plan"}
          </DialogDescription>
        </DialogHeader>

        {state.status === "loading" && (
          <div className="flex h-48 flex-col items-center justify-center gap-3 text-emerald-800">
            <Loader2 className="h-6 w-6 animate-spin" />
            Fetching student progress…
          </div>
        )}

        {state.status === "error" && (
          <div className="flex h-48 flex-col items-center justify-center gap-3 text-rose-700">
            <AlertCircle className="h-6 w-6" />
            {state.error}
          </div>
        )}

        {state.status === "success" && state.data && (
          <div className="space-y-6">
            <div className="grid gap-4 rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4 md:grid-cols-3">
              {classProgress.length === 0 ? (
                <p className="text-sm text-emerald-800">This plan is not assigned to any classes yet.</p>
              ) : (
                classProgress.map((classSummary) => {
                  const total = classSummary.studentCount || 1
                  const completion = Math.round((classSummary.completed / total) * 100)
                  const active = classSummary.inProgress
                  return (
                    <div key={classSummary.id} className="space-y-2 rounded-xl bg-white/80 p-3 shadow-sm">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-maroon-900">{classSummary.name}</p>
                          <p className="text-xs text-emerald-700">
                            {classSummary.studentCount} learner{classSummary.studentCount === 1 ? "" : "s"}
                          </p>
                        </div>
                        <Badge variant="outline" className="border-emerald-200 text-emerald-800">
                          {completion}% complete
                        </Badge>
                      </div>
                      <Progress value={completion} className="h-2 bg-emerald-100" />
                      <div className="flex items-center gap-3 text-xs text-emerald-700">
                        <span>{classSummary.completed} completed</span>
                        <span>{active} in progress</span>
                        <span>{classSummary.notStarted} not started</span>
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            <div className="rounded-2xl border border-emerald-100 bg-white/90">
              <div className="flex items-center justify-between border-b border-emerald-100 px-4 py-3">
                <h3 className="text-sm font-medium text-maroon-900">Student progress</h3>
                <Badge variant="outline" className="border-emerald-200 text-emerald-800">
                  {students.length} learner{students.length === 1 ? "" : "s"}
                </Badge>
              </div>
              <ScrollArea className="max-h-80">
                <div className="divide-y divide-emerald-100">
                  {students.length === 0 ? (
                    <p className="p-4 text-sm text-emerald-700">No students are assigned to this plan yet.</p>
                  ) : (
                    students.map((student) => {
                      const config = statusConfig[student.status]
                      const Icon = config.icon
                      const currentVerse = student.currentVerseIndex < student.verseCount
                        ? state.data?.plan.verseKeys[student.currentVerseIndex]
                        : undefined
                      return (
                        <div key={student.studentId} className="flex flex-col gap-2 p-4 text-sm">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div>
                              <p className="font-medium text-maroon-900">{student.studentName}</p>
                              <p className="text-xs text-emerald-700">{student.className}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Icon className={cn("h-4 w-4", config.className)} />
                              <span className={cn("text-xs font-medium", config.className)}>{config.label}</span>
                            </div>
                          </div>
                          <div className="flex flex-wrap items-center gap-3 text-xs text-emerald-700">
                            <span>
                              {student.repetitionsDone} / 20 repetitions on current verse
                            </span>
                            {currentVerse && (
                              <span className="rounded-full bg-emerald-50 px-2 py-1">
                                {formatVerseReference(currentVerse)}
                              </span>
                            )}
                            {student.lastActivity && (
                              <span>
                                Last activity {formatDistanceToNow(new Date(student.lastActivity), { addSuffix: true })}
                              </span>
                            )}
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </ScrollArea>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
