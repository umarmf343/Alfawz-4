"use client"

import { useMemo } from "react"
import type { CSSProperties } from "react"

import { ArabicText } from "@/components/arabic-text"
import { MushafOverlayMode, getTajweedRuleColor } from "@/lib/mushaf-fonts"
import type { LiveMistake } from "@/lib/recitation-analysis"
import type { Ayah as QuranAyah } from "@/lib/quran-api"
import { cn } from "@/lib/utils"

export interface MushafVerseProps {
  ayah: QuranAyah & { translation?: string; transliteration?: string }
  overlayMode: MushafOverlayMode
  mistakes: LiveMistake[]
  fontSizeClass: string
  isMushafEnabled: boolean
  weakestMetricLabel?: string
  fontsReady: boolean
}

function buildMistakeLookup(mistakes: LiveMistake[], overlayMode: MushafOverlayMode): Map<number, LiveMistake> {
  const map = new Map<number, LiveMistake>()
  if (overlayMode === "none") {
    return map
  }

  for (const mistake of mistakes) {
    if (typeof mistake.index !== "number") {
      continue
    }

    if (overlayMode === "tajweed" && (!mistake.tajweedRules || mistake.tajweedRules.length === 0)) {
      continue
    }

    map.set(mistake.index, mistake)
  }

  return map
}

type MushafWordStyles = CSSProperties & {
  "--mushaf-highlight-bg"?: string
  "--mushaf-highlight-border"?: string
  "--mushaf-highlight-text"?: string
}

export function MushafVerse({
  ayah,
  mistakes,
  overlayMode,
  fontSizeClass,
  isMushafEnabled,
  weakestMetricLabel,
  fontsReady,
}: MushafVerseProps) {
  const mistakeLookup = useMemo(() => buildMistakeLookup(mistakes, overlayMode), [mistakes, overlayMode])

  const words = useMemo(() => ayah.text.split(/\s+/).filter(Boolean), [ayah.text])
  const textVariant = isMushafEnabled && fontsReady ? "mushaf" : "quran"
  const wordCount = words.length

  return (
    <div className="space-y-2">
      <ArabicText
        as="p"
        variant={textVariant}
        className={cn(fontSizeClass, "text-primary transition-[font-family]")}
        lang="ar"
      >
        {words.map((word, index) => {
          const mistake = mistakeLookup.get(index)
          const tajweedRule = mistake?.tajweedRules?.[0]
          const colorPalette = tajweedRule ? getTajweedRuleColor(tajweedRule) : getTajweedRuleColor()
          const hasMistake = Boolean(mistake)
          const showOverlay = hasMistake && overlayMode !== "none"
          const isTajweedOverlay = showOverlay && overlayMode === "tajweed" && Boolean(tajweedRule)

          const highlightStyles: MushafWordStyles = {}

          if (!isTajweedOverlay && showOverlay) {
            highlightStyles["--mushaf-highlight-bg"] = "rgba(248, 113, 113, 0.18)"
            highlightStyles["--mushaf-highlight-border"] = "rgba(248, 113, 113, 0.6)"
          }

          if (isTajweedOverlay) {
            highlightStyles["--mushaf-highlight-bg"] = colorPalette.background
            highlightStyles["--mushaf-highlight-border"] = colorPalette.border
            highlightStyles["--mushaf-highlight-text"] = colorPalette.text
          }

          if (index < wordCount - 1) {
            highlightStyles.marginInlineEnd = "0.45em"
          }

          return (
            <span
              key={`${ayah.number}-${word}-${index}`}
              className="mushaf-word"
              data-highlighted={showOverlay ? "true" : undefined}
              style={highlightStyles}
              aria-live="polite"
              aria-label={
                hasMistake
                  ? tajweedRule
                    ? `Tajweed rule ${tajweedRule} needs attention in word ${word}`
                    : `Pronunciation issue detected in word ${word}`
                  : undefined
              }
            >
              <span className="relative z-10">{word}</span>
            </span>
          )
        })}
      </ArabicText>

      {weakestMetricLabel && overlayMode !== "none" && mistakes.length === 0 && (
        <p className="text-xs text-muted-foreground">
          Focus on {weakestMetricLabel} for this āyah. No tajweed issues detected yet.
        </p>
      )}
    </div>
  )
}
