"use client"

import Link from "next/link"
import { useCallback, useMemo } from "react"
import { Brain, CheckCircle2, RefreshCw } from "lucide-react"

import { useUser } from "@/hooks/use-user"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const memorizationStatusLabels: Record<string, string> = {
  new: "New",
  due: "Due",
  learning: "In Review",
  mastered: "Mastered",
}

const taskStatusLabel = (status: string) => memorizationStatusLabels[status] ?? status

export function MemorizationStudioPanel() {
  const { dashboard, teachers, reviewMemorizationTask } = useUser()

  const memorizationSummary = dashboard?.memorizationSummary
  const memorizationQueue = useMemo(() => dashboard?.memorizationQueue ?? [], [dashboard?.memorizationQueue])
  const memorizationPlaylists = useMemo(
    () => dashboard?.memorizationPlaylists ?? [],
    [dashboard?.memorizationPlaylists],
  )
  const teacherMap = useMemo(() => new Map(teachers.map((teacher) => [teacher.id, teacher.name])), [teachers])

  const memorizationDueToday = memorizationSummary?.dueToday ?? 0
  const memorizationNewCount = memorizationSummary?.newCount ?? 0
  const memorizationMastered = memorizationSummary?.totalMastered ?? 0
  const memorizationRecommendedDuration = memorizationSummary?.recommendedDuration ?? 0
  const memorizationHeatmap = memorizationSummary?.reviewHeatmap ?? []

  const sortedMemorizationQueue = useMemo(() => {
    return [...memorizationQueue].sort(
      (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime(),
    )
  }, [memorizationQueue])

  const memorizationDueTasks = useMemo(
    () =>
      sortedMemorizationQueue.filter((task) => {
        const dueDate = new Date(task.dueDate)
        const today = new Date()
        dueDate.setHours(0, 0, 0, 0)
        today.setHours(0, 0, 0, 0)
        return dueDate.getTime() <= today.getTime()
      }),
    [sortedMemorizationQueue],
  )

  const nextMemorizationTask = memorizationDueTasks[0] ?? sortedMemorizationQueue[0]

  const handleMemorizationReview = useCallback(
    (taskId: string) => {
      reviewMemorizationTask({ taskId, quality: 4, accuracy: 95, durationSeconds: 180 })
    },
    [reviewMemorizationTask],
  )

  if (!dashboard) {
    return null
  }

  return (
    <Card className="shadow-lg border-emerald-100/60 bg-white/95">
      <CardHeader>
        <CardTitle className="text-xl flex items-center gap-2 text-maroon-900">
          <Brain className="w-5 h-5 text-maroon-600" />
          Memorization Studio
        </CardTitle>
        <CardDescription className="text-maroon-600">
          Keep the spaced repetition queue healthy and celebrate every review.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="rounded-lg border border-rose-100 bg-rose-50/70 p-4">
            <p className="text-xs uppercase tracking-wide text-rose-600">Due today</p>
            <p className="text-3xl font-bold text-rose-700">{memorizationDueToday}</p>
            <p className="text-xs text-rose-600">{memorizationRecommendedDuration} min suggested</p>
          </div>
          <div className="rounded-lg border border-amber-100 bg-amber-50 p-4">
            <p className="text-xs uppercase tracking-wide text-amber-600">New cards</p>
            <p className="text-3xl font-bold text-amber-700">{memorizationNewCount}</p>
            <p className="text-xs text-amber-600">Introduce gradually for retention</p>
          </div>
          <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-4">
            <p className="text-xs uppercase tracking-wide text-emerald-600">Mastered</p>
            <p className="text-3xl font-bold text-emerald-700">{memorizationMastered}</p>
            <p className="text-xs text-emerald-600">Confidence-backed mastery</p>
          </div>
          <div className="hidden md:block rounded-lg border border-maroon-100 bg-cream-50 p-4">
            <p className="text-xs uppercase tracking-wide text-maroon-600">Last review</p>
            <p className="text-lg font-semibold text-maroon-800">
              {memorizationSummary?.lastReviewedOn
                ? new Date(memorizationSummary.lastReviewedOn).toLocaleTimeString()
                : "Not yet"}
            </p>
            <p className="text-xs text-maroon-600">Streak {memorizationSummary?.streak ?? 0} days</p>
          </div>
        </div>

        {nextMemorizationTask ? (
          <div className="rounded-lg border border-maroon-100 bg-cream-50 p-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-wide text-maroon-600">Next focus</p>
              <p className="text-sm font-semibold text-maroon-900">
                {nextMemorizationTask.surah} • Ayah {nextMemorizationTask.ayahRange}
              </p>
              <p className="text-xs text-maroon-600">
                {memorizationSummary?.focusArea || nextMemorizationTask.notes || "Guided by your instructor"}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant="secondary" className="text-xs bg-white text-maroon-700">
                {taskStatusLabel(nextMemorizationTask.status)}
              </Badge>
              <Button
                size="sm"
                className="bg-gradient-to-r from-maroon-600 to-maroon-700 text-white border-0"
                onClick={() => handleMemorizationReview(nextMemorizationTask.id)}
              >
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Mark Reviewed
              </Button>
            </div>
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-maroon-200 bg-maroon-50/60 p-4 text-sm text-maroon-700">
            No memorization tasks in the queue yet. Ask your teacher to assign a playlist to get started.
          </div>
        )}

        <div className="space-y-3">
          {sortedMemorizationQueue.slice(0, 4).map((task) => (
            <div
              key={task.id}
              className="rounded-lg border border-maroon-100 bg-white p-4 shadow-sm flex flex-col gap-3 md:flex-row md:items-center md:justify-between"
            >
              <div className="space-y-1">
                <p className="text-sm font-semibold text-maroon-900">
                  {task.surah} • Ayah {task.ayahRange}
                </p>
                <div className="text-xs text-gray-600 flex flex-wrap items-center gap-3">
                  <span>Due {new Date(task.dueDate).toLocaleDateString()}</span>
                  <span>Interval: {task.interval} day{task.interval === 1 ? "" : "s"}</span>
                  <span>Confidence {(task.memorizationConfidence * 100).toFixed(0)}%</span>
                  <span>Teacher: {teacherMap.get(task.teacherId) ?? "Instructor"}</span>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Badge variant="secondary" className="text-xs bg-white text-maroon-700">
                  {taskStatusLabel(task.status)}
                </Badge>
                <Button variant="outline" size="sm" onClick={() => handleMemorizationReview(task.id)}>
                  <RefreshCw className="w-4 h-4 mr-2" /> Review
                </Button>
              </div>
            </div>
          ))}
          {sortedMemorizationQueue.length === 0 && (
            <div className="rounded-lg border border-dashed border-maroon-200 bg-white/70 p-4 text-center text-sm text-gray-600">
              Add ayahs to your memorization playlist to populate this view.
            </div>
          )}
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          {memorizationPlaylists.slice(0, 2).map((playlist) => (
            <div key={playlist.id} className="rounded-lg border border-maroon-100 bg-white p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold text-maroon-900">{playlist.title}</p>
                <Badge variant="secondary" className="text-xs bg-maroon-50 text-maroon-700">
                  {playlist.progress}%
                </Badge>
              </div>
              <p className="text-xs text-gray-600 mb-2">{playlist.description}</p>
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>{playlist.ayahCount} ayahs</span>
                <span>{playlist.dueCount} due</span>
              </div>
            </div>
          ))}
          {memorizationPlaylists.length === 0 && (
            <div className="rounded-lg border border-dashed border-maroon-200 bg-white/70 p-4 text-sm text-gray-600">
              Create a memorization playlist to track long-term goals.
            </div>
          )}
        </div>

        {memorizationHeatmap.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-wide text-gray-500">Recent review momentum</p>
            <div className="flex gap-1 flex-wrap">
              {memorizationHeatmap.slice(0, 14).map((entry) => (
                <div
                  key={entry.date}
                  className={`h-6 w-6 rounded-md flex items-center justify-center text-[10px] font-medium ${
                    entry.completed === 0
                      ? "bg-gray-100 text-gray-400"
                      : entry.completed >= 3
                        ? "bg-maroon-600 text-white"
                        : "bg-maroon-200 text-maroon-700"
                  }`}
                >
                  {entry.completed}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-wrap justify-end gap-3">
          <Button variant="outline" asChild>
            <Link href="/student/memorization">Open Memorization Panel</Link>
          </Button>
          {nextMemorizationTask && (
            <Button className="bg-gradient-to-r from-maroon-600 to-maroon-700 text-white border-0" asChild>
              <Link href={`/student/memorization?focus=${nextMemorizationTask.id}`}>
                Start Focus Session
              </Link>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
