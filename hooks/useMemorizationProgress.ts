"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  advanceMemorizationVerse,
  recordMemorizationRepetition,
  type MemorizationPlanDTO,
  type StudentPlanProgressDTO,
} from "@/lib/memorization-api"
import { useToast } from "@/components/ui/use-toast"

const REPETITION_TARGET = 20

interface UseMemorizationProgressOptions {
  plan: MemorizationPlanDTO
  initialProgress: StudentPlanProgressDTO
  onProgressUpdate?: (progress: StudentPlanProgressDTO) => void
}

export function useMemorizationProgress({
  plan,
  initialProgress,
  onProgressUpdate,
}: UseMemorizationProgressOptions) {
  const [progress, setProgress] = useState<StudentPlanProgressDTO>(initialProgress)
  const [isRepeating, setIsRepeating] = useState(false)
  const [isAdvancing, setIsAdvancing] = useState(false)
  const [isVerseCelebrationOpen, setVerseCelebrationOpen] = useState(
    initialProgress.repetitionsDone >= REPETITION_TARGET && !initialProgress.completedAt,
  )
  const [hasShownCompletion, setHasShownCompletion] = useState(Boolean(initialProgress.completedAt))
  const [isCompletionOpen, setCompletionOpen] = useState(Boolean(initialProgress.completedAt))
  const celebratedVerseIndexRef = useRef<number | null>(
    initialProgress.repetitionsDone >= REPETITION_TARGET ? initialProgress.currentVerseIndex : null,
  )
  const { toast } = useToast()

  useEffect(() => {
    setProgress(initialProgress)
    setVerseCelebrationOpen(
      initialProgress.repetitionsDone >= REPETITION_TARGET && !initialProgress.completedAt,
    )
    setCompletionOpen(Boolean(initialProgress.completedAt))
    setHasShownCompletion(Boolean(initialProgress.completedAt))
    celebratedVerseIndexRef.current =
      initialProgress.repetitionsDone >= REPETITION_TARGET
        ? initialProgress.currentVerseIndex
        : null
  }, [initialProgress])

  useEffect(() => {
    if (
      !progress.completedAt &&
      progress.repetitionsDone >= REPETITION_TARGET &&
      celebratedVerseIndexRef.current !== progress.currentVerseIndex
    ) {
      celebratedVerseIndexRef.current = progress.currentVerseIndex
      setVerseCelebrationOpen(true)
    }
  }, [progress.completedAt, progress.repetitionsDone, progress.currentVerseIndex])

  useEffect(() => {
    if (progress.completedAt && !hasShownCompletion) {
      setCompletionOpen(true)
      setHasShownCompletion(true)
    }
  }, [progress.completedAt, hasShownCompletion])

  const notifyUpdate = useCallback(
    (updated: StudentPlanProgressDTO) => {
      setProgress(updated)
      onProgressUpdate?.(updated)
    },
    [onProgressUpdate],
  )

  const handleRepeat = useCallback(async () => {
    if (isRepeating || progress.completedAt) {
      return
    }
    if (progress.repetitionsDone >= REPETITION_TARGET) {
      setVerseCelebrationOpen(true)
      return
    }

    setIsRepeating(true)
    try {
      const updated = await recordMemorizationRepetition(plan.id)
      notifyUpdate(updated)
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to record repetition"
      toast({
        title: "Could not save repetition",
        description: message,
        variant: "destructive",
      })
    } finally {
      setIsRepeating(false)
    }
  }, [isRepeating, progress.completedAt, progress.repetitionsDone, plan.id, notifyUpdate, toast])

  const handleAdvanceVerse = useCallback(async () => {
    if (isAdvancing) {
      return
    }
    if (progress.completedAt) {
      setVerseCelebrationOpen(false)
      return
    }
    if (progress.repetitionsDone < REPETITION_TARGET) {
      toast({
        title: "Keep repeating",
        description: `Complete ${REPETITION_TARGET} repetitions before advancing.`,
        variant: "default",
      })
      setVerseCelebrationOpen(false)
      return
    }
    setIsAdvancing(true)
    try {
      const updated = await advanceMemorizationVerse(plan.id)
      celebratedVerseIndexRef.current =
        updated.completedAt || updated.repetitionsDone === 0 ? null : celebratedVerseIndexRef.current
      notifyUpdate(updated)
      setVerseCelebrationOpen(false)
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to advance verse"
      toast({
        title: "Could not advance",
        description: message,
        variant: "destructive",
      })
    } finally {
      setIsAdvancing(false)
    }
  }, [isAdvancing, plan.id, notifyUpdate, toast])

  const repetitionProgress = useMemo(() => {
    return Math.min(progress.repetitionsDone / REPETITION_TARGET, 1)
  }, [progress.repetitionsDone])

  return {
    progress,
    isRepeating,
    isAdvancing,
    repetitionProgress,
    isVerseCelebrationOpen,
    setVerseCelebrationOpen,
    isCompletionOpen,
    setCompletionOpen,
    handleRepeat,
    handleAdvanceVerse,
    celebratedVerseIndex: celebratedVerseIndexRef.current,
  }
}
