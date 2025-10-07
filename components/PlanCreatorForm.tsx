"use client"

import { Fragment, useEffect, useMemo, useState } from "react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { useQuranVerses } from "@/hooks/useQuranVerses"
import {
  CreateTeacherPlanInput,
  SuggestedMemorizationPlan,
  TeacherClassSummary,
  TeacherMemorizationPlanSummary,
} from "@/lib/data/teacher-database"
import { formatVerseReference } from "@/lib/quran-data"
import {
  SurahOption,
  expandVerseRange,
  getSurahOptions,
  parseCommaSeparatedVerseKeys,
  validateVerseKeys,
  type VerseValidationIssue,
} from "@/lib/verse-validator"
import { cn } from "@/lib/utils"
import { Check, ChevronsUpDown, Loader2, Plus, Sparkles, X } from "lucide-react"

import { VerseSelector, type VerseSelectionBlock } from "./VerseSelector"

interface PlanCreatorFormProps {
  mode: "create" | "edit"
  initialPlan?: TeacherMemorizationPlanSummary
  classes: TeacherClassSummary[]
  onCancel: () => void
  onCreated?: (plan: TeacherMemorizationPlanSummary) => void
  onUpdated?: (plan: TeacherMemorizationPlanSummary) => void
  suggestions?: SuggestedMemorizationPlan[]
  prefillSuggestion?: SuggestedMemorizationPlan | null
}

interface PlanFormState {
  title: string
  notes: string
  blocks: VerseSelectionBlock[]
  selectedClassIds: string[]
}

interface VerseSelectionState {
  verseKeys: string[]
  blockErrors: Record<string, string | undefined>
  invalidIssues: VerseValidationIssue[]
}

interface ClassOption {
  id: string
  name: string
  description?: string
  studentCount: number
}

const DEFAULT_BLOCK: VerseSelectionBlock = {
  id: "block-0",
  mode: "range",
  title: "New memorization",
  surahNumber: undefined,
  fromAyah: undefined,
  toAyah: undefined,
  customVerseKeys: "",
}

function createBlock(id: string): VerseSelectionBlock {
  return { ...DEFAULT_BLOCK, id, title: "" }
}

function createInitialState(
  mode: PlanCreatorFormProps["mode"],
  initialPlan?: TeacherMemorizationPlanSummary,
): PlanFormState {
  if (mode === "edit" && initialPlan) {
    const customBlock: VerseSelectionBlock = {
      id: `block-${initialPlan.plan.id}`,
      mode: "custom",
      title: initialPlan.plan.title,
      customVerseKeys: initialPlan.plan.verseKeys.join(","),
      surahNumber: undefined,
      fromAyah: undefined,
      toAyah: undefined,
    }
    return {
      title: initialPlan.plan.title,
      notes: initialPlan.plan.notes ?? "",
      blocks: [customBlock],
      selectedClassIds: [...initialPlan.plan.classIds],
    }
  }
  return {
    title: "",
    notes: "",
    blocks: [createBlock("block-0")],
    selectedClassIds: [],
  }
}

function buildClassOptions(classes: TeacherClassSummary[]): ClassOption[] {
  return classes.map((classRecord) => ({
    id: classRecord.id,
    name: classRecord.name,
    description: classRecord.description,
    studentCount: classRecord.studentCount,
  }))
}

function buildVerseSelection(blocks: VerseSelectionBlock[]): VerseSelectionState {
  const aggregated: { key: string; blockId: string }[] = []
  const blockErrors: Record<string, string | undefined> = {}

  blocks.forEach((block) => {
    if (block.mode === "range") {
      if (!block.surahNumber || !block.fromAyah || !block.toAyah) {
        blockErrors[block.id] = "Select a surah and ayah range"
        return
      }
      try {
        const keys = expandVerseRange(block.surahNumber, block.fromAyah, block.toAyah)
        keys.forEach((key) => aggregated.push({ key, blockId: block.id }))
      } catch (error) {
        blockErrors[block.id] = error instanceof Error ? error.message : "Invalid range"
      }
    } else {
      if (!block.customVerseKeys.trim()) {
        blockErrors[block.id] = "Enter at least one verse key"
        return
      }
      const customKeys = parseCommaSeparatedVerseKeys(block.customVerseKeys)
      if (customKeys.length === 0) {
        blockErrors[block.id] = "Enter verse keys in Surah:Ayah format"
        return
      }
      customKeys.forEach((key) => aggregated.push({ key, blockId: block.id }))
    }
  })

  const keysForValidation = aggregated.map((entry) => entry.key)
  const validation = validateVerseKeys(keysForValidation)

  if (validation.issues.length > 0) {
    const keyToBlocks = new Map<string, Set<string>>()
    aggregated.forEach((entry) => {
      const blocksForKey = keyToBlocks.get(entry.key) ?? new Set<string>()
      blocksForKey.add(entry.blockId)
      keyToBlocks.set(entry.key, blocksForKey)
    })
    validation.issues.forEach((issue) => {
      const relatedBlocks = keyToBlocks.get(issue.key)
      relatedBlocks?.forEach((blockId) => {
        if (!blockErrors[blockId]) {
          blockErrors[blockId] = `Check verse ${issue.key}: ${issue.reason}`
        }
      })
    })
  }

  return {
    verseKeys: validation.validKeys,
    blockErrors,
    invalidIssues: validation.issues,
  }
}

export function PlanCreatorForm({
  mode,
  initialPlan,
  classes,
  onCancel,
  onCreated,
  onUpdated,
  suggestions,
  prefillSuggestion,
}: PlanCreatorFormProps) {
  const [formState, setFormState] = useState<PlanFormState>(() => createInitialState(mode, initialPlan))
  const [availableClasses, setAvailableClasses] = useState<ClassOption[]>(() => buildClassOptions(classes))
  const [isLoadingClasses, setIsLoadingClasses] = useState(false)
  const [classPopoverOpen, setClassPopoverOpen] = useState(false)
  const [submissionError, setSubmissionError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [appliedSuggestionId, setAppliedSuggestionId] = useState<string | null>(null)

  const surahOptions = useMemo<SurahOption[]>(() => getSurahOptions(), [])
  const { toast } = useToast()

  useEffect(() => {
    setFormState(createInitialState(mode, initialPlan))
    setAppliedSuggestionId(null)
  }, [mode, initialPlan?.plan.id])

  useEffect(() => {
    setAvailableClasses(buildClassOptions(classes))
  }, [classes])

  useEffect(() => {
    let ignore = false
    async function fetchClasses() {
      try {
        setIsLoadingClasses(true)
        const response = await fetch("/api/teacher/classes")
        if (!response.ok) {
          return
        }
        const data = (await response.json()) as { classes: TeacherClassSummary[] }
        if (!ignore && Array.isArray(data.classes)) {
          setAvailableClasses(buildClassOptions(data.classes))
        }
      } finally {
        if (!ignore) {
          setIsLoadingClasses(false)
        }
      }
    }
    fetchClasses()
    return () => {
      ignore = true
    }
  }, [])

  useEffect(() => {
    if (mode !== "create" || !prefillSuggestion) {
      return
    }
    applySuggestion(prefillSuggestion)
  }, [prefillSuggestion?.id])

  const verseSelection = useMemo(() => buildVerseSelection(formState.blocks), [formState.blocks])
  const versePreview = useQuranVerses(verseSelection.verseKeys)

  const totalVerseCount = verseSelection.verseKeys.length
  const hasBlockingErrors =
    Object.values(verseSelection.blockErrors).some((message) => Boolean(message)) ||
    verseSelection.invalidIssues.length > 0

  function updateBlock(id: string, block: VerseSelectionBlock) {
    setFormState((previous) => ({
      ...previous,
      blocks: previous.blocks.map((entry) => (entry.id === id ? block : entry)),
    }))
  }

  function addBlock() {
    const nextId = `block-${Date.now()}`
    setFormState((previous) => ({
      ...previous,
      blocks: [...previous.blocks, createBlock(nextId)],
    }))
  }

  function removeBlock(id: string) {
    setFormState((previous) => ({
      ...previous,
      blocks: previous.blocks.length <= 1 ? previous.blocks : previous.blocks.filter((entry) => entry.id !== id),
    }))
  }

  function toggleClass(classId: string) {
    setFormState((previous) => {
      const exists = previous.selectedClassIds.includes(classId)
      const nextIds = exists
        ? previous.selectedClassIds.filter((id) => id !== classId)
        : [...previous.selectedClassIds, classId]
      return { ...previous, selectedClassIds: nextIds }
    })
  }

  function applySuggestion(suggestion: SuggestedMemorizationPlan) {
    setFormState((previous) => ({
      ...previous,
      title: previous.title || suggestion.title,
      blocks: [
        {
          id: `suggestion-${suggestion.id}`,
          mode: "custom",
          title: suggestion.title,
          customVerseKeys: suggestion.verseKeys.join(","),
          surahNumber: undefined,
          fromAyah: undefined,
          toAyah: undefined,
        },
      ],
    }))
    setAppliedSuggestionId(suggestion.id)
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmissionError(null)

    if (!formState.title.trim()) {
      setSubmissionError("Give your plan a heartfelt title before saving.")
      return
    }
    if (formState.selectedClassIds.length === 0) {
      setSubmissionError("Assign the plan to at least one class.")
      return
    }
    if (verseSelection.verseKeys.length === 0 || hasBlockingErrors) {
      setSubmissionError("Resolve the verse selection before saving your plan.")
      return
    }

    const payload: CreateTeacherPlanInput = {
      title: formState.title.trim(),
      classIds: Array.from(new Set(formState.selectedClassIds)),
      verseKeys: verseSelection.verseKeys,
      notes: formState.notes.trim() || undefined,
    }

    setIsSubmitting(true)
    try {
      if (mode === "create") {
        const response = await fetch("/api/teacher/plans", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
        const data = (await response.json().catch(() => null)) as
          | { plan?: TeacherMemorizationPlanSummary; error?: string }
          | null
        if (!response.ok || !data?.plan) {
          throw new Error(data?.error ?? "Unable to create plan")
        }
        onCreated?.(data.plan)
        toast({
          title: "Memorization plan created",
          description: "Your students will now see this plan in their memorization panel.",
        })
      } else if (initialPlan) {
        const response = await fetch(`/api/teacher/plans/${initialPlan.plan.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
        const data = (await response.json().catch(() => null)) as
          | { plan?: TeacherMemorizationPlanSummary; error?: string }
          | null
        if (!response.ok || !data?.plan) {
          throw new Error(data?.error ?? "Unable to update plan")
        }
        onUpdated?.(data.plan)
        toast({
          title: "Memorization plan updated",
          description: "Students will see the refreshed verses immediately.",
        })
      }
      onCancel()
    } catch (error) {
      setSubmissionError(error instanceof Error ? error.message : "Something went wrong")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card className="border-emerald-100/70 bg-gradient-to-br from-white to-emerald-50/40">
        <CardHeader>
          <CardTitle className="text-xl text-maroon-900">
            {mode === "create" ? "Craft a new memorization journey" : "Refine memorization plan"}
          </CardTitle>
          <CardDescription className="text-emerald-800">
            Guide your students with intentional sequences rooted in Qur'anic wisdom.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="plan-title">Plan title</Label>
            <Input
              id="plan-title"
              value={formState.title}
              onChange={(event) => setFormState((previous) => ({ ...previous, title: event.target.value }))}
              placeholder="e.g., Week 1 • Surah Al-Falaq & An-Nas"
              className="border-emerald-200/70"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="plan-notes">Teaching intention (optional)</Label>
            <Textarea
              id="plan-notes"
              value={formState.notes}
              onChange={(event) => setFormState((previous) => ({ ...previous, notes: event.target.value }))}
              placeholder="Share the focus or heart-goal for this plan."
              className="border-emerald-200/70"
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="border-emerald-100/70 bg-white/80">
        <CardHeader className="gap-3">
          <div>
            <CardTitle className="text-lg text-maroon-900">Step 2 • Select verses</CardTitle>
            <CardDescription className="text-emerald-800">
              Choose verses by range or custom keys. Add multiple blocks for sabaq and revision.
            </CardDescription>
          </div>
          {mode === "create" && suggestions && suggestions.length > 0 && (
            <div className="flex flex-col gap-3 rounded-xl border border-emerald-100 bg-emerald-50/60 p-4">
              <div className="flex items-center gap-2 text-emerald-900">
                <Sparkles className="h-4 w-4" />
                <span className="text-sm font-medium">Suggested plans for your classes</span>
              </div>
              <div className="flex flex-wrap gap-3">
                {suggestions.map((suggestion) => (
                  <Card
                    key={suggestion.id}
                    className={cn(
                      "w-full max-w-sm border border-emerald-100 bg-white/90",
                      appliedSuggestionId === suggestion.id && "border-emerald-300",
                    )}
                  >
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base text-maroon-900">{suggestion.title}</CardTitle>
                      <CardDescription className="text-emerald-800">{suggestion.reason}</CardDescription>
                    </CardHeader>
                    <CardContent className="flex items-center justify-between gap-3 pt-2">
                      <Badge variant="outline" className="border-emerald-200 text-emerald-800">
                        {suggestion.verseKeys.length} verses
                      </Badge>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => applySuggestion(suggestion)}
                        className="text-emerald-700 hover:bg-emerald-100/60"
                      >
                        Apply
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            {formState.blocks.map((block, index) => (
              <VerseSelector
                key={block.id}
                index={index}
                block={block}
                onChange={(nextBlock) => updateBlock(block.id, nextBlock)}
                surahOptions={surahOptions}
                canRemove={formState.blocks.length > 1}
                onRemove={() => removeBlock(block.id)}
                error={verseSelection.blockErrors[block.id]}
              />
            ))}
            <Button
              type="button"
              variant="outline"
              onClick={addBlock}
              className="w-full border-dashed border-emerald-200 text-emerald-800"
            >
              <Plus className="mr-2 h-4 w-4" /> Add another block
            </Button>
          </div>

          <Separator className="bg-emerald-100" />

          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3 text-sm text-emerald-900">
              <Badge className="bg-emerald-700 text-white">{totalVerseCount} verse(s)</Badge>
              <span>{formState.blocks.length} block(s)</span>
            </div>
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4">
              <h3 className="mb-3 text-sm font-medium text-emerald-900">Live verse preview</h3>
              <ScrollArea className="max-h-72 pr-2">
                <div className="space-y-4">
                  {versePreview.verses.length === 0 ? (
                    <p className="text-sm text-emerald-700">
                      Select a surah range or enter custom keys to preview the verses here.
                    </p>
                  ) : (
                    versePreview.verses.map((verse, index) => (
                      <Fragment key={`${verse.key}-${index}`}>
                        <div className="space-y-2 rounded-xl bg-white/70 p-3 shadow-sm">
                          <div className="text-xs uppercase text-emerald-700">{formatVerseReference(verse.key)}</div>
                          <div className="text-2xl leading-[2.2rem] text-maroon-900 font-quran">{verse.text}</div>
                        </div>
                      </Fragment>
                    ))
                  )}
                </div>
              </ScrollArea>
            </div>
            {verseSelection.invalidIssues.length > 0 && (
              <Alert variant="destructive" className="border-rose-200/80 bg-rose-50/80 text-rose-700">
                <AlertTitle>Check verse references</AlertTitle>
                <AlertDescription>
                  Some verse keys could not be validated: {" "}
                  {Array.from(new Set(verseSelection.invalidIssues.map((issue) => issue.key))).join(", ")}
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="border-emerald-100/70 bg-white/90">
        <CardHeader>
          <CardTitle className="text-lg text-maroon-900">Step 3 • Assign to classes</CardTitle>
          <CardDescription className="text-emerald-800">
            Select one or more classes. Students will see the plan instantly in their memorization panel.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Popover open={classPopoverOpen} onOpenChange={setClassPopoverOpen}>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="outline"
                className="w-full justify-between border-emerald-200/70 text-emerald-900"
              >
                <span>
                  {formState.selectedClassIds.length === 0
                    ? "Select classes"
                    : `${formState.selectedClassIds.length} class${formState.selectedClassIds.length === 1 ? "" : "es"} selected`}
                </span>
                <ChevronsUpDown className="ml-2 h-4 w-4 opacity-60" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-72 p-0">
              <Command>
                <CommandInput placeholder="Search classes" />
                <CommandEmpty>No classes found.</CommandEmpty>
                <CommandGroup>
                  {availableClasses.map((classOption) => {
                    const isSelected = formState.selectedClassIds.includes(classOption.id)
                    return (
                      <CommandItem
                        key={classOption.id}
                        value={classOption.name}
                        onSelect={() => {
                          toggleClass(classOption.id)
                        }}
                      >
                        <Check className={cn("mr-2 h-4 w-4", isSelected ? "opacity-100" : "opacity-0")} />
                        <div className="flex flex-col">
                          <span className="text-sm text-maroon-900">{classOption.name}</span>
                          <span className="text-xs text-emerald-700">
                            {classOption.studentCount} learner{classOption.studentCount === 1 ? "" : "s"}
                          </span>
                        </div>
                      </CommandItem>
                    )
                  })}
                </CommandGroup>
              </Command>
            </PopoverContent>
          </Popover>

          {isLoadingClasses && (
            <div className="flex items-center gap-2 text-sm text-emerald-700">
              <Loader2 className="h-4 w-4 animate-spin" />
              Syncing your latest class roster…
            </div>
          )}

          {availableClasses.length === 0 && (
            <Alert className="border-emerald-200 bg-emerald-50/70 text-emerald-900">
              <AlertTitle>No classes yet</AlertTitle>
              <AlertDescription>
                Create a class from your teacher dashboard before assigning memorization plans.
              </AlertDescription>
            </Alert>
          )}

          {formState.selectedClassIds.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {formState.selectedClassIds.map((classId) => {
                const classOption = availableClasses.find((entry) => entry.id === classId)
                return (
                  <Badge
                    key={classId}
                    variant="secondary"
                    className="flex items-center gap-1 border border-emerald-200 bg-emerald-50 text-emerald-800"
                  >
                    {classOption?.name ?? classId}
                    <button type="button" onClick={() => toggleClass(classId)} className="ml-1">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {submissionError && (
        <Alert variant="destructive">
          <AlertTitle>We couldn't save the plan</AlertTitle>
          <AlertDescription>{submissionError}</AlertDescription>
        </Alert>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm text-emerald-800">
          {formState.selectedClassIds.length} class{formState.selectedClassIds.length === 1 ? "" : "es"} •{' '}
          {totalVerseCount} verse{totalVerseCount === 1 ? "" : "s"}
        </div>
        <div className="flex items-center gap-3">
          <Button type="button" variant="outline" onClick={onCancel} className="border-emerald-200/70">
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting} className="bg-emerald-700 text-white hover:bg-emerald-800">
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {mode === "create" ? "Save memorization plan" : "Update plan"}
          </Button>
        </div>
      </div>
    </form>
  )
}
