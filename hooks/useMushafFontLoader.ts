"use client"

import { useEffect, useMemo, useState } from "react"

import { MUSHAF_FONT_SOURCES, resolveMushafFontUrl } from "@/lib/mushaf-fonts"

export type MushafFontStatus = "idle" | "loading" | "ready" | "error"

export function useMushafFontLoader(enabled: boolean): { status: MushafFontStatus; isReady: boolean; error: string | null } {
  const [status, setStatus] = useState<MushafFontStatus>("idle")
  const [error, setError] = useState<string | null>(null)

  const shouldAttemptLoad = useMemo(
    () => enabled && typeof window !== "undefined" && "fonts" in document && "FontFace" in window,
    [enabled],
  )

  useEffect(() => {
    if (!shouldAttemptLoad) {
      return
    }

    let isCancelled = false

    const loadFonts = async () => {
      setStatus("loading")
      setError(null)

      try {
        const missingSources: string[] = []

        await Promise.all(
          MUSHAF_FONT_SOURCES.map(async (source) => {
            if (document.fonts.check(`1em ${source.family}`)) {
              return
            }

            const fontUrl = resolveMushafFontUrl(source)

            if (typeof fetch === "function") {
              try {
                const response = await fetch(fontUrl, { method: "HEAD" })
                if (!response.ok) {
                  missingSources.push(source.file)
                  return
                }
              } catch {
                missingSources.push(source.file)
                return
              }
            }

            const fontFace = new FontFace(source.family, `url(${fontUrl}) format("${source.format}")`, {
              weight: source.weight.toString(),
              style: source.style,
              display: "swap",
            })

            const loadedFace = await fontFace.load()
            document.fonts.add(loadedFace)
          }),
        )

        if (missingSources.length > 0) {
          const missingList = missingSources.join(", ")
          throw new Error(
            `Missing Mushaf font asset${missingSources.length === 1 ? "" : "s"}: ${missingList}. Run \`npm run fonts:mushaf\` and convert the exported TTX files to WOFF/WOFF2 to enable Mushaf typography.`,
          )
        }

        if (!isCancelled) {
          setStatus("ready")
        }
      } catch (caught) {
        console.error("Failed to load Mushaf fonts", caught)
        if (!isCancelled) {
          setStatus("error")
          setError(
            caught instanceof Error
              ? caught.message
              : "Unable to load Mushaf font assets. Run `npm run fonts:mushaf` to download the required files.",
          )
        }
      }
    }

    void loadFonts()

    return () => {
      isCancelled = true
    }
  }, [shouldAttemptLoad])

  return { status, isReady: status === "ready", error }
}
