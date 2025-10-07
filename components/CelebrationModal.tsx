"use client"

import { useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import clsx from "clsx"

interface CelebrationModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: "verse" | "plan"
  planTitle: string
  verseReference?: string
  onPrimaryAction?: () => void
  primaryActionLabel?: string
  completionDate?: string | null
}

export function CelebrationModal({
  open,
  onOpenChange,
  mode,
  planTitle,
  verseReference,
  onPrimaryAction,
  primaryActionLabel,
  completionDate,
}: CelebrationModalProps) {
  useEffect(() => {
    if (!open) return
    const launchConfetti = async () => {
      const confetti = (await import("canvas-confetti")).default
      confetti({
        particleCount: mode === "plan" ? 220 : 120,
        spread: mode === "plan" ? 85 : 70,
        origin: { y: 0.6 },
        colors: mode === "plan" ? ["#0f766e", "#10b981", "#f59e0b", "#fde68a"] : undefined,
        scalar: mode === "plan" ? 1.2 : 1,
      })
    }
    void launchConfetti()
  }, [open, mode])

  const isPlanCelebration = mode === "plan"
  const actionLabel = primaryActionLabel ?? (isPlanCelebration ? "Close" : "Next Verse")

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={clsx(
          "max-w-xl border-0 bg-white/95 backdrop-blur-md text-maroon-900 shadow-2xl",
          isPlanCelebration && "max-w-3xl",
        )}
      >
        <DialogHeader className="space-y-2 text-center">
          <DialogTitle className="text-3xl font-bold text-emerald-700">
            {isPlanCelebration ? "BarakAllahu Feek!" : "Masha’Allah!"}
          </DialogTitle>
          <DialogDescription className="text-base text-maroon-700">
            {isPlanCelebration
              ? `You’ve completed ${planTitle}. May Allah make it a light in your heart.`
              : `You’ve repeated this verse 20 times with presence and devotion.`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 text-center">
          {!isPlanCelebration && verseReference && (
            <p className="text-sm font-medium text-emerald-800">{verseReference}</p>
          )}

          {isPlanCelebration && (
            <div className="relative overflow-hidden rounded-3xl border-4 border-emerald-600/60 bg-gradient-to-br from-emerald-900 via-emerald-700 to-amber-500 p-6 text-white shadow-lg">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.25),_transparent)]" aria-hidden />
              <div className="relative space-y-3">
                <p className="text-sm uppercase tracking-[0.35em] text-amber-200">Ijazah Preview</p>
                <h3 className="text-3xl font-semibold">Certificate of Sacred Memorization</h3>
                <p className="text-lg font-light">
                  Awarded to <span className="font-semibold">you</span> for memorizing
                  <span className="font-semibold"> {planTitle}</span> with sincerity and repetition.
                </p>
                <div className="grid gap-2 rounded-xl bg-white/15 p-3 text-sm text-emerald-50 md:grid-cols-2">
                  <div className="flex flex-col">
                    <span className="text-xs uppercase tracking-widest text-amber-100">Completion Date</span>
                    <span>{completionDate ? new Date(completionDate).toLocaleDateString() : "Today"}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs uppercase tracking-widest text-amber-100">Mentor Signature</span>
                    <span className="italic">____________________</span>
                  </div>
                </div>
                <p className="text-sm italic text-amber-100">
                  “Say: رَبِّ زِدْنِي عِلْمًا – My Lord, increase me in knowledge.”
                </p>
              </div>
            </div>
          )}

          {!isPlanCelebration && (
            <p className="text-sm italic text-emerald-700">
              “Say: رَبِّ زِدْنِي عِلْمًا after memorizing!”
            </p>
          )}
        </div>

        <DialogFooter className="flex flex-col gap-2 sm:flex-row sm:justify-center">
          {isPlanCelebration && (
            <Button
              type="button"
              variant="outline"
              className="border-emerald-600 text-emerald-700 hover:bg-emerald-50"
              onClick={() => {
                if (typeof navigator !== "undefined" && navigator.clipboard) {
                  void navigator.clipboard
                    .writeText(
                      `Alhamdulillah! I have memorized ${planTitle}. Please make du'a for steadfastness.`,
                    )
                    .catch(() => undefined)
                }
              }}
            >
              Share with Teacher
            </Button>
          )}
          <Button type="button" onClick={onPrimaryAction ?? (() => onOpenChange(false))}>
            {actionLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
