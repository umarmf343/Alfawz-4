"use client"

import { useMemo, useState } from "react"

import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/components/ui/use-toast"
import { PlanCreatorForm } from "@/components/PlanCreatorForm"
import { PlanProgressModal } from "@/components/PlanProgressModal"
import { getCachedVerseText } from "@/hooks/useQuranVerses"
import {
  SuggestedMemorizationPlan,
  TeacherClassSummary,
  TeacherMemorizationPlanSummary,
} from "@/lib/data/teacher-database"
import { formatVerseReference } from "@/lib/quran-data"
import { cn } from "@/lib/utils"
import { formatDistanceToNow } from "date-fns"
import {
  BarChart3,
  Bell,
  Copy,
  FileDown,
  Loader2,
  Plus,
  Trash2,
  Wand2,
  Waypoints,
  BookOpenCheck,
  Pencil,
} from "lucide-react"

interface PlanManagementClientProps {
  teacherId: string
  initialPlans: TeacherMemorizationPlanSummary[]
  initialClasses: TeacherClassSummary[]
  suggestions: SuggestedMemorizationPlan[]
}

interface DeleteState {
  planId: string | null
  isLoading: boolean
}

export default function PlanManagementClient({
  teacherId: _teacherId,
  initialPlans,
  initialClasses,
  suggestions,
}: PlanManagementClientProps) {
  const [plans, setPlans] = useState<TeacherMemorizationPlanSummary[]>(initialPlans)
  const [classes] = useState<TeacherClassSummary[]>(initialClasses)
  const [dialogMode, setDialogMode] = useState<"create" | "edit">("create")
  const [activePlan, setActivePlan] = useState<TeacherMemorizationPlanSummary | undefined>(undefined)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [prefillSuggestion, setPrefillSuggestion] = useState<SuggestedMemorizationPlan | null>(null)
  const [progressPlan, setProgressPlan] = useState<{ id: string; title: string } | null>(null)
  const [deleteState, setDeleteState] = useState<DeleteState>({ planId: null, isLoading: false })
  const { toast } = useToast()

  const aggregateStats = useMemo(() => {
    if (plans.length === 0) {
      return { plans: 0, verses: 0, students: 0, completionRate: 0 }
    }
    const verseTotal = plans.reduce((total, plan) => total + plan.stats.verseCount, 0)
    const studentTotal = plans.reduce((total, plan) => total + plan.stats.assignedStudents, 0)
    const completedTotal = plans.reduce((total, plan) => total + plan.stats.completedStudents, 0)
    const completionRate = studentTotal === 0 ? 0 : Math.round((completedTotal / studentTotal) * 100)
    return {
      plans: plans.length,
      verses: verseTotal,
      students: studentTotal,
      completionRate,
    }
  }, [plans])

  function openCreateDialog(suggestion?: SuggestedMemorizationPlan) {
    setDialogMode("create")
    setActivePlan(undefined)
    setPrefillSuggestion(suggestion ?? null)
    setIsDialogOpen(true)
  }

  function openEditDialog(plan: TeacherMemorizationPlanSummary) {
    setDialogMode("edit")
    setActivePlan(plan)
    setPrefillSuggestion(null)
    setIsDialogOpen(true)
  }

  function handlePlanCreated(plan: TeacherMemorizationPlanSummary) {
    setPlans((previous) => [plan, ...previous.filter((entry) => entry.plan.id !== plan.plan.id)])
  }

  function handlePlanUpdated(plan: TeacherMemorizationPlanSummary) {
    setPlans((previous) => previous.map((entry) => (entry.plan.id === plan.plan.id ? plan : entry)))
  }

  async function handleDuplicate(plan: TeacherMemorizationPlanSummary) {
    const payload = {
      title: `${plan.plan.title} (Copy)`,
      classIds: plan.plan.classIds,
      verseKeys: plan.plan.verseKeys,
      notes: plan.plan.notes,
    }
    try {
      const response = await fetch("/api/teacher/plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const data = (await response.json().catch(() => null)) as
        | { plan?: TeacherMemorizationPlanSummary; error?: string }
        | null
      if (!response.ok || !data?.plan) {
        throw new Error(data?.error ?? "Unable to duplicate plan")
      }
      setPlans((previous) => [data.plan!, ...previous])
      toast({ title: "Plan duplicated", description: "A copy has been created for your next cycle." })
    } catch (error) {
      toast({
        title: "Could not duplicate plan",
        description: error instanceof Error ? error.message : "An unexpected error occurred.",
        variant: "destructive",
      })
    }
  }

  async function handleDeleteConfirm() {
    if (!deleteState.planId) return
    setDeleteState((previous) => ({ ...previous, isLoading: true }))
    try {
      const response = await fetch(`/api/teacher/plans/${deleteState.planId}`, { method: "DELETE" })
      const data = (await response.json().catch(() => null)) as { success?: boolean; error?: string } | null
      if (!response.ok || !data?.success) {
        throw new Error(data?.error ?? "Unable to delete plan")
      }
      setPlans((previous) => previous.filter((entry) => entry.plan.id !== deleteState.planId))
      toast({
        title: "Plan deleted",
        description: "Students will no longer see this memorization plan.",
      })
    } catch (error) {
      toast({
        title: "Could not delete plan",
        description: error instanceof Error ? error.message : "An unexpected error occurred.",
        variant: "destructive",
      })
    } finally {
      setDeleteState({ planId: null, isLoading: false })
    }
  }

  function handleExport(plan: TeacherMemorizationPlanSummary) {
    const verses = plan.plan.verseKeys.map((key) => ({ key, text: getCachedVerseText(key) }))
    const printable = `<!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charSet="utf-8" />
          <title>${plan.plan.title} – Memorization Sheet</title>
          <style>
            body { font-family: 'Helvetica Neue', Arial, sans-serif; padding: 32px; color: #1f2937; }
            h1 { margin-bottom: 0; }
            h2 { color: #047857; margin-top: 32px; }
            .verse { margin-bottom: 24px; }
            .reference { font-size: 12px; color: #047857; text-transform: uppercase; }
            .arabic { font-family: 'Amiri', serif; font-size: 28px; line-height: 1.6; direction: rtl; text-align: right; margin-top: 8px; }
          </style>
        </head>
        <body>
          <h1>${plan.plan.title}</h1>
          ${plan.plan.notes ? `<p>${plan.plan.notes}</p>` : ""}
          <h2>Verses (${verses.length})</h2>
          ${verses
            .map(
              (verse) => `
              <div class="verse">
                <div class="reference">${formatVerseReference(verse.key)}</div>
                <div class="arabic">${verse.text}</div>
              </div>
            `,
            )
            .join("")}
        </body>
      </html>`

    const printWindow = window.open("", "_blank")
    if (!printWindow) {
      toast({
        title: "Export blocked",
        description: "Allow pop-ups to generate the printable sheet.",
        variant: "destructive",
      })
      return
    }
    printWindow.document.write(printable)
    printWindow.document.close()
    printWindow.focus()
    printWindow.print()
  }

  function handleReminder(plan: TeacherMemorizationPlanSummary) {
    const awaiting = plan.stats.notStartedStudents + plan.stats.inProgressStudents
    toast({
      title: "Gentle reminder drafted",
      description:
        awaiting === 0
          ? "All students are already celebrating this plan!"
          : `${awaiting} learner${awaiting === 1 ? "" : "s"} still need a nudge. Encourage them with a heartfelt reminder.`,
    })
  }

  function closeDialog() {
    setIsDialogOpen(false)
    setPrefillSuggestion(null)
  }

  return (
    <div className="space-y-8">
      <header className="space-y-4 rounded-3xl border border-emerald-100 bg-gradient-to-br from-white via-emerald-50/60 to-white p-8 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold text-maroon-900">Memorization plans</h1>
            <p className="text-sm text-emerald-800">
              Curate, assign, and celebrate your students’ hifz milestones with clarity and grace.
            </p>
          </div>
          <Button className="bg-emerald-700 text-white hover:bg-emerald-800" onClick={() => openCreateDialog()}>
            <Plus className="mr-2 h-4 w-4" /> New plan
          </Button>
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="border-emerald-100/70 bg-white/90">
            <CardContent className="flex flex-col gap-1 p-4">
              <span className="text-xs uppercase text-emerald-700">Active plans</span>
              <span className="text-2xl font-semibold text-maroon-900">{aggregateStats.plans}</span>
            </CardContent>
          </Card>
          <Card className="border-emerald-100/70 bg-white/90">
            <CardContent className="flex flex-col gap-1 p-4">
              <span className="text-xs uppercase text-emerald-700">Verses assigned</span>
              <span className="text-2xl font-semibold text-maroon-900">{aggregateStats.verses}</span>
            </CardContent>
          </Card>
          <Card className="border-emerald-100/70 bg-white/90">
            <CardContent className="flex flex-col gap-1 p-4">
              <span className="text-xs uppercase text-emerald-700">Learners reached</span>
              <span className="text-2xl font-semibold text-maroon-900">{aggregateStats.students}</span>
            </CardContent>
          </Card>
          <Card className="border-emerald-100/70 bg-white/90">
            <CardContent className="flex flex-col gap-1 p-4">
              <span className="text-xs uppercase text-emerald-700">Average completion</span>
              <span className="text-2xl font-semibold text-maroon-900">{aggregateStats.completionRate}%</span>
            </CardContent>
          </Card>
        </div>
      </header>

      {suggestions.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium text-emerald-800">
            <Wand2 className="h-4 w-4" /> Inspired sequences for your classes
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {suggestions.map((suggestion) => (
              <Card key={suggestion.id} className="border-emerald-100 bg-white/90">
                <CardContent className="flex h-full flex-col gap-3 p-4">
                  <div>
                    <h3 className="text-base font-semibold text-maroon-900">{suggestion.title}</h3>
                    <p className="text-sm text-emerald-700">{suggestion.reason}</p>
                  </div>
                  <div className="mt-auto flex items-center justify-between">
                    <Badge variant="outline" className="border-emerald-200 text-emerald-800">
                      {suggestion.verseKeys.length} verses
                    </Badge>
                    <Button variant="ghost" size="sm" onClick={() => openCreateDialog(suggestion)}>
                      <BookOpenCheck className="mr-2 h-4 w-4" /> Use plan
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      <Card className="border-emerald-100/70 bg-white/95">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-emerald-50/60">
                <TableHead className="text-emerald-800">Plan</TableHead>
                <TableHead className="text-emerald-800">Verses</TableHead>
                <TableHead className="text-emerald-800">Classes</TableHead>
                <TableHead className="text-emerald-800">Created</TableHead>
                <TableHead className="text-right text-emerald-800">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {plans.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-12 text-center text-sm text-emerald-700">
                    No memorization plans yet. Create one to begin guiding your class.
                  </TableCell>
                </TableRow>
              ) : (
                plans.map((plan) => {
                  const createdAt = new Date(plan.plan.createdAt)
                  return (
                    <TableRow key={plan.plan.id} className="align-top">
                      <TableCell className="space-y-2 py-4">
                        <div className="flex items-center gap-2 text-maroon-900">
                          <Waypoints className="h-4 w-4 text-emerald-600" />
                          <span className="font-medium">{plan.plan.title}</span>
                        </div>
                        {plan.plan.notes && <p className="text-xs text-emerald-700">{plan.plan.notes}</p>}
                        <div className="flex flex-wrap gap-2 text-xs text-emerald-700">
                          <span>{plan.stats.completedStudents} completed</span>
                          <span>{plan.stats.inProgressStudents} in progress</span>
                          <span>{plan.stats.notStartedStudents} not started</span>
                        </div>
                      </TableCell>
                      <TableCell className="py-4">
                        <Badge variant="outline" className="border-emerald-200 text-emerald-800">
                          {plan.stats.verseCount} verses
                        </Badge>
                      </TableCell>
                      <TableCell className="py-4">
                        <div className="flex flex-wrap gap-2">
                          {plan.classes.map((classRecord) => (
                            <Badge key={classRecord.id} className="bg-emerald-700/10 text-emerald-800">
                              {classRecord.name}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="py-4 text-sm text-emerald-700">
                        {createdAt.toLocaleDateString()}
                        <div className="text-xs">{formatDistanceToNow(createdAt, { addSuffix: true })}</div>
                      </TableCell>
                      <TableCell className="py-4">
                        <div className="flex flex-wrap justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setProgressPlan({ id: plan.plan.id, title: plan.plan.title })}
                            className="text-emerald-700 hover:bg-emerald-50"
                          >
                            <BarChart3 className="mr-1 h-4 w-4" /> Progress
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(plan)}
                            className="text-emerald-700 hover:bg-emerald-50"
                          >
                            <Pencil className="mr-1 h-4 w-4" /> Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDuplicate(plan)}
                            className="text-emerald-700 hover:bg-emerald-50"
                          >
                            <Copy className="mr-1 h-4 w-4" /> Duplicate
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleExport(plan)}
                            className="text-emerald-700 hover:bg-emerald-50"
                          >
                            <FileDown className="mr-1 h-4 w-4" /> Export
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleReminder(plan)}
                            className="text-emerald-700 hover:bg-emerald-50"
                          >
                            <Bell className="mr-1 h-4 w-4" /> Reminder
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteState({ planId: plan.plan.id, isLoading: false })}
                            className="text-rose-600 hover:bg-rose-50"
                          >
                            <Trash2 className="mr-1 h-4 w-4" /> Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog
        open={isDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            closeDialog()
          } else {
            setIsDialogOpen(true)
          }
        }}
      >
        <DialogContent className="max-w-4xl overflow-y-auto max-h-[90vh]">
          <PlanCreatorForm
            key={dialogMode === "edit" ? activePlan?.plan.id ?? "edit" : dialogMode}
            mode={dialogMode}
            initialPlan={dialogMode === "edit" ? activePlan : undefined}
            classes={classes}
            onCancel={closeDialog}
            onCreated={(plan) => {
              handlePlanCreated(plan)
              closeDialog()
            }}
            onUpdated={(plan) => {
              handlePlanUpdated(plan)
              closeDialog()
            }}
            suggestions={suggestions}
            prefillSuggestion={dialogMode === "create" ? prefillSuggestion : null}
          />
        </DialogContent>
      </Dialog>

      <PlanProgressModal
        open={Boolean(progressPlan)}
        planId={progressPlan?.id ?? null}
        planTitle={progressPlan?.title}
        onOpenChange={(open) => {
          if (!open) setProgressPlan(null)
        }}
      />

      <AlertDialog open={Boolean(deleteState.planId)} onOpenChange={(open) => !open && setDeleteState({ planId: null, isLoading: false })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this memorization plan?</AlertDialogTitle>
            <AlertDialogDescription>
              Students assigned to this plan will no longer see it in their panel. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteState.isLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={deleteState.isLoading}
              className="bg-rose-600 text-white hover:bg-rose-700"
              onClick={handleDeleteConfirm}
            >
              {deleteState.isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
