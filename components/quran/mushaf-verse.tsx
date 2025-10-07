"use client"

import { useMemo } from "react"

import { MushafOverlayMode, getTajweedRuleColor } from "@/lib/mushaf-fonts"
import type { LiveMistake } from "@/lib/tajweed-analysis"
import type { Ayah as QuranAyah } from "@/lib/quran-api"

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

  return (
    <div className="space-y-2">
      <p
        className={`arabic-text ${fontSizeClass} leading-relaxed text-primary transition-[font-family] ${
          isMushafEnabled && fontsReady ? "font-mushaf" : "font-quran"
        }`}
      >
        {words.map((word, index) => {
          const mistake = mistakeLookup.get(index)
          const tajweedRule = mistake?.tajweedRules?.[0]
          const colorPalette = tajweedRule ? getTajweedRuleColor(tajweedRule) : getTajweedRuleColor()
          const hasMistake = Boolean(mistake)

          return (
            <span
              key={`${ayah.number}-${word}-${index}`}
              className="relative inline-block px-1 py-0.5"
              aria-live="polite"
              aria-label={
                hasMistake
                  ? tajweedRule
                    ? `Tajweed rule ${tajweedRule} needs attention in word ${word}`
                    : `Pronunciation issue detected in word ${word}`
                  : undefined
              }
            >
              {hasMistake && overlayMode !== "none" && (
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-[0.15rem] rounded-md border"
                  style={{
                    backgroundColor:
                      overlayMode === "tajweed" && tajweedRule
                        ? colorPalette.background
                        : "rgba(248, 113, 113, 0.18)",
                    borderColor:
                      overlayMode === "tajweed" && tajweedRule
                        ? colorPalette.border
                        : "rgba(248, 113, 113, 0.6)",
                  }}
                />
              )}
              <span className="relative z-10">{word}</span>
            </span>
          )
        })}
      </p>

      {weakestMetricLabel && overlayMode !== "none" && mistakes.length === 0 && (
        <p className="text-xs text-muted-foreground">
          Focus on {weakestMetricLabel} for this āyah. No tajweed issues detected yet.
        </p>
      )}
    </div>
  )
}
