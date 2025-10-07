"use client"

import { useEffect, useMemo, useState } from "react"

import { MUSHAF_FONT_SOURCES, MUSHAF_FONTS_AVAILABLE, resolveMushafFontUrl } from "@/lib/mushaf-fonts"

export type MushafFontStatus = "idle" | "loading" | "ready" | "error"

export function useMushafFontLoader(enabled: boolean): { status: MushafFontStatus; isReady: boolean; error: string | null } {
  const [status, setStatus] = useState<MushafFontStatus>("idle")
  const [error, setError] = useState<string | null>(null)

  const shouldAttemptLoad = useMemo(() => {
    return enabled && MUSHAF_FONTS_AVAILABLE && typeof window !== "undefined" && "fonts" in document
  }, [enabled])

  useEffect(() => {
    if (!enabled) {
      setStatus("idle")
      setError(null)
      return
    }

    if (!MUSHAF_FONTS_AVAILABLE) {
      setStatus("error")
      setError(
        "Mushaf font assets are not installed on this server yet. Run `npm run fonts:mushaf` and convert the TTX exports to WOFF/WOFF2.",
      )
      return
    }

    if (!shouldAttemptLoad) {
      return
    }

    let isCancelled = false

    const loadFonts = async () => {
      setStatus("loading")
      setError(null)

      try {
        await Promise.all(
          MUSHAF_FONT_SOURCES.map(async (source) => {
            if (document.fonts.check(`1em ${source.family}`)) {
              return
            }

            const fontFace = new FontFace(source.family, `url(${resolveMushafFontUrl(source)}) format("${source.format}")`, {
              weight: source.weight.toString(),
              style: source.style,
              display: "swap",
            })

            const loadedFace = await fontFace.load()
            document.fonts.add(loadedFace)
          }),
        )

        if (!isCancelled) {
          setStatus("ready")
        }
      } catch (caught) {
        console.error("Failed to load Mushaf fonts", caught)
        if (!isCancelled) {
          setStatus("error")
          setError(caught instanceof Error ? caught.message : "Unable to load Mushaf font assets")
        }
      }
    }

    void loadFonts()

    return () => {
      isCancelled = true
    }
  }, [enabled, shouldAttemptLoad])

  return { status, isReady: status === "ready", error }
}
