"use client"

import { useMemo } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { MISTAKE_CATEGORY_META, type LiveMistake } from "@/lib/recitation-analysis"
import type { MushafOverlayMode } from "@/lib/mushaf-fonts"
import { cn } from "@/lib/utils"
import { Activity, Mic, MicOff, Sparkles } from "lucide-react"

export interface MobileRecitationClientProps {
  isRecording: boolean
  isLiveAnalysisActive: boolean
  onToggle: () => void
  statusMessage: string
  transcription: string
  mistakes: LiveMistake[]
  volumeLevel: number
  overlayMode: MushafOverlayMode
  permissionStatus: "unknown" | "granted" | "denied"
  errorMessage?: string | null
  isLiveAnalysisSupported: boolean
  unavailableMessage?: string
  className?: string
}

export function MobileRecitationClient({
  isRecording,
  isLiveAnalysisActive,
  onToggle,
  statusMessage,
  transcription,
  mistakes,
  volumeLevel,
  overlayMode,
  permissionStatus,
  errorMessage,
  isLiveAnalysisSupported,
  unavailableMessage,
  className,
}: MobileRecitationClientProps) {
  const normalizedVolume = Math.min(1, Math.max(volumeLevel, 0))
  const volumeScale = 1 + normalizedVolume * 0.35
  const latestMistake = mistakes[0]
  const statusTone = isRecording ? "bg-emerald-600" : "bg-muted"
  const latestCategories = latestMistake?.categories ?? []

  const overlaySummary = useMemo(() => {
    if (overlayMode === "none") {
      return "Overlays hidden"
    }

    if (overlayMode === "tajweed") {
      return "Highlighting recitation guidance"
    }

    return "Highlighting pronunciation issues"
  }, [overlayMode])

  return (
    <Card className={cn("border border-primary/30 shadow-lg md:hidden", className)}>
      <CardContent className="space-y-4 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-primary">Live Recitation</p>
            <p className="text-xs text-muted-foreground">{overlaySummary}</p>
          </div>
          <Badge variant="secondary" className={cn("flex items-center gap-1 text-xs", statusTone)}>
            <Activity className="h-3.5 w-3.5" /> {isRecording ? "Streaming" : "Idle"}
          </Badge>
        </div>

        <div className="relative mx-auto h-32 w-32">
          <div
            className="absolute inset-0 rounded-full bg-gradient-to-br from-amber-100 via-primary/10 to-primary/30 transition-transform duration-300"
            style={{ transform: `scale(${volumeScale})` }}
          />
          <div className="absolute inset-2 rounded-full bg-primary/10 backdrop-blur" />
          <Button
            type="button"
            onClick={onToggle}
            size="icon"
            className={cn(
              "relative z-10 h-full w-full rounded-full border-0 text-white shadow-xl transition-all disabled:cursor-not-allowed disabled:opacity-60",
              isRecording
                ? "bg-gradient-to-br from-emerald-500 to-emerald-600 hover:from-emerald-500 hover:to-emerald-600"
                : "bg-gradient-to-br from-primary to-primary/90 hover:from-primary/90 hover:to-primary",
            )}
            aria-label={isRecording ? "Stop live recitation" : "Start live recitation"}
            disabled={!isLiveAnalysisSupported}
          >
            {isRecording ? <MicOff className="h-10 w-10" /> : <Mic className="h-10 w-10" />}
          </Button>
        </div>

        <div className="space-y-2 text-center">
          <p className="text-sm font-medium text-primary">{statusMessage}</p>
          {permissionStatus === "denied" ? (
            <p className="text-xs text-destructive">
              Microphone access denied. Enable permissions in your browser to continue.
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">
              {!isLiveAnalysisSupported
                ? unavailableMessage ||
                  "AI transcription isn't configured on this server yet. Add a TARTEEL_API_KEY and refresh."
                  : isLiveAnalysisActive
                    ? "Speak clearly and maintain a steady pace."
                    : "Tap the button to begin recitation analysis."}
            </p>
          )}
        </div>

        {errorMessage && (
          <p className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive">
            {errorMessage}
          </p>
        )}

        <div className="space-y-3 rounded-lg border border-border/50 bg-background/70 p-3 text-left">
          <p className="text-xs font-semibold text-foreground">Recent transcription</p>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {transcription ? transcription : "Your words will appear here during recitation."}
          </p>
          {latestMistake && overlayMode !== "none" && (
              <div className="rounded-md border border-amber-300/60 bg-amber-50/70 p-2 text-xs text-amber-900">
                <div className="flex items-center gap-1 font-medium">
                  <Sparkles className="h-3.5 w-3.5" /> Recitation cue
                </div>
                <p className="mt-1">
                  {latestMistake.tajweedRules && latestMistake.tajweedRules.length > 0
                    ? latestMistake.tajweedRules.join(", ")
                    : "We detected a pronunciation issue. Review and try again."}
              </p>
              {latestCategories.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {latestCategories.map((category) => (
                    <span
                      key={category}
                      className="rounded-full bg-white/60 px-2 py-1 text-[10px] font-semibold uppercase text-amber-800"
                    >
                      {MISTAKE_CATEGORY_META[category]?.label ?? category}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
